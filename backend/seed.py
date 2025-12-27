from app import app
from database import db
from models import Protocol

# רשימת הפרוטוקולים המלאה שחילצנו מאוגדן ALS 2024
protocols_data = [
    # --- פרק 2: החייאה (Resuscitation) ---
    {"category": "Resuscitation", "title": "דום לב במבוגר - VF/VT"},
    {"category": "Resuscitation", "title": "דום לב במבוגר - PEA/Asystole"},
    {"category": "Resuscitation", "title": "טיפול לאחר החייאה (ROSC) - מבוגרים"},
    {"category": "Resuscitation", "title": "דום לב בילדים - VF/VT"},
    {"category": "Resuscitation", "title": "דום לב בילדים - PEA/Asystole"},
    {"category": "Resuscitation", "title": "טיפול לאחר החייאה (ROSC) - ילדים"},
    {"category": "Resuscitation", "title": "הטיפול המיידי ביילוד"},
    {"category": "Resuscitation", "title": "פינוי תוך כדי החייאה / הפסקת החייאה"},

    # --- פרק 3: מצבי חירום במבוגרים (Adult Medicine) ---
    {"category": "Adult Medicine", "title": "ניהול נתיב אוויר מתקדם (Advanced Airway)"},
    {"category": "Adult Medicine", "title": "השתנקות וגוף זר (FBAO)"},
    {"category": "Respiratory", "title": "סיוע נשימתי (CPAP) ואי-ספיקה נשימתית"},
    {"category": "Respiratory", "title": "בצקת ריאות (Pulmonary Edema)"},
    {"category": "Respiratory", "title": "התקף אסתמה במבוגר"},
    {"category": "Respiratory", "title": "החמרה ב-COPD"},
    {"category": "Adult Medicine", "title": "תגובה אלרגית / אנפילקסיס - מבוגר"},
    {"category": "Cardiology", "title": "טכיקרדיה במבוגר (גישה כללית)"},
    {"category": "Cardiology", "title": "טכיאריתמיה בקומפלקס רחב (Wide Complex)"},
    {"category": "Cardiology", "title": "טכיאריתמיה בקומפלקס צר (Narrow Complex)"},
    {"category": "Cardiology", "title": "ברדיקרדיה במבוגר"},
    {"category": "Cardiology", "title": "תסמונת כלילית חריפה (ACS / MI)"},
    {"category": "Adult Medicine", "title": "ירידה בפרפוזיה / הלם (Non-Traumatic Shock)"},
    {"category": "Neurology", "title": "שבץ מוחי (CVA)"},
    {"category": "Neurology", "title": "פרכוסים במבוגר"},
    {"category": "Neurology", "title": "שינויים במצב הכרה / היפוגליקמיה"},
    {"category": "Neurology", "title": "דליריום"},
    {"category": "Adult Medicine", "title": "בחילות והקאות"},

    # --- פרק 4: מצבי חירום בילדים (Pediatrics) ---
    {"category": "Pediatrics", "title": "ניהול נתיב אוויר בילדים"},
    {"category": "Pediatrics", "title": "סטרידור (Stridor)"},
    {"category": "Pediatrics", "title": "התקף אסתמה בילדים"},
    {"category": "Pediatrics", "title": "טכיקרדיה בילדים (רחב/צר)"},
    {"category": "Pediatrics", "title": "ברדיקרדיה בילדים"},
    {"category": "Pediatrics", "title": "פרכוסים בילדים"},
    {"category": "Pediatrics", "title": "שינויים במצב הכרה בילדים"},
    {"category": "Pediatrics", "title": "אנפילקסיס בילדים"},

    # --- פרק 5: טראומה וסביבה (Trauma & Environmental) ---
    {"category": "Trauma", "title": "הטיפול בנפגע טראומה (PHTLS)"},
    {"category": "Trauma", "title": "קיבוע עמוד שדרה"},
    {"category": "Trauma", "title": "תסמונת מעיכה (Crush Syndrome)"},
    {"category": "Trauma", "title": "החייאת טראומה (TCPA)"},
    {"category": "Trauma", "title": "כויות (Burns)"},
    {"category": "Trauma", "title": "טיפול בכאב"},
    {"category": "Environmental", "title": "פגיעות בעלי חיים (הכשות/עקיצות)"},
    {"category": "Environmental", "title": "שאיפת עשן"},
    {"category": "Environmental", "title": "טביעה"},
    {"category": "Toxicology", "title": "הרעלת זרחנים אורגניים"},
    {"category": "Environmental", "title": "פגיעות חום (Heat Stroke)"},
    {"category": "Environmental", "title": "היפותרמיה"},

    # --- פרק 6: מיילדות וגינקולוגיה (OB/GYN) ---
    {"category": "OB/GYN", "title": "קבלת לידה"},
    {"category": "OB/GYN", "title": "דימום סב-לידתי (PPH)"},
    {"category": "OB/GYN", "title": "סיבוכים בלידה (עכוז, פרע כתפיים)"},
    {"category": "OB/GYN", "title": "רעלת היריון (Pre-Eclampsia)"},

    # --- פרק 7: תרופות (Medicine/Pharma) ---
    {"category": "Medicine/Pharma", "title": "אדרנלין (Adrenaline/Epinephrine)"},
    {"category": "Medicine/Pharma", "title": "אמיודרון (Amiodarone)"},
    {"category": "Medicine/Pharma", "title": "אטרופין (Atropine)"},
    {"category": "Medicine/Pharma", "title": "אדנוזין (Adenosine)"},
    {"category": "Medicine/Pharma", "title": "מגנזיום סולפט (Magnesium Sulfate)"},
    {"category": "Medicine/Pharma", "title": "סלבוטמול (Salbutamol/Ventolin)"},
    {"category": "Medicine/Pharma", "title": "איפרטרופיום (Ipratropium)"},
    {"category": "Medicine/Pharma", "title": "דקסמתזון (Dexamethasone)"},
    {"category": "Medicine/Pharma", "title": "הידרוקורטיזון (Hydrocortisone)"},
    {"category": "Medicine/Pharma", "title": "פוסיד (Furosemide)"},
    {"category": "Medicine/Pharma", "title": "מורפין (Morphine)"},
    {"category": "Medicine/Pharma", "title": "פנטניל (Fentanyl)"},
    {"category": "Medicine/Pharma", "title": "קטמין (Ketamine)"},
    {"category": "Medicine/Pharma", "title": "מידזולם (Midazolam)"},
    {"category": "Medicine/Pharma", "title": "דיאזפאם (Diazepam)"},
    {"category": "Medicine/Pharma", "title": "גלוקוז (Glucose/Dextrose)"},
    {"category": "Medicine/Pharma", "title": "גלוקגון (Glucagon)"},
    {"category": "Medicine/Pharma", "title": "נלוקסון (Naloxone/Narcan)"},
    {"category": "Medicine/Pharma", "title": "אספירין (Aspirin)"},
    {"category": "Medicine/Pharma", "title": "ניטרוגליצרין (Nitroglycerin)"},
    {"category": "Medicine/Pharma", "title": "אוקסיטוצין (Oxytocin)"},
    {"category": "Medicine/Pharma", "title": "TXA - חומצה טרנקסמית (Tranexamic Acid)"},
    {"category": "Medicine/Pharma", "title": "סודיום ביקרבונט (Sodium Bicarbonate)"},
    {"category": "Medicine/Pharma", "title": "קלציום גלוקונט (Calcium Gluconate)"},
    {"category": "Medicine/Pharma", "title": "אנטיביוטיקה פרה-הוספיטלית"},
]

def seed_protocols():
    print("🌱 Seeding Protocols...")
    
    # אופציה 1: מחיקת כל הפרוטוקולים הקיימים והתחלה מחדש (מומלץ לפיתוח)
    try:
        num_deleted = db.session.query(Protocol).delete()
        db.session.commit()
        print(f"   Deleted {num_deleted} existing protocols.")
    except Exception as e:
        db.session.rollback()
        print(f"   Error clearing protocols: {e}")

    # הוספת הפרוטוקולים החדשים
    count = 0
    for p_data in protocols_data:
        # בדיקה אם קיים כבר (למקרה שלא מחקנו)
        exists = Protocol.query.filter_by(title=p_data['title']).first()
        if not exists:
            new_protocol = Protocol(
                title=p_data['title'],
                category=p_data['category'],
                description=f"Protocol based on MADA ALS 2024 guidelines for {p_data['title']}"
            )
            db.session.add(new_protocol)
            count += 1
    
    db.session.commit()
    print(f"✅ Successfully added {count} protocols to the database!")

if __name__ == "__main__":
    with app.app_context():
        # וודא שהטבלאות קיימות
        db.create_all()
        
        # הרצת הזריעה
        seed_protocols()