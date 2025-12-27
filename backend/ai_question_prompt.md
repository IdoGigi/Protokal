# AI Question Generation Prompt for Proto-Kal
# Copy everything below the line and paste it to your AI along with the ALS-2024 PDF

---

You are helping build a medical training question database. I am uploading the file "als-2024.pdf" (MADA ALS 2024 guidelines in Hebrew).

## YOUR TASK:
Extract as many multiple-choice questions as possible from this PDF and format them for database import.

## ⚠️ OUTPUT REQUIREMENT - VERY IMPORTANT:
**Create your output in a CODE CANVAS / CODE ARTIFACT / CODE BLOCK**
This ensures proper formatting with each line preserved correctly.

## OUTPUT FORMAT: CSV (Comma-Separated Values)

### CRITICAL REQUIREMENTS - READ CAREFULLY:

1. **OUTPUT IN A CODE CANVAS** - Use the canvas/artifact feature to create a code file
   
2. **EACH QUESTION MUST BE ON ITS OWN LINE** 
   - Press ENTER after each question
   - Do NOT output everything on one line
   
3. **First line = header row** (copy exactly):
   ```
   protocol_name,text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty_level,source_reference
   ```

3. **NO markdown formatting** - no ``` code blocks, no bold, no bullets

4. **Commas in text**: If any field contains a comma, wrap that field in double quotes
   - Wrong: הנחיות AHA, 2020
   - Correct: "הנחיות AHA, 2020"

5. **Quotes in text**: If any field contains quote marks, use two double quotes
   - Wrong: עומק 5-6 ס"מ
   - Correct: "עומק 5-6 ס""מ"

6. **Explanations**: Keep very short (1 sentence). Avoid commas. Use periods instead.

7. **correct_answer**: Only lowercase letter: a, b, c, or d

8. **difficulty_level**: Only numbers: 1 (easy), 2 (medium), 3 (hard)

9. **source_reference**: Just the PAGE NUMBER from the PDF (e.g., "27" or "30-31")

---

## EXACT PROTOCOL NAMES (you MUST use these exactly):

### Resuscitation (החייאה)
דום לב במבוגר - VF/VT
דום לב במבוגר - PEA/Asystole
טיפול לאחר החייאה (ROSC) - מבוגרים
דום לב בילדים - VF/VT
דום לב בילדים - PEA/Asystole
טיפול לאחר החייאה (ROSC) - ילדים
הטיפול המיידי ביילוד
פינוי תוך כדי החייאה / הפסקת החייאה

### Adult Medicine (מבוגרים)
ניהול נתיב אוויר מתקדם (Advanced Airway)
השתנקות וגוף זר (FBAO)
תגובה אלרגית / אנפילקסיס - מבוגר
ירידה בפרפוזיה / הלם (Non-Traumatic Shock)
בחילות והקאות

### Respiratory (נשימה)
סיוע נשימתי (CPAP) ואי-ספיקה נשימתית
בצקת ריאות (Pulmonary Edema)
התקף אסתמה במבוגר
החמרה ב-COPD

### Cardiology (לב)
טכיקרדיה במבוגר (גישה כללית)
טכיאריתמיה בקומפלקס רחב (Wide Complex)
טכיאריתמיה בקומפלקס צר (Narrow Complex)
ברדיקרדיה במבוגר
תסמונת כלילית חריפה (ACS / MI)

### Neurology (נוירולוגיה)
שבץ מוחי (CVA)
פרכוסים במבוגר
שינויים במצב הכרה / היפוגליקמיה
דליריום

### Pediatrics (ילדים)
ניהול נתיב אוויר בילדים
סטרידור (Stridor)
התקף אסתמה בילדים
טכיקרדיה בילדים (רחב/צר)
ברדיקרדיה בילדים
פרכוסים בילדים
שינויים במצב הכרה בילדים
אנפילקסיס בילדים

### Trauma (טראומה)
הטיפול בנפגע טראומה (PHTLS)
קיבוע עמוד שדרה
תסמונת מעיכה (Crush Syndrome)
החייאת טראומה (TCPA)
כויות (Burns)
טיפול בכאב

### Environmental (סביבה)
פגיעות בעלי חיים (הכשות/עקיצות)
שאיפת עשן
טביעה
פגיעות חום (Heat Stroke)
היפותרמיה

### Toxicology (הרעלות)
הרעלת זרחנים אורגניים

### OB/GYN (מיילדות)
קבלת לידה
דימום סב-לידתי (PPH)
סיבוכים בלידה (עכוז, פרע כתפיים)
רעלת היריון (Pre-Eclampsia)

### Medicine/Pharma (תרופות)
אדרנלין (Adrenaline/Epinephrine)
אמיודרון (Amiodarone)
אטרופין (Atropine)
אדנוזין (Adenosine)
מגנזיום סולפט (Magnesium Sulfate)
סלבוטמול (Salbutamol/Ventolin)
איפרטרופיום (Ipratropium)
דקסמתזון (Dexamethasone)
הידרוקורטיזון (Hydrocortisone)
פוסיד (Furosemide)
מורפין (Morphine)
פנטניל (Fentanyl)
קטמין (Ketamine)
מידזולם (Midazolam)
דיאזפאם (Diazepam)
גלוקוז (Glucose/Dextrose)
גלוקגון (Glucagon)
נלוקסון (Naloxone/Narcan)
אספירין (Aspirin)
ניטרוגליצרין (Nitroglycerin)
אוקסיטוצין (Oxytocin)
TXA - חומצה טרנקסמית (Tranexamic Acid)
סודיום ביקרבונט (Sodium Bicarbonate)
קלציום גלוקונט (Calcium Gluconate)
אנטיביוטיקה פרה-הוספיטלית

---

## EXAMPLE OUTPUT (in a CODE CANVAS):

```csv
protocol_name,text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty_level,source_reference
דום לב במבוגר - VF/VT,מהו קצב העיסויים המומלץ?,60-80,80-100,100-120,120-140,c,קצב מומלץ 100-120 לדקה,1,27
דום לב במבוגר - VF/VT,מהו עומק העיסויים?,"3-4 ס""מ","4-5 ס""מ","5-6 ס""מ","6-7 ס""מ",c,עומק 5-6 סנטימטר עם חזרה מלאה,2,27
דום לב במבוגר - VF/VT,יחס עיסויים להנשמות?,15:2,30:2,15:1,30:1,b,יחס 30 עיסויים ל-2 הנשמות,1,27
דום לב במבוגר - VF/VT,מתי לתת אדרנלין ראשון ב-VF?,מיד,אחרי שוק ראשון,אחרי שוק שני,אחרי 5 דקות,c,אדרנלין ניתן לאחר השוק השני,2,30-31
```

---

## NOW GENERATE:
- **CREATE A CODE CANVAS/ARTIFACT** with the CSV output
- Extract ALL possible questions from the PDF (aim for 50-100)
- Each question on its own line
- source_reference = page number only
- No intro text. No conclusion. Just CSV data in the code canvas.

