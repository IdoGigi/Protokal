"""
Script to create the question_flag table in the database.
Run this once after adding the QuestionFlag model.
"""
import mysql.connector

config = {
    'host': 'localhost',
    'user': 'root',
    'password': '1234',
    'database': 'protokal_v2'
}

conn = mysql.connector.connect(**config)
cursor = conn.cursor()

# Create question_flag table
cursor.execute("""
CREATE TABLE IF NOT EXISTS question_flag (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_id INT NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    admin_notes TEXT,
    FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
)
""")

conn.commit()
print("✅ question_flag table created successfully!")

cursor.close()
conn.close()
