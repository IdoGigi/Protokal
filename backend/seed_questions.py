"""
Bulletproof Question Seeder for Proto-Kal V2
============================================
This script safely populates the 'question' table from a CSV file.

Key Security & Robustness Features:
1. Zero SQL Injection Risk: Uses SQLAlchemy ORM objects, never raw SQL strings.
2. Robust CSV Parsing: Uses csv.DictReader which handles commas/quotes/newlines in fields.
3. Smart Protocol Linking: Maps protocol_name (string) to protocol.id via DB lookup.
4. Data Validation: Validates correct_answer, difficulty_level, and required fields.
5. Per-Row Error Handling: One bad row doesn't crash the batch; errors are logged.
"""

import csv
import sys
from app import app
from database import db
from models import Question, Protocol


def seed_questions_from_csv(filepath: str, clear_existing: bool = False):
    """
    Reads questions from a CSV file and inserts them into the database.

    Args:
        filepath: Path to the CSV file.
        clear_existing: If True, deletes all existing questions before seeding.
    """
    with app.app_context():
        # --- Step 1: Optionally Clear Existing Questions ---
        if clear_existing:
            deleted_count = Question.query.delete()
            db.session.commit()
            print(f"🗑️  Cleared {deleted_count} existing questions.")

        # --- Step 2: Pre-fetch Protocols for Fast Lookup ---
        # Map lowercase names to Protocol objects for efficient matching
        protocols_map = {p.title.lower().strip(): p for p in Protocol.query.all()}
        if not protocols_map:
            print("❌ FATAL: No protocols found in database. Run seed.py first!")
            return

        print(f"📖 Loaded {len(protocols_map)} protocols for matching.")

        # --- Step 3: Open and Parse CSV ---
        valid_count = 0
        error_count = 0
        questions_to_add = []

        try:
            with open(filepath, 'r', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile)

                # Verify required headers exist
                required = ['protocol_name', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']
                if not reader.fieldnames or not all(h in reader.fieldnames for h in required):
                    print(f"❌ FATAL: CSV is missing required headers. Expected: {required}")
                    print(f"   Found: {reader.fieldnames}")
                    return

                for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 = header)
                    try:
                        # --- Validation 1: Protocol Lookup ---
                        protocol_name_raw = row.get('protocol_name', '').strip()
                        protocol_key = protocol_name_raw.lower()
                        protocol = protocols_map.get(protocol_key)

                        if not protocol:
                            raise ValueError(f"Protocol not found: '{protocol_name_raw}'")

                        # --- Validation 2: Required Fields ---
                        text = row.get('text', '').strip()
                        option_a = row.get('option_a', '').strip()
                        option_b = row.get('option_b', '').strip()
                        option_c = row.get('option_c', '').strip()
                        option_d = row.get('option_d', '').strip()

                        if not all([text, option_a, option_b, option_c, option_d]):
                            raise ValueError("Missing required text/option fields.")

                        # --- Validation 3: Correct Answer ---
                        correct_answer = row.get('correct_answer', '').lower().strip()
                        if correct_answer not in ['a', 'b', 'c', 'd']:
                            raise ValueError(f"Invalid correct_answer: '{correct_answer}'. Must be a, b, c, or d.")

                        # --- Validation 4: Difficulty Level ---
                        difficulty_raw = row.get('difficulty_level', '1').strip()
                        if difficulty_raw.isdigit() and int(difficulty_raw) in [1, 2, 3]:
                            difficulty_level = int(difficulty_raw)
                        else:
                            difficulty_level = 1  # Default to easy if invalid or missing

                        # --- Optional Fields ---
                        explanation = row.get('explanation', '').strip()
                        source_reference = row.get('source_reference', '').strip()

                        # --- Create ORM Object (Safe from SQL Injection) ---
                        question = Question(
                            protocol_id=protocol.id,
                            text=text,
                            option_a=option_a,
                            option_b=option_b,
                            option_c=option_c,
                            option_d=option_d,
                            correct_answer=correct_answer,
                            explanation=explanation if explanation else None,
                            source_reference=source_reference if source_reference else None,
                            difficulty_level=difficulty_level
                        )
                        questions_to_add.append(question)
                        valid_count += 1

                    except Exception as e:
                        error_count += 1
                        print(f"   ⚠️  Row {row_num}: {e}")

        except FileNotFoundError:
            print(f"❌ FATAL: File not found: {filepath}")
            return
        except Exception as e:
            print(f"❌ FATAL: Could not read CSV file. Error: {e}")
            return

        # --- Step 4: Bulk Insert ---
        if questions_to_add:
            db.session.add_all(questions_to_add)
            db.session.commit()
            print(f"\n✅ Successfully imported {valid_count} questions.")
        else:
            print("\n⚠️  No valid questions were found to import.")

        if error_count > 0:
            print(f"❌ Encountered {error_count} errors (see warnings above).")


if __name__ == '__main__':
    # --- Configuration ---
    CSV_FILE = 'questions.csv'  # Default file name
    CLEAR_FIRST = True          # Set to False to append instead of replace

    print("=" * 50)
    print("   Proto-Kal V2 - Bulletproof Question Seeder")
    print("=" * 50)

    if len(sys.argv) > 1:
        CSV_FILE = sys.argv[1]

    print(f"📂 Reading from: {CSV_FILE}")
    print(f"🧹 Clear existing questions first: {CLEAR_FIRST}")
    print("-" * 50)

    seed_questions_from_csv(CSV_FILE, clear_existing=CLEAR_FIRST)

    print("-" * 50)
    print("🏁 Done.")
