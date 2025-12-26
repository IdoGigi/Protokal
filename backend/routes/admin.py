from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import QuestionSuggestion, Question, Protocol, User, QuestionFlag
from database import db
from utils.decorators import admin_required
from datetime import datetime

admin_bp = Blueprint('admin', __name__)


# --- Get all suggestions (filtered by status) ---
@admin_bp.route('/suggestions', methods=['GET'])
@jwt_required()
@admin_required
def get_suggestions():
    status = request.args.get('status', 'pending')  # Default to pending
    
    # Validate status
    if status not in ['pending', 'approved', 'rejected', 'all']:
        return jsonify({"message": "Invalid status filter"}), 400

    # Query based on status
    if status == 'all':
        suggestions = QuestionSuggestion.query.order_by(QuestionSuggestion.created_at.desc()).all()
    else:
        suggestions = QuestionSuggestion.query.filter_by(status=status)\
                                              .order_by(QuestionSuggestion.created_at.desc())\
                                              .all()

    output = []
    for s in suggestions:
        output.append({
            "id": s.id,
            "text": s.text,
            "option_a": s.option_a,
            "option_b": s.option_b,
            "option_c": s.option_c,
            "option_d": s.option_d,
            "correct_answer": s.correct_answer,
            "explanation": s.explanation,
            "source_reference": s.source_reference,
            "difficulty_level": s.difficulty_level,
            "protocol": s.protocol.title if s.protocol else "לא צוין",
            "protocol_id": s.protocol_id,
            "suggested_by": s.user.display_name,
            "status": s.status,
            "created_at": s.created_at.strftime("%d/%m/%Y %H:%M"),
            "admin_feedback": s.admin_feedback
        })

    return jsonify({
        "count": len(output),
        "status_filter": status,
        "suggestions": output
    }), 200


# --- Approve a suggestion (create actual Question) ---
@admin_bp.route('/approve/<int:suggestion_id>', methods=['POST'])
@jwt_required()
@admin_required
def approve_suggestion(suggestion_id):
    suggestion = QuestionSuggestion.query.get(suggestion_id)
    
    if not suggestion:
        return jsonify({"message": "Suggestion not found"}), 404

    if suggestion.status != 'pending':
        return jsonify({"message": f"Suggestion already {suggestion.status}"}), 400

    # Check if protocol exists (required for Question)
    if not suggestion.protocol_id:
        return jsonify({"message": "Cannot approve: No protocol assigned to this suggestion"}), 400

    protocol = Protocol.query.get(suggestion.protocol_id)
    if not protocol:
        return jsonify({"message": "Cannot approve: Protocol not found"}), 404

    # Create new Question from the suggestion
    new_question = Question(
        protocol_id=suggestion.protocol_id,
        text=suggestion.text,
        option_a=suggestion.option_a,
        option_b=suggestion.option_b,
        option_c=suggestion.option_c,
        option_d=suggestion.option_d,
        correct_answer=suggestion.correct_answer,
        explanation=suggestion.explanation,
        source_reference=suggestion.source_reference,
        difficulty_level=suggestion.difficulty_level
    )

    db.session.add(new_question)
    db.session.flush()  # Get the new question ID before commit

    # Update suggestion status
    suggestion.status = 'approved'
    suggestion.reviewed_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "message": "Suggestion approved and added to question bank!",
        "new_question_id": new_question.id,
        "suggestion_id": suggestion_id
    }), 200


# --- Reject a suggestion ---
@admin_bp.route('/reject/<int:suggestion_id>', methods=['POST'])
@jwt_required()
@admin_required
def reject_suggestion(suggestion_id):
    suggestion = QuestionSuggestion.query.get(suggestion_id)
    
    if not suggestion:
        return jsonify({"message": "Suggestion not found"}), 404

    if suggestion.status != 'pending':
        return jsonify({"message": f"Suggestion already {suggestion.status}"}), 400

    data = request.get_json() or {}
    reason = data.get('reason', '')

    # Update suggestion status
    suggestion.status = 'rejected'
    suggestion.admin_feedback = reason if reason else "השאלה לא עמדה בקריטריונים"
    suggestion.reviewed_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "message": "Suggestion rejected",
        "suggestion_id": suggestion_id
    }), 200


# --- Get admin statistics ---
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_stats():
    pending_count = QuestionSuggestion.query.filter_by(status='pending').count()
    approved_count = QuestionSuggestion.query.filter_by(status='approved').count()
    rejected_count = QuestionSuggestion.query.filter_by(status='rejected').count()
    total_questions = Question.query.count()
    total_users = User.query.count()

    return jsonify({
        "suggestions": {
            "pending": pending_count,
            "approved": approved_count,
            "rejected": rejected_count
        },
        "total_questions": total_questions,
        "total_users": total_users
    }), 200


# --- Bulk User Import Questions ---
import csv
import io

