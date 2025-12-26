from app import app
from database import db
from models import Protocol, Question

def seed_data():
    with app.app_context():
        print("🌱 Starting database seed...")

        # 1. ניקוי נתונים ישנים (כדי שלא יהיו כפילויות)
        # מוחקים קודם שאלות כי הן תלויות בפרוטוקולים
        db.session.query(Question).delete()
        db.session.query(Protocol).delete()
        
        # 2. יצירת פרוטוקולים לדוגמה
        p1 = Protocol(title="החייאת מבוגרים (ALS)", description="פרוטוקול מתקדם לטיפול בדום לב במבוגר")
        p2 = Protocol(title="טיפול בטראומה (PHTLS)", description="עקרונות הטיפול בפצוע בודד וארן")
        p3 = Protocol(title="תגובה אלרגית (Anaphylaxis)", description="טיפול בהלם אנאפילקטי")

        db.session.add_all([p1, p2, p3])
        db.session.commit() # שומרים כדי שיהיה להם ID
        
        print("✅ Protocols created!")

        # 3. יצירת שאלות לפרוטוקול החייאה (p1)
        q1 = Question(
            protocol_id=p1.id,
            text="מה המינון הראשוני של אדרנלין בדום לב?",
            option_a="0.5 mg",
            option_b="1 mg",
            option_c="3 mg",
            option_d="0.1 mg",
            correct_answer="b"
        )

        q2 = Question(
            protocol_id=p1.id,
            text="איזו תרופה ניתנת בהפרעת קצב מסוג VF לאחר שוק שלישי?",
            option_a="Amiodarone 300mg",
            option_b="Lidocaine 100mg",
            option_c="Magnesium 2g",
            option_d="Atropine 1mg",
            correct_answer="a"
        )

        # 4. יצירת שאלות לטראומה (p2)
        q3 = Question(
            protocol_id=p2.id,
            text="מהו השלב הראשון בביצוע סכמת PHTLS?",
            option_a="Airway",
            option_b="Safety",
            option_c="Breathing",
            option_d="Circulation",
            correct_answer="b"
        )

        db.session.add_all([q1, q2, q3])
        db.session.commit()

        print("✅ Questions created!")
        print("🏁 Database seeded successfully!")

if __name__ == '__main__':
    seed_data()