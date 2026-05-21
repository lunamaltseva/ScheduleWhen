#!/usr/bin/env python3
"""
Department-specific course catalog for AUCA Fall 2026, with credits and
section meeting times (day, time) extracted from the official schedule PDFs.

Exposes:
    DEPT_CATALOG : dict dept -> list of course dicts (see course_data.course)
    REQUIRED     : dict (dept, concentration, year) -> [course_code, ...]
    ELECTIVES    : dict dept -> [course_code, ...]   (fill pool)
Years: Freshman / Sophomore / Junior / Senior  (UG)
       "Masters 1st Year" / "Masters 2nd Year"  (PG)
"""

from scripts.course_data import course, sec

# ===========================================================================
# UNDERGRADUATE DEPARTMENTS
# ===========================================================================

DEPT_CATALOG = {}

# ---- BBA (Business Administration; output label "BA") ---------------------
DEPT_CATALOG["BA"] = [
    course("BUS115", "Introduction to Business Management", 6, [
        sec("1", [("Mon","8:00"),("Wed","8:00")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18),
        sec("3", [("Tue","12:45"),("Thu","12:45")], 18),
        sec("4", [("Tue","14:10"),("Thu","14:10")], 18)]),
    course("ECO-112.1", "Introductory Microeconomic Theory", 6, [
        sec("1", [("Fri","12:45"),("Mon","14:10")], 15),
        sec("2", [("Wed","12:45"),("Mon","12:45")], 15),
        sec("4", [("Fri","10:50"),("Mon","10:50")], 15),
        sec("6", [("Tue","12:45"),("Thu","12:45")], 15)]),
    course("MAT-132", "Mathematics for Business and Economics I", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("3", [("Tue","12:45"),("Thu","12:45")], 18)]),
    course("ECO-122.1", "Introduction to Macroeconomic Theory", 6, [
        sec("1", [("Tue","14:10"),("Thu","14:10")], 18),
        sec("2", [("Mon","14:10"),("Fri","12:45")], 18)]),
    course("FIN100", "Introduction to Finance", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 18),
        sec("2", [("Fri","9:25"),("Fri","10:50")], 18)]),
    course("MAT-308", "Statistics for Business", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 18),
        sec("2", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("4", [("Tue","12:45"),("Thu","12:45")], 18)]),
    course("FIN280", "Financial Accounting I", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 18),
        sec("2", [("Mon","12:45"),("Wed","12:45")], 18),
        sec("3", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("4", [("Mon","14:10"),("Wed","14:10")], 18)]),
    course("FIN285", "Financial Accounting II", 6, [
        sec("1", [("Mon","15:35"),("Wed","15:35")], 18)]),
    course("BUS301.1", "Business Communications", 6, [
        sec("1", [("Mon","8:00"),("Wed","8:00")], 18),
        sec("2", [("Mon","9:25"),("Wed","9:25")], 18),
        sec("3", [("Tue","14:10"),("Thu","14:10")], 18),
        sec("4", [("Tue","15:35"),("Thu","15:35")], 18)]),
    course("LAW271", "Business Legislation and Policy", 3, [
        sec("1", [("Tue","10:50")], 18),
        sec("2", [("Thu","10:50")], 18)]),
    course("MNG200", "Management of Information Systems", 3, [
        sec("1", [("Tue","12:45")], 18),
        sec("2", [("Thu","12:45")], 18)]),
    course("MRK302.1", "Introduction to Marketing", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("BUS152", "Entrepreneurship", 6, [
        sec("1", [("Tue","8:00"),("Thu","8:00")], 18),
        sec("2", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("3", [("Mon","15:35"),("Wed","15:35")], 18)]),
    course("BUS230", "Ethics, Commerce & Society", 3, [
        sec("1", [("Tue","12:45")], 18),
        sec("2", [("Thu","12:45")], 18)]),
    course("FIN350", "Managerial Accounting", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("BUS390.1", "Business Research Methods", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 18)]),
    course("FIN492.1", "Financial Management", 6, [
        sec("1", [("Mon","10:50"),("Wed","10:50")], 18),
        sec("2", [("Wed","12:45"),("Fri","12:45")], 18)]),
    course("BUS490.1", "Senior Thesis Seminar I", 3, [
        sec("1", [("Fri","8:00")], 27)]),
    # track electives
    course("MNG430", "Corporate Governance", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 18)]),
    course("FIN363", "Financial Reporting", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 18)]),
    course("MRK366", "Advertising", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 18)]),
    course("MRK420", "Consumer Behavior", 6, [sec("1", [("Mon","14:10"),("Wed","14:10")], 18)]),
    course("MNG281", "Supply Chain Management", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 18)]),
    course("MNG450.1", "Project Management", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 18)]),
    course("BUS/MAT-376", "Strategic Business Analytics", 6, [sec("1", [("Fri","9:25"),("Fri","10:50")], 18)]),
    course("BUS/SOC/COM377", "Data Mining", 6, [sec("1", [("Mon","14:10"),("Wed","14:10")], 18)]),
    course("BUS390.2", "Data Analysis", 6, [sec("1", [("Tue","15:35"),("Tue","17:00")], 18)]),
]

# ---- ECO -------------------------------------------------------------------
DEPT_CATALOG["ECO"] = [
    course("ECO-112.1", "Introductory Microeconomic Theory", 6, [
        sec("3", [("Mon","12:45"),("Wed","12:45")], 36),
        sec("5", [("Mon","12:45"),("Wed","12:45")], 18)]),
    course("MAT-131.1", "Linear Algebra and Analytic Geometry for Economics", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("ECO-122.1", "Introduction to Macroeconomic Theory", 6, [
        sec("1", [("Tue","14:10"),("Thu","14:10")], 18),
        sec("2", [("Mon","14:10"),("Fri","12:45")], 18)]),
    course("ECO-217.1", "Intermediate Microeconomics", 6, [
        sec("1", [("Fri","14:10"),("Wed","14:10")], 18)]),
    course("ECO-215.1", "Intermediate Macroeconomics", 6, [
        sec("1", [("Tue","15:35"),("Thu","15:35")], 18),
        sec("2", [("Fri","14:10"),("Wed","14:10")], 18)]),
    course("ECO-303.1", "International Economics", 6, [
        sec("1", [("Wed","12:45"),("Fri","12:45")], 18)]),
    course("ECO-320.1", "Introduction to Econometrics", 6, [
        sec("1", [("Mon","8:00"),("Mon","9:25")], 18)]),
    course("STT-511", "Applied Econometrics", 6, [
        sec("1", [("Tue","14:10"),("Thu","14:10")], 18)]),
    course("ECO-434", "Honor Seminar I", 6, [
        sec("1", [("Sat","9:25"),("Sat","10:50")], 18)]),
    course("ECO-113", "Core Mathematics for Economics", 6, [sec("1", [("Mon","14:10"),("Wed","14:10")], 18)]),
    course("ECO-350", "Mathematical Economics", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 18)]),
    course("ECO-440", "Monetary Theory and Policy", 6, [sec("1", [("Wed","10:50"),("Mon","12:45")], 18)]),
    course("ECO-337", "Machine Learning", 6, [sec("1", [("Sat","15:35"),("Sat","17:00")], 13)]),
    course("ECO-340", "Introduction to Stata", 6, [sec("1", [("Mon","17:00"),("Wed","17:00")], 13)]),
]

