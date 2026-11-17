"""
Official 5th Semester CSE Student Master Data Importer
SmartDept - Smart Department Academic & Campus Management System (MITT)
Imports the exact 133 verified students (Name, USN, Gmail) provided by the user,
maps official A/B sections & contact numbers, exports backend/official_students.csv,
and updates both SQLite databases cleanly.
"""
import csv
import io
import os
import shutil
import sys
from collections import Counter

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import create_dev_tables, SessionLocal
from app.models.student import Student
from app.models.department import Department

USER_STUDENT_CSV = """Student Name,USN,Gmail
ABHILASH KUMAR K,4MN24CS002,abhilashkumar27k@gmail.com
AHMED NABEEL,4MN24CS003,ahmednabeel4561@gmail.com
AISHWARYA H M,4MN24CS004,gowdaaishu323@gmail.com
AISHWARYA V,4MN24CS005,aishwaryavishwanath2005@gmail.com
AMRUTHA B N,4MN24CS006,amruthabnamruthabn74@gmail.com
AMULYA H S,4MN24CS007,amulyaamulyahs@gmail.com
ANJALI G SHANKAR,4MN24CS008,anjalishankar305@gmail.com
ANUSHA G S,4MN24CS009,anushags248@gmail.com
ANUSHA R,4MN24CS010,ranusha40002@gmail.com
ANUSUYA S,4MN24CS011,anusuyadevarahalli9@gmail.com
BALAESHWARI,4MN24CS012,eshwari2306@gmail.com
BASAVARAJ TEGGI,4MN24CS013,basuteggi11@gmail.com
BHAVYA S,4MN24CS014,bhavyabhavi1124@gmail.com
BHOOMIKA B,4MN24CS015,bhoomika31gowda@gmail.com
BHOOMIKA B M,4MN24CS016,bhoomika4747@gmail.com
BIBI HAJIRA,4MN24CS017,bibihajira010601@gmail.com
CHANDANA M,4MN24CS018,cc1345616@gmail.com
CHIRANTHANA N S,4MN24CS020,chiranthana1704@gmail.com
DEEKSHA,4MN24CS021,rsdeeksha75@gmail.com
DEEKSHITH M ANAND,4MN24CS022,deekshitm841@gmail.com
DHANUSH S RAJ,4MN24CS023,dhanushsraj27@gmail.com
DURGASHREE M,4MN24CS024,durgamahesh945@gmail.com
GAGANA B C,4MN24CS025,gaganag895@gmail.com
GOUTHAMI K V,4MN24CS026,gouthamigouthami028@gmail.com
GUDI NAVEEN,4MN24CS027,ngudinaveen@gmail.com
HANNAH AHMED,4MN24CS028,hannah18.edu@gmail.com
HARSHA D L,4MN24CS029,harshaharsha642006@gmail.com
HARSHA KUMAR A K,4MN24CS030,harshakumarak2110@gmail.com
HARSHAVARDHAN T S,4MN24CS031,harshavardhan13ts@gmail.com
HARSHITH B K GOWDA,4MN24CS032,harshagowdru1011@gmail.com
HARSHITHA K R,4MN24CS033,isuharshita@gmail.com
HOYSALA P A,4MN24CS034,hoysalapa27@gmail.com
INCHARA H S,4MN24CS035,incharagowda1172006@gmail.com
INDUHAASINI,4MN24CS036,induhaasini2006@gmail.com
JEEVAN K H,4MN24CS037,jeevankh3@gmail.com
JEEVAN K R,4MN24CS038,jeevanramesh1602@gmail.com
JEEVIKA B M,4MN24CS039,jeevikamadappa@gmail.com
KANCHANA B S,4MN24CS040,kanchanabs156@gmail.com
KATAM VEERA POOJITHA,4MN24CS041,poojitha8631@gmail.com
KAVANA R,4MN24CS042,kavanaravi136@gmail.com
KEERTHANA S P,4MN24CS043,keerthikeerthanasp@gmail.com
KIRAN A SHETTY,4MN24CS044,shettykiran1488@gmail.com
KISHAN K U,4MN24CS045,kishanku827@gmail.com
KISHAN P T,4MN24CS046,kishanpt232006@gmail.com
KRUPA P,4MN24CS047,krupakrupa2005@gmail.com
KUMARA GURU R,4MN24CS048,gurukumara863@gmail.com
KUSHMITH NAYAKA,4MN24CS049,hm742261@gmail.com
LALITHYA S,4MN24CS050,lalithya046@gmail.com
LIBA M VARGHESE,4MN24CS051,libamvarghese0@gmail.com
LIKITHA M,4MN24CS052,tejaa0525@gmail.com
M V HAMSA,4MN24CS053,hamsamvgowda07@gmail.com
MADAN GOPAL A M,4MN24CS054,gopalammadan4@gmail.com
MADIHA,4MN24CS055,madihamadi973@gmail.com
MANJUNATH,4MN24CS056,manjunath48857@gmail.com
MANYA SHREE C P,4MN24CS057,manyashreemanya1887@gmail.com
MAYA D,4MN24CS058,mayupatelmayupatel42@gmail.com
MEGHANA M S,4MN24CS059,meghanamsmeghanams89@gmail.com
MEHAR KHANUM,4MN24CS060,meherkhanamhnp@gmail.com
MOHAMMED NAUMAN,4MN24CS061,mnauman10999@gmail.com
MOHITH GOWDA T R,4MN24CS062,mohithgowda549@gmail.com
MOHITH S,4MN24CS063,mohithgowda10@gmail.com
MONIKA M,4MN24CS064,monikamaheshgowda600@gmail.com
NAGALAKSHMI S,4MN24CS065,nagalakshmis179@gmail.com
NAGARATHNA B S,4MN24CS066,nagubs07@gmail.com
NANDITHA N,4MN24CS067,nandithann40@gmail.com
NANDITHA PRASAD K N,4MN24CS068,nandithaprasadkn21@gmail.com
NEHA JOSE J,4MN24CS069,nehajosej@gmail.com
NISARGA MINCHU D,4MN24CS070,gowdaminchu1@gmail.com
NITEESH REDDY S,4MN24CS071,niteeshs822@gmail.com
PADMASHREE K L,4MN24CS072,padmashreekl01@gmail.com
PRAGNYA M,4MN24CS073,pragnya1907@gmail.com
PRAMOD D C,4MN24CS074,pramoddc79@gmail.com
PRASHANTH S,4MN24CS075,prashuprashanth4478@gmail.com
PRAVEEN KUMAR H M,4MN24CS076,praveenbypassm@gmail.com
PREETHAM M,4MN24CS077,preethu8001@gmail.com
PRIYANKA CHANAGONDA,4MN24CS078,priyankabiradar262@gmail.com
PRUTHVI L,4MN24CS079,lpruthvi0506@gmail.com
RACHANA,4MN24CS080,rachanaracchu1118@gmail.com
RACHANA R,4MN24CS081,rachana15126@gmail.com
RAGHAVENDRA D S,4MN24CS082,dsraghavendra22@gmail.com
RAKSHA,4MN24CS083,rakshakalal2006@gmail.com
RAKSHITHA,4MN24CS084,rakshitharaj431@gmail.com
RAMYA K,4MN24CS085,ry5965104@gmail.com
RANJITHA S,4MN24CS086,ranjitharanjithashivannashetty@gmail.com
RUCHITHA C S,4MN24CS087,ruchithaa06@gmail.com
SAGAR P,4MN24CS088,sagarsagar6927@gmail.com
SANDHYASHREE P,4MN24CS089,sandhyashreep36@gmail.com
SANGEETHA,4MN24CS090,sangeethamahadev329@gmail.com
SANIKA M,4MN24CS091,sanikamsanika@gmail.com
SANIL M,4MN24CS092,sanilm2006@gmail.com
SANJANA C B,4MN24CS093,sanajanasanju5146@gmail.com
SANJANA S,4MN24CS094,sanjanaskabbahalli@gmail.com
SANJANA SHYAM,4MN24CS095,sanjanashyam49@gmail.com
SARIA NOORAIN,4MN24CS096,sarianoorain3106@gmail.com
SHAMANTH N,4MN24CS097,shamanth.nraj07@gmail.com
SHIVASIDDU M,4MN24CS098,shivasiddumnayak@gmail.com
SINCHANA M,4MN24CS099,sinchanaaa.04@gmail.com
SINCHANA M,4MN24CS100,sinchanamadhu856@gmail.com
SINCHANA R,4MN24CS101,sinchanasinchu00742@gmail.com
SMITHASHREE T N,4MN24CS102,smithashree20@gmail.com
SPANDANA K R,4MN24CS103,spandanakrspandana@gmail.com
TEJASWINI K P,4MN24CS104,tejaswiniparmesh2006@gmail.com
THANUSHREE G S,4MN24CS105,thanugunda2006@gmail.com
THEJASWINI M,4MN24CS106,thejashwiniteju09@gmail.com
THRISHA HINDUSTANI,4MN24CS107,thrishahindustani19@gmail.com
THRISHA R,4MN24CS108,thrishar864@gmail.com
TRISHASHREE N REDDY,4MN24CS109,trishareddy4518@gmail.com
UJWAL K S,4MN24CS110,ujwalks777@gmail.com
UMME ZOHA,4MN24CS111,zumme598@gmail.com
UMRA SHARIFF,4MN24CS112,umrashariff332@gmail.com
USHA T L,4MN24CS113,ushausha53201@gmail.com
VARSHITHA N R,4MN24CS114,varshitharamesh68@gmail.com
VIKAS D T,4MN24CS115,dtvikas977@gmail.com
VINAY K,4MN24CS117,vinivinayvinay5@gmail.com
YASHASWINI N,4MN24CS118,yashaswinimysore0101@gmail.com
YASHASWINI R,4MN24CS119,yashaswinir750@gmail.com
YUGANK R GOWDA,4MN24CS120,yugankrgowda@gmail.com
YUKTHA K,4MN24CS121,yukthakishore568@gmail.com
ADARSH D C,4MN25CS400,adarshdc2006@gmail.com
AKASH J,4MN25CS401,akashj5913@gmail.com
AKASH K,4MN25CS402,akash29k2006@gmail.com
ANKITHA C,4MN25CS403,ankithagowda116@gmail.com
CHANDRA SHEKHAR A,4MN25CS404,achandrashekhar141@gmail.com
CHETHAN A J,4MN25CS405,ajchethan9@gmail.com
DHANUSH N P,4MN25CS406,dhanushnpdhanu@gmail.com
DHANUSHREE D,4MN25CS407,dhanushreed937@gmail.com
DILEEP Y P,4MN25CS408,dileepgowdayp143@gmail.com
GANESHA S,4MN25CS409,gag29494@gmail.com
KARTHIKA D K,4MN25CS410,karthikdk1169@gmail.com
NAVEEN KSHEERASAGAR,4MN25CS411,naveenek59@gmail.com
PRAJWAL D,4MN25CS412,pp1270831@gmail.com
PRATEESHA,4MN25CS413,prateesha115@gmail.com
SHUBHA T V,4MN25CS415,shubhashushubhashu4@gmail.com
"""

