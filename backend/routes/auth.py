from flask import Blueprint, request, jsonify
from models import User
from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)


# --- Registration ---
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    Required fields: username, email, password, display_name
    """
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    display_name = data.get('display_name')

    # Validate all required fields are present
    if not username or not email or not password or not display_name:
        return jsonify({
            "message": "All fields are required: username, email, password, display_name"
        }), 400

    # Check if username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400

    # Check if display_name already exists
    if User.query.filter_by(display_name=display_name).first():
        return jsonify({"message": "Display name already exists"}), 400

    # Create new user with hashed password
    hashed_password = generate_password_hash(password)
    new_user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        display_name=display_name
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating user", "error": str(e)}), 500


# --- Login ---
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user using username and password.
    Returns JWT access token and display_name on success.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    # Find user by username
    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            "access_token": access_token,
            "display_name": user.display_name,
            "is_admin": user.is_admin
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401


# --- Get Profile (Read-Only) ---
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get the current user's profile information.
    Profile is read-only after creation.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "display_name": user.display_name,
        "is_admin": user.is_admin,
        "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else None
    }), 200