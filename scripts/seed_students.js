// Seed generator for 1st to 8th Semester Students and Semester History

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data', 'mongodb');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const HISTORY_FILE = path.join(DATA_DIR, 'semester_history.json');

function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

// Sample student dataset templates
const sampleNames = {
  1: [
    { name: 'Aditya Kashyap', gender: 'Male', section: 'A' },
    { name: 'Bhavana Gowda', gender: 'Female', section: 'A' },
    { name: 'Chetan M', gender: 'Male', section: 'B' },
    { name: 'Divya Shree R', gender: 'Female', section: 'B' },
    { name: 'Eshwar Prasad', gender: 'Male', section: 'C' },
    { name: 'Fathima Zohra', gender: 'Female', section: 'D' }
  ],
  2: [
    { name: 'Gagan Deep S', gender: 'Male', section: 'A' },
    { name: 'Harshitha K', gender: 'Female', section: 'A' },
    { name: 'Ishan Sharma', gender: 'Male', section: 'B' },
    { name: 'Jyothi N', gender: 'Female', section: 'B' }
  ],
  3: [
    { name: 'Karthik Raja', gender: 'Male', section: 'A' },
    { name: 'Lavanya M', gender: 'Female', section: 'A' },
    { name: 'Manoj Kumar V', gender: 'Male', section: 'B' },
    { name: 'Nandini Rao', gender: 'Female', section: 'B' }
  ],
  4: [
    { name: 'Omkar Naik', gender: 'Male', section: 'A' },
    { name: 'Pallavi Deshmukh', gender: 'Female', section: 'A' },
    { name: 'Rahul Verma', gender: 'Male', section: 'B' },
    { name: 'Sneha Kulkarni', gender: 'Female', section: 'B' }
  ],
  5: [
    { name: 'AMULYA H S', gender: 'Female', section: 'A', usn: '4MN24CS007', email: 'amulya.h.s@mitt.ac.in' },
    { name: 'ANJALI G SHANKAR', gender: 'Female', section: 'A', usn: '4MN24CS008', email: 'anjali.g.shankar@mitt.ac.in' },
    { name: 'ANUSHA G S', gender: 'Female', section: 'A', usn: '4MN24CS009', email: 'anusha.g.s@mitt.ac.in' },
    { name: 'ABHILASH KUMAR K', gender: 'Male', section: 'B', usn: '4MN24CS002', email: 'abhilash.kumar.k@mitt.ac.in' },
    { name: 'BIBI HAJIRA', gender: 'Female', section: 'A', usn: '4MN24CS017', email: 'bibi.hajira@mitt.ac.in' },
    { name: 'CHAYA GIRISH', gender: 'Female', section: 'A', usn: '4MN24CS019', email: 'chaya.girish@mitt.ac.in' },
    { name: 'DHANUSHREE D', gender: 'Female', section: 'B', usn: '4MN25CS419', email: 'dhanushree.d@mitt.ac.in' },
    { name: 'GUDI NAVEEN', gender: 'Male', section: 'A', usn: '4MN24CS027', email: 'gudi.naveen@mitt.ac.in' }
  ],
  6: [
    { name: 'Aarav Sharma', gender: 'Male', section: 'A', usn: '1NT21CS042', email: 'aarav.sharma@college.edu' },
    { name: 'Priya Patel', gender: 'Female', section: 'A', usn: '1NT21CS089', email: 'priya.patel@college.edu' },
    { name: 'Kunal Das', gender: 'Male', section: 'A', usn: '1NT21CS019', email: 'kunal.das@college.edu' },
    { name: 'Aditya Nair', gender: 'Male', section: 'B', usn: '1NT21CS005', email: 'aditya.nair@college.edu' }
  ],
  7: [
    { name: 'Pranav Kulkarni', gender: 'Male', section: 'A' },
    { name: 'Ritu Sen', gender: 'Female', section: 'A' },
    { name: 'Siddharth Rao', gender: 'Male', section: 'B' },
    { name: 'Tanvi Joshi', gender: 'Female', section: 'B' }
  ],
  8: [
    { name: 'Umesh Hegde', gender: 'Male', section: 'A' },
    { name: 'Varsha Murthy', gender: 'Female', section: 'A' },
    { name: 'Yashaswini B', gender: 'Female', section: 'B' },
    { name: 'Zeeshan Khan', gender: 'Male', section: 'B' }
  ]
};

const subjectsPerSem = {
  1: ['CS101 (Programming in C)', 'MA101 (Calculus)', 'PH101 (Physics)', 'EE101 (Basic Electrical)'],
  2: ['CS201 (Data Structures)', 'MA201 (Linear Algebra)', 'CH201 (Chemistry)', 'EC201 (Electronics)'],
  3: ['CS301 (Object-Oriented Java)', 'CS302 (Digital Logic)', 'MA301 (Discrete Math)', 'CS303 (Data Structures Lab)'],
  4: ['CS401 (Algorithms Design)', 'CS402 (Microprocessors)', 'CS403 (OS Fundamentals)', 'CS404 (Algorithm Lab)'],
  5: ['CS501 (Software Engineering)', 'CS502 (Computer Networks)', 'CS503 (Theory of Computation)', 'CS504 (DBMS)'],
  6: ['CS601 (Distributed Systems)', 'CS602 (Machine Learning)', 'CS603 (Cloud Architecture)', 'CS604 (Compiler Design)'],
  7: ['CS701 (AI & Deep Learning)', 'CS702 (Cyber Security)', 'CS703 (Big Data Analytics)', 'CS704 (Elective III)'],
  8: ['CS801 (Major Capstone Project)', 'CS802 (Industrial Internship)', 'CS803 (Cloud & DevOps Practicum)']
};