DIPLOMA_USN_MAP = {
    "ADARSH D C": "4MN25CS400",
    "AKASH J": "4MN25CS401",
    "AKASH K": "4MN25CS402",
    "ANKITHA C": "4MN25CS403",
    "CHANDRA SHEKHAR A": "4MN25CS404",
    "CHETHAN A J": "4MN25CS405",
    "DHANUSH N P": "4MN25CS406",
    "DHANUSHREE D": "4MN25CS407",
    "DILEEP Y P": "4MN25CS408",
    "GANESHA S": "4MN25CS409",
    "KARTHIKA D K": "4MN25CS410",
    "NAVEEN KSHEERASAGAR": "4MN25CS411",
    "PRAJWAL D": "4MN25CS412",
    "PRATEESHA": "4MN25CS413",
    "SANKETH M B": "4MN25CS414",
    "SHUBHA T V": "4MN25CS415",
}


def load_section_and_phone_metadata():
    """Load Section (A/B) and phone numbers from student_data_raw.csv keyed by USN."""
    meta = {}
    raw_path = os.path.join(os.path.dirname(__file__), "student_data_raw.csv")
    if not os.path.exists(raw_path):
        return meta

    with open(raw_path, encoding="utf-8") as f:
        text = f.read()

    parts = text.split("Maharaja Institute of Technology Thandavapura")
    for idx, section_letter in [(1, "A"), (2, "B")]:
        if len(parts) <= idx:
            continue
        for line in parts[idx].splitlines():
            row = [c.strip() for c in line.split(",")]
            if len(row) >= 3 and row[0].isdigit():
                raw_usn = row[1].upper()
                raw_name = " ".join(row[2].split()).upper()
                usn = DIPLOMA_USN_MAP.get(raw_name, raw_usn) if "DIPLOMA" in raw_usn else raw_usn
                meta[usn] = {
                    "section": section_letter,
                    "phone": row[3] if len(row) > 3 and row[3] not in ("-", "") else "",
                    "father_phone": row[4] if len(row) > 4 and row[4] not in ("-", "") else "",
                    "mother_phone": row[5] if len(row) > 5 and row[5] not in ("-", "") else "",
                }
    return meta


