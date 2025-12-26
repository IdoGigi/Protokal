from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Group, GroupMember, User, TestResult, GroupPost, GroupPostComment, GroupGoal
from database import db
from datetime import datetime, timedelta
import random
import string

groups_bp = Blueprint('groups', __name__)


def generate_invite_code(length=6):
    """Generate a unique invite code"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        # Check if code already exists
        existing = Group.query.filter_by(invite_code=code).first()
        if not existing:
            return code


# --- Create a new group ---
@groups_bp.route('/create', methods=['POST'])
@jwt_required()
def create_group():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')

    if not name or len(name) < 2:
        return jsonify({"message": "Group name must be at least 2 characters"}), 400

    # Create the group
    new_group = Group(
        name=name,
        description=description,
        invite_code=generate_invite_code(),
        created_by=user.id
    )
    db.session.add(new_group)
    db.session.flush()  # Get the ID

    # Add creator as admin member
    admin_member = GroupMember(
        group_id=new_group.id,
        user_id=user.id,
        role='admin'
    )
    db.session.add(admin_member)
    db.session.commit()

    return jsonify({
        "message": "Group created successfully!",
        "group": {
            "id": new_group.id,
            "name": new_group.name,
            "invite_code": new_group.invite_code
        }
    }), 201


# --- Join a group via invite code ---
@groups_bp.route('/join', methods=['POST'])
@jwt_required()
def join_group():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    invite_code = data.get('invite_code', '').upper().strip()

    if not invite_code:
        return jsonify({"message": "Invite code is required"}), 400

    # Find the group
    group = Group.query.filter_by(invite_code=invite_code).first()
    if not group:
        return jsonify({"message": "Invalid invite code"}), 404

    # Check if already a member
    existing_member = GroupMember.query.filter_by(
        group_id=group.id, 
        user_id=user.id
    ).first()
    
    if existing_member:
        return jsonify({"message": "You are already a member of this group"}), 400

    # Add as member
    new_member = GroupMember(
        group_id=group.id,
        user_id=user.id,
        role='member'
    )
    db.session.add(new_member)
    db.session.commit()

    return jsonify({
        "message": f"Successfully joined {group.name}!",
        "group": {
            "id": group.id,
            "name": group.name
        }
    }), 200


# --- Get user's groups ---
@groups_bp.route('/my-groups', methods=['GET'])
@jwt_required()
def get_my_groups():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    memberships = GroupMember.query.filter_by(user_id=user.id).all()

    groups = []
    for m in memberships:
        group = m.group
        member_count = GroupMember.query.filter_by(group_id=group.id).count()
        groups.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "role": m.role,
            "member_count": member_count,
            "joined_at": m.joined_at.strftime("%d/%m/%Y")
        })

    return jsonify({"groups": groups}), 200


# --- Get group details with members ---
@groups_bp.route('/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group_details(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check if user is a member
    membership = GroupMember.query.filter_by(
        group_id=group_id, 
        user_id=user.id
    ).first()
    
    if not membership:
        return jsonify({"message": "You are not a member of this group"}), 403

    group = Group.query.get(group_id)
    if not group:
        return jsonify({"message": "Group not found"}), 404

    # Get all members with their stats
    members = []
    for m in group.members:
        member_user = m.user
        # Get member's test stats
        test_count = TestResult.query.filter_by(user_id=member_user.id).count()
        avg_score_result = db.session.query(
            db.func.avg(TestResult.score)
        ).filter(TestResult.user_id == member_user.id).scalar()
        
        members.append({
            "user_id": member_user.id,
            "display_name": member_user.display_name,
            "role": m.role,
            "tests_taken": test_count,
            "avg_score": round(avg_score_result, 1) if avg_score_result else 0,
            "joined_at": m.joined_at.strftime("%d/%m/%Y")
        })

    # Sort by avg_score descending
    members.sort(key=lambda x: x['avg_score'], reverse=True)

    return jsonify({
        "group": {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "invite_code": group.invite_code if membership.role == 'admin' else None,
            "created_at": group.created_at.strftime("%d/%m/%Y"),
            "is_admin": membership.role == 'admin'
        },
        "members": members,
        "member_count": len(members)
    }), 200


# --- Get group leaderboard ---
@groups_bp.route('/<int:group_id>/leaderboard', methods=['GET'])
@jwt_required()
def get_group_leaderboard(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check if user is a member
    membership = GroupMember.query.filter_by(
        group_id=group_id, 
        user_id=user.id
    ).first()
    
    if not membership:
        return jsonify({"message": "You are not a member of this group"}), 403

    group = Group.query.get(group_id)
    
    # Get period filter
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

    # Get member IDs
    member_ids = [m.user_id for m in group.members]

    # New Ranking Logic:
    # 1. Total Correct Answers (Quality/Effort)
    # 2. Average Score (Skill)
    
    from models import QuestionAttempt
    
    # Base query for stats
    results = []
    
    for member_id in member_ids:
        # Get member info
        member_user = User.query.get(member_id)
        
        # Helper to apply date filter to queries
        def apply_date(q, date_col):
            if date_filter:
                return q.filter(date_col >= date_filter)
            return q

        # Calculate Correct Answers
        correct_q = QuestionAttempt.query.filter(
            QuestionAttempt.user_id == member_id, 
            QuestionAttempt.is_correct == True
        )
        correct_count = apply_date(correct_q, QuestionAttempt.created_at).count()

        # Calculate Tests Taken & Avg Score
        test_q = TestResult.query.filter(TestResult.user_id == member_id)
        test_q = apply_date(test_q, TestResult.date_taken)
        
        tests_taken = test_q.count()
        avg_score = test_q.with_entities(db.func.avg(TestResult.score)).scalar()
        avg_score = round(avg_score, 1) if avg_score else 0

        # Only include if they have activity in this period (optional, but cleaner)
        if tests_taken > 0 or correct_count > 0:
            results.append({
                "user_id": member_id,
                "display_name": member_user.display_name,
                "tests_taken": tests_taken,
                "avg_score": avg_score,
                "correct_answers": correct_count,
                "is_current_user": member_id == user.id
            })

    # Sort by Correct Answers (primary) and Avg Score (secondary)
    results.sort(key=lambda x: (x['correct_answers'], x['avg_score']), reverse=True)

    # Assign ranks
    leaderboard = []
    for i, r in enumerate(results):
        r['rank'] = i + 1
        leaderboard.append(r)

    return jsonify({
        "group_name": group.name,
        "period": period,
        "period_name": period_name,
        "leaderboard": leaderboard
    }), 200


# --- Leave a group ---
@groups_bp.route('/<int:group_id>/leave', methods=['POST'])
@jwt_required()
def leave_group(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    membership = GroupMember.query.filter_by(
        group_id=group_id, 
        user_id=user.id
    ).first()
    
    if not membership:
        return jsonify({"message": "You are not a member of this group"}), 404

    # Check if admin and only admin
    if membership.role == 'admin':
        admin_count = GroupMember.query.filter_by(
            group_id=group_id, 
            role='admin'
        ).count()
        
        if admin_count <= 1:
            return jsonify({
                "message": "You are the only admin. Transfer admin role or delete the group first."
            }), 400

    db.session.delete(membership)
    db.session.commit()

    return jsonify({"message": "Left group successfully"}), 200


# --- Remove member (admin only) ---
@groups_bp.route('/<int:group_id>/remove/<int:user_id>', methods=['POST'])
@jwt_required()
def remove_member(group_id, user_id):
    current_user_id = get_jwt_identity()
    admin_user = User.query.get(int(current_user_id))
    
    if not admin_user:
        return jsonify({"message": "User not found"}), 404

    # Check if requester is admin
    admin_membership = GroupMember.query.filter_by(
        group_id=group_id, 
        user_id=admin_user.id,
        role='admin'
    ).first()
    
    if not admin_membership:
        return jsonify({"message": "Admin access required"}), 403

    # Find member to remove
    member = GroupMember.query.filter_by(
        group_id=group_id, 
        user_id=user_id
    ).first()
    
    if not member:
        return jsonify({"message": "Member not found"}), 404

    if member.user_id == admin_user.id:
        return jsonify({"message": "Cannot remove yourself"}), 400

    db.session.delete(member)
    db.session.commit()

    return jsonify({"message": "Member removed successfully"}), 200


# --- Delete group (admin only) ---
@groups_bp.route('/<int:group_id>/delete', methods=['DELETE'])
@jwt_required()
def delete_group(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check if admin
    admin_membership = GroupMember.query.filter_by(
        group_id=group_id, 
        user_id=user.id,
        role='admin'
    ).first()
    
    if not admin_membership:
        return jsonify({"message": "Admin access required"}), 403

    group = Group.query.get(group_id)
    if not group:
        return jsonify({"message": "Group not found"}), 404

    db.session.delete(group)
    db.session.commit()

    return jsonify({"message": "Group deleted successfully"}), 200


# ============================================
# GROUP POSTS (ANNOUNCEMENTS/FEED)
# ============================================

# --- Get group posts ---
@groups_bp.route('/<int:group_id>/posts', methods=['GET'])
@jwt_required()
def get_group_posts(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check membership
    membership = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
    if not membership:
        return jsonify({"message": "Not a member"}), 403

    # Get posts (pinned first, then by date)
    posts = GroupPost.query.filter_by(group_id=group_id).order_by(
        GroupPost.is_pinned.desc(),
        GroupPost.created_at.desc()
    ).all()

    output = []
    for p in posts:
        output.append({
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "author": p.author.display_name,
            "author_id": p.user_id,
            "is_pinned": p.is_pinned,
            "created_at": p.created_at.strftime("%d/%m/%Y %H:%M"),
            "comment_count": len(p.comments)
        })

    return jsonify({"posts": output}), 200


# --- Create a post (admin only) ---
@groups_bp.route('/<int:group_id>/posts', methods=['POST'])
@jwt_required()
def create_post(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check admin
    membership = GroupMember.query.filter_by(
        group_id=group_id, user_id=user.id, role='admin'
    ).first()
    if not membership:
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json()
    content = data.get('content', '').strip()
    title = data.get('title', '').strip()
    is_pinned = data.get('is_pinned', False)

    if not content:
        return jsonify({"message": "Content is required"}), 400

    new_post = GroupPost(
        group_id=group_id,
        user_id=user.id,
        title=title if title else None,
        content=content,
        is_pinned=is_pinned
    )
    db.session.add(new_post)
    db.session.commit()

    return jsonify({"message": "Post created!", "post_id": new_post.id}), 201


# --- Get single post with comments ---
@groups_bp.route('/<int:group_id>/posts/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post_details(group_id, post_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    membership = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
    if not membership:
        return jsonify({"message": "Not a member"}), 403

    post = GroupPost.query.filter_by(id=post_id, group_id=group_id).first()
    if not post:
        return jsonify({"message": "Post not found"}), 404

    comments = []
    for c in post.comments:
        comments.append({
            "id": c.id,
            "content": c.content,
            "author": c.author.display_name,
            "author_id": c.user_id,
            "created_at": c.created_at.strftime("%d/%m/%Y %H:%M")
        })

    return jsonify({
        "post": {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "author": post.author.display_name,
            "author_id": post.user_id,
            "is_pinned": post.is_pinned,
            "created_at": post.created_at.strftime("%d/%m/%Y %H:%M")
        },
        "comments": comments,
        "is_admin": membership.role == 'admin'
    }), 200


# --- Add comment to post ---
@groups_bp.route('/<int:group_id>/posts/<int:post_id>/comment', methods=['POST'])
@jwt_required()
def add_comment(group_id, post_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    membership = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
    if not membership:
        return jsonify({"message": "Not a member"}), 403

    post = GroupPost.query.filter_by(id=post_id, group_id=group_id).first()
    if not post:
        return jsonify({"message": "Post not found"}), 404

    data = request.get_json()
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"message": "Comment content required"}), 400

    comment = GroupPostComment(
        post_id=post_id,
        user_id=user.id,
        content=content
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({"message": "Comment added!", "comment_id": comment.id}), 201


# --- Delete post (admin only) ---
@groups_bp.route('/<int:group_id>/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(group_id, post_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    membership = GroupMember.query.filter_by(
        group_id=group_id, user_id=user.id, role='admin'
    ).first()
    if not membership:
        return jsonify({"message": "Admin access required"}), 403

    post = GroupPost.query.filter_by(id=post_id, group_id=group_id).first()
    if not post:
        return jsonify({"message": "Post not found"}), 404

    db.session.delete(post)
    db.session.commit()

    return jsonify({"message": "Post deleted"}), 200


# ============================================
# GROUP GOALS (CHALLENGES/TARGETS)
# ============================================

# --- Get group goals ---
@groups_bp.route('/<int:group_id>/goals', methods=['GET'])
@jwt_required()
def get_group_goals(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    membership = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
    if not membership:
        return jsonify({"message": "Not a member"}), 403

    group = Group.query.get(group_id)
    member_ids = [m.user_id for m in group.members]

    goals = GroupGoal.query.filter_by(group_id=group_id).order_by(
        GroupGoal.status.asc(),  # active first
        GroupGoal.created_at.desc()
    ).all()

    output = []
    
    # Pre-fetch correct answers for calculation efficiency
    # This query gets (user_id, count) for all members
    # In a real app we'd filter by date per goal, but this is a simplified approach
    
    for g in goals:
        current_value = 0
        top_contributors = []
        is_individual = g.scope == 'individual'
        
        # Determine relevant users for calculation
        target_users = [user.id] if is_individual else member_ids
        
        if g.target_type == 'tests_count':
            # Count total tests
            current_value = TestResult.query.filter(
                TestResult.user_id.in_(target_users),
                TestResult.date_taken >= g.start_date
            ).count()
            
            # For team goals, find contributors
            if not is_individual:
                contribs = db.session.query(
                    TestResult.user_id, db.func.count(TestResult.id)
                ).filter(
                    TestResult.user_id.in_(member_ids),
                    TestResult.date_taken >= g.start_date
                ).group_by(TestResult.user_id).order_by(db.func.count(TestResult.id).desc()).limit(3).all()
                
                for uid, count in contribs:
                    u = User.query.get(uid)
                    top_contributors.append({"name": u.display_name, "value": count})

        elif g.target_type == 'avg_score':
            # Average score
            avg = db.session.query(db.func.avg(TestResult.score)).filter(
                TestResult.user_id.in_(target_users),
                TestResult.date_taken >= g.start_date
            ).scalar()
            current_value = round(avg) if avg else 0

        elif g.target_type == 'correct_answers':
            # NEW: Count correct answers from QuestionAttempt
            # Join with QuestionAttempt
            from models import QuestionAttempt
            
            current_value = QuestionAttempt.query.filter(
                QuestionAttempt.user_id.in_(target_users),
                QuestionAttempt.is_correct == True,
                QuestionAttempt.created_at >= g.start_date
            ).count()

            # For team goals, find contributors
            if not is_individual:
                contribs = db.session.query(
                    QuestionAttempt.user_id, db.func.count(QuestionAttempt.id)
                ).filter(
                    QuestionAttempt.user_id.in_(member_ids),
                    QuestionAttempt.is_correct == True,
                    QuestionAttempt.created_at >= g.start_date
                ).group_by(QuestionAttempt.user_id).order_by(db.func.count(QuestionAttempt.id).desc()).limit(3).all()

                for uid, count in contribs:
                    u = User.query.get(uid)
                    top_contributors.append({"name": u.display_name, "value": count})

        progress_pct = min(100, round((current_value / g.target_value) * 100)) if g.target_value > 0 else 0

        output.append({
            "id": g.id,
            "title": g.title,
            "description": g.description,
            "scope": g.scope,
            "target_type": g.target_type,
            "target_value": g.target_value,
            "current_value": current_value,
            "progress_pct": progress_pct,
            "status": g.status,
            "start_date": g.start_date.strftime("%d/%m/%Y"),
            "end_date": g.end_date.strftime("%d/%m/%Y") if g.end_date else None,
            "created_by": g.creator.display_name,
            "top_contributors": top_contributors
        })

    return jsonify({"goals": output, "is_admin": membership.role == 'admin'}), 200


# --- Create goal (admin only) ---
@groups_bp.route('/<int:group_id>/goals', methods=['POST'])
@jwt_required()
def create_goal(group_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    membership = GroupMember.query.filter_by(
        group_id=group_id, user_id=user.id, role='admin'
    ).first()
    if not membership:
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '')
    target_type = data.get('target_type')
    target_value = data.get('target_value')
    scope = data.get('scope', 'team')
    end_date_str = data.get('end_date')

    if not title or not target_type or not target_value:
        return jsonify({"message": "Title, target_type and target_value are required"}), 400

    if target_type not in ['tests_count', 'avg_score', 'correct_answers']:
        return jsonify({"message": "Invalid target_type"}), 400

    end_date = None
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        except:
            pass

    new_goal = GroupGoal(
        group_id=group_id,
        created_by=user.id,
        title=title,
        description=description,
        scope=scope,
        target_type=target_type,
        target_value=int(target_value),
        end_date=end_date
    )
    db.session.add(new_goal)
    db.session.commit()

    return jsonify({"message": "Goal created!", "goal_id": new_goal.id}), 201


# --- Complete/Close goal (admin only) ---
@groups_bp.route('/<int:group_id>/goals/<int:goal_id>/complete', methods=['POST'])
@jwt_required()
def complete_goal(group_id, goal_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    membership = GroupMember.query.filter_by(
        group_id=group_id, user_id=user.id, role='admin'
    ).first()
    if not membership:
        return jsonify({"message": "Admin access required"}), 403

    goal = GroupGoal.query.filter_by(id=goal_id, group_id=group_id).first()
    if not goal:
        return jsonify({"message": "Goal not found"}), 404

    goal.status = 'completed'
    db.session.commit()

    return jsonify({"message": "Goal marked as completed!"}), 200


# --- Delete goal (admin only) ---
@groups_bp.route('/<int:group_id>/goals/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(group_id, goal_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    membership = GroupMember.query.filter_by(
        group_id=group_id, user_id=user.id, role='admin'
    ).first()
    if not membership:
        return jsonify({"message": "Admin access required"}), 403

    goal = GroupGoal.query.filter_by(id=goal_id, group_id=group_id).first()
    if not goal:
        return jsonify({"message": "Goal not found"}), 404

    db.session.delete(goal)
    db.session.commit()

    return jsonify({"message": "Goal deleted"}), 200

