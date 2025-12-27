from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Protocol, Question, TestResult, User, QuestionAttempt, QuestionFlag
from database import db
import random
from datetime import datetime, timedelta


content_bp = Blueprint('content', __name__)

# --- Function 1: Get list of protocols (including scores) ---
@content_bp.route('/protocols', methods=['GET'])
@jwt_required()
def get_protocols():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if not user:
        return jsonify({"message": "User not found"}), 404

    protocols = Protocol.query.all()
    
    output = []
    for p in protocols:
        # Get the highest score for this user and protocol
        best_result = TestResult.query.filter_by(user_id=user.id, protocol_id=p.id)\
                                      .order_by(TestResult.score.desc())\
                                      .first()
        
        output.append({
            'id': p.id,
            'title': p.title,
            'category': p.category, # Added category
            'description': p.description,
            'best_score': best_result.score if best_result else None
        })
    
    return jsonify(output), 200

# --- Function 2: Get specific protocol and questions ---
@content_bp.route('/protocol/<int:protocol_id>', methods=['GET'])
@jwt_required()
def get_protocol_data(protocol_id):
    protocol = Protocol.query.get(protocol_id)
    
    if not protocol:
        return jsonify({"message": "Protocol not found"}), 404

    questions = Question.query.filter_by(protocol_id=protocol_id).all()
    
    # Randomize question order for each test session
    random.shuffle(questions)

    questions_output = []
    for q in questions:
        questions_output.append({
            "id": q.id,
            "text": q.text,
            "options": {
                "a": q.option_a,
                "b": q.option_b,
                "c": q.option_c,
                "d": q.option_d
            },
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "source_reference": q.source_reference,
            "difficulty_level": q.difficulty_level
        })

    return jsonify({
        "id": protocol.id,
        "title": protocol.title,
        "questions": questions_output
    }), 200

# --- Function 3: Save test score and individual attempts ---
@content_bp.route('/submit-test', methods=['POST'])
@jwt_required()
def submit_test():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    protocol_id = data.get('protocol_id')  # Can be null for general tests
    score = data.get('score')
    answers = data.get('answers', [])  # Optional: list of {question_id, user_answer, is_correct}

    # Save the overall test result
    new_result = TestResult(
        user_id=user.id,
        protocol_id=protocol_id,  # null = general test
        score=score
    )
    db.session.add(new_result)

    # Save individual question attempts (for weakness tracking)
    for answer in answers:
        question_id = answer.get('question_id')
        user_answer = answer.get('user_answer')
        is_correct = answer.get('is_correct', False)
        
        attempt = QuestionAttempt(
            user_id=user.id,
            question_id=question_id,
            user_answer=user_answer,
            is_correct=is_correct
        )
        db.session.add(attempt)

    db.session.commit()

    return jsonify({"message": "Score saved successfully!", "score": score}), 201


# --- Function 4: Generate general test (random questions) ---
@content_bp.route('/general-test', methods=['GET'])
@jwt_required()
def get_general_test():
    # 1. Get all questions from the system
    all_questions = Question.query.all()

    # 2. Randomly select questions
    # Select 100 questions, or all questions if less than 100 exist
    num_questions = min(len(all_questions), 100)
    selected_questions = random.sample(all_questions, num_questions)

    # 3. Format the data for response
    questions_output = []
    for q in selected_questions:
        questions_output.append({
            "id": q.id,
            "text": q.text,
            # Bonus: include protocol title so user knows which topic the question is from
            "protocol_title": q.protocol.title, 
            "options": {
                "a": q.option_a,
                "b": q.option_b,
                "c": q.option_c,
                "d": q.option_d
            },
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "source_reference": q.source_reference,
            "difficulty_level": q.difficulty_level
        })

    return jsonify({
        "title": "מבחן מסכם רב-תחומי 🚑",
        "description": f"מבחן המכיל {num_questions} שאלות מכל הפרוטוקולים.",
        "questions": questions_output
    }), 200


