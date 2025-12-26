from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import User

def admin_required(fn):
    """
    Decorator to protect routes that require admin privileges.
    Must be used AFTER @jwt_required() decorator.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        if not user.is_admin:
            return jsonify({"message": "Admin access required"}), 403
        
        return fn(*args, **kwargs)
    return wrapper
