from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Protocol, Question, TestResult, User
from database import db
import random


content_bp = Blueprint('content', __name__)

# --- פונקציה 1: קבלת רשימת הפרוטוקולים (כולל ציונים) ---
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
        # שליפת הציון הגבוה ביותר
        best_result = TestResult.query.filter_by(user_id=user.id, protocol_id=p.id)\
                                      .order_by(TestResult.score.desc())\
                                      .first()
        
        output.append({
            'id': p.id,
            'title': p.title,
            'description': p.description,
            'best_score': best_result.score if best_result else None
        })
    
    return jsonify(output), 200

# --- פונקציה 2: קבלת פרוטוקול ספציפי ושאלות ---
@content_bp.route('/protocol/<int:protocol_id>', methods=['GET'])
@jwt_required()
def get_protocol_data(protocol_id):
    protocol = Protocol.query.get(protocol_id)
    
    if not protocol:
        return jsonify({"message": "Protocol not found"}), 404

    questions = Question.query.filter_by(protocol_id=protocol_id).all()

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
            "correct_answer": q.correct_answer 
        })

    return jsonify({
        "id": protocol.id,
        "title": protocol.title,
        "questions": questions_output
    }), 200

# --- פונקציה 3: שמירת ציון מבחן ---
@content_bp.route('/submit-test', methods=['POST'])
@jwt_required()
def submit_test():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    protocol_id = data.get('protocol_id')
    score = data.get('score')

    new_result = TestResult(
        user_id=user.id,
        protocol_id=protocol_id,
        score=score
    )

    db.session.add(new_result)
    db.session.commit()

    return jsonify({"message": "Score saved successfully!", "score": score}), 201


# --- נתיב 4: יצירת מבחן כללי (רנדומלי) ---
@content_bp.route('/general-test', methods=['GET'])
@jwt_required()
def get_general_test():
    # 1. שליפת כל השאלות שקיימות במערכת
    all_questions = Question.query.all()

    # 2. בחירת שאלות רנדומלית
    # נבחר 100 שאלות, או את כל השאלות אם יש פחות מ-100
    num_questions = min(len(all_questions), 100)
    selected_questions = random.sample(all_questions, num_questions)

    # 3. סידור המידע לשליחה
    questions_output = []
    for q in selected_questions:
        questions_output.append({
            "id": q.id,
            "text": q.text,
            # בונוס: נשלח גם את שם הפרוטוקול כדי שהמשתמש ידע מאיזה נושא השאלה
            "protocol_title": q.protocol.title, 
            "options": {
                "a": q.option_a,
                "b": q.option_b,
                "c": q.option_c,
                "d": q.option_d
            },
            "correct_answer": q.correct_answer 
        })

    return jsonify({
        "title": "מבחן מסכם רב-תחומי 🚑",
        "description": f"מבחן המכיל {num_questions} שאלות מכל הפרוטוקולים.",
        "questions": questions_output
    }), 200


# --- נתיב 5: קבלת סטטיסטיקות משתמש ---
@content_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # 1. שליפת כל התוצאות של המשתמש (מהחדש לישן)
    results = TestResult.query.filter_by(user_id=user.id).order_by(TestResult.date_taken.desc()).all()

    # 2. חישובים סטטיסטיים
    total_tests = len(results)
    avg_score = 0
    if total_tests > 0:
        avg_score = round(sum(r.score for r in results) / total_tests)

    # 3. עיבוד ההיסטוריה לפורמט נוח
    history = []
    for r in results:
        # שליפת שם הפרוטוקול (אם הוא קיים, כי אולי זה מבחן כללי שנרצה לטפל בו בעתיד)
        protocol_title = "מבחן לא ידוע"
        if r.protocol_id:
            p = Protocol.query.get(r.protocol_id)
            if p:
                protocol_title = p.title
            else:
                # אולי בעתיד נשמור ID מיוחד למבחן כללי, כרגע נניח שזה פרוטוקול רגיל
                protocol_title = "פרוטוקול נמחק"

        history.append({
            "id": r.id,
            "date": r.date_taken.strftime("%d/%m/%Y %H:%M"), # עיצוב התאריך
            "protocol": protocol_title,
            "score": r.score
        })

    return jsonify({
        "total_tests": total_tests,
        "average_score": avg_score,
        "history": history
    }), 200