# ---- AMI -------------------------------------------------------------------
DEPT_CATALOG["AMI"] = [
    course("MAT-131.2", "Linear Algebra and Analytic Geometry for AMI/SFW", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 18),
        sec("2", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("4", [("Tue","12:45"),("Thu","12:45")], 18)]),
    course("COM-227", "Discrete Mathematics and Mathematical Logic I", 6, [
        sec("1", [("Tue","8:00"),("Thu","8:00")], 9),
        sec("2", [("Tue","12:45"),("Thu","12:45")], 18)]),
    course("MAT-240", "Discrete Mathematics", 6, [
        sec("2", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("3", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("MAT-202.1", "Physics: Computer Modeling", 6, [
        sec("1", [("Mon","8:00"),("Wed","8:00")], 18)]),
    course("MAT-316.2", "Mathematical Analysis II (AMI)", 6, [
        sec("1", [("Tue","10:50"),("Fri","9:25")], 15),
        sec("2", [("Thu","10:50"),("Fri","10:50")], 15)]),
    course("MAT-332", "Ordinary Differential Equations", 6, [
        sec("1", [("Tue","12:45"),("Thu","12:45")], 15),
        sec("2", [("Tue","14:10"),("Thu","14:10")], 15)]),
    course("MAT-341", "Functional Analysis", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 15)]),
    course("COM-341.1", "Operating Systems", 6, [
        sec("1", [("Mon","12:45"),("Wed","12:45")], 40),
        sec("2", [("Tue","14:10"),("Tue","15:35")], 18)]),
    course("MAT-380", "Educational Internship", 6, [
        sec("1", [("Thu","17:00"),("Thu","15:35")], 15)]),
    course("MAT-480", "Senior Project Preparation I", 3, [
        sec("1", [("Thu","14:10")], 15)]),
    course("MAT-410", "Numerical Methods for Equations of Mathematical Physics", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 15)]),
    course("MAT-435", "Optimization Methods", 6, [sec("1", [("Tue","8:00"),("Thu","8:00")], 15)]),
    course("MAT-326", "Complex Variables", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 15)]),
    course("MAT-333", "Math Modelling in Economics", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 15)]),
]

# ---- SFW -------------------------------------------------------------------
DEPT_CATALOG["SFW"] = [
    course("COM-122", "Introduction to Programming", 6, [
        sec("1", [("Mon","14:10"),("Wed","14:10")], 18),
        sec("2", [("Mon","10:50"),("Wed","10:50")], 18),
        sec("3", [("Mon","12:45"),("Wed","12:45")], 18),
        sec("4", [("Mon","15:35"),("Wed","15:35")], 18)]),
    course("COM-229", "Data Structures", 6, [
        sec("1", [("Mon","12:45"),("Wed","12:45")], 18),
        sec("2", [("Mon","14:10"),("Wed","14:10")], 18)]),
    course("COM-213", "Database", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("COM-416.1", "Computer Networks", 6, [
        sec("1", [("Wed","9:25"),("Wed","10:50")], 18)]),
    course("COM-431.1", "Senior Project I", 6, [
        sec("1", [("Mon","10:50"),("Fri","10:50")], 18),
        sec("2", [("Mon","12:45"),("Fri","12:45")], 18),
        sec("3", [("Mon","14:10"),("Fri","14:10")], 18)]),
    course("COM-160.1", "Introduction to Cybersecurity", 6, [sec("1", [("Fri","9:25"),("Fri","10:50")], 18)]),
    course("COM-417", "Computer Networks II", 6, [sec("1", [("Tue","9:25"),("Tue","10:50")], 18)]),
    course("COM-463.1", "System Administration", 6, [sec("1", [("Tue","12:45"),("Tue","14:10")], 18)]),
    course("COM-299", "Game Development", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 18)]),
    course("COM-312", "Neural Networks and Deep Learning", 6, [sec("1", [("Mon","9:25"),("Wed","9:25")], 18)]),
    course("COM-360.1", "Web Page Design: HTML, CSS & AI Tools", 6, [sec("1", [("Wed","14:10"),("Wed","15:35")], 18)]),
    course("COM-421.1", "Information Security", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 18)]),
]

# ---- ICP -------------------------------------------------------------------
DEPT_CATALOG["ICP"] = [
    course("ICP-280.1", "Introduction to Political Science", 6, [
        sec("1", [("Tue","10:50"),("Thu","10:50")], 20),
        sec("2", [("Tue","12:45"),("Thu","12:45")], 20)]),
    course("ICP-110.1", "Introduction to International Relations", 6, [
        sec("1", [("Mon","10:50"),("Wed","10:50")], 20),
        sec("2", [("Tue","9:25"),("Thu","9:25")], 20)]),
    course("ICP-280.2", "Introduction to Political Theory", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 20),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 20)]),
    course("ICP-318.2", "Foreign Policy Analysis", 6, [
        sec("1", [("Mon","12:45"),("Wed","12:45")], 25)]),
    course("ICP-302", "Research Methods in Political Science", 6, [
        sec("1", [("Mon","9:25"),("Mon","10:50")], 25)]),
    course("ICP-404", "Senior Thesis I", 6, [
        sec("1", [("Fri","9:25"),("Fri","10:50")], 25)]),
    course("ICP-212", "Political Communication", 6, [sec("1", [("Mon","14:10"),("Wed","14:10")], 20)]),
    course("ICP-347", "Science and Technology Diplomacy", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 20)]),
    course("ICP-405.1", "Politics of Kyrgyzstan", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 20)]),
    course("ICP/HR-403", "International Law and IR in a Turbulent World", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 20)]),
    course("ICP/LAS/GDS-208", "Politics of Human Rights", 6, [sec("1", [("Mon","8:00"),("Wed","8:00")], 18)]),
]

