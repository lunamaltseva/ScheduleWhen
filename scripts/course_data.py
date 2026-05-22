#!/usr/bin/env python3
"""
Course catalog for AUCA Fall 2026, extracted from the official schedules.

A Course is a dict:
    code, name, credits, sections
where each section is a dict:
    sec   : section label (e.g. "1")
    slots : list of (day, time) meeting blocks  -- used for conflict checks
    seats : registered-student count for that section

Times use the standard AUCA grid:
    8:00, 9:25, 10:50, 12:45, 14:10, 15:35, 17:00, 18:00/18:25/18:30, 19:30/19:55
Days: Mon, Tue, Wed, Thu, Fri, Sat.

This module holds the SHARED / SERVICE catalogs that every program draws on
(FYS bundle, General Education, Russian/Kyrgyz languages). Department-specific
catalogs are merged in by generate_students.py.
"""

def course(code, name, credits, sections):
    return {"code": code, "name": name, "credits": credits, "sections": sections}

def sec(label, slots, seats):
    return {"sec": label, "slots": slots, "seats": seats}


# ===========================================================================
# FYS bundle  (Freshman writing requirement = 12 credits across 3 courses)
#   FYS-100 (4cr)  : meets Mon+Wed at the section time
#   ENG-122 (6cr)  : meets Fri+Fri (two consecutive blocks)
#   FYS-100.3 (2cr): "Individual Schedule" -> no fixed slot
# 14 coordinated sections. Section N of all three is taken together.
# ===========================================================================

# (fys100_time, eng122_block1, eng122_block2) per section index 1..14
_FYS1_SECTIONS = {
    1:  ("9:25",  "9:25", "10:50"),
    2:  ("9:25",  "9:25", "10:50"),
    3:  ("9:25",  "9:25", "10:50"),
    4:  ("9:25",  "9:25", "10:50"),
    5:  ("9:25",  "9:25", "10:50"),
    6:  ("10:50", "10:50", "12:45"),
    7:  ("10:50", "10:50", "12:45"),
    8:  ("10:50", "10:50", "12:45"),
    9:  ("10:50", "10:50", "12:45"),
    10: ("12:45", "12:45", "14:10"),
    11: ("12:45", "12:45", "14:10"),
    12: ("12:45", "12:45", "14:10"),
    13: ("12:45", "12:45", "14:10"),
    14: ("14:10", "14:10", "15:35"),
}

def fys1_bundle_sections():
    """Return per-section slot bundles for the FYS-I cluster.
    Each entry: {sec, fys100_slots, eng122_slots, seats}."""
    out = []
    for n, (ft, e1, e2) in _FYS1_SECTIONS.items():
        out.append({
            "sec": str(n),
            "fys100_slots": [("Mon", ft), ("Wed", ft)],
            "eng122_slots": [("Fri", e1), ("Fri", e2)],
            "seats": 18,
        })
    return out

# FYS-II cluster (Sophomore writing requirement, 12cr) — only 3 sections.
_FYS2_SECTIONS = {
    1: ("9:25",  "9:25", "10:50"),
    2: ("14:10", "14:10", "15:35"),
    3: ("15:35", "15:35", "17:00"),
}

def fys2_bundle_sections():
    out = []
    for n, (ft, e1, e2) in _FYS2_SECTIONS.items():
        out.append({
            "sec": str(n),
            "fys211_slots": [("Mon", ft), ("Wed", ft)],
            "eng222_slots": [("Fri", e1), ("Fri", e2)],
            "seats": 18,
        })
    return out


# ===========================================================================
# General Education catalog (electives open to all; used to fill credit loads)
# ===========================================================================