# --- Function 5: Generate weakness-focused test ---
@content_bp.route('/weakness-test', methods=['GET'])
@jwt_required()
def get_weakness_test():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # 1. Calculate NET weakness score: failures - successes for each question
    # Using CASE statement to count correct vs incorrect separately
    from sqlalchemy import case
    
    weakness_scores = db.session.query(
        QuestionAttempt.question_id,
        db.func.sum(case((QuestionAttempt.is_correct == False, 1), else_=0)).label('fail_count'),
        db.func.sum(case((QuestionAttempt.is_correct == True, 1), else_=0)).label('pass_count')
    ).filter(
        QuestionAttempt.user_id == user.id
    ).group_by(QuestionAttempt.question_id).all()

    # 2. Filter to questions where failures > successes (net score > 0)
    weak_questions = []
    for score in weakness_scores:
        net_score = score.fail_count - score.pass_count
        if net_score > 0:  # Only include if still weak
            weak_questions.append({
                'question_id': score.question_id,
                'fail_count': score.fail_count,
                'pass_count': score.pass_count,
                'net_score': net_score
            })

    # Sort by net score (highest weakness first)
    weak_questions.sort(key=lambda x: x['net_score'], reverse=True)
    weak_questions = weak_questions[:30]  # Limit to top 30

    if not weak_questions:
        return jsonify({
            "title": "חזק את החולשות 💪",
            "description": "אין לך שאלות שנכשלת בהן עדיין! המשך לתרגל.",
            "questions": [],
            "no_weaknesses": True
        }), 200

    # 3. Get the actual Question objects
    question_ids = [wq['question_id'] for wq in weak_questions]
    questions = Question.query.filter(Question.id.in_(question_ids)).all()
    
    # Create lookups for scores
    score_map = {wq['question_id']: wq for wq in weak_questions}

    # 4. Format output (sorted by net_score)
    questions_output = []
    for q in sorted(questions, key=lambda x: score_map.get(x.id, {}).get('net_score', 0), reverse=True):
        wq = score_map.get(q.id, {})
        questions_output.append({
            "id": q.id,
            "text": q.text,
            "protocol_title": q.protocol.title,
            "fail_count": wq.get('fail_count', 0),
            "pass_count": wq.get('pass_count', 0),
            "net_score": wq.get('net_score', 0),
            "options": {
                "a": q.option_a,
                "b": q.option_b,
                "c": q.option_c,
                "d": q.option_d
            },
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "source_reference": q.source_reference,
            "difficulty_level": q.difficulty_level
        })

    # 5. Limit to 20 questions for the test
    questions_output = questions_output[:20]

    return jsonify({
        "title": "חזק את החולשות 💪",
        "description": f"מבחן מותאם אישית עם {len(questions_output)} שאלות שעדיין צריך לשפר.",
        "questions": questions_output
    }), 200


# --- Function 6: Get user statistics (separated by test type) ---
@content_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # 1. Get all results for the user (newest first)
    all_results = TestResult.query.filter_by(user_id=user.id).order_by(TestResult.date_taken.desc()).all()

    # 2. Separate results by type (protocol tests vs general tests)
    protocol_results = [r for r in all_results if r.protocol_id is not None]
    general_results = [r for r in all_results if r.protocol_id is None]

    # 3. Calculate statistics for protocol tests
    protocol_total = len(protocol_results)
    protocol_avg = 0
    if protocol_total > 0:
        protocol_avg = round(sum(r.score for r in protocol_results) / protocol_total)

    # 4. Calculate statistics for general tests
    general_total = len(general_results)
    general_avg = 0
    if general_total > 0:
        general_avg = round(sum(r.score for r in general_results) / general_total)

    # 5. Format protocol test history
    protocol_history = []
    for r in protocol_results:
        protocol_title = "פרוטוקול נמחק"
        p = Protocol.query.get(r.protocol_id)
        if p:
            protocol_title = p.title

        protocol_history.append({
            "id": r.id,
            "date": r.date_taken.strftime("%d/%m/%Y %H:%M"),
            "protocol": protocol_title,
            "score": r.score
        })

    # 6. Format general test history
    general_history = []
    for r in general_results:
        general_history.append({
            "id": r.id,
            "date": r.date_taken.strftime("%d/%m/%Y %H:%M"),
            "protocol": "מבחן מסכם רב-תחומי",
            "score": r.score
        })

    return jsonify({
        # Overall stats
        "total_tests": len(all_results),
        "average_score": round(sum(r.score for r in all_results) / len(all_results)) if all_results else 0,
        
        # Protocol tests stats
        "protocol_stats": {
            "total": protocol_total,
            "average": protocol_avg,
            "history": protocol_history
        },
        
        # General tests stats
        "general_stats": {
            "total": general_total,
            "average": general_avg,
            "history": general_history
        }
    }), 200