# ---- JMC -------------------------------------------------------------------
DEPT_CATALOG["JMC"] = [
    course("JOR-182", "Introduction to Mass Communication", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 20)]),
    course("MC-235.1", "Newswriting Skills I", 6, [sec("1", [("Tue","9:25"),("Thu","9:25")], 20)]),
    course("JMC-253", "Communication Theory and Practice", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 20)]),
    course("JOR-285", "Data Storytelling", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 20)]),
    course("JOR/TCVA-201", "Multimedia Skills I", 6, [sec("1", [("Fri","9:25"),("Fri","10:50")], 20)]),
    course("JMC-494.1", "Senior Project I", 6, [sec("1", [("Fri","14:10"),("Fri","15:35")], 20)]),
    course("PSY/JMC-225", "Visual Communication and Its Psychological Aspects", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 20)]),
    course("JOR/LAS-200", "E-Commerce and Digital Marketing", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 20)]),
]

# ---- PSY -------------------------------------------------------------------
DEPT_CATALOG["PSY"] = [
    course("PSY-105.1", "Introduction to Psychology", 6, [
        sec("2", [("Tue","12:45"),("Thu","12:45")], 25),
        sec("1", [("Mon","14:10"),("Wed","14:10")], 40)]),
    course("PSY-366", "Qualitative Research Methods", 6, [sec("1", [("Mon","9:25"),("Mon","10:50")], 25)]),
    course("PSY-356", "Introduction to Behavioral Statistics", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 30)]),
    course("PSY-128", "Psychological Approaches to Effective Learning", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 25)]),
    course("PSY-337.1", "Psychological Tests", 6, [sec("1", [("Mon","14:10"),("Wed","14:10")], 25)]),
    course("PSY-298", "Internship I", 3, [sec("1", [("Mon","15:35")], 20)]),
    course("PSY-411.1", "Senior Thesis I", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 35)]),
    course("PSY-391.1", "Abnormal Psychology", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 25)]),
    course("PSY-363", "Happiness: Private/Public Feeling", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 25)]),
    course("PSY-310.1", "Psychophysiology and Cognitive Psychology", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 25)]),
    course("PSY-342.1", "Introduction to Organizational Psychology", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 25)]),
    course("PSY-405", "Group Counseling", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 20)]),
]

# ---- SOC -------------------------------------------------------------------
DEPT_CATALOG["SOC"] = [
    course("SOC-108", "Introduction to Sociology I", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 20)]),
    course("SOC-221.1", "Qualitative Research Methods", 6, [sec("1", [("Mon","9:25"),("Wed","9:25")], 20)]),
    course("SOC-357", "Applied Social Statistics and SPSS", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 20)]),
    course("SOC-210.1", "Classical Social Theory", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 20)]),
    course("SOC-381.1", "Social Deviance", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 20)]),
    course("SOC-354.2", "Sociology of Gender", 6, [sec("1", [("Thu","17:00"),("Fri","17:00")], 20)]),
    course("SOC-480.1", "Senior Thesis Seminar I", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 8)]),
    course("SOC-415", "Perspectives on Global Inequalities", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 20)]),
    course("ANTH/SOC-368", "Ethnicity and Nationalism in Multicultural Societies", 6, [sec("1", [("Tue","9:25"),("Thu","9:25")], 12)]),
]

# ---- ANTH ------------------------------------------------------------------
DEPT_CATALOG["ANTH"] = [
    course("ANTH-107", "Cultural Concepts and Social Networks", 6, [
        sec("2", [("Mon","9:25"),("Wed","9:25")], 20),
        sec("3", [("Mon","14:10"),("Wed","14:10")], 15)]),
    course("ANTH-133", "Races, Human Diversity and Biology", 6, [sec("1", [("Mon","9:25"),("Wed","9:25")], 20)]),
    course("ANTH-343", "History of Anthropological Theories I", 6, [sec("1", [("Mon","14:10"),("Wed","14:10")], 15)]),
    course("ANTH-327", "Fieldwork (Archaeology)", 6, [sec("1", [("Sat","9:25"),("Sat","10:50")], 10)]),
    course("ANTH-328", "Fieldwork (Ethnography)", 6, [sec("1", [("Sat","12:45"),("Sat","14:10")], 10)]),
    course("ANTH-402", "Thesis Writing I", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 10)]),
    course("ANTH-341", "International Development and Cross-Cultural Communication", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 20)]),
    course("ANTH-112", "Digital Anthropology: TikTok, VR and AI", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 20)]),
    course("ANTH-232.1", "Language, Culture and Power", 6, [
        sec("1", [("Tue","14:10"),("Thu","14:10")], 20),
        sec("2", [("Tue","15:35"),("Thu","15:35")], 20)]),
    course("ANTH-342", "Japanese Culture, International Development, and Technology", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 20)]),
    course("ANTH-393", "'Nature' and 'Sustainable Development'", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 12)]),
]

# ---- ESCS ------------------------------------------------------------------
DEPT_CATALOG["ESCS"] = [
    course("ENV/NTR-205", "Applied Ecology: Interactions and Conservation", 6, [sec("1", [("Tue","9:25"),("Thu","9:25")], 20)]),
    course("ENV-216", "Climate Change and Sustainable Development Goals", 6, [sec("1", [("Thu","14:10"),("Thu","15:35")], 20)]),
    course("ENV-201", "GIS Application in Environmental Management", 6, [sec("1", [("Fri","14:10"),("Fri","15:35")], 20)]),
    course("ENV-309", "Environmental Geophysics", 6, [sec("1", [("Wed","14:10"),("Wed","15:35")], 20)]),
    course("ENV-400", "Senior Thesis Seminar", 6, [sec("1", [("Mon","9:25"),("Wed","9:25")], 10)]),
    course("ENV/NTR-100", "Introduction to Environmental Management", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 20)]),
    course("ESCS/NTR-101", "Sustainable Ecosystem Development", 6, [sec("1", [("Wed","12:45"),("Fri","12:45")], 20)]),
    course("ESCS/NS-102", "General Chemistry", 6, [sec("1", [("Wed","15:35"),("Fri","15:35")], 20)]),
    course("ESCS/NTR-102", "Eco-Tourism and Environmental Conservation", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 20)]),
    course("ANTH/ESCS-445", "Sustainable Development and Circular Economy", 3, [sec("1", [("Thu","14:10")], 10)]),
]