def parse_user_students():
    meta = load_section_and_phone_metadata()
    reader = csv.DictReader(io.StringIO(USER_STUDENT_CSV.strip()))
    students = []
    unmatched_sections = []

    for row in reader:
        name = " ".join((row["Student Name"] or "").split()).upper()
        usn = (row["USN"] or "").strip().upper()
        gmail = (row["Gmail"] or "").strip().lower()

        info = meta.get(usn)
        if not info:
            unmatched_sections.append(usn)
            section = "A"
            phone = father_phone = mother_phone = ""
        else:
            section = info["section"]
            phone = info["phone"]
            father_phone = info["father_phone"]
            mother_phone = info["mother_phone"]

        students.append({
            "name": name,
            "usn": usn,
            "gmail": gmail,
            "section": section,
            "semester": 5,
            "phone": phone,
            "father_phone": father_phone,
            "mother_phone": mother_phone,
        })

    if unmatched_sections:
        print(f"[!] Warning: USNs without section metadata (defaulted to A): {unmatched_sections}")

    # Validate zero duplicates
    dup_usns = [u for u, c in Counter(s["usn"] for s in students).items() if c > 1]
    dup_gmails = [g for g, c in Counter(s["gmail"] for s in students).items() if c > 1]
    if dup_usns:
        raise ValueError(f"Duplicate USNs detected: {dup_usns}")
    if dup_gmails:
        raise ValueError(f"Duplicate Gmails detected: {dup_gmails}")

    return students