# --- Function 7: Get leaderboard rankings ---
@content_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404

    # Get time period filter (default: weekly)
    period = request.args.get('period', 'weekly')  # weekly, monthly, all
    
    # Calculate date filter
    now = datetime.utcnow()
    if period == 'weekly':
        date_filter = now - timedelta(days=7)
        period_name = "שבועי"
    elif period == 'monthly':
        date_filter = now - timedelta(days=30)
        period_name = "חודשי"
    else:  # all time
        date_filter = None
        period_name = "כל הזמנים"

    # Get ranking mode from query param (default: avg_score)
    rank_by = request.args.get('rank_by', 'avg_score')  # 'avg_score' or 'correct_answers'

    # Optional group filter
    group_id = request.args.get('group_id')
    group_member_ids = None
    group_name = None
    
    if group_id:
        from models import GroupMember, Group
        group = Group.query.get(int(group_id))
        if group:
            group_name = group.name
            group_member_ids = [m.user_id for m in GroupMember.query.filter_by(group_id=int(group_id)).all()]

    # Get correct answers per user from QuestionAttempt
    correct_answers_subquery = db.session.query(
        QuestionAttempt.user_id,
        db.func.count(QuestionAttempt.id).label('correct_answers')
    ).filter(QuestionAttempt.is_correct == True)
    
    if date_filter:
        correct_answers_subquery = correct_answers_subquery.filter(QuestionAttempt.created_at >= date_filter)
    
    correct_answers_subquery = correct_answers_subquery.group_by(QuestionAttempt.user_id).subquery()

    # Build query for aggregated stats per user
    query = db.session.query(
        User.id,
        User.display_name,
        db.func.count(TestResult.id).label('tests_taken'),
        db.func.avg(TestResult.score).label('avg_score'),
        db.func.sum(TestResult.score).label('total_points'),
        db.func.coalesce(correct_answers_subquery.c.correct_answers, 0).label('correct_answers')
    ).join(TestResult, User.id == TestResult.user_id
    ).outerjoin(correct_answers_subquery, User.id == correct_answers_subquery.c.user_id)
    
    # Apply date filter if not all-time
    if date_filter:
        query = query.filter(TestResult.date_taken >= date_filter)

    # Apply group filter if specified
    if group_member_ids:
        query = query.filter(User.id.in_(group_member_ids))
    
    # Order by selected ranking mode
    if rank_by == 'correct_answers':
        results = query.group_by(User.id, correct_answers_subquery.c.correct_answers).order_by(
            db.func.coalesce(correct_answers_subquery.c.correct_answers, 0).desc(),
            db.func.avg(TestResult.score).desc()
        ).limit(20).all()
    else:  # avg_score (default)
        results = query.group_by(User.id, correct_answers_subquery.c.correct_answers).order_by(
            db.func.avg(TestResult.score).desc(),
            db.func.count(TestResult.id).desc()
        ).limit(20).all()

    # Build leaderboard output
    leaderboard = []
    for i, r in enumerate(results):
        leaderboard.append({
            "rank": i + 1,
            "user_id": r.id,
            "display_name": r.display_name,
            "tests_taken": r.tests_taken,
            "avg_score": round(r.avg_score, 1) if r.avg_score else 0,
            "total_points": r.total_points or 0,
            "correct_answers": r.correct_answers or 0,
            "is_current_user": r.id == current_user.id
        })

    # Find current user's rank if not in top 20
    current_user_rank = None
    current_user_stats = None
    is_in_top_20 = any(entry['is_current_user'] for entry in leaderboard)
    
    if not is_in_top_20:
        # Get current user's stats
        user_query = db.session.query(
            db.func.count(TestResult.id).label('tests_taken'),
            db.func.avg(TestResult.score).label('avg_score'),
            db.func.sum(TestResult.score).label('total_points')
        ).filter(TestResult.user_id == current_user.id)
        
        if date_filter:
            user_query = user_query.filter(TestResult.date_taken >= date_filter)
        
        user_stats = user_query.first()
        
        if user_stats and user_stats.tests_taken > 0:
            # Count how many users are ahead
            rank_query = db.session.query(
                db.func.count(db.distinct(User.id))
            ).join(TestResult, User.id == TestResult.user_id)
            
            if date_filter:
                rank_query = rank_query.filter(TestResult.date_taken >= date_filter)
            
            rank_query = rank_query.filter(
                db.func.coalesce(db.func.avg(TestResult.score), 0) > (user_stats.avg_score or 0)
            )
            # This is a simplified rank calculation
            current_user_rank = len(results) + 1 if user_stats.avg_score else None
            
            current_user_stats = {
                "rank": current_user_rank,
                "display_name": current_user.display_name,
                "tests_taken": user_stats.tests_taken,
                "avg_score": round(user_stats.avg_score, 1) if user_stats.avg_score else 0,
                "total_points": user_stats.total_points or 0
            }

    return jsonify({
        "period": period,
        "period_name": period_name,
        "leaderboard": leaderboard,
        "current_user": current_user_stats,
        "total_participants": len(results),
        "group_id": int(group_id) if group_id else None,
        "group_name": group_name
    }), 200


