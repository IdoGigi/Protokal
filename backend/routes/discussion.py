from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import QuestionComment, Question, User
from database import db

discussion_bp = Blueprint('discussion', __name__)


# --- Add a comment to a question ---
@discussion_bp.route('/comments', methods=['POST'])
@jwt_required()
def add_comment():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    question_id = data.get('question_id')
    content = data.get('content')

    # Validate input
    if not question_id or not content:
        return jsonify({"message": "question_id and content are required"}), 400

    if not content.strip():
        return jsonify({"message": "Comment cannot be empty"}), 400

    # Verify question exists
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"message": "Question not found"}), 404

    # Create new comment
    new_comment = QuestionComment(
        question_id=question_id,
        user_id=user.id,
        content=content.strip()
    )

    db.session.add(new_comment)
    db.session.commit()

    return jsonify({
        "message": "Comment added successfully",
        "comment": {
            "id": new_comment.id,
            "content": new_comment.content,
            "display_name": user.display_name,
            "created_at": new_comment.created_at.strftime("%d/%m/%Y %H:%M")
        }
    }), 201


# --- Get all comments for a question ---
@discussion_bp.route('/comments/<int:question_id>', methods=['GET'])
@jwt_required()
def get_comments(question_id):
    # Verify question exists
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"message": "Question not found"}), 404

    # Get all comments for this question (newest first)
    comments = QuestionComment.query.filter_by(question_id=question_id)\
                                     .order_by(QuestionComment.created_at.desc())\
                                     .all()

    comments_output = []
    for comment in comments:
        comments_output.append({
            "id": comment.id,
            "content": comment.content,
            "display_name": comment.user.display_name,
            "created_at": comment.created_at.strftime("%d/%m/%Y %H:%M")
        })

    return jsonify({
        "question_id": question_id,
        "comments_count": len(comments_output),
        "comments": comments_output
    }), 200


# --- Delete a comment (only by the author) ---
@discussion_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    current_user_id = get_jwt_identity()
    
    comment = QuestionComment.query.get(comment_id)
    if not comment:
        return jsonify({"message": "Comment not found"}), 404

    # Only the author can delete their comment
    if comment.user_id != int(current_user_id):
        return jsonify({"message": "You can only delete your own comments"}), 403

    db.session.delete(comment)
    db.session.commit()

    return jsonify({"message": "Comment deleted successfully"}), 200