def write_official_csv(students):
    csv_path = os.path.join(os.path.dirname(__file__), "official_students.csv")
    fieldnames = ["Student Name", "USN", "Gmail", "Section", "Semester", "Phone", "Father Phone", "Mother Phone"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for s in students:
            writer.writerow({
                "Student Name": s["name"],
                "USN": s["usn"],
                "Gmail": s["gmail"],
                "Section": s["section"],
                "Semester": s["semester"],
                "Phone": s["phone"],
                "Father Phone": s["father_phone"],
                "Mother Phone": s["mother_phone"],
            })
    print(f"[+] Wrote verified master CSV: {csv_path} ({len(students)} students)")
    return csv_path


def run_import():
    print("=" * 65)
    print("UPDATING OFFICIAL 5TH SEMESTER CSE STUDENT DATA")
    print("=" * 65)

    create_dev_tables()
    students = parse_user_students()

    sec_a = [s for s in students if s["section"] == "A"]
    sec_b = [s for s in students if s["section"] == "B"]
    print(f"[*] Verified Input: {len(students)} students total")
    print(f"    - Section A: {len(sec_a)} students")
    print(f"    - Section B: {len(sec_b)} students")

    write_official_csv(students)

    db = SessionLocal()
    try:
        dept = db.query(Department).first()
        dept_id = dept.id if dept else 1

        # Clear existing student master rows before clean insert
        db.query(Student).delete()
        db.commit()

        for s in students:
            record = Student(
                usn=s["usn"],
                student_id=s["usn"],
                name=s["name"],
                email=s["gmail"],
                gmail=s["gmail"],
                phone=s["phone"] or None,
                father_phone=s["father_phone"] or None,
                mother_phone=s["mother_phone"] or None,
                semester=s["semester"],
                section=s["section"],
                department_id=dept_id,
                admission_year=2025 if s["usn"].startswith("4MN25") else 2024,
                username=s["usn"].lower(),
                status="active",
                registration_status="Unregistered",
                email_verification_status="Unverified",
            )
            db.add(record)

        db.commit()

        # Verify DB counts
        total = db.query(Student).count()
        cnt_a = db.query(Student).filter(Student.section == "A").count()
        cnt_b = db.query(Student).filter(Student.section == "B").count()
        missing_gmail = db.query(Student).filter((Student.gmail == None) | (Student.gmail == "")).count()
        print(f"\n[OK] Database updated successfully:")
        print(f"    - Total Students : {total}")
        print(f"    - Section A      : {cnt_a}")
        print(f"    - Section B      : {cnt_b}")
        print(f"    - Missing Gmail  : {missing_gmail}")

    finally:
        db.close()

    # Sync backend/smart_department.db -> root smart_department.db
    backend_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "smart_department.db"))
    root_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "smart_department.db"))
    if os.path.exists(backend_db):
        shutil.copy2(backend_db, root_db)
        print(f"[*] Synced {backend_db} -> {root_db}")


if __name__ == "__main__":
    run_import()