# ---- TCMA ------------------------------------------------------------------
DEPT_CATALOG["TCMA"] = [
    course("TCMA/HUM-106", "History of Cinema", 6, [sec("1", [("Wed","12:45"),("Wed","14:10")], 20)]),
    course("TCMA-235", "Scriptwriting I", 6, [sec("1", [("Wed","14:10"),("Wed","15:35")], 20)]),
    course("TCMA-344", "Film and TV Directing Skills I", 6, [sec("1", [("Tue","12:45"),("Tue","14:10")], 20)]),
    course("TCMA-214", "Art and Theory of Editing", 6, [sec("1", [("Tue","9:25"),("Tue","10:50")], 20)]),
    course("TCMA-365", "Ethics of Artistic Production", 6, [sec("1", [("Thu","9:25"),("Thu","10:50")], 14)]),
    course("TCMA-213", "Film Production Management", 6, [sec("1", [("Tue","12:45"),("Tue","14:10")], 14)]),
    course("TCMA-414", "Film Analysis and Criticism", 6, [sec("1", [("Mon","14:10"),("Mon","15:35")], 14)]),
    course("TCMA-405", "Senior Project/Thesis I", 6, [sec("1", [("Thu","12:45"),("Thu","14:10")], 15)]),
    course("TCMA/ART-135", "Photography and Creativity", 6, [sec("1", [("Fri","9:25"),("Fri","10:50")], 12)]),
    course("TCMA/JMC-115", "Cinematography", 6, [sec("1", [("Wed","9:25"),("Wed","10:50")], 12)]),
    course("TCMA/ART-261", "Explore Animation: Visual Storytelling", 6, [sec("1", [("Mon","9:25"),("Mon","10:50")], 20)]),
    course("TCMA/JMC-200", "Cinema in Kyrgyzstan: Art & Industry", 6, [sec("1", [("Fri","12:45"),("Fri","14:10")], 20)]),
]

# ---- IBL (Law program) -----------------------------------------------------
DEPT_CATALOG["IBL"] = [
    course("Law-110", "Introduction to Law", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 20)]),
    course("Law-116", "Philosophy of Law", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 20),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 20),
        sec("3", [("Tue","12:45"),("Thu","12:45")], 20)]),
    course("Law-244.2", "Criminal Law II: Right to Fair Trial", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 20),
        sec("2", [("Mon","10:50"),("Wed","10:50")], 20),
        sec("3", [("Fri","9:25"),("Fri","10:50")], 20)]),
    course("Law-247.1", "Public International Law and UN System", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 22),
        sec("2", [("Mon","10:50"),("Wed","10:50")], 22)]),
    course("Law-238.2", "Civil Law I: Property and Succession Law", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 22),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 22),
        sec("3", [("Tue","12:45"),("Thu","12:45")], 22)]),
    course("Law-301.3", "Civil Law III: Business Transactions and Contracts", 6, [
        sec("1", [("Tue","9:25"),("Fri","9:25")], 18),
        sec("2", [("Tue","10:50"),("Fri","10:50")], 18)]),
    course("Law-402.2", "Conflicts of Laws, Globalization and Technology", 3, [sec("1", [("Thu","12:45")], 22)]),
    course("Law-423.1", "Legal Clinic II", 3, [sec("1", [("Thu","8:00")], 22)]),
    course("Law-426.1", "Thesis Research Seminar I", 6, [sec("1", [("Wed","9:25"),("Wed","10:50")], 22)]),
    course("Law-258.1", "International Humanitarian Law", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 18)]),
    course("Law-419", "International Human Rights Law", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 12)]),
    course("Law-430", "Justice in the 21st Century", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 18)]),
    course("Law-435", "Practical Aspects of Commercial Law", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 18)]),
    course("Law/HR-394", "Women's Rights in Central Asia", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 18)]),
    course("Law-302.2", "Labor Law", 3, [sec("1", [("Tue","12:45")], 18)]),
    course("HR-100.1", "Introduction to Human Rights", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 12)]),
]

