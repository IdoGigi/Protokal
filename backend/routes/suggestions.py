from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import QuestionSuggestion, Protocol, User
from database import db

suggestions_bp = Blueprint('suggestions', __name__)


# --- Submit a question suggestion ---
@suggestions_bp.route('/propose-question', methods=['POST'])
@jwt_required()
def propose_question():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    
    # Required fields
    text = data.get('text')
    option_a = data.get('option_a')
    option_b = data.get('option_b')
    option_c = data.get('option_c')
    option_d = data.get('option_d')
    correct_answer = data.get('correct_answer')
    
    # Optional fields
    protocol_id = data.get('protocol_id')
    explanation = data.get('explanation')
    source_reference = data.get('source_reference')
    difficulty_level = data.get('difficulty_level', 1)

    # Validate required fields
    if not all([text, option_a, option_b, option_c, option_d, correct_answer]):
        return jsonify({"message": "Missing required fields"}), 400

    # Validate correct_answer format
    if correct_answer.lower() not in ['a', 'b', 'c', 'd']:
        return jsonify({"message": "correct_answer must be 'a', 'b', 'c', or 'd'"}), 400

    # Validate protocol exists (if provided)
    if protocol_id:
        protocol = Protocol.query.get(protocol_id)
        if not protocol:
            return jsonify({"message": "Protocol not found"}), 404

    # Create suggestion
    new_suggestion = QuestionSuggestion(
        user_id=user.id,
        protocol_id=protocol_id,
        text=text.strip(),
        option_a=option_a.strip(),
        option_b=option_b.strip(),
        option_c=option_c.strip(),
        option_d=option_d.strip(),
        correct_answer=correct_answer.lower(),
        explanation=explanation.strip() if explanation else None,
        source_reference=source_reference.strip() if source_reference else None,
        difficulty_level=difficulty_level,
        status='pending'
    )

    db.session.add(new_suggestion)
    db.session.commit()

    return jsonify({
        "message": "Question suggestion submitted successfully!",
        "suggestion_id": new_suggestion.id
    }), 201


# --- Get user's own suggestions ---
@suggestions_bp.route('/my-suggestions', methods=['GET'])
@jwt_required()
def get_my_suggestions():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    suggestions = QuestionSuggestion.query.filter_by(user_id=user.id)\
                                          .order_by(QuestionSuggestion.created_at.desc())\
                                          .all()

    output = []
    for s in suggestions:
        output.append({
            "id": s.id,
            "text": s.text[:100] + "..." if len(s.text) > 100 else s.text,  # Preview
            "protocol": s.protocol.title if s.protocol else "ללא פרוטוקול",
            "status": s.status,
            "created_at": s.created_at.strftime("%d/%m/%Y"),
            "admin_feedback": s.admin_feedback
        })

    return jsonify({
        "count": len(output),
        "suggestions": output
    }), 200
