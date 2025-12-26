from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import text
from database import db  # מייבאים את ה-db מהקובץ הנפרד
from models import User  # מייבאים את המודלים כדי שהמערכת תכיר אותם
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp
from routes.content import content_bp


app = Flask(__name__)
CORS(app)

# --- Config ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:root@localhost/protokal_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Security Key for the Tokens (In production, this should be hidden in .env file)
app.config['JWT_SECRET_KEY'] = 'super-secret-key-123'
# --- Init Extensions ---
db.init_app(app)
jwt = JWTManager(app) # Initialize JWT

# --- Register Blueprints ---
# This tells Flask: "Any request starting with /api/auth goes to auth_bp"
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(content_bp, url_prefix='/api/content')

@app.route('/')
def home():
    return "Proto-Kal V2 Backend is Running!"

@app.route('/api/test')
def test_api():
    return jsonify({"message": "Hello from Flask!", "status": "success"})

@app.route('/test-db')
def test_db():
    try:
        db.session.execute(text('SELECT 1'))
        return jsonify({"message": "Database Connection Successful! 🟢"})
    except Exception as e:
        return jsonify({"message": "Database Connection Failed 🔴", "error": str(e)})

# --- יצירת הטבלאות והרצת השרת ---
if __name__ == '__main__':
    with app.app_context():
        # בגלל שייבאנו את User למעלה, הפקודה הזו יודעת ליצור את הטבלה שלו
        db.create_all()
        print("✅ Tables created/verified successfully!")
    
    app.run(debug=True, port=5000)