# ---- LAS (8 concentrations, label dept "LAS") ------------------------------
DEPT_CATALOG["LAS"] = [
    # core
    course("NTR/LAS-100", "Concepts of Modern Sciences", 6, [
        sec("L1", [("Tue","15:35"),("Thu","15:35")], 36),
        sec("L2", [("Mon","12:45"),("Wed","12:45")], 20)]),
    course("SS/LAS-102", "Globalization and Social Sciences", 6, [
        sec("1", [("Mon","12:45"),("Wed","12:45")], 18),
        sec("2", [("Mon","10:50"),("Wed","10:50")], 18)]),
    course("LAS/HUM-220", "World Literature", 6, [
        sec("1", [("Tue","14:10"),("Thu","14:10")], 18),
        sec("2", [("Tue","15:35"),("Thu","15:35")], 18)]),
    course("LAS/ART-230", "Concept of Modern Arts", 6, [sec("1", [("Wed","9:25"),("Wed","10:50")], 18)]),
    course("LAS-400", "Senior Thesis Seminar I", 6, [
        sec("1", [("Mon","15:35"),("Wed","15:35")], 18),
        sec("2", [("Tue","12:45"),("Thu","12:45")], 10)]),
    # DC
    course("LAS/DC-305", "Artificial Intelligence in a Human World", 6, [sec("1", [("Mon","18:00"),("Wed","18:00")], 15)]),
    course("LAS-211", "Digital Archives", 3, [sec("1", [("Tue","15:35")], 18)]),
    course("LAS/ART-202", "Creative Design: Prototyping and Testing", 6, [sec("1", [("Mon","12:45"),("Mon","14:10")], 18)]),
    course("LAS-200", "Introduction to Research Practice for Liberal Arts", 3, [sec("1", [("Wed","14:10")], 18)]),
    course("LAS/HUM/COM-101", "Introduction to Digital Humanities", 3, [sec("1", [("Wed","15:35")], 18)]),
    course("HUM/ART-205", "Introduction to Digital Manas Studies", 3, [sec("1", [("Mon","15:35")], 18)]),
    course("JOR-182", "Introduction to Mass Communication", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 20)]),
    # ES
    course("ES302.1", "History of European Culture", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("GER-116", "German for Beginners I", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 15),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 20),
        sec("3", [("Mon","9:25"),("Wed","9:25")], 20)]),
    course("SPP-111.1", "Spanish for Beginners", 6, [
        sec("1", [("Mon","12:45"),("Fri","12:45")], 20),
        sec("2", [("Mon","14:10"),("Fri","14:10")], 20)]),
    course("FRN-113", "French for Beginners I", 6, [
        sec("1", [("Mon","12:45"),("Fri","12:45")], 20),
        sec("2", [("Tue","12:45"),("Thu","12:45")], 20),
        sec("3", [("Tue","14:10"),("Thu","14:10")], 20)]),
    # HR
    course("HR100.1", "Introduction to Human Rights", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 12)]),
    course("ICP/LAS/GDS-208", "Politics of Human Rights", 6, [sec("1", [("Mon","8:00"),("Wed","8:00")], 18)]),
    course("Law247.1", "Public International Law and UN System", 6, [
        sec("1", [("Mon","9:25"),("Wed","9:25")], 22),
        sec("2", [("Mon","10:50"),("Wed","10:50")], 22)]),
    course("Law419", "International Human Rights Law", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 12)]),
    course("Law258.1", "International Humanitarian Law", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 18)]),
    course("Law426.1", "Thesis Research Seminar I", 6, [sec("1", [("Wed","9:25"),("Wed","10:50")], 22)]),
    course("Law430", "Justice in the 21st Century", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 18)]),
    course("ICP/HR-403", "International Law and IR in a Turbulent World", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 20)]),
    # MC (shares JMC course objects defined in DEPT_CATALOG["JMC"]; redefine here for lookup)
    course("MC-235.1", "Newswriting Skills I", 6, [sec("1", [("Tue","9:25"),("Thu","9:25")], 20)]),
    course("JMC-253", "Communication Theory and Practice", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 20)]),
    course("JOR-285", "Data Storytelling", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 20)]),
    course("JOR/TCVA-201", "Multimedia Skills I", 6, [sec("1", [("Fri","9:25"),("Fri","10:50")], 20)]),
    course("JMC-494.1", "Senior Project I", 6, [sec("1", [("Fri","14:10"),("Fri","15:35")], 20)]),
    # MM
    course("MAT-135", "Mathematics for Life", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("MAT-134", "Introduction to Probability and Statistics", 6, [
        sec("1", [("Tue","9:25"),("Thu","9:25")], 18),
        sec("2", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("MAT-131.1", "Linear Algebra and Analytic Geometry for Economics", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("MATH/ICP/ECO-300", "Game Theory and Its Applications", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 18)]),
    course("MAT/HUM-200", "Storytelling with Statistics", 6, [sec("1", [("Tue","12:45"),("Thu","12:45")], 10)]),
    # PC
    course("LAS-150", "Introduction to Peace and Conflict Studies", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 20)]),
    course("SYS/HUM/SS-272", "China's Foreign Policy", 6, [sec("1", [("Mon","12:45"),("Wed","12:45")], 18)]),
    course("SYS/HUM/SS-285", "Political and Moral Economy of Global Heritage", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 18)]),
    course("SYS/HUM/SS-253", "Challenges of the 21st Century", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 18)]),
    course("ANTH-341", "International Development and Cross-Cultural Communication", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 20)]),
    course("ANTH/SOC-368", "Ethnicity and Nationalism in Multicultural Societies", 6, [sec("1", [("Tue","9:25"),("Thu","9:25")], 12)]),
    # SEDT
    course("SE-200", "Social Entrepreneurship", 6, [sec("1", [("Tue","14:10"),("Thu","14:10")], 18)]),
    course("LAS/BUS-284", "Design Thinking and Social Innovations", 6, [
        sec("1", [("Mon","12:45"),("Wed","12:45")], 18),
        sec("2", [("Tue","9:25"),("Thu","9:25")], 18)]),
    course("LAS/SE-201", "Sustainable Development for Social Entrepreneurship", 6, [sec("1", [("Mon","14:10"),("Fri","14:10")], 18)]),
    course("LAS/SE-210", "Social Entrepreneurship Practicum", 6, [sec("1", [("Mon","18:30"),("Wed","12:45")], 18)]),
    course("LAS/SE-300", "Agile in Social Innovation", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 18)]),
    course("LAS-301", "Research Methods", 6, [
        sec("1", [("Wed","14:10"),("Fri","12:45")], 18),
        sec("2", [("Thu","14:10"),("Thu","15:35")], 18)]),
    course("LAS/SE-302", "Entrepreneurial Finance", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 18)]),
    course("LAS/SE-306", "Marketing for Social Enterprises", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 18)]),
    course("FIN100", "Introduction to Finance", 6, [sec("1", [("Tue","10:50"),("Thu","10:50")], 18)]),
    # UPD
    course("LAS/EUS-301", "Urban Design", 6, [sec("1", [("Tue","15:35"),("Tue","17:00")], 18)]),
    course("ANTH-326", "Introduction to Urban and Regional Planning", 6, [sec("1", [("Mon","15:35"),("Mon","17:00")], 18)]),
    course("LAS/UPD-302", "Integrated Urban Management for Public Space Design", 6, [sec("1", [("Wed","15:35"),("Wed","17:00")], 18)]),
    course("LAS/UPD-201", "Architectural Sketching and Rendering", 6, [sec("1", [("Thu","15:35"),("Thu","17:00")], 18)]),
    course("LAS/UPD-301", "Hands on Urban Design Practice", 6, [sec("1", [("Fri","15:35"),("Fri","17:00")], 18)]),
    course("ANTH-107", "Cultural Concepts and Social Networks", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 20)]),
]

# ===========================================================================
# POSTGRADUATE DEPARTMENTS
# ===========================================================================

DEPT_CATALOG["LLM"] = [
    course("LLM-504", "Legal Terminology and Research", 3, [sec("1", [("Sat","12:45"),("Sat","14:10")], 12)]),
    course("LLM-505", "Law Teaching Methodology", 3, [sec("1", [("Sat","12:45"),("Sat","14:10")], 12)]),
    course("LLM-502", "Law and Economics", 3, [sec("1", [("Sat","9:25"),("Sat","10:50")], 12)]),
    course("LLM-601", "History and Philosophy of Law", 3, [sec("1", [("Sat","15:35"),("Sat","17:00")], 12)]),
    course("LLM-510.1", "Legal Research and Practice I", 3, [sec("1", [("Thu","17:00")], 12)]),
    course("LLM-530.1", "Teaching Practice Seminar", 3, [sec("1", [("Wed","18:00")], 15)]),
    course("LLM-531", "Master Thesis Paper I", 6, [sec("1", [("Tue","15:35"),("Thu","15:35")], 15)]),
    course("LLM-634", "Advanced Legal Issues of Business Law", 6, [sec("1", [("Sat","12:45"),("Sat","14:10")], 15)]),
    course("LLM-572", "Internship II", 6, [sec("1", [], 15)]),
    course("LLM-522", "International Human Rights Law", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 8)]),
    course("LLM-578", "Internet Law", 6, [sec("1", [("Mon","17:00"),("Mon","18:25")], 10)]),
    course("LLM-635", "Comparative and International Consumer Law", 6, [sec("1", [("Thu","8:00"),("Thu","9:25")], 15)]),
]

