"""
EDU CARD AI — Synthetic Data Generator

Generates realistic student engagement histories across 7 behavioral archetypes:
1. stable: Consistently high/moderate engagement throughout
2. improving: Starts lower, steadily gains engagement
3. gradual_decline: Early engagement fade (LMS/activity drops in weeks 5-8 BEFORE grades drop in weeks 12+)
4. sudden_drop: Sharp single-week decline due to life event/illness
5. late_submission_drift: High physical attendance but missed/late assignments
6. silent_decliner: Present in class but disengaged from digital platforms
7. recovering: Dips mid-semester, receives support, rebounds

Follows Privacy-by-Design:
- Demographic attributes are kept separate and NEVER returned with feature data.
"""

import random
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd


# Reproducibility seed
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

DEMO_STUDENTS = [
    # Hero Showcase students
    {"student_id": "ST101", "name": "Aarav Sharma", "department": "Computer Science", "year": 3, "semester": 5, "course_id": "CS-301", "archetype": "gradual_decline", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST102", "name": "Ananya Iyer", "department": "Data Science", "year": 2, "semester": 3, "course_id": "DS-201", "archetype": "sudden_drop", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST103", "name": "Rohan Verma", "department": "Information Technology", "year": 3, "semester": 5, "course_id": "IT-301", "archetype": "silent_decliner", "gender": "Male", "category": "OBC", "socioeconomic_band": "Tier-3", "disability_flag": 0},
    {"student_id": "ST104", "name": "Priya Patel", "department": "Computer Science", "year": 3, "semester": 5, "course_id": "CS-301", "archetype": "late_submission_drift", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST105", "name": "Vikramaditya Rao", "department": "Computer Science", "year": 2, "semester": 4, "course_id": "CS-202", "archetype": "recovering", "gender": "Male", "category": "EWS", "socioeconomic_band": "Tier-3", "disability_flag": 0},
    {"student_id": "ST106", "name": "Sneha Kulkarni", "department": "Data Science", "year": 3, "semester": 5, "course_id": "DS-301", "archetype": "gradual_decline", "gender": "Female", "category": "OBC", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST107", "name": "Aditya Nair", "department": "Computer Science", "year": 1, "semester": 2, "course_id": "CS-101", "archetype": "stable", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST108", "name": "Diya Sengupta", "department": "Information Technology", "year": 2, "semester": 3, "course_id": "IT-201", "archetype": "improving", "gender": "Female", "category": "SC", "socioeconomic_band": "Tier-3", "disability_flag": 0},
    {"student_id": "ST109", "name": "Kabir Mehta", "department": "Computer Science", "year": 3, "semester": 5, "course_id": "CS-301", "archetype": "stable", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST110", "name": "Meera Joshi", "department": "Data Science", "year": 2, "semester": 4, "course_id": "DS-202", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST111", "name": "Arjun Reddy", "department": "Information Technology", "year": 4, "semester": 7, "course_id": "IT-401", "archetype": "sudden_drop", "gender": "Male", "category": "OBC", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST112", "name": "Tanvi Deshmukh", "department": "Computer Science", "year": 2, "semester": 3, "course_id": "CS-201", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST113", "name": "Karthik Sundaram", "department": "Data Science", "year": 3, "semester": 5, "course_id": "DS-301", "archetype": "improving", "gender": "Male", "category": "ST", "socioeconomic_band": "Tier-3", "disability_flag": 0},
    {"student_id": "ST114", "name": "Nandini Gupta", "department": "Computer Science", "year": 3, "semester": 6, "course_id": "CS-302", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST115", "name": "Farhan Ali", "department": "Information Technology", "year": 2, "semester": 3, "course_id": "IT-201", "archetype": "gradual_decline", "gender": "Male", "category": "OBC", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST116", "name": "Isha Chatterjee", "department": "Computer Science", "year": 1, "semester": 1, "course_id": "CS-101", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST117", "name": "Varun Kapoor", "department": "Data Science", "year": 3, "semester": 5, "course_id": "DS-301", "archetype": "silent_decliner", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST118", "name": "Ananya Bhattacharya", "department": "Information Technology", "year": 3, "semester": 5, "course_id": "IT-301", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST119", "name": "Siddharth Menon", "department": "Computer Science", "year": 4, "semester": 7, "course_id": "CS-401", "archetype": "recovering", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST120", "name": "Pooja Hegde", "department": "Data Science", "year": 1, "semester": 2, "course_id": "DS-101", "archetype": "improving", "gender": "Female", "category": "OBC", "socioeconomic_band": "Tier-3", "disability_flag": 0},
    {"student_id": "ST121", "name": "Gaurav Malhotra", "department": "Information Technology", "year": 2, "semester": 4, "course_id": "IT-202", "archetype": "stable", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST122", "name": "Ritu Saxena", "department": "Computer Science", "year": 2, "semester": 3, "course_id": "CS-201", "archetype": "late_submission_drift", "gender": "Female", "category": "SC", "socioeconomic_band": "Tier-3", "disability_flag": 1},
    {"student_id": "ST123", "name": "Devansh Tiwari", "department": "Data Science", "year": 3, "semester": 6, "course_id": "DS-302", "archetype": "stable", "gender": "Male", "category": "EWS", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST124", "name": "Kavya Pillai", "department": "Information Technology", "year": 1, "semester": 2, "course_id": "IT-102", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
    {"student_id": "ST125", "name": "Harsh Vardhan", "department": "Computer Science", "year": 4, "semester": 8, "course_id": "CS-402", "archetype": "gradual_decline", "gender": "Male", "category": "General", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST126", "name": "Bhavna Swaminathan", "department": "Data Science", "year": 2, "semester": 3, "course_id": "DS-201", "archetype": "stable", "gender": "Female", "category": "OBC", "socioeconomic_band": "Tier-2", "disability_flag": 0},
    {"student_id": "ST127", "name": "Manish Choudhary", "department": "Information Technology", "year": 3, "semester": 5, "course_id": "IT-301", "archetype": "recovering", "gender": "Male", "category": "ST", "socioeconomic_band": "Tier-3", "disability_flag": 0},
    {"student_id": "ST128", "name": "Divya Nambiar", "department": "Computer Science", "year": 3, "semester": 5, "course_id": "CS-301", "archetype": "stable", "gender": "Female", "category": "General", "socioeconomic_band": "Tier-1", "disability_flag": 0},
]


def _clamp(val: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    return max(min_val, min(max_val, val))


def generate_weekly_series_for_archetype(archetype: str, total_weeks: int = 16) -> List[Dict]:
    """
    Generates 16 weeks of metric records for a student following a specific archetype.
    Each week contains:
    - attendance_pct (0-100)
    - assignment_completion_pct (0-100)
    - assessment_score (0-100, occasional exams in weeks 4, 8, 12, 16)
    - lms_logins (0-30)
    - active_days (0-7)
    - time_spent_minutes (0-500)
    - class_participation_score (0-10)
    """
    records = []
    
    # Base parameters per archetype
    for w in range(1, total_weeks + 1):
        noise = lambda scale=2.5: random.gauss(0, scale)

        if archetype == "stable":
            att = _clamp(92.0 + noise(3.0))
            assign = _clamp(94.0 + noise(3.0))
            score = _clamp(86.0 + noise(4.0)) if w in (4, 8, 12, 16) else _clamp(84.0 + noise(3.0))
            logins = int(_clamp(18 + noise(2.0), 5, 30))
            active_days = int(_clamp(5 + noise(0.7), 3, 7))
            time_spent = _clamp(240.0 + noise(25.0), 60, 450)
            part = _clamp(8.5 + noise(0.4), 0, 10)

        elif archetype == "improving":
            # Growth curve from week 1 to 16
            progress = (w - 1) / (total_weeks - 1)
            att = _clamp(68.0 + progress * 24.0 + noise(3.0))
            assign = _clamp(65.0 + progress * 28.0 + noise(3.0))
            score = _clamp(62.0 + progress * 26.0 + noise(4.0))
            logins = int(_clamp(8 + progress * 12 + noise(2.0), 3, 28))
            active_days = int(_clamp(3 + progress * 3 + noise(0.6), 2, 7))
            time_spent = _clamp(110.0 + progress * 150.0 + noise(20.0), 40, 400)
            part = _clamp(5.5 + progress * 3.5 + noise(0.4), 0, 10)

        elif archetype == "gradual_decline":
            # THE HERO DEMO PATTERN:
            # Weeks 1-4: Baseline solid (att ~90, assign ~95, logins ~18, time ~260)
            # Weeks 5-8: Engagement drops (logins drop to 6-8, time drops to 90m, assign ~75) BUT grades still high!
            # Weeks 9-12: Attendance drops (att ~68%, assign ~60%)
            # Weeks 13-16: Assessment scores drop (score drops ~55%)
            if w <= 4:
                att = _clamp(91.0 + noise(2.5))
                assign = _clamp(95.0 + noise(2.5))
                score = _clamp(87.0 + noise(3.0))
                logins = int(_clamp(19 + noise(2.0), 12, 28))
                active_days = int(_clamp(5 + noise(0.5), 4, 7))
                time_spent = _clamp(270.0 + noise(20.0), 180, 400)
                part = _clamp(8.4 + noise(0.4), 0, 10)
            elif w <= 8:
                # Early Engagement Fade! Notice attendance and scores are still decent!
                att = _clamp(86.0 - (w - 4) * 2.0 + noise(3.0))  # 84 -> 78
                assign = _clamp(88.0 - (w - 4) * 4.0 + noise(3.0))  # 84 -> 72
                score = _clamp(82.0 + noise(3.0))  # Still good!
                logins = int(_clamp(14 - (w - 4) * 2.2 + noise(1.5), 4, 20))  # 12 -> 5
                active_days = int(_clamp(4.5 - (w - 4) * 0.6 + noise(0.5), 2, 6))  # 4 -> 2
                time_spent = _clamp(230.0 - (w - 4) * 35.0 + noise(15.0), 50, 300)  # 195 -> 90
                part = _clamp(7.8 - (w - 4) * 0.7 + noise(0.4), 0, 10)  # 7.1 -> 5.0
            elif w <= 12:
                # Moderate decline
                att = _clamp(75.0 - (w - 8) * 3.0 + noise(3.5))  # 72 -> 63
                assign = _clamp(70.0 - (w - 8) * 4.0 + noise(4.0))  # 66 -> 54
                score = _clamp(76.0 - (w - 8) * 4.0 + noise(4.0))  # 72 -> 60
                logins = int(_clamp(5 - (w - 8) * 0.5 + noise(1.0), 1, 10))
                active_days = int(_clamp(2 - (w - 8) * 0.2 + noise(0.4), 1, 4))
                time_spent = _clamp(80.0 - (w - 8) * 8.0 + noise(12.0), 30, 150)
                part = _clamp(4.8 - (w - 8) * 0.5 + noise(0.4), 0, 10)
            else:
                # Full downstream drop
                att = _clamp(60.0 + noise(4.0))
                assign = _clamp(50.0 + noise(4.0))
                score = _clamp(52.0 + noise(4.0))  # Now exam scores reflect the engagement loss from weeks 5-8!
                logins = int(_clamp(3 + noise(1.0), 1, 8))
                active_days = int(_clamp(1 + noise(0.4), 1, 3))
                time_spent = _clamp(50.0 + noise(10.0), 20, 100)
                part = _clamp(3.0 + noise(0.4), 0, 10)

        elif archetype == "sudden_drop":
            # Stable until week 6, then sharp shock in week 7
            if w < 7:
                att = _clamp(90.0 + noise(2.5))
                assign = _clamp(92.0 + noise(2.5))
                score = _clamp(84.0 + noise(3.0))
                logins = int(_clamp(17 + noise(2.0), 10, 25))
                active_days = int(_clamp(5 + noise(0.5), 3, 7))
                time_spent = _clamp(250.0 + noise(25.0), 150, 380)
                part = _clamp(8.2 + noise(0.4), 0, 10)
            elif w == 7:
                # Sudden single-week shock (e.g. -25 pp drop)
                att = _clamp(62.0 + noise(3.0))
                assign = _clamp(60.0 + noise(3.0))
                score = _clamp(68.0 + noise(3.0))
                logins = int(_clamp(5 + noise(1.0), 2, 10))
                active_days = 2
                time_spent = _clamp(75.0 + noise(15.0), 30, 150)
                part = _clamp(4.0 + noise(0.4), 0, 10)
            else:
                # Persistent low level
                att = _clamp(65.0 + noise(4.0))
                assign = _clamp(62.0 + noise(4.0))
                score = _clamp(64.0 + noise(4.0))
                logins = int(_clamp(6 + noise(1.5), 2, 12))
                active_days = int(_clamp(2 + noise(0.5), 1, 4))
                time_spent = _clamp(90.0 + noise(15.0), 30, 160)
                part = _clamp(4.5 + noise(0.4), 0, 10)

        elif archetype == "late_submission_drift":
            # Attendance steady, but assignment completion drifts down
            att = _clamp(84.0 + noise(3.0))
            assign = _clamp(90.0 - w * 2.8 + noise(3.5))  # drops from 87 to 45
            score = _clamp(80.0 - w * 1.5 + noise(4.0))
            logins = int(_clamp(15 - w * 0.5 + noise(1.5), 4, 22))
            active_days = int(_clamp(4 - w * 0.1 + noise(0.5), 2, 6))
            time_spent = _clamp(210.0 - w * 8.0 + noise(20.0), 60, 320)
            part = _clamp(7.5 - w * 0.2 + noise(0.4), 0, 10)

        elif archetype == "silent_decliner":
            # High classroom attendance, but zero/minimal LMS engagement and participation
            att = _clamp(89.0 + noise(2.0))  # physically sits in class
            assign = _clamp(85.0 - (w * 1.8) + noise(3.0))
            score = _clamp(78.0 - (w * 1.2) + noise(4.0))
            logins = int(_clamp(max(2, 16 - (w * 1.1) + noise(1.0)), 1, 20))  # 15 -> 2
            active_days = int(_clamp(max(1, 5 - (w * 0.3) + noise(0.5)), 1, 6))  # 5 -> 1
            time_spent = _clamp(max(30.0, 240.0 - (w * 15.0) + noise(15.0)), 25, 300)  # 225 -> 40
            part = _clamp(max(2.0, 8.0 - (w * 0.4) + noise(0.3)), 0, 10)  # 7.6 -> 2.0

        elif archetype == "recovering":
            # Dips in weeks 5-8, faculty check-in at week 9, rebounds in weeks 10-16
            if w <= 4:
                att = _clamp(88.0 + noise(2.5))
                assign = _clamp(90.0 + noise(2.5))
                score = _clamp(82.0 + noise(3.0))
                logins = int(_clamp(16 + noise(2.0), 8, 24))
                active_days = 4
                time_spent = _clamp(230.0 + noise(20.0), 120, 350)
                part = _clamp(8.0 + noise(0.4), 0, 10)
            elif w <= 8:
                # temporary slump
                att = _clamp(70.0 + noise(3.5))
                assign = _clamp(68.0 + noise(3.5))
                score = _clamp(72.0 + noise(3.5))
                logins = int(_clamp(8 + noise(1.5), 3, 14))
                active_days = 2
                time_spent = _clamp(110.0 + noise(18.0), 40, 200)
                part = _clamp(5.2 + noise(0.5), 0, 10)
            else:
                # Supportive intervention recovery!
                rec_w = w - 8
                att = _clamp(72.0 + rec_w * 2.5 + noise(2.5))
                assign = _clamp(70.0 + rec_w * 3.0 + noise(2.5))
                score = _clamp(74.0 + rec_w * 2.0 + noise(3.0))
                logins = int(_clamp(9 + rec_w * 1.5 + noise(1.5), 4, 25))
                active_days = int(_clamp(3 + rec_w * 0.3 + noise(0.4), 2, 6))
                time_spent = _clamp(120.0 + rec_w * 20.0 + noise(18.0), 80, 340)
                part = _clamp(5.5 + rec_w * 0.4 + noise(0.4), 0, 10)

        else:
            att = 85.0
            assign = 85.0
            score = 80.0
            logins = 12
            active_days = 4
            time_spent = 180.0
            part = 7.5

        records.append({
            "week_number": w,
            "attendance_pct": round(float(att), 1),
            "assignment_completion_pct": round(float(assign), 1),
            "assessment_score": round(float(score), 1),
            "lms_logins": int(logins),
            "active_days": int(active_days),
            "time_spent_minutes": round(float(time_spent), 1),
            "class_participation_score": round(float(part), 1),
        })

    return records


def generate_training_cohort(cohort_size: int = 1500, weeks: int = 16) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generates synthetic training cohort of N students with weekly records.
    Returns:
    - students_df: metadata
    - weekly_df: long format dataframe (student_idx, week_number, metrics...)
    """
    archetypes = [
        ("stable", 0.45),
        ("improving", 0.15),
        ("gradual_decline", 0.15),
        ("sudden_drop", 0.08),
        ("late_submission_drift", 0.07),
        ("silent_decliner", 0.05),
        ("recovering", 0.05),
    ]
    arch_names, arch_probs = zip(*archetypes)
    
    categories = ["General", "OBC", "SC", "ST", "EWS"]
    genders = ["Female", "Male", "Non-binary"]
    depts = ["Computer Science", "Data Science", "Information Technology"]
    
    students = []
    all_weekly = []
    
    for i in range(1, cohort_size + 1):
        arch = np.random.choice(arch_names, p=arch_probs)
        st_id = f"TRN_{i:04d}"
        dept = random.choice(depts)
        gender = random.choice(genders)
        cat = random.choice(categories)
        tier = random.choice(["Tier-1", "Tier-2", "Tier-3"])
        disability = 1 if random.random() < 0.04 else 0
        
        students.append({
            "student_id": st_id,
            "name": f"Student {i}",
            "department": dept,
            "year": random.choice([1, 2, 3, 4]),
            "semester": random.choice([1, 2, 3, 5, 6, 7]),
            "archetype": arch,
            "gender": gender,
            "category": cat,
            "socioeconomic_band": tier,
            "disability_flag": disability
        })
        
        series = generate_weekly_series_for_archetype(arch, total_weeks=weeks)
        for rec in series:
            rec["student_id"] = st_id
            all_weekly.append(rec)
            
    return pd.DataFrame(students), pd.DataFrame(all_weekly)