GENED = [
    # --- History / Geography / Manas (NTR-adjacent civic block) ---
    course("HIST-208.1", "History of Kyrgyzstan", 4, [
        sec("1", [("Mon", "9:25"), ("Wed", "9:25")], 55),
        sec("2", [("Tue", "14:10"), ("Thu", "14:10")], 60),
        sec("3", [("Mon", "15:35"), ("Wed", "14:10")], 60),
    ]),
    course("GEO-208", "Geography of Kyrgyzstan", 2, [
        sec("1", [("Mon", "14:10")], 20), sec("2", [("Mon", "15:35")], 20),
        sec("3", [("Mon", "17:00")], 20), sec("4", [("Tue", "14:10")], 20),
        sec("5", [("Tue", "15:35")], 20), sec("6", [("Wed", "9:25")], 20),
        sec("7", [("Wed", "10:50")], 20), sec("8", [("Wed", "12:45")], 20),
        sec("9", [("Thu", "9:25")], 15), sec("10", [("Thu", "10:50")], 20),
    ]),
    course("GE-224", "Manas Studies", 2, [
        sec("1", [("Mon", "9:25")], 20), sec("2", [("Mon", "10:50")], 15),
        sec("3", [("Mon", "12:45")], 20), sec("4", [("Thu", "10:50")], 20),
        sec("5", [("Thu", "12:45")], 20), sec("6", [("Thu", "14:10")], 20),
    ]),
    # --- Social Sciences (SS) ---
    course("SS-200", "Civil Society, Activism in the Contemporary World", 6, [
        sec("1", [("Wed", "17:00"), ("Thu", "19:55")], 15)]),
    course("LAW-116", "Philosophy of Law", 6, [
        sec("1", [("Tue", "9:25"), ("Thu", "9:25")], 20),
        sec("2", [("Tue", "10:50"), ("Thu", "10:50")], 20),
        sec("3", [("Tue", "12:45"), ("Thu", "12:45")], 20),
        sec("4", [("Tue", "14:10"), ("Thu", "14:10")], 20)]),
    course("SOC-104.1", "General Sociology (for non-sociologists)", 6, [
        sec("1", [("Tue", "14:10"), ("Thu", "14:10")], 20)]),
    course("SS/ART-100", "The Evolution of Media: From Writing to Screen", 6, [
        sec("1", [("Tue", "17:00"), ("Thu", "17:00")], 15)]),
    # --- Psychology GenEd ---
    course("PSY-280", "Psychology of Conflict", 6, [
        sec("1", [("Mon", "12:45"), ("Wed", "12:45")], 30)]),
    course("PSY-294", "Feminism and Psychology", 6, [
        sec("1", [("Tue", "15:35"), ("Thu", "15:35")], 25)]),
    course("PSY/LAS-265", "Urban Psychology", 6, [
        sec("1", [("Mon", "14:10"), ("Wed", "14:10")], 30)]),
    # --- Natural Sciences (NTR) ---
    course("NTR-105", "The History and Philosophy of Science", 3, [
        sec("1", [("Mon", "14:10")], 20), sec("2", [("Mon", "17:00")], 15)]),
    course("ESCS/NTR-102", "Eco-Tourism and Environmental Conservation", 6, [
        sec("1", [("Tue", "10:50"), ("Thu", "10:50")], 20)]),
    course("ESCS/NS-102", "General Chemistry", 6, [
        sec("1", [("Wed", "15:35"), ("Fri", "15:35")], 20)]),
    course("ESCS/NTR-101", "Sustainable Ecosystem Development", 6, [
        sec("1", [("Wed", "12:45"), ("Fri", "12:45")], 20)]),
    # --- Humanities (HUM) ---
    course("HUM-295", "Russian Literature", 6, [
        sec("1", [("Wed", "15:35"), ("Fri", "15:35")], 15)]),
    course("HUM-200", "Global History Lab: A History of the World since 1300", 6, [
        sec("1", [("Mon", "14:10"), ("Wed", "14:10")], 20)]),
    course("HUM/ART-205", "Introduction to Digital Manas Studies", 3, [
        sec("1", [("Mon", "15:35")], 20)]),
    course("HUM/ART-265", "Representations of Women in Art and Literature", 6, [
        sec("1", [("Wed", "14:10"), ("Fri", "14:10")], 20)]),
    # --- ART block ---
    course("ART-110", "Introduction to Social Media and Art", 6, [
        sec("1", [("Tue", "14:10"), ("Thu", "14:10")], 20)]),
    course("ART-107.1", "History of Art", 6, [
        sec("1", [("Mon", "10:50"), ("Wed", "10:50")], 20)]),
    course("ARP-127", "Basics of Fine Arts I (Drawing)", 4, [
        sec("1", [("Mon", "9:25"), ("Wed", "9:25")], 20),
        sec("2", [("Mon", "10:50"), ("Wed", "10:50")], 20)]),
    course("ARP-200.1", "Basics of Fine Arts II (Painting)", 4, [
        sec("1", [("Tue", "9:25"), ("Thu", "9:25")], 20),
        sec("2", [("Tue", "10:50"), ("Thu", "10:50")], 20)]),
    course("MUS-104.1", "Komuz 1", 3, [
        sec("1", [("Mon", "14:10"), ("Wed", "14:10")], 18),
        sec("2", [("Tue", "14:10"), ("Thu", "14:10")], 18)]),
    course("MUS-205.1", "Ensemble of Komuz-Players", 3, [
        sec("1", [("Mon", "15:35"), ("Wed", "15:35")], 18),
        sec("2", [("Tue", "15:35"), ("Thu", "15:35")], 18)]),
    course("MUS-106.1", "Chorus", 2, [
        sec("1", [("Tue", "15:35")], 30), sec("2", [("Tue", "17:00")], 30),
        sec("3", [("Thu", "15:35")], 30), sec("4", [("Thu", "17:00")], 30)]),
    # --- Foreign languages (GenEd electives) ---
    course("JPN-111.1", "Japanese for Beginners I", 6, [
        sec("1", [("Tue", "14:10"), ("Thu", "14:10")], 20)]),
    course("JPN-121.1", "Japanese for Beginners II", 6, [
        sec("1", [("Tue", "15:35"), ("Thu", "15:35")], 20)]),
    course("CHN-111.1", "Chinese for Beginners I", 6, [
        sec("1", [("Tue", "14:10"), ("Thu", "14:10")], 18),
        sec("2", [("Tue", "15:35"), ("Thu", "15:35")], 18)]),
]