DEPT_CATALOG["MAANTH"] = [
    course("ANTH-517", "Social and Cultural Anthropology", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 20)]),
    course("ANTH-508.1", "Advanced Anthropological Theories I", 6, [sec("1", [("Wed","17:00"),("Wed","18:25")], 20)]),
    course("ANTH-504", "Anthropology of International Development", 6, [sec("1", [("Mon","17:00"),("Mon","18:25")], 20)]),
    course("ANTH-613", "Anthropology in the Digital World", 6, [sec("1", [("Fri","17:00"),("Fri","18:25")], 20)]),
    course("ANTH-507", "Language, Culture and Power", 6, [sec("1", [("Mon","17:00"),("Mon","18:25")], 20)]),
    course("ANTH-583", "Development Project Management", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 20)]),
    course("ANTH-612", "Master Thesis Writing II", 6, [sec("1", [("Thu","17:00"),("Thu","18:25")], 15)]),
    course("ANTH-604", "Ethnographic Fieldwork for Master Students", 6, [sec("1", [], 15)]),
    course("ANTH-593", "'Nature' and 'Sustainable Development'", 6, [sec("1", [("Mon","10:50"),("Wed","10:50")], 12)]),
]

DEPT_CATALOG["MACAS"] = [
    course("CA-503.1", "Power and Knowledge in Central Asia", 6, [sec("1", [("Mon","17:00"),("Mon","18:25")], 10)]),
    course("CA-501", "Empire, Identity and Modernity: History of Central Asia", 6, [sec("1", [("Fri","17:00"),("Fri","18:25")], 10)]),
    course("CA-900", "Independent Graduate Study I", 6, [sec("1", [], 5)]),
    course("CA-507.2", "Central Asia in Global Politics", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 10)]),
    course("CA-508.1", "Master's Thesis Development II", 2, [sec("1", [], 5)]),
    course("RUS-508", "Academic Russian Language for Graduates I", 6, [sec("1", [("Mon","9:25"),("Mon","10:50")], 5)]),
    course("KYR-503", "Kyrgyz as a Foreign Language for Graduates II", 6, [sec("1", [("Tue","8:00"),("Tue","9:25")], 5)]),
]

DEPT_CATALOG["MAPAP"] = [
    course("ANTH/PSY/SOC/CA-542", "Graduate Writing, Thinking and Learning", 6, [sec("1", [("Wed","17:00"),("Wed","18:25")], 15)]),
    course("ANTH/PSY/SOC-540", "Quantitative Research Methods", 6, [sec("1", [("Mon","17:00"),("Mon","18:25")], 15)]),
    course("PSY-503", "Contemporary Theories of Personality", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 15)]),
    course("PSY-502", "Biological Basis of Behavior", 6, [sec("1", [("Fri","17:00"),("Fri","18:25")], 15)]),
    course("PSY-681", "Contemporary Approaches to Psychological Counselling I", 6, [sec("1", [("Thu","17:00"),("Thu","18:25")], 15)]),
    course("PSY-610", "Internship Colloquium I", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 15)]),
    course("PSY-512", "Research and Writing Colloquium II", 6, [sec("1", [("Wed","17:00"),("Wed","18:25")], 15)]),
    course("MAPAP-645", "Contemporary Approaches to Psychological Counselling II", 6, [sec("1", [("Mon","17:00"),("Mon","18:25")], 15)]),
    course("PSY-623", "Digital Technologies in Psychology: VR, Gaming and Neuroscience", 6, [sec("1", [("Tue","17:00"),("Tue","18:25")], 15)]),
    course("MAPAP-625", "Group Counseling", 6, [sec("1", [("Mon","15:35"),("Wed","15:35")], 15)]),
]

DEPT_CATALOG["MAT"] = [   # Master of Arts in Teaching
    course("IOE-518R", "Academic Research Project", 6, [sec("1", [("Tue","17:30"),("Tue","18:45")], 25)]),
    course("IOE-507P", "Teaching Practicum Fall", 6, [sec("1", [("Wed","17:30"),("Wed","18:45")], 25)]),
    course("IOE-500F", "21st Century Teaching & Learning", 3, [sec("1", [("Sat","18:00"),("Sat","19:30")], 20)]),
    course("IOE-506F", "Developing a Learning Environment", 6, [sec("1", [("Mon","19:30"),("Wed","19:30")], 20)]),
    course("IOE-500P", "Lesson Design, Planning & Assessment", 6, [sec("1", [("Tue","19:30"),("Thu","19:30")], 20)]),
    course("IOE-606R", "Graduate Research Project 2", 6, [sec("1", [("Tue","17:30"),("Tue","18:45")], 15)]),
    course("IOE-607PS", "Teaching Lab 2: Literature and Social Studies", 6, [sec("1", [("Thu","17:30"),("Thu","18:45")], 20)]),
    course("MAT-511", "Advanced Statistics", 6, [sec("1", [("Mon","17:30"),("Mon","18:45")], 15)]),
    course("IOE-508", "Policy and Practice in Global Education", 6, [sec("1", [("Mon","19:00"),("Mon","20:15")], 20)]),
    course("IOE-520L", "Advanced Studies in English Language & Rhetoric", 6, [sec("1", [("Thu","17:30"),("Thu","18:45")], 20)]),
]

DEPT_CATALOG["MBA"] = [
    course("MBA-580", "Economics for Business", 6, [sec("1", [("Thu","18:30"),("Thu","19:55")], 18)]),
    course("MBA-518.1", "Financial Accounting", 6, [sec("1", [("Mon","18:30"),("Mon","19:55")], 18)]),
    course("MBA-670", "Management and HRM", 6, [sec("1", [("Tue","18:30"),("Tue","19:55")], 18)]),
    course("MBA-615", "Business Communication", 6, [sec("1", [("Wed","18:30"),("Wed","19:55")], 18)]),
    course("MBA-610.1", "Entrepreneurship", 6, [sec("1", [("Fri","18:30"),("Fri","19:55")], 18)]),
    course("MBA-693.1", "Financial Management", 6, [sec("1", [("Mon","18:30"),("Mon","19:55")], 10)]),
    course("MBA-568", "Data Analysis", 6, [sec("1", [("Thu","18:30"),("Thu","19:55")], 10)]),
    course("MBA-627", "Thesis I", 6, [sec("1", [("Wed","18:30"),("Wed","19:55")], 10)]),
    course("MBA-644", "AI in Marketing Research and Strategy", 6, [sec("1", [("Fri","18:30"),("Fri","19:55")], 10)]),
]

