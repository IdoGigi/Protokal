"""
Script to clear all questions from the database.
This keeps protocols, users, and other data intact.
Run this when you want to start fresh with real questions.
"""
from app import app
from database import db
from models import Question, QuestionAttempt, QuestionComment, QuestionFlag

def clear_questions():
    print("🗑️ Clearing existing questions...")
    
    with app.app_context():
        try:
            # First, delete related data (due to foreign keys)
            flags_deleted = db.session.query(QuestionFlag).delete()
            print(f"   Deleted {flags_deleted} question flags")
            
            comments_deleted = db.session.query(QuestionComment).delete()
            print(f"   Deleted {comments_deleted} question comments")
            
            attempts_deleted = db.session.query(QuestionAttempt).delete()
            print(f"   Deleted {attempts_deleted} question attempts")
            
            # Now delete questions
            questions_deleted = db.session.query(Question).delete()
            print(f"   Deleted {questions_deleted} questions")
            
            db.session.commit()
            print("✅ All questions cleared! Ready for fresh import.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    confirm = input("⚠️ This will DELETE ALL QUESTIONS. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        clear_questions()
    else:
        print("❌ Cancelled.")