# Sports (0 credits — required 4 times over 4 years; do not count toward credit load)
SPORTS = [
    course("SPO-120", "Volleyball", 0, [
        sec("1", [("Tue", "12:45"), ("Thu", "12:45")], 25),
        sec("2", [("Thu", "14:10"), ("Fri", "14:10")], 25),
        sec("3", [("Wed", "15:35"), ("Fri", "15:35")], 25),
        sec("4", [("Wed", "17:00"), ("Fri", "17:00")], 25)]),
    course("SPO-113", "Basketball", 0, [
        sec("1", [("Mon", "12:45"), ("Wed", "12:45")], 25),
        sec("2", [("Mon", "14:10"), ("Wed", "14:10")], 25),
        sec("3", [("Tue", "15:35"), ("Thu", "15:35")], 25),
        sec("4", [("Tue", "17:00"), ("Thu", "17:00")], 25)]),
    course("SPO-116", "Football", 0, [
        sec("1", [("Mon", "9:25"),  ("Wed", "9:25")],  25),
        sec("2", [("Mon", "10:50"), ("Wed", "10:50")], 25),
        sec("3", [("Tue", "9:25"),  ("Thu", "9:25")],  25),
        sec("4", [("Tue", "10:50"), ("Thu", "10:50")], 25)]),
    course("SPO-165", "Kyrgyz Chuko Games", 0, [
        sec("1", [("Wed", "14:10"), ("Fri", "14:10")], 20)]),
    course("SPO-109", "Topaz Korgool", 0, [
        sec("1", [("Mon", "19:30"), ("Wed", "19:30")], 20),
        sec("2", [("Tue", "12:45"), ("Thu", "12:45")], 30)]),
    course("SPO-105", "General Physical Training", 0, [
        sec("1", [("Tue", "10:50"), ("Thu", "10:50")], 15),
        sec("2", [("Wed", "14:10"), ("Fri", "14:10")], 15)]),
    course("SPO-128.1", "Sports", 0, [
        sec("1", [("Mon", "9:25"),  ("Wed", "9:25")],  15),
        sec("2", [("Mon", "10:50"), ("Wed", "10:50")], 15),
        sec("3", [("Mon", "12:45"), ("Wed", "12:45")], 15)]),
    course("SPO-101.1", "Bodybuilding", 0, [
        sec("1", [("Tue", "14:10"), ("Thu", "14:10")], 15)]),
    course("SPO-119", "Pilates", 0, [
        sec("1", [("Tue", "10:50"), ("Thu", "10:50")], 15),
        sec("2", [("Tue", "12:45"), ("Thu", "12:45")], 15),
        sec("3", [("Wed", "15:35"), ("Fri", "15:35")], 15),
        sec("4", [("Wed", "17:00"), ("Fri", "17:00")], 15)]),
    course("SPO-150", "Dancing", 0, [
        sec("1", [("Tue", "9:25"),  ("Thu", "9:25")],  15),
        sec("2", [("Wed", "14:10"), ("Fri", "14:10")], 15)]),
    course("SPO-155", "Shape-mix", 0, [
        sec("1", [("Tue", "14:10"), ("Thu", "14:10")], 15),
        sec("2", [("Wed", "9:25"),  ("Fri", "9:25")],  15),
        sec("3", [("Wed", "10:50"), ("Fri", "10:50")], 15)]),
    course("SPO-130", "Fitness", 0, [
        sec("1", [("Thu", "15:35"), ("Fri", "15:35")], 15),
        sec("2", [("Tue", "17:00"), ("Thu", "17:00")], 15),
        sec("3", [("Wed", "12:45"), ("Fri", "12:45")], 15)]),
]