DEPT_CATALOG["MSECO"] = [
    course("ECO-601", "Microeconomic Theory I", 6, [sec("1", [("Sat","9:25"),("Sat","10:50")], 10)]),
    course("ECO-602", "Macroeconomic Theory I", 6, [sec("1", [("Sat","12:45"),("Sat","14:10")], 10)]),
    course("ECO-604", "Probability Theory and Statistics", 6, [sec("1", [("Tue","18:30"),("Tue","19:55")], 10)]),
    course("ECO-703", "Econometrics II", 6, [sec("1", [("Sat","12:45"),("Sat","14:10")], 10)]),
    course("ECO-605.1", "Advanced Topics in Microeconomic Theory", 6, [sec("1", [("Wed","18:00"),("Wed","19:25")], 10)]),
    course("ECO-706", "Master Thesis Seminar I", 6, [sec("1", [("Tue","18:00"),("Tue","19:25")], 10)]),
    course("ECO-509", "Machine Learning", 6, [sec("1", [("Sat","15:35"),("Sat","17:00")], 5)]),
    course("ECO-500", "Introduction to Stata", 6, [sec("1", [("Mon","17:00"),("Wed","17:00")], 5)]),
]


# ===========================================================================
# REQUIRED anchor courses by (dept, concentration, year)
# ===========================================================================

REQUIRED = {
    # BA
    ("BA", None, "Freshman"):  ["BUS115", "ECO-112.1", "MAT-132"],
    ("BA", None, "Sophomore"): ["ECO-122.1", "FIN280", "MAT-308", "BUS301.1"],
    ("BA", None, "Junior"):    ["BUS152", "FIN350", "BUS390.1", "BUS230"],
    ("BA", None, "Senior"):    ["FIN492.1", "BUS490.1", "MNG200"],
    # ECO
    ("ECO", None, "Freshman"):  ["ECO-112.1", "MAT-131.1"],
    ("ECO", None, "Sophomore"): ["ECO-122.1", "ECO-217.1", "ECO-215.1"],
    ("ECO", None, "Junior"):    ["ECO-303.1", "ECO-320.1"],
    ("ECO", None, "Senior"):    ["STT-511", "ECO-434"],
    # AMI
    ("AMI", None, "Freshman"):  ["MAT-131.2", "COM-227", "MAT-202.1"],
    ("AMI", None, "Sophomore"): ["MAT-240", "MAT-316.2", "MAT-332"],
    ("AMI", None, "Junior"):    ["MAT-341", "COM-341.1"],
    ("AMI", None, "Senior"):    ["MAT-380", "MAT-480", "MAT-410"],
    # SFW
    ("SFW", None, "Freshman"):  ["COM-122", "MAT-131.2", "COM-227"],
    ("SFW", None, "Sophomore"): ["COM-229", "MAT-240"],
    ("SFW", None, "Junior"):    ["COM-213", "COM-341.1", "COM-416.1"],
    ("SFW", None, "Senior"):    ["COM-431.1"],
    # ICP
    ("ICP", None, "Freshman"):  ["ICP-280.1"],
    ("ICP", None, "Sophomore"): ["ICP-110.1", "ICP-280.2"],
    ("ICP", None, "Junior"):    ["ICP-318.2", "ICP-302"],
    ("ICP", None, "Senior"):    ["ICP-404"],
    # JMC
    ("JMC", None, "Freshman"):  ["JOR-182"],
    ("JMC", None, "Sophomore"): ["MC-235.1", "JMC-253", "JOR-285"],
    ("JMC", None, "Junior"):    ["JOR/TCVA-201"],
    ("JMC", None, "Senior"):    ["JMC-494.1"],
    # PSY
    ("PSY", None, "Freshman"):  ["PSY-105.1"],
    ("PSY", None, "Sophomore"): ["PSY-366", "PSY-356", "PSY-128"],
    ("PSY", None, "Junior"):    ["PSY-337.1", "PSY-298"],
    ("PSY", None, "Senior"):    ["PSY-411.1"],
    # SOC
    ("SOC", None, "Freshman"):  ["SOC-108"],
    ("SOC", None, "Sophomore"): ["SOC-221.1", "SOC-357", "SOC-210.1"],
    ("SOC", None, "Junior"):    ["SOC-381.1", "SOC-354.2"],
    ("SOC", None, "Senior"):    ["SOC-480.1"],
    # ANTH
    ("ANTH", None, "Freshman"):  ["ANTH-107", "ANTH-133"],
    ("ANTH", None, "Sophomore"): ["ANTH-327", "ANTH-232.1"],
    ("ANTH", None, "Junior"):    ["ANTH-343", "ANTH-328", "ANTH-341"],
    ("ANTH", None, "Senior"):    ["ANTH-402"],
    # ESCS
    ("ESCS", None, "Freshman"):  ["ENV/NTR-205", "ENV-216"],
    ("ESCS", None, "Sophomore"): ["ENV-201", "ESCS/NTR-101"],
    ("ESCS", None, "Junior"):    ["ENV-309"],
    ("ESCS", None, "Senior"):    ["ENV-400"],
    # TCMA
    ("TCMA", None, "Freshman"):  ["TCMA/HUM-106", "TCMA-235"],
    ("TCMA", None, "Sophomore"): ["TCMA-344"],
    ("TCMA", None, "Junior"):    ["TCMA-214", "TCMA-365", "TCMA-213"],
    ("TCMA", None, "Senior"):    ["TCMA-414", "TCMA-405"],
    # IBL (Law)
    ("IBL", None, "Freshman"):  ["Law-110", "Law-116"],
    ("IBL", None, "Sophomore"): ["Law-244.2", "Law-247.1", "Law-238.2"],
    ("IBL", None, "Junior"):    ["Law-301.3", "Law-419", "Law-258.1"],
    ("IBL", None, "Senior"):    ["Law-426.1", "Law-402.2", "Law-423.1"],
    # LAS concentrations (core added per-year via LAS_CORE below)
    ("LAS", "DC", "Freshman"):  ["JOR-182", "LAS/HUM/COM-101"],
    ("LAS", "DC", "Sophomore"): ["LAS/DC-305", "LAS-211"],
    ("LAS", "DC", "Junior"):    ["LAS/ART-202", "LAS-200"],
    ("LAS", "DC", "Senior"):    ["LAS-400"],
    ("LAS", "ES", "Freshman"):  ["ES302.1"],
    ("LAS", "ES", "Sophomore"): ["LAS/HUM-220"],
    ("LAS", "ES", "Junior"):    ["SYS/HUM/SS-272"],
    ("LAS", "ES", "Senior"):    ["LAS-400"],
    ("LAS", "HR", "Freshman"):  ["HR100.1", "ICP/LAS/GDS-208"],
    ("LAS", "HR", "Sophomore"): ["Law247.1"],
    ("LAS", "HR", "Junior"):    ["Law419", "Law258.1"],
    ("LAS", "HR", "Senior"):    ["LAS-400", "Law426.1"],
    ("LAS", "MC", "Freshman"):  ["JOR-182", "LAS/HUM/COM-101"],
    ("LAS", "MC", "Sophomore"): ["MC-235.1", "JMC-253"],
    ("LAS", "MC", "Junior"):    ["JOR-285", "JOR/TCVA-201"],
    ("LAS", "MC", "Senior"):    ["LAS-400", "JMC-494.1"],
    ("LAS", "MM", "Freshman"):  ["MAT-135", "MAT-134"],
    ("LAS", "MM", "Sophomore"): ["MAT-131.1"],
    ("LAS", "MM", "Junior"):    ["MATH/ICP/ECO-300", "MAT/HUM-200"],
    ("LAS", "MM", "Senior"):    ["LAS-400"],
    ("LAS", "PC", "Freshman"):  ["LAS-150"],
    ("LAS", "PC", "Sophomore"): ["SYS/HUM/SS-272", "SYS/HUM/SS-285"],
    ("LAS", "PC", "Junior"):    ["ANTH-341", "ANTH/SOC-368"],
    ("LAS", "PC", "Senior"):    ["LAS-400"],
    ("LAS", "SEDT", "Freshman"):  ["SE-200", "LAS/BUS-284"],
    ("LAS", "SEDT", "Sophomore"): ["LAS/SE-201", "LAS/SE-210"],
    ("LAS", "SEDT", "Junior"):    ["LAS/SE-300", "LAS-301"],
    ("LAS", "SEDT", "Senior"):    ["LAS-400", "LAS/SE-302"],
    ("LAS", "UPD", "Freshman"):  ["LAS/EUS-301", "ANTH-326"],
    ("LAS", "UPD", "Sophomore"): ["LAS/UPD-302"],
    ("LAS", "UPD", "Junior"):    ["LAS/UPD-201", "LAS/UPD-301"],
    ("LAS", "UPD", "Senior"):    ["LAS-400"],
    # PG
    ("LLM", None, "Masters 1st Year"): ["LLM-504", "LLM-505", "LLM-502", "LLM-601", "LLM-510.1"],
    ("LLM", None, "Masters 2nd Year"): ["LLM-530.1", "LLM-531", "LLM-634", "LLM-572"],
    ("MAANTH", None, "Masters 1st Year"): ["ANTH-517", "ANTH-508.1", "ANTH-504", "ANTH-613"],
    ("MAANTH", None, "Masters 2nd Year"): ["ANTH-507", "ANTH-583", "ANTH-612", "ANTH-604"],
    ("MACAS", None, "Masters 1st Year"): ["CA-503.1", "CA-501", "CA-900"],
    ("MACAS", None, "Masters 2nd Year"): ["CA-507.2", "CA-508.1"],
    ("MAPAP", None, "Masters 1st Year"): ["ANTH/PSY/SOC/CA-542", "ANTH/PSY/SOC-540", "PSY-503", "PSY-502", "PSY-681"],
    ("MAPAP", None, "Masters 2nd Year"): ["PSY-610", "PSY-512", "MAPAP-645"],
    ("MAT", None, "Masters 1st Year"): ["IOE-518R", "IOE-507P", "IOE-500F", "IOE-506F"],
    ("MAT", None, "Masters 2nd Year"): ["IOE-606R", "IOE-607PS", "MAT-511"],
    ("MBA", None, "Masters 1st Year"): ["MBA-580", "MBA-518.1", "MBA-670", "MBA-615"],
    ("MBA", None, "Masters 2nd Year"): ["MBA-693.1", "MBA-568", "MBA-627"],
    ("MSECO", None, "Masters 1st Year"): ["ECO-601", "ECO-602", "ECO-604"],
    ("MSECO", None, "Masters 2nd Year"): ["ECO-703", "ECO-605.1", "ECO-706"],
}

