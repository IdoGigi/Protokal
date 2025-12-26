from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime 

# --- טבלת המשתמשים (קיים) ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# --- טבלת הפרוטוקולים (חדש) ---
class Protocol(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)      # שם הפרוטוקול (למשל: החייאת מבוגר)
    description = db.Column(db.String(255), nullable=True) # תיאור קצר
    # קשר: כשנרצה לשלוף את הפרוטוקול, נוכל לבקש גם את ה-questions שלו
    questions = db.relationship('Question', backref='protocol', lazy=True)

# --- טבלת השאלות (חדש) ---
class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # המפתח הזר (Foreign Key): הקישור לאבא (Protocol ID)
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=False)
    
    text = db.Column(db.Text, nullable=False)              # תוכן השאלה
    option_a = db.Column(db.String(200), nullable=False)   # תשובה א'
    option_b = db.Column(db.String(200), nullable=False)   # תשובה ב'
    option_c = db.Column(db.String(200), nullable=False)   # תשובה ג'
    option_d = db.Column(db.String(200), nullable=False)   # תשובה ד'
    correct_answer = db.Column(db.String(1), nullable=False) # איזו תשובה נכונה? ('a', 'b', 'c', 'd')

class TestResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)     # מי עשה את המבחן?
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=False) # על איזה פרוטוקול?
    score = db.Column(db.Integer, nullable=False) # הציון (למשל 80)
    date_taken = db.Column(db.DateTime, default=datetime.utcnow) # מתי זה קרה?