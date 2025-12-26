from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime 

# --- User Table ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)  # Login identifier
    email = db.Column(db.String(120), unique=True, nullable=False)  # For future automations/notifications
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(80), unique=True, nullable=False)  # Displayed in UI after login
    is_admin = db.Column(db.Boolean, default=False)  # Admin role flag
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # Account creation timestamp

    def set_password(self, password):
        """Hash and store the password securely."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify a password against the stored hash."""
        return check_password_hash(self.password_hash, password)

# --- Protocol Table ---
class Protocol(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)  # Added category field
    description = db.Column(db.Text, nullable=True)       # Changed to Text
    
    # Relationship: when fetching protocol, we can also request its questions
    questions = db.relationship('Question', backref='protocol', lazy=True)

# --- Question Table ---
class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Foreign Key: link to parent Protocol
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=False)
    
    text = db.Column(db.Text, nullable=False)              # Question content
    option_a = db.Column(db.String(200), nullable=False)   # Answer A
    option_b = db.Column(db.String(200), nullable=False)   # Answer B
    option_c = db.Column(db.String(200), nullable=False)   # Answer C
    option_d = db.Column(db.String(200), nullable=False)   # Answer D
    correct_answer = db.Column(db.String(1), nullable=False) # Which answer is correct? ('a', 'b', 'c', 'd')
    
    # Educational content fields
    explanation = db.Column(db.Text, nullable=True)        # Detailed explanation of the correct answer
    source_reference = db.Column(db.String(255), nullable=True)  # Protocol/book reference (e.g., "ALS Protocol, Page 4")
    difficulty_level = db.Column(db.Integer, default=1)    # Difficulty: 1=Easy, 2=Medium, 3=Hard

# --- Question Flag Table (for QA) ---
class QuestionFlag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.Text, nullable=True)  # User's description of the problem
    status = db.Column(db.String(20), default='pending')  # 'pending', 'reviewed', 'resolved'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    
    # Relationships
    question = db.relationship('Question', backref='flags')
    user = db.relationship('User', backref='flagged_questions')
class TestResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)     # Who took the test?
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=True)  # Which protocol? NULL = general test
    score = db.Column(db.Integer, nullable=False) # Score (e.g., 80)
    date_taken = db.Column(db.DateTime, default=datetime.utcnow) # When was it taken?

# --- Question Comment Table (for discussions) ---
class QuestionComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)  # Which question?
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)          # Who commented?
    content = db.Column(db.Text, nullable=False)              # Comment text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # When was it posted?
    
    # Relationships for easy access
    user = db.relationship('User', backref='comments')
    question = db.relationship('Question', backref='comments')

# --- Question Suggestion Table (crowdsourcing) ---
class QuestionSuggestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Who suggested?
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=True)  # Suggested protocol category
    
    # Question content (mirrors Question model)
    text = db.Column(db.Text, nullable=False)              # Question content
    option_a = db.Column(db.String(200), nullable=False)   # Answer A
    option_b = db.Column(db.String(200), nullable=False)   # Answer B
    option_c = db.Column(db.String(200), nullable=False)   # Answer C
    option_d = db.Column(db.String(200), nullable=False)   # Answer D
    correct_answer = db.Column(db.String(1), nullable=False)  # Correct answer ('a', 'b', 'c', 'd')
    
    # Educational content
    explanation = db.Column(db.Text, nullable=True)        # Explanation of correct answer
    source_reference = db.Column(db.String(255), nullable=True)  # Reference source
    difficulty_level = db.Column(db.Integer, default=1)    # Suggested difficulty
    
    # Admin review fields
    status = db.Column(db.String(20), default='pending')   # 'pending', 'approved', 'rejected'
    admin_feedback = db.Column(db.Text, nullable=True)     # Feedback from admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='suggestions')
    protocol = db.relationship('Protocol', backref='suggestions')

# --- Question Attempt Table (for tracking individual answers) ---
class QuestionAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)      # Who answered?
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)  # Which question?
    is_correct = db.Column(db.Boolean, nullable=False)        # Did they get it right?
    user_answer = db.Column(db.String(1), nullable=True)      # What they answered ('a', 'b', 'c', 'd')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # When was it attempted?
    
    # Relationships for easy access
    user = db.relationship('User', backref='attempts')
    question = db.relationship('Question', backref='attempts')

# --- Group Table (for teams/organizations) ---
class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)           # Group name
    description = db.Column(db.String(255), nullable=True)     # Optional description
    invite_code = db.Column(db.String(8), unique=True, nullable=False)  # 6-8 char code
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Who created it
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='created_groups', foreign_keys=[created_by])
    members = db.relationship('GroupMember', backref='group', lazy=True, cascade='all, delete-orphan')

# --- Group Member Table (many-to-many: user <-> group) ---
class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # 'admin' or 'member'
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship for easy access to user
    user = db.relationship('User', backref='group_memberships')
    
    # Unique constraint - user can only join a group once
    __table_args__ = (db.UniqueConstraint('group_id', 'user_id', name='unique_group_member'),)

# --- Group Post Table (announcements/feed) ---
class GroupPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Who posted
    title = db.Column(db.String(150), nullable=True)          # Optional title
    content = db.Column(db.Text, nullable=False)              # Post content
    is_pinned = db.Column(db.Boolean, default=False)          # Pin to top
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    author = db.relationship('User', backref='group_posts')
    group = db.relationship('Group', backref='posts')
    comments = db.relationship('GroupPostComment', backref='post', lazy=True, cascade='all, delete-orphan')

# --- Group Post Comment Table ---
class GroupPostComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('group_post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    author = db.relationship('User', backref='post_comments')

# --- Group Goal Table (challenges/targets) ---
class GroupGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    title = db.Column(db.String(150), nullable=False)         # Goal title
    description = db.Column(db.Text, nullable=True)           # Details
    scope = db.Column(db.String(20), default='team')          # 'team' or 'individual'
    target_type = db.Column(db.String(30), nullable=False)    # 'correct_answers', 'questions_mastered', 'avg_score', 'tests_count'
    target_value = db.Column(db.Integer, nullable=False)      # Target number (e.g., 500 correct, 85%)
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=True)  # For protocol-specific goals
    
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)          # Optional deadline
    status = db.Column(db.String(20), default='active')       # 'active', 'completed', 'expired'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    group = db.relationship('Group', backref='goals')
    creator = db.relationship('User', backref='created_goals')