# Shared LAS core courses, added (where they fit) to every LAS student.
LAS_CORE_BY_YEAR = {
    "Freshman":  ["NTR/LAS-100"],
    "Sophomore": ["SS/LAS-102"],
    "Junior":    ["LAS/HUM-220", "LAS/ART-230"],
    "Senior":    ["LAS-400"],
}

# Elective fill pools per department (E + extra R courses students can pick up)
ELECTIVES = {
    "BA":   ["MNG430", "FIN363", "MRK366", "MRK420", "MNG281", "MNG450.1",
             "BUS/MAT-376", "BUS/SOC/COM377", "BUS390.2", "MRK302.1", "FIN100", "FIN285"],
    "ECO":  ["ECO-113", "ECO-350", "ECO-440", "ECO-337", "ECO-340", "MAT-308"],
    "AMI":  ["MAT-435", "MAT-326", "MAT-333", "MAT-240"],
    "SFW":  ["COM-160.1", "COM-417", "COM-463.1", "COM-299", "COM-312", "COM-360.1", "COM-421.1"],
    "ICP":  ["ICP-212", "ICP-347", "ICP-405.1", "ICP/HR-403", "ICP/LAS/GDS-208"],
    "JMC":  ["PSY/JMC-225", "JOR/LAS-200"],
    "PSY":  ["PSY-391.1", "PSY-363", "PSY-310.1", "PSY-342.1", "PSY-405"],
    "SOC":  ["SOC-415", "ANTH/SOC-368", "SS/LAS-102"],
    "ANTH": ["ANTH-112", "ANTH-342", "ANTH-393"],
    "ESCS": ["ENV/NTR-100", "ESCS/NS-102", "ESCS/NTR-102", "ANTH/ESCS-445"],
    "TCMA": ["TCMA/ART-135", "TCMA/JMC-115", "TCMA/ART-261", "TCMA/JMC-200"],
    "IBL":  ["Law-435", "Law/HR-394", "Law-302.2", "HR-100.1", "Law-430"],
    "LAS":  ["LAS/HUM-220", "LAS/ART-230", "ICP/HR-403"],
    "LLM":  ["LLM-522", "LLM-578", "LLM-635"],
    "MAANTH": ["ANTH-593"],
    "MACAS":  ["RUS-508", "KYR-503"],
    "MAPAP":  ["PSY-623", "MAPAP-625"],
    "MAT":    ["IOE-500P", "IOE-508", "IOE-520L"],
    "MBA":    ["MBA-610.1", "MBA-644"],
    "MSECO":  ["ECO-509", "ECO-500"],
}