@admin_bp.route('/import-questions', methods=['POST'])
@jwt_required()
@admin_required
def import_questions():
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({"message": "Only CSV files are allowed"}), 400

    try:
        # Read file
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        csv_input = csv.DictReader(stream)
        
        # Verify headers
        # Verify headers - now expects protocol_name (not ID)
        required_headers = ['protocol_name', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']
        if not csv_input.fieldnames or not all(h in csv_input.fieldnames for h in required_headers):
             return jsonify({"message": f"Invalid CSV format. Required headers: {', '.join(required_headers)}"}), 400

        valid_count = 0
        error_count = 0
        errors = []
        
        new_questions = []

        # Pre-fetch protocols to minimize DB queries
        # Pre-fetch protocols
        protocols_by_id = {p.id: p for p in Protocol.query.all()}
        protocols_by_title = {p.title.lower().strip(): p for p in protocols_by_id.values()}

        for i, row in enumerate(csv_input):
            try:
                # 1. Validate Protocol (by Name or ID)
                p_raw = row.get('protocol_name', '').strip()
                p_id = None
                
                # Strategy A: Try as Integer ID (for backwards compat)
                if p_raw.isdigit():
                    pid_int = int(p_raw)
                    if pid_int in protocols_by_id:
                        p_id = pid_int

                # Strategy B: Try as Title (primary method)
                if not p_id:
                     p_norm = p_raw.lower()
                     if p_norm in protocols_by_title:
                         p_id = protocols_by_title[p_norm].id
                
                # Failed both
                if not p_id:
                     raise ValueError(f"Protocol '{p_raw}' not found")
                
                # 2. Validate Correct Answer
                correct = row.get('correct_answer', '').lower().strip()
                if correct not in ['a', 'b', 'c', 'd']:
                    raise ValueError(f"Invalid correct_answer: '{correct}'. Must be a, b, c, or d.")

                # 3. Validate Difficulty Level (1-3)
                difficulty_raw = row.get('difficulty_level', '1').strip()
                if difficulty_raw.isdigit() and int(difficulty_raw) in [1, 2, 3]:
                    difficulty_level = int(difficulty_raw)
                else:
                    difficulty_level = 1  # Default

                # 4. Validate Required Fields
                text = row.get('text', '').strip()
                option_a = row.get('option_a', '').strip()
                option_b = row.get('option_b', '').strip()
                option_c = row.get('option_c', '').strip()
                option_d = row.get('option_d', '').strip()

                if not all([text, option_a, option_b, option_c, option_d]):
                    raise ValueError("Missing required text/option fields")

                # 5. Create Question Object (ORM - safe from SQL injection)
                q = Question(
                    protocol_id=p_id,
                    text=text,
                    option_a=option_a,
                    option_b=option_b,
                    option_c=option_c,
                    option_d=option_d,
                    correct_answer=correct,
                    explanation=row.get('explanation', '').strip() or None,
                    source_reference=row.get('source_reference', '').strip() or None,
                    difficulty_level=difficulty_level
                )

                new_questions.append(q)
                valid_count += 1
                
            except Exception as e:
                error_count += 1
                if len(errors) < 10: # Limit error limits
                    errors.append(f"Row {i+2}: {str(e)}")

        # Bulk insert
        if new_questions:
            db.session.add_all(new_questions)
            db.session.commit()

        return jsonify({
            "message": "Import process completed",
            "imported_count": valid_count,
            "failed_count": error_count,
            "errors": errors
        }), 200

    except Exception as e:
        return jsonify({"message": f"Server error during import: {str(e)}"}), 500


# --- View Flagged Questions (Admin QA) ---
@admin_bp.route('/flagged-questions', methods=['GET'])
@jwt_required()
@admin_required
def get_flagged_questions():
    status_filter = request.args.get('status', 'pending')
    
    query = QuestionFlag.query
    if status_filter != 'all':
        query = query.filter_by(status=status_filter)
    
    flags = query.order_by(QuestionFlag.created_at.desc()).all()
    
    output = []
    for f in flags:
        question = Question.query.get(f.question_id)
        user = User.query.get(f.user_id)
        protocol = Protocol.query.get(question.protocol_id) if question else None
        
        output.append({
            "id": f.id,
            "question_id": f.question_id,
            "question_text": question.text if question else "Deleted",
            "protocol_title": protocol.title if protocol else "Unknown",
            "correct_answer": question.correct_answer if question else None,
            "flagged_by": user.display_name if user else "Unknown",
            "reason": f.reason,
            "status": f.status,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "admin_notes": f.admin_notes
        })
    
    return jsonify({"flags": output, "count": len(output)}), 200


# --- Resolve a Flag (Admin) ---
@admin_bp.route('/resolve-flag/<int:flag_id>', methods=['POST'])
@jwt_required()
@admin_required
def resolve_flag(flag_id):
    flag = QuestionFlag.query.get(flag_id)
    if not flag:
        return jsonify({"message": "Flag not found"}), 404

    data = request.get_json()
    new_status = data.get('status', 'resolved')
    admin_notes = data.get('admin_notes', '')

    flag.status = new_status
    flag.admin_notes = admin_notes
    flag.reviewed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": f"Flag marked as {new_status}"}), 200