# ===========================================================================
# Russian language (RUS = domestic; RFL = international) — 2cr, half-semester
# Kyrgyz language (KLL) — 4cr, required for 2025 admits (sophomores)
#   KLL-104.1 = foreign students; KLL-103.1/203.1 = domestic
# ===========================================================================

RUS_DOMESTIC = [
    course("RUS-101.1", "Russian Language I (intermediate)", 2, [
        sec("1", [("Mon", "10:50")], 20), sec("2", [("Mon", "14:10")], 20),
        sec("3", [("Tue", "14:10")], 20), sec("4", [("Tue", "15:35")], 20),
        sec("5", [("Wed", "9:25")], 20),  sec("6", [("Wed", "14:10")], 20),
        sec("7", [("Thu", "14:10")], 20), sec("8", [("Thu", "15:35")], 20),
        sec("9", [("Tue", "17:00")], 20), sec("10", [("Fri", "14:10")], 20),
        sec("11", [("Fri", "15:35")], 20)]),
    course("RUS-201.1", "Russian Language I (advanced)", 2, [
        sec("1", [("Tue", "14:10")], 20), sec("2", [("Tue", "15:35")], 20),
        sec("3", [("Wed", "10:50")], 20), sec("4", [("Wed", "12:45")], 20),
        sec("5", [("Wed", "14:10")], 20), sec("6", [("Thu", "14:10")], 20),
        sec("7", [("Thu", "15:35")], 20), sec("8", [("Fri", "17:00")], 20)]),
]

RFL_INTERNATIONAL = [
    course("RFL-103.1", "Russian as a Foreign Language I (beginner)", 2, [
        sec("1", [("Mon", "9:25")], 15), sec("2", [("Mon", "12:45")], 20),
        sec("3", [("Mon", "15:35")], 20)]),
    course("RFL-203.1", "Russian as a Foreign Language I (intermediate)", 2, [
        sec("1", [("Wed", "10:50")], 20)]),
]

KLL_DOMESTIC = [
    course("KLL-103.1", "Kyrgyz Language and Literature I (beginner)", 4, [
        sec("1", [("Tue", "12:45"), ("Thu", "12:45")], 18),
        sec("2", [("Mon", "12:45"), ("Wed", "12:45")], 18),
        sec("3", [("Mon", "14:10"), ("Wed", "14:10")], 18),
        sec("4", [("Wed", "9:25"), ("Fri", "9:25")], 18),
        sec("5", [("Tue", "10:50"), ("Thu", "10:50")], 18)]),
    course("KLL-203.1", "Kyrgyz Language and Literature I (intermediate)", 4, [
        sec("1", [("Mon", "12:45"), ("Wed", "12:45")], 18),
        sec("2", [("Mon", "15:35"), ("Wed", "15:35")], 18),
        sec("3", [("Tue", "12:45"), ("Thu", "12:45")], 18),
        sec("4", [("Tue", "14:10"), ("Thu", "14:10")], 18),
        sec("5", [("Tue", "15:35"), ("Thu", "15:35")], 18),
        sec("6", [("Tue", "9:25"), ("Thu", "9:25")], 18),
        sec("7", [("Tue", "10:50"), ("Thu", "10:50")], 18),
        sec("8", [("Tue", "12:45"), ("Thu", "12:45")], 18),
        sec("9", [("Tue", "14:10"), ("Thu", "14:10")], 18),
        sec("10", [("Wed", "10:50"), ("Fri", "10:50")], 18),
        sec("11", [("Mon", "9:25"), ("Wed", "9:25")], 18),
        sec("12", [("Mon", "10:50"), ("Wed", "10:50")], 18),
        sec("13", [("Mon", "12:45"), ("Wed", "12:45")], 18),
        sec("14", [("Tue", "12:45"), ("Thu", "12:45")], 18),
        sec("15", [("Tue", "14:10"), ("Thu", "14:10")], 18)]),
]

KLL_INTERNATIONAL = [
    course("KLL-104.1", "Kyrgyz Language and Literature for Foreign Students I (beginner)", 4, [
        sec("1", [("Tue", "9:25"), ("Thu", "9:25")], 15),
        sec("2", [("Mon", "14:10"), ("Wed", "14:10")], 15),
        sec("3", [("Mon", "15:35"), ("Wed", "15:35")], 15),
        sec("4", [("Tue", "10:50"), ("Thu", "10:50")], 15)]),
]
