from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import User
from database import db

# Define the Blueprint (a modular route handler)
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # 1. Check if data exists
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Missing email or password"}), 400
    
    # 2. Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "User already exists"}), 409

    # 3. Create new user
    new_user = User(
        username=data.get('username', 'Anonymous'), # Default name if missing
        email=data['email']
    )
    new_user.set_password(data['password'])

    # 4. Save to DB
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # 1. Find user by email
    user = User.query.filter_by(email=data.get('email')).first()

    # 2. Validate user and password
    if user and user.check_password(data.get('password')):
        # 3. Generate Token (The "Entry Ticket")
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, username=user.username), 200

    return jsonify({"message": "Invalid credentials"}), 401