function seedStudents() {
  console.log('🌱 Seeding 1st to 8th Semester Students and Academic History...');

  // If already seeded and has enough data, don't reseed
  if (fs.existsSync(STUDENTS_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf8'));
      if (existing.length >= 25) {
        console.log(`ℹ️ Students collection already has ${existing.length} records. Skipping initial seeding.`);
        return;
      }
    } catch (e) { }
  }

  const students = [];
  const histories = [];
  const now = new Date().toISOString();

  let globalRollCounter = 1;

  for (let sem = 1; sem <= 8; sem++) {
    const semStudents = sampleNames[sem] || [];

    semStudents.forEach((tmpl, idx) => {
      const studentId = `STD-${sem}${tmpl.section}-${String(idx + 1).padStart(3, '0')}`;
      const rollNum = String(globalRollCounter++).padStart(3, '0');
      const usn = tmpl.usn || `4MN2${8 - sem}CS${rollNum}`;
      const email = tmpl.email || `${tmpl.name.toLowerCase().replace(/\s+/g, '.')}@yourcollege.edu.in`;
      const id = generateObjectId();
      const batchYearStart = 2026 - Math.floor((sem - 1) / 2);
      const batch = `${batchYearStart}-${batchYearStart + 4}`;
      const admissionYear = String(batchYearStart);
      const academicYear = '2024-2025';

      const studentDoc = {
        _id: id,
        userId: `usr-std-${sem}-${idx + 1}`,
        profilePhoto: `https://images.unsplash.com/photo-${1530000000000 + (sem * 1000 + idx * 100)}?auto=format&fit=crop&w=200&q=80`,
        name: tmpl.name,
        gender: tmpl.gender || (idx % 2 === 0 ? 'Male' : 'Female'),
        dateOfBirth: `200${4 - Math.floor(sem / 2)}-0${(idx % 9) + 1}-15`,
        phone: `+91 98450 ${sem}${idx}0${idx + 10}`,
        personalEmail: `${tmpl.name.toLowerCase().replace(/\s+/g, '')}.personal@gmail.com`,
        collegeEmail: email,
        bloodGroup: ['O+', 'A+', 'B+', 'AB+'][idx % 4],
        address: `${100 + idx}, Campus Avenue, Block ${tmpl.section}`,
        city: 'Mysuru',
        state: 'Karnataka',
        pincode: '570008',
        studentId: studentId,
        usn: usn,
        admissionNumber: `ADM-2024-${sem}${tmpl.section}-${rollNum}`,
        department: 'Computer Science and Engineering',
        semester: sem, // Numeric 1 to 8 (Requirement 1)
        section: tmpl.section,
        batch: batch,
        admissionYear: admissionYear,
        academicYear: academicYear,
        status: sem === 8 && idx === 3 ? 'GRADUATED' : 'ACTIVE', // ACTIVE / INACTIVE / GRADUATED / SUSPENDED
        role: 'STUDENT',
        skills: 'Python, Java, Data Structures, Web Development',
        interests: 'Artificial Intelligence, Competitive Coding, Robotics',
        bio: `${sem}th Semester Computer Science student passionate about systems programming.`,
        github: `https://github.com/${tmpl.name.toLowerCase().replace(/\s+/g, '')}`,
        linkedin: `https://linkedin.com/in/${tmpl.name.toLowerCase().replace(/\s+/g, '')}`,
        portfolio: `https://${tmpl.name.toLowerCase().replace(/\s+/g, '')}.dev`,
        guardian: {
          name: `Mr. ${tmpl.name.split(' ')[0]} Senior`,
          relationship: 'Father',
          phone: `+91 98451 ${sem}${idx}999`,
          email: `guardian.${tmpl.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          occupation: 'Senior Engineer / Professional'
        },
        createdBy: 'usr-hod-01',
        createdAt: now,
        updatedAt: now
      };

      students.push(studentDoc);

      // Create Semester History for all completed and current semesters
      for (let prevSem = 1; prevSem <= sem; prevSem++) {
        const histDoc = {
          _id: generateObjectId(),
          studentId: id,
          usn: usn,
          studentName: tmpl.name,
          semester: prevSem,
          academicYear: `${2024 - (sem - prevSem)}-${2025 - (sem - prevSem)}`,
          department: 'Computer Science and Engineering',
          section: tmpl.section,
          subjects: subjectsPerSem[prevSem] || subjectsPerSem[1],
          attendance: Math.min(98, Math.max(70, Math.round(75 + Math.random() * 20))),
          internalMarks: {
            ia1: Math.round(18 + Math.random() * 7),
            ia2: Math.round(19 + Math.random() * 6),
            assignment: Math.round(8 + Math.random() * 2),
            total: Math.round(44 + Math.random() * 6)
          },
          examinationRecords: {
            grade: ['A+', 'A', 'B+', 'O'][prevSem % 4],
            sgpa: (7.5 + (prevSem * 0.2)).toFixed(2),
            resultStatus: 'PASS'
          },
          startDate: `${2024 - (sem - prevSem)}-08-01`,
          endDate: `${2024 - (sem - prevSem) + 1}-01-15`,
          createdAt: now
        };
        histories.push(histDoc);
      }
    });
  }

  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf8');
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(histories, null, 2), 'utf8');

  console.log(`✅ Successfully seeded ${students.length} students across 1st to 8th Semester.`);
  console.log(`✅ Successfully seeded ${histories.length} historical semester academic records.`);
}

seedStudents();