# --- Groups Competition Leaderboard ---
@content_bp.route('/groups-leaderboard', methods=['GET'])
@jwt_required()
def get_groups_leaderboard():
    from models import Group, GroupMember
    
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404

    # Get time period filter
    period = request.args.get('period', 'weekly')
    now = datetime.utcnow()
    
    if period == 'weekly':
        date_filter = now - timedelta(days=7)
        period_name = "שבועי"
    elif period == 'monthly':
        date_filter = now - timedelta(days=30)
        period_name = "חודשי"
    else:
        date_filter = None
        period_name = "כל הזמנים"

    # Get all groups
    all_groups = Group.query.all()
    
    results = []
    for group in all_groups:
        # Get member IDs for this group
        member_ids = [m.user_id for m in GroupMember.query.filter_by(group_id=group.id).all()]
        
        if not member_ids:
            continue
            
        # Calculate total correct answers for all members
        correct_query = QuestionAttempt.query.filter(
            QuestionAttempt.user_id.in_(member_ids),
            QuestionAttempt.is_correct == True
        )
        if date_filter:
            correct_query = correct_query.filter(QuestionAttempt.created_at >= date_filter)
        
        total_correct = correct_query.count()
        
        # Find top contributor in this group
        top_contributor = None
        top_count = 0
        for member_id in member_ids:
            member_query = QuestionAttempt.query.filter(
                QuestionAttempt.user_id == member_id,
                QuestionAttempt.is_correct == True
            )
            if date_filter:
                member_query = member_query.filter(QuestionAttempt.created_at >= date_filter)
            count = member_query.count()
            if count > top_count:
                top_count = count
                member = User.query.get(member_id)
                top_contributor = member.display_name if member else "Unknown"
        
        results.append({
            "group_id": group.id,
            "group_name": group.name,
            "total_correct_answers": total_correct,
            "member_count": len(member_ids),
            "top_contributor": top_contributor,
            "top_contributor_score": top_count
        })
    
    # Sort by total correct answers
    results.sort(key=lambda x: x["total_correct_answers"], reverse=True)
    
    # Add ranks
    for i, r in enumerate(results):
        r["rank"] = i + 1
    
    # Find current user's group rank (if they're in any group)
    user_group_ids = [m.group_id for m in GroupMember.query.filter_by(user_id=current_user.id).all()]
    user_groups_ranked = [r for r in results if r["group_id"] in user_group_ids]

    return jsonify({
        "period": period,
        "period_name": period_name,
        "groups_leaderboard": results[:20],  # Top 20 groups
        "user_groups": user_groups_ranked
    }), 200


# --- Flag a question for QA review ---
@content_bp.route('/flag-question', methods=['POST'])
@jwt_required()
def flag_question():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    question_id = data.get('question_id')
    reason = data.get('reason', '').strip()

    if not question_id:
        return jsonify({"message": "question_id is required"}), 400

    # Verify question exists
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"message": "Question not found"}), 404

    # Check if user already flagged this question
    existing_flag = QuestionFlag.query.filter_by(
        question_id=question_id,
        user_id=user.id,
        status='pending'
    ).first()

    if existing_flag:
        return jsonify({"message": "You have already flagged this question"}), 400

    # Create new flag
    new_flag = QuestionFlag(
        question_id=question_id,
        user_id=user.id,
        reason=reason if reason else "No reason provided"
    )
    db.session.add(new_flag)
    db.session.commit()

    return jsonify({
        "message": "Question flagged for review. Thank you!",
        "flag_id": new_flag.id
    }), 201
