from app import app
from database import db
from sqlalchemy import text

with app.app_context():
    print("🔧 Fixing schema...")
    try:
        # Try to add the column. If it exists, it might error, so we catch it.
        # Syntax for MySQL
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE protocol ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General';"))
            print("✅ Added 'category' column to 'protocol' table.")
    except Exception as e:
        print(f"ℹ️ Note: {e}")
        # Make sure it's not a connection error
        if "Duplicate column name" in str(e):
            print("✅ Column 'category' already exists.")
        else:
            print("⚠️ Could not alter table. If the table doesn't exist, it will be created by seed.py.")

print("🏁 Done.")
