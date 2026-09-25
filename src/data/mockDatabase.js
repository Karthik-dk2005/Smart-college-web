// CampusConnect // Smart Department & College Management System
// Centralized Realistic Mock Database with Full Data Relationships
// Synced to LocalStorage for Session Persistence

const DB_STORAGE_KEY = 'campusconnect_master_db_v6';

const INITIAL_MOCK_DATABASE = {
  // System Metadata
  collegeName: 'Maharaja Institute of Technology Thandavapura',
  systemTitle: 'CampusConnect // Maharaja Institute of Technology Thandavapura',
  academicYear: '2024-2025',
  currentSemesterTerm: 'Academic Term 2024-25',
  attendanceRuleThreshold: 75, // Mandatory 75% rule

  // 1. Departments
  departments: [
    { id: 'dept-cse', code: 'CSE', name: 'Computer Science and Engineering', hod: 'Dr. Vikramaditya Sen', building: 'Turing Block', floors: 4, roomsCount: 16, studentCount: 420, facultyCount: 28 },
    { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering', hod: 'Dr. Meenakshi Sundaram', building: 'Maxwell Hall', floors: 3, roomsCount: 14, studentCount: 380, facultyCount: 24 },
    { id: 'dept-it', code: 'IT', name: 'Information Technology', hod: 'Dr. Arjun Rao', building: 'Shannon Complex', floors: 3, roomsCount: 12, studentCount: 310, facultyCount: 20 },
    { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering', hod: 'Dr. Sanjay Verma', building: 'Newton Block', floors: 2, roomsCount: 10, studentCount: 290, facultyCount: 22 },
    { id: 'dept-eee', code: 'EEE', name: 'Electrical & Electronics Engineering', hod: 'Dr. K. Radhakrishnan', building: 'Faraday Hall', floors: 3, roomsCount: 11, studentCount: 260, facultyCount: 19 }
  ],

  // 2. Semesters & Sections
  semesters: [
    { id: 1, name: 'Semester 1', year: '1st Year', type: 'Odd', active: false },
    { id: 2, name: 'Semester 2', year: '1st Year', type: 'Even', active: false },
    { id: 3, name: 'Semester 3', year: '2nd Year', type: 'Odd', active: false },
    { id: 4, name: 'Semester 4', year: '2nd Year', type: 'Even', active: true },
    { id: 5, name: 'Semester 5', year: '3rd Year', type: 'Odd', active: true },
    { id: 6, name: 'Semester 6', year: '3rd Year', type: 'Even', active: true }
  ],
  sections: ['A', 'B'],

  // 3. Subjects (Theory, Lab, Elective, Project)
  subjects: [
    // 5th Semester CSE Subjects (Maharaja Institute of Technology Thandavapura)
    { id: 'sub-cs501', code: 'CS501', name: 'Software Engineering & Agile Methodology', dept: 'CSE', semester: 5, credits: 4, type: 'Theory', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer' },
    { id: 'sub-cs502', code: 'CS502', name: 'Computer Networks & Internet Protocols', dept: 'CSE', semester: 5, credits: 4, type: 'Theory', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar' },
    { id: 'sub-cs503', code: 'CS503', name: 'Theory of Computation & Automata', dept: 'CSE', semester: 5, credits: 4, type: 'Theory', teacherId: 'usr-hod-01', teacherName: 'Dr. Vikramaditya Sen' },
    { id: 'sub-cs504', code: 'CS504', name: 'Database Management Systems (DBMS)', dept: 'CSE', semester: 5, credits: 4, type: 'Theory', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon' },
    { id: 'sub-cs505', code: 'CS505', name: 'Computer Networks & DBMS Lab', dept: 'CSE', semester: 5, credits: 2, type: 'Lab', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer' },
    { id: 'sub-cs506', code: 'CS506', name: 'Research Methodology & Intellectual Property', dept: 'CSE', semester: 5, credits: 3, type: 'Theory', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon' },
    // 6th Semester Subjects
    { id: 'sub-cs601', code: 'CS601', name: 'Distributed Systems', dept: 'CSE', semester: 6, credits: 4, type: 'Theory', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer' },
    { id: 'sub-cs602', code: 'CS602', name: 'Machine Learning Applications', dept: 'CSE', semester: 6, credits: 4, type: 'Theory', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon' },
    { id: 'sub-cs603', code: 'CS603', name: 'Cloud Computing Architecture', dept: 'CSE', semester: 6, credits: 3, type: 'Elective', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer' },
    { id: 'sub-cs604', code: 'CS604', name: 'Compiler Design', dept: 'CSE', semester: 6, credits: 4, type: 'Theory', teacherId: 'usr-hod-01', teacherName: 'Dr. Vikramaditya Sen' },
    { id: 'sub-cs605', code: 'CS605', name: 'Distributed Systems & Cloud Lab', dept: 'CSE', semester: 6, credits: 2, type: 'Lab', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer' },
    { id: 'sub-cs606', code: 'CS606', name: 'Capstone Industry Project - Phase I', dept: 'CSE', semester: 6, credits: 3, type: 'Project', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon' },
    { id: 'sub-ec401', code: 'EC401', name: 'Digital Signal Processing', dept: 'ECE', semester: 4, credits: 4, type: 'Theory', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar' },
    { id: 'sub-ec402', code: 'EC402', name: 'Microcontrollers & Embedded Systems', dept: 'ECE', semester: 4, credits: 4, type: 'Theory', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar' }
  ],

  // 4. Rooms and Laboratories
  rooms: [
    { id: 'rm-tb-201', number: 'TB-201', building: 'Turing Block', floor: '2nd Floor', type: 'Classroom', capacity: 70, status: 'Occupied', currentCourse: 'CS601' },
    { id: 'rm-tb-203', number: 'TB-203', building: 'Turing Block', floor: '2nd Floor', type: 'Classroom', capacity: 65, status: 'Available', currentCourse: null },
    { id: 'rm-tb-204', number: 'TB-204', building: 'Turing Block', floor: '2nd Floor', type: 'Classroom', capacity: 70, status: 'Reserved', currentCourse: null },
    { id: 'rm-cslab-3', number: 'CS-Lab 3', building: 'Turing Block', floor: '3rd Floor', type: 'Laboratory', capacity: 50, status: 'Occupied', currentCourse: 'CS605' },
    { id: 'rm-cslab-1', number: 'CS-Lab 1', building: 'Turing Block', floor: '1st Floor', type: 'Laboratory', capacity: 45, status: 'Available', currentCourse: null },
    { id: 'rm-audi-1', number: 'Turing Audi', building: 'Turing Block', floor: 'Ground Floor', type: 'Auditorium', capacity: 250, status: 'Occupied', currentCourse: 'CS604' },
    { id: 'rm-sem-hall', number: 'Seminar Hall B', building: 'Turing Block', floor: '4th Floor', type: 'Seminar Hall', capacity: 120, status: 'Available', currentCourse: null },
    { id: 'rm-mh-102', number: 'MH-102', building: 'Maxwell Hall', floor: '1st Floor', type: 'Classroom', capacity: 60, status: 'Occupied', currentCourse: 'EC401' },
    { id: 'rm-tb-maint', number: 'TB-105', building: 'Turing Block', floor: '1st Floor', type: 'Classroom', capacity: 55, status: 'Maintenance', currentCourse: null }
  ],

  // 5. Users with Specific Roles
  users: [
    ...(typeof window !== 'undefined' && window.EXCEL_5TH_SEM_STUDENTS ? window.EXCEL_5TH_SEM_STUDENTS : []),
    // --- Students ---
    {
      id: 'usr-std-01',
      role: 'Student',
      email: 'student@college.edu',
      officialEmail: 'aarav.sharma@college.edu',
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      usn: '1NT21CS042',
      rollNo: '21CS042',
      department: 'CSE',
      semester: 6,
      section: 'A',
      cgpa: 9.18,
      overallAttendance: 88.4,
      busRouteNumber: 'Route 04',
      status: 'Active'
    },
    {
      id: 'usr-std-02',
      role: 'Student',
      email: 'priya.patel@college.edu',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      usn: '1NT21CS089',
      rollNo: '21CS089',
      department: 'CSE',
      semester: 6,
      section: 'A',
      cgpa: 7.45,
      overallAttendance: 68.2, // Below 75% warning
      busRouteNumber: 'Route 02',
      status: 'Active'
    },
    {
      id: 'usr-std-03',
      role: 'Student',
      email: 'rohan.verma@college.edu',
      name: 'Rohan Verma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      usn: '1NT22EC015',
      rollNo: '22EC015',
      department: 'ECE',
      semester: 4,
      section: 'B',
      cgpa: 8.52,
      overallAttendance: 84.1,
      busRouteNumber: 'Route 01',
      status: 'Active'
    },
    {
      id: 'usr-std-04',
      role: 'Student',
      email: 'sneha.k@college.edu',
      name: 'Sneha Kulkarni',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      usn: '1NT21CS099',
      rollNo: '21CS099',
      department: 'CSE',
      semester: 6,
      section: 'A',
      cgpa: 9.35,
      overallAttendance: 92.0,
      busRouteNumber: 'Route 04',
      status: 'Active'
    },
    {
      id: 'usr-std-05',
      role: 'Student',
      email: 'kunal.das@college.edu',
      name: 'Kunal Das',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      usn: '1NT21CS019',
      rollNo: '21CS019',
      department: 'CSE',
      semester: 6,
      section: 'A',
      cgpa: 8.70,
      overallAttendance: 86.5,
      busRouteNumber: 'Hostel Resident',
      status: 'Active'
    },
    {
      id: 'usr-std-06',
      role: 'Student',
      email: 'aditya.nair@college.edu',
      name: 'Aditya Nair',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      usn: '1NT21CS005',
      rollNo: '21CS005',
      department: 'CSE',
      semester: 6,
      section: 'B',
      cgpa: 7.12,
      overallAttendance: 64.2, // Critical < 65% shortage
      busRouteNumber: 'Route 05',
      status: 'Active'
    },
    {
      id: 'usr-std-07',
      role: 'Student',
      email: 'kavya.reddy@college.edu',
      name: 'Kavya Reddy',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      usn: '1NT22CS034',
      rollNo: '22CS034',
      department: 'CSE',
      semester: 4,
      section: 'A',
      cgpa: 8.10,
      overallAttendance: 71.8, // Shortage < 75%
      busRouteNumber: 'Route 03',
      status: 'Active'
    },

    // --- Teacher ---
    {
      id: 'usr-tch-01',
      role: 'Teacher',
      email: 'teacher@college.edu',
      officialEmail: 'ananya.iyer@college.edu',
      name: 'Prof. Ananya Iyer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      empId: 'EMP-CSE-108',
      department: 'CSE',
      designation: 'Associate Professor',
      office: 'Turing Block 214',
      assignedSubjects: ['CS601', 'CS603', 'CS605'],
      status: 'Active'
    },
    {
      id: 'usr-tch-02',
      role: 'Teacher',
      email: 'rajesh.kumar@college.edu',
      name: 'Dr. Rajesh Kumar',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      empId: 'EMP-ECE-204',
      department: 'ECE',
      designation: 'Professor',
      office: 'Maxwell Hall 310',
      assignedSubjects: ['EC401', 'EC402'],
      status: 'Active'
    },
    {
      id: 'usr-tch-03',
      role: 'Teacher',
      email: 'divya.menon@college.edu',
      name: 'Prof. Divya Menon',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
      empId: 'EMP-CSE-115',
      department: 'CSE',
      designation: 'Assistant Professor',
      office: 'Turing Block 218',
      assignedSubjects: ['CS602', 'CS606'],
      status: 'Active'
    },

    // --- HOD ---
    {
      id: 'usr-hod-01',
      role: 'HOD',
      email: 'hod@college.edu',
      officialEmail: 'hod.cse@college.edu',
      name: 'Dr. Vikramaditya Sen',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
      empId: 'HOD-CSE-001',
      department: 'CSE',
      designation: 'Head of Department & Senior Professor',
      office: 'Turing Block, Suite 301',
      assignedSubjects: ['CS604'],
      status: 'Active'
    },

    // --- Admin ---
    {
      id: 'usr-adm-01',
      role: 'Admin',
      email: 'admin@college.edu',
      officialEmail: 'registrar@college.edu',
      name: 'Dr. Robert Hawthorne',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      empId: 'ADM-REG-001',
      department: 'Central Administration',
      designation: 'Dean of Academic Affairs & Registrar',
      office: 'Senate House, Executive Suite 101',
      status: 'Active'
    }
  ],

  // 6. Master Official Timetable
  timetable: [
    // 5th Semester CSE Section A (68 students - Maharaja Institute of Technology Thandavapura)
    { id: 'tt-5a-01', day: 'Monday', timeSlot: '09:00 - 10:00', subjectCode: 'CS501', subjectName: 'Software Engineering & Agile Methodology', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-02', day: 'Monday', timeSlot: '10:00 - 11:00', subjectCode: 'CS502', subjectName: 'Computer Networks & Internet Protocols', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-03', day: 'Monday', timeSlot: '11:15 - 12:15', subjectCode: 'CS504', subjectName: 'Database Management Systems (DBMS)', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-04', day: 'Monday', timeSlot: '13:30 - 16:30', subjectCode: 'CS505', subjectName: 'Computer Networks & DBMS Lab', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'CS-Lab 1', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-05', day: 'Tuesday', timeSlot: '09:00 - 10:00', subjectCode: 'CS503', subjectName: 'Theory of Computation & Automata', teacherId: 'usr-hod-01', teacherName: 'Dr. Vikramaditya Sen', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-06', day: 'Tuesday', timeSlot: '10:00 - 11:00', subjectCode: 'CS501', subjectName: 'Software Engineering & Agile Methodology', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-07', day: 'Wednesday', timeSlot: '09:00 - 10:00', subjectCode: 'CS502', subjectName: 'Computer Networks & Internet Protocols', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-08', day: 'Wednesday', timeSlot: '10:00 - 11:00', subjectCode: 'CS504', subjectName: 'Database Management Systems (DBMS)', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-09', day: 'Thursday', timeSlot: '09:00 - 10:00', subjectCode: 'CS503', subjectName: 'Theory of Computation & Automata', teacherId: 'usr-hod-01', teacherName: 'Dr. Vikramaditya Sen', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-10', day: 'Thursday', timeSlot: '10:00 - 11:00', subjectCode: 'CS506', subjectName: 'Research Methodology & Intellectual Property', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-11', day: 'Friday', timeSlot: '09:00 - 10:00', subjectCode: 'CS501', subjectName: 'Software Engineering & Agile Methodology', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },
    { id: 'tt-5a-12', day: 'Friday', timeSlot: '10:00 - 11:00', subjectCode: 'CS502', subjectName: 'Computer Networks & Internet Protocols', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar', room: 'TB-201', dept: 'CSE', semester: 5, section: 'A', status: 'Regular' },

    // 5th Semester CSE Section B (67 students - Maharaja Institute of Technology Thandavapura)
    { id: 'tt-5b-01', day: 'Monday', timeSlot: '09:00 - 10:00', subjectCode: 'CS502', subjectName: 'Computer Networks & Internet Protocols', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-02', day: 'Monday', timeSlot: '10:00 - 11:00', subjectCode: 'CS501', subjectName: 'Software Engineering & Agile Methodology', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-03', day: 'Monday', timeSlot: '11:15 - 12:15', subjectCode: 'CS503', subjectName: 'Theory of Computation & Automata', teacherId: 'usr-hod-01', teacherName: 'Dr. Vikramaditya Sen', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-04', day: 'Monday', timeSlot: '13:30 - 16:30', subjectCode: 'CS505', subjectName: 'Computer Networks & DBMS Lab', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'CS-Lab 3', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-05', day: 'Tuesday', timeSlot: '09:00 - 10:00', subjectCode: 'CS504', subjectName: 'Database Management Systems (DBMS)', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-06', day: 'Tuesday', timeSlot: '10:00 - 11:00', subjectCode: 'CS502', subjectName: 'Computer Networks & Internet Protocols', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-07', day: 'Wednesday', timeSlot: '09:00 - 10:00', subjectCode: 'CS501', subjectName: 'Software Engineering & Agile Methodology', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-08', day: 'Wednesday', timeSlot: '10:00 - 11:00', subjectCode: 'CS503', subjectName: 'Theory of Computation & Automata', teacherId: 'usr-hod-01', teacherName: 'Dr. Vikramaditya Sen', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-09', day: 'Thursday', timeSlot: '09:00 - 10:00', subjectCode: 'CS504', subjectName: 'Database Management Systems (DBMS)', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-10', day: 'Thursday', timeSlot: '10:00 - 11:00', subjectCode: 'CS506', subjectName: 'Research Methodology & Intellectual Property', teacherId: 'usr-tch-03', teacherName: 'Prof. Divya Menon', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-11', day: 'Friday', timeSlot: '09:00 - 10:00', subjectCode: 'CS502', subjectName: 'Computer Networks & Internet Protocols', teacherId: 'usr-tch-02', teacherName: 'Dr. Rajesh Kumar', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    { id: 'tt-5b-12', day: 'Friday', timeSlot: '10:00 - 11:00', subjectCode: 'CS501', subjectName: 'Software Engineering & Agile Methodology', teacherId: 'usr-tch-01', teacherName: 'Prof. Ananya Iyer', room: 'TB-203', dept: 'CSE', semester: 5, section: 'B', status: 'Regular' },
    {
      id: 'tt-01',
      day: 'Monday',
      timeSlot: '09:00 - 10:00',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'TB-201',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-02',
      day: 'Monday',
      timeSlot: '10:00 - 11:00',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning Applications',
      teacherId: 'usr-tch-03',
      teacherName: 'Prof. Divya Menon',
      room: 'TB-203',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-03',
      day: 'Monday',
      timeSlot: '11:15 - 12:15',
      subjectCode: 'CS604',
      subjectName: 'Compiler Design',
      teacherId: 'usr-hod-01',
      teacherName: 'Dr. Vikramaditya Sen',
      room: 'Turing Audi',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-04',
      day: 'Monday',
      timeSlot: '13:30 - 16:30',
      subjectCode: 'CS605',
      subjectName: 'Distributed Systems & Cloud Lab',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'CS-Lab 3',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-05',
      day: 'Tuesday',
      timeSlot: '09:00 - 10:00',
      subjectCode: 'CS603',
      subjectName: 'Cloud Computing Architecture',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'TB-201',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-06',
      day: 'Tuesday',
      timeSlot: '10:00 - 11:00',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'TB-201',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-07',
      day: 'Tuesday',
      timeSlot: '11:15 - 12:15',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning',
      teacherId: 'usr-tch-03',
      teacherName: 'Prof. Divya Menon',
      room: 'TB-203',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-08',
      day: 'Wednesday',
      timeSlot: '09:00 - 10:00',
      subjectCode: 'CS604',
      subjectName: 'Compiler Design',
      teacherId: 'usr-hod-01',
      teacherName: 'Dr. Vikramaditya Sen',
      room: 'Turing Audi',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-09',
      day: 'Wednesday',
      timeSlot: '10:00 - 11:00',
      subjectCode: 'CS603',
      subjectName: 'Cloud Computing',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'TB-201',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-10',
      day: 'Thursday',
      timeSlot: '09:00 - 10:00',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning Applications',
      teacherId: 'usr-tch-03',
      teacherName: 'Prof. Divya Menon',
      room: 'TB-203',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    },
    {
      id: 'tt-11',
      day: 'Friday',
      timeSlot: '09:00 - 10:00',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'TB-201',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Regular'
    }
  ],

  // 7. Dynamic Timetable Changes (Requirement 20 & 21)
  dynamicTimetableChanges: [
    {
      id: 'dtc-01',
      timetableEntryId: 'tt-01',
      date: '2026-09-24',
      changeType: 'Room Change',
      subjectCode: 'CS601',
      oldValue: 'Room TB-201',
      newValue: 'Lab 3 (Turing Block 3rd Floor)',
      reason: 'Interactive hands-on distributed RPC benchmarking demonstration',
      changedBy: 'Prof. Ananya Iyer',
      approvedBy: 'Dr. Vikramaditya Sen (HOD)',
      status: 'Approved',
      notified: true,
      timestamp: '2026-09-24 08:30'
    },
    {
      id: 'dtc-02',
      timetableEntryId: 'tt-02',
      date: '2026-09-25',
      changeType: 'Substitute Teacher',
      subjectCode: 'CS602',
      oldValue: 'Prof. Divya Menon',
      newValue: 'Dr. Vikramaditya Sen (Substitute)',
      reason: 'Prof. Menon attending IEEE AI Symposium keynote',
      changedBy: 'Dr. Vikramaditya Sen',
      approvedBy: 'Dr. Vikramaditya Sen (HOD)',
      status: 'Approved',
      notified: true,
      timestamp: '2026-09-23 16:45'
    }
  ],

  // 8. Session Engine (Requirement 26 & 27)
  sessions: [
    {
      sessionId: 'SES-2026-0924-CS601-001',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'TB-201',
      date: '2026-09-24',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Completed', // 'Scheduled' | 'Open' | 'Attendance Active' | 'Completed' | 'Cancelled'
      topicCovered: 'Consensus Protocols: Paxos and Raft State Machine Replication',
      attendanceCount: 42,
      totalEnrolled: 45
    },
    {
      sessionId: 'SES-2026-0924-CS602-002',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning Applications',
      teacherId: 'usr-tch-03',
      teacherName: 'Prof. Divya Menon',
      room: 'TB-203',
      date: '2026-09-24',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Attendance Active', // Current active session
      topicCovered: 'Gradient Descent Optimization & Cross-Entropy Loss',
      attendanceCount: 39,
      totalEnrolled: 45
    },
    {
      sessionId: 'SES-2026-0924-CS605-003',
      subjectCode: 'CS605',
      subjectName: 'Distributed Systems Lab',
      teacherId: 'usr-tch-01',
      teacherName: 'Prof. Ananya Iyer',
      room: 'CS-Lab 3',
      date: '2026-09-24',
      startTime: '01:30 PM',
      endTime: '04:30 PM',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      status: 'Scheduled',
      topicCovered: 'gRPC Cluster Communication with Protobuf Serialization',
      attendanceCount: 0,
      totalEnrolled: 45
    }
  ],

  // 9. Session-Based Attendance Records (Requirement 28 - 34)
  attendanceRecords: [
    {
      id: 'att-rec-01',
      sessionId: 'SES-2026-0924-CS601-001',
      studentId: 'usr-std-01', // Aarav Sharma
      studentName: 'Aarav Sharma',
      rollNo: '21CS042',
      subjectCode: 'CS601',
      date: '2026-09-24',
      status: 'Present',
      timestamp: '2026-09-24 09:04:12',
      locationVerified: true,
      deviceVerified: true,
      biometricStatus: 'Available'
    },
    {
      id: 'att-rec-02',
      sessionId: 'SES-2026-0924-CS601-001',
      studentId: 'usr-std-02', // Priya Patel
      studentName: 'Priya Patel',
      rollNo: '21CS089',
      subjectCode: 'CS601',
      date: '2026-09-24',
      status: 'Absent',
      timestamp: null,
      locationVerified: false,
      deviceVerified: false,
      biometricStatus: 'Not Available'
    },
    {
      id: 'att-rec-03',
      sessionId: 'SES-2026-0924-CS601-001',
      studentId: 'usr-std-04',
      studentName: 'Sneha Kulkarni',
      rollNo: '21CS099',
      subjectCode: 'CS601',
      date: '2026-09-24',
      status: 'Present',
      timestamp: '2026-09-24 09:02:44',
      locationVerified: true,
      deviceVerified: true,
      biometricStatus: 'Available'
    }
  ],

  // 10. Student Subject-Wise Summary Attendance (Aarav Sharma)
  studentSubjectAttendance: {
    'usr-std-01': [
      { subjectCode: 'CS601', subjectName: 'Distributed Systems', attended: 32, total: 36, percentage: 88.9, faculty: 'Prof. Ananya Iyer' },
      { subjectCode: 'CS602', subjectName: 'Machine Learning Applications', attended: 34, total: 38, percentage: 89.5, faculty: 'Prof. Divya Menon' },
      { subjectCode: 'CS603', subjectName: 'Cloud Computing Architecture', attended: 26, total: 30, percentage: 86.7, faculty: 'Prof. Ananya Iyer' },
      { subjectCode: 'CS604', subjectName: 'Compiler Design', attended: 31, total: 35, percentage: 88.6, faculty: 'Dr. Vikramaditya Sen' },
      { subjectCode: 'CS605', subjectName: 'Distributed Systems Lab', attended: 15, total: 16, percentage: 93.8, faculty: 'Prof. Ananya Iyer' }
    ],
    'usr-std-02': [
      { subjectCode: 'CS601', subjectName: 'Distributed Systems', attended: 24, total: 36, percentage: 66.7, faculty: 'Prof. Ananya Iyer' },
      { subjectCode: 'CS602', subjectName: 'Machine Learning Applications', attended: 26, total: 38, percentage: 68.4, faculty: 'Prof. Divya Menon' },
      { subjectCode: 'CS603', subjectName: 'Cloud Computing Architecture', attended: 20, total: 30, percentage: 66.7, faculty: 'Prof. Ananya Iyer' },
      { subjectCode: 'CS604', subjectName: 'Compiler Design', attended: 25, total: 35, percentage: 71.4, faculty: 'Dr. Vikramaditya Sen' },
      { subjectCode: 'CS605', subjectName: 'Distributed Systems Lab', attended: 11, total: 16, percentage: 68.8, faculty: 'Prof. Ananya Iyer' }
    ]
  },

  // 11. Examinations & Seating Arrangement (Requirements 35 - 37)
  exams: [
    {
      id: 'ex-01',
      type: 'Internal Assessment 2',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      date: '2026-10-12',
      day: 'Monday',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      room: 'TB-201',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      maxMarks: 30
    },
    {
      id: 'ex-02',
      type: 'Internal Assessment 2',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning',
      date: '2026-10-14',
      day: 'Wednesday',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      room: 'TB-203',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      maxMarks: 30
    },
    {
      id: 'ex-03',
      type: 'Semester Final Theory Exam',
      subjectCode: 'CS604',
      subjectName: 'Compiler Design',
      date: '2026-11-20',
      day: 'Friday',
      startTime: '09:30 AM',
      endTime: '12:30 PM',
      room: 'Turing Audi',
      dept: 'CSE',
      semester: 6,
      section: 'A',
      maxMarks: 100
    }
  ],

  // Seating Arrangement (Requirement 37)
  seatingArrangements: [
    { studentId: 'usr-std-01', studentName: 'Aarav Sharma', rollNo: '21CS042', examId: 'ex-01', room: 'TB-201', deskNumber: 'Row 3 - Desk 12', invigilator: 'Prof. Divya Menon' },
    { studentId: 'usr-std-02', studentName: 'Priya Patel', rollNo: '21CS089', examId: 'ex-01', room: 'TB-201', deskNumber: 'Row 3 - Desk 14', invigilator: 'Prof. Divya Menon' },
    { studentId: 'usr-std-04', studentName: 'Sneha Kulkarni', rollNo: '21CS099', examId: 'ex-01', room: 'TB-201', deskNumber: 'Row 4 - Desk 02', invigilator: 'Prof. Divya Menon' },
    { studentId: 'usr-std-05', studentName: 'Kunal Das', rollNo: '21CS019', examId: 'ex-01', room: 'TB-201', deskNumber: 'Row 1 - Desk 05', invigilator: 'Prof. Divya Menon' }
  ],

  // 12. Internal Marks (Requirements 38 - 42)
  // IA1 (20) + IA2 (20) + Assignment (10) + Quiz (10) = 60 scaled or 100 total
  internalMarks: {
    'usr-std-01': [
      { subjectCode: 'CS601', subjectName: 'Distributed Systems', ia1: 19, ia2: 18, assignment: 10, quiz: 9, total: 56, maxTotal: 60, status: 'FINALIZED', grade: 'O', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' },
      { subjectCode: 'CS602', subjectName: 'Machine Learning', ia1: 18, ia2: 19, assignment: 9, quiz: 10, total: 56, maxTotal: 60, status: 'FINALIZED', grade: 'O', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' },
      { subjectCode: 'CS603', subjectName: 'Cloud Computing', ia1: 17, ia2: 17, assignment: 9, quiz: 8, total: 51, maxTotal: 60, status: 'Submitted for Approval', grade: 'A+', verifiedBy: 'Pending HOD' },
      { subjectCode: 'CS604', subjectName: 'Compiler Design', ia1: 19, ia2: 18, assignment: 10, quiz: 9, total: 56, maxTotal: 60, status: 'FINALIZED', grade: 'O', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' },
      { subjectCode: 'CS605', subjectName: 'Distributed Systems Lab', ia1: 20, ia2: 19, assignment: 10, quiz: 10, total: 59, maxTotal: 60, status: 'FINALIZED', grade: 'O', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' }
    ],
    'usr-std-02': [
      { subjectCode: 'CS601', subjectName: 'Distributed Systems', ia1: 13, ia2: 12, assignment: 7, quiz: 6, total: 38, maxTotal: 60, status: 'FINALIZED', grade: 'B', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' },
      { subjectCode: 'CS602', subjectName: 'Machine Learning', ia1: 14, ia2: 15, assignment: 8, quiz: 7, total: 44, maxTotal: 60, status: 'FINALIZED', grade: 'B+', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' },
      { subjectCode: 'CS603', subjectName: 'Cloud Computing', ia1: 12, ia2: 13, assignment: 6, quiz: 6, total: 37, maxTotal: 60, status: 'Submitted for Approval', grade: 'B', verifiedBy: 'Pending HOD' },
      { subjectCode: 'CS604', subjectName: 'Compiler Design', ia1: 14, ia2: 12, assignment: 7, quiz: 7, total: 40, maxTotal: 60, status: 'FINALIZED', grade: 'B+', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' },
      { subjectCode: 'CS605', subjectName: 'Distributed Systems Lab', ia1: 15, ia2: 16, assignment: 8, quiz: 8, total: 47, maxTotal: 60, status: 'FINALIZED', grade: 'A', verifiedBy: 'Dr. Vikramaditya Sen (HOD)' }
    ]
  },

  // Mark Modification Audit History (Requirement 41)
  markAuditHistory: [
    { id: 'mah-01', subjectCode: 'CS601', studentRoll: '21CS042', assessment: 'IA1', oldScore: 17, newScore: 19, reason: 'Re-evaluation of Question 3b consensus proof', changedBy: 'Prof. Ananya Iyer', date: '2026-09-15 14:22' },
    { id: 'mah-02', subjectCode: 'CS602', studentRoll: '21CS089', assessment: 'Quiz', oldScore: 5, newScore: 7, reason: 'Late online test submission credit approved by mentor', changedBy: 'Prof. Divya Menon', date: '2026-09-18 11:05' }
  ],

  // 13. Assignments & Submissions (Requirements 43 & 44)
  assignments: [
    {
      id: 'asg-01',
      title: 'Implementation of Three-Node Raft Consensus State Machine',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      semester: 6,
      section: 'A',
      deadline: '2026-10-05',
      attachment: 'raft_assignment_spec_v1.pdf',
      description: 'Implement leader election, term numbering, heartbeat ticker, and log replication in Python/Go.',
      createdBy: 'Prof. Ananya Iyer',
      maxMarks: 10,
      totalSubmissions: 42,
      totalStudents: 45
    },
    {
      id: 'asg-02',
      title: 'Fine-Tuning Transformer for Technical Support Intent Classification',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning Applications',
      semester: 6,
      section: 'A',
      deadline: '2026-10-18',
      attachment: 'transformer_nlp_lab.pdf',
      description: 'HuggingFace BERT model training with cross-validation, confusion matrix, and inference benchmark.',
      createdBy: 'Prof. Divya Menon',
      maxMarks: 10,
      totalSubmissions: 35,
      totalStudents: 45
    },
    {
      id: 'asg-03',
      title: 'Terraform & Kubernetes Blue-Green Deployment Architecture',
      subjectCode: 'CS603',
      subjectName: 'Cloud Computing Architecture',
      semester: 6,
      section: 'A',
      deadline: '2026-10-25',
      attachment: 'k8s_bluegreen_instructions.pdf',
      description: 'Configure multi-tier microservice Helm chart with zero-downtime traffic switching.',
      createdBy: 'Prof. Ananya Iyer',
      maxMarks: 10,
      totalSubmissions: 18,
      totalStudents: 45
    }
  ],

  // Student Submissions
  submissions: {
    'usr-std-01': [
      {
        assignmentId: 'asg-01',
        title: 'Implementation of Three-Node Raft Consensus State Machine',
        submittedAt: '2026-10-02 21:14',
        fileName: 'raft_cluster_aarav_21cs042.zip',
        status: 'Reviewed',
        scoreObtained: 10,
        maxMarks: 10,
        teacherFeedback: 'Outstanding implementation! Test suite covers partitioned network rejoin edge cases cleanly.'
      },
      {
        assignmentId: 'asg-02',
        title: 'Fine-Tuning Transformer for Technical Support Intent Classification',
        submittedAt: '2026-10-14 17:30',
        fileName: 'bert_intent_classifier_aarav.ipynb',
        status: 'Submitted',
        scoreObtained: null,
        maxMarks: 10,
        teacherFeedback: 'Submission received. Awaiting faculty evaluation.'
      }
    ]
  },

  // 14. Study Materials (Hierarchy: Dept -> Sem -> Subject -> Unit -> Material) (Requirements 45 & 46)
  materials: [
    {
      id: 'mat-01',
      subjectCode: 'CS601',
      unit: 'Unit 1: Fundamentals & RPC',
      title: 'RPC Architecture, Serialization & Idempotency Paradigms',
      type: 'PDF Notes',
      fileName: 'Unit1_RPC_Protobuf_LectureNotes.pdf',
      fileSize: '4.2 MB',
      uploadedBy: 'Prof. Ananya Iyer',
      uploadedDate: '2026-08-15',
      importantQuestionsAttached: true
    },
    {
      id: 'mat-02',
      subjectCode: 'CS601',
      unit: 'Unit 2: Distributed Consensus',
      title: 'Paxos & Raft State Machine Replication Guide',
      type: 'Presentation Slides',
      fileName: 'Unit2_Raft_Consensus_DeepDive.pptx',
      fileSize: '12.8 MB',
      uploadedBy: 'Prof. Ananya Iyer',
      uploadedDate: '2026-09-02',
      importantQuestionsAttached: true
    },
    {
      id: 'mat-03',
      subjectCode: 'CS602',
      unit: 'Unit 3: Deep Neural Networks',
      title: 'Backpropagation Calculus & Loss Surfaces',
      type: 'Important Questions',
      fileName: 'Unit3_ML_QuestionBank_WithSolutions.pdf',
      fileSize: '2.8 MB',
      uploadedBy: 'Prof. Divya Menon',
      uploadedDate: '2026-09-10',
      importantQuestionsAttached: true
    },
    {
      id: 'mat-04',
      subjectCode: 'CS604',
      unit: 'Unit 2: Syntax Analysis',
      title: 'LR(1) & LALR Parser Construction Algorithm Handouts',
      type: 'PDF Notes',
      fileName: 'Compiler_LR_Parsing_Tables.pdf',
      fileSize: '5.1 MB',
      uploadedBy: 'Dr. Vikramaditya Sen',
      uploadedDate: '2026-09-08',
      importantQuestionsAttached: false
    }
  ],

  // 15. "What I Missed" (Requirement 47)
  whatIMissedRecords: [
    {
      id: 'wim-01',
      studentId: 'usr-std-01',
      date: '2026-09-22',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning Applications',
      teacher: 'Prof. Divya Menon',
      room: 'TB-203',
      topicCovered: 'Transformer Attention Mechanism & Multi-Head Projections',
      homework: 'Derive scaled dot-product attention gradient for Exercise 4',
      attachedMaterials: ['Transformer_Attention_Handout.pdf'],
      announcements: 'Midterm 2 test dates pushed by 2 days.',
      nextClassPreview: 'Cross-Attention & Encoder-Decoder decoders on Thursday 9 AM.'
    },
    {
      id: 'wim-02',
      studentId: 'usr-std-01',
      date: '2026-09-18',
      subjectCode: 'CS604',
      subjectName: 'Compiler Design',
      teacher: 'Dr. Vikramaditya Sen',
      room: 'Turing Audi',
      topicCovered: 'Intermediate Representation: Three-Address Code (TAC) and Quadruples',
      homework: 'Convert boolean control flow into short-circuit TAC',
      attachedMaterials: ['TAC_Quadruples_Guide.pdf'],
      announcements: 'Assignment 2 deadline is strict.',
      nextClassPreview: 'Basic Blocks and Flow Graph Construction on Monday 11:15 AM.'
    }
  ],

  // 16. "Class Memory" (Chronological Lecture Ledger) (Requirement 48)
  classMemory: [
    {
      id: 'cm-01',
      date: '24 September 2026',
      timeSlot: '09:00 - 10:00',
      subjectCode: 'CS601',
      subjectName: 'Distributed Systems',
      room: 'TB-201',
      teacher: 'Prof. Ananya Iyer',
      topicsCovered: ['Raft Leader Election', 'Log Inconsistency Repair', 'Split-Brain Prevention'],
      homework: 'Complete code exercise on GitHub Classroom for heartbeat ticker',
      keyTakeaways: 'A candidate must obtain majorities (N/2 + 1) to become leader.'
    },
    {
      id: 'cm-02',
      date: '24 September 2026',
      timeSlot: '10:00 - 11:00',
      subjectCode: 'CS602',
      subjectName: 'Machine Learning',
      room: 'TB-203',
      teacher: 'Prof. Divya Menon',
      topicsCovered: ['Stochastic Gradient Descent', 'Adam Optimizer Momentum', 'Learning Rate Warmup'],
      homework: 'Tune learning rate on FashionMNIST notebook',
      keyTakeaways: 'Adam maintains exponential moving averages of both past gradients and squared gradients.'
    },
    {
      id: 'cm-03',
      date: '23 September 2026',
      timeSlot: '11:15 - 12:15',
      subjectCode: 'CS604',
      subjectName: 'Compiler Design',
      room: 'Turing Audi',
      teacher: 'Dr. Vikramaditya Sen',
      topicsCovered: ['LALR(1) Parsing Table Compression', 'Shift-Reduce Conflicts', 'Dangling Else Precedence'],
      homework: 'Solve textbook chapter 4 exercises 4.12 to 4.16',
      keyTakeaways: 'LALR combines states with identical cores to shrink table size significantly.'
    }
  ],

  // 17. College Bus Information (Requirements 57 - 60)
  busRoutes: [
    {
      busNumber: 'Bus 04',
      routeNumber: 'Route 04',
      routeName: 'North Ring & Metro Corridor',
      driverName: 'Suresh Gowda',
      driverPhone: '+91 98450 12345',
      capacity: 52,
      morningDeparture: '07:30 AM',
      eveningDeparture: '04:45 PM',
      scheduleType: 'Weekday (Regular)',
      stops: [
        { name: 'City Center Mall', timeMorning: '07:30 AM', timeEvening: '05:35 PM' },
        { name: 'Hennur Cross Metro', timeMorning: '07:45 AM', timeEvening: '05:20 PM' },
        { name: 'Kalyan Nagar Ring Road', timeMorning: '08:00 AM', timeEvening: '05:05 PM' },
        { name: 'College Main Campus Gate', timeMorning: '08:25 AM', timeEvening: '04:45 PM' }
      ],
      activeAlert: 'Minor 10-minute traffic delay near Ring Road junction due to flyover repair.'
    },
    {
      busNumber: 'Bus 02',
      routeNumber: 'Route 02',
      routeName: 'South Suburb & Tech Park Expressway',
      driverName: 'Ramesh Reddy',
      driverPhone: '+91 98450 67890',
      capacity: 52,
      morningDeparture: '07:15 AM',
      eveningDeparture: '04:45 PM',
      scheduleType: 'Weekday (Regular)',
      stops: [
        { name: 'Silk Board Junction', timeMorning: '07:15 AM', timeEvening: '05:50 PM' },
        { name: 'Koramangala BDA Complex', timeMorning: '07:35 AM', timeEvening: '05:30 PM' },
        { name: 'Indiranagar 100ft Road', timeMorning: '07:50 AM', timeEvening: '05:15 PM' },
        { name: 'College Main Campus Gate', timeMorning: '08:30 AM', timeEvening: '04:45 PM' }
      ],
      activeAlert: null
    },
    {
      busNumber: 'Bus 01',
      routeNumber: 'Route 01',
      routeName: 'West Suburbs & Rajajinagar',
      driverName: 'Manjunath K.',
      driverPhone: '+91 98450 99887',
      capacity: 48,
      morningDeparture: '07:20 AM',
      eveningDeparture: '04:45 PM',
      scheduleType: 'Weekday (Regular)',
      stops: [
        { name: 'Yeshwantpur Railway Station', timeMorning: '07:20 AM', timeEvening: '05:40 PM' },
        { name: 'Malleshwaram 8th Cross', timeMorning: '07:40 AM', timeEvening: '05:20 PM' },
        { name: 'Hebbal Flyover Junction', timeMorning: '08:05 AM', timeEvening: '05:00 PM' },
        { name: 'College Main Campus Gate', timeMorning: '08:25 AM', timeEvening: '04:45 PM' }
      ],
      activeAlert: null
    },
    {
      busNumber: 'Bus 07 (Special)',
      routeNumber: 'Route 07',
      routeName: 'Hostel Shuttle & Weekend Library Circuit',
      driverName: 'Anil Patil',
      driverPhone: '+91 98450 33445',
      capacity: 35,
      morningDeparture: '09:00 AM',
      eveningDeparture: '07:00 PM',
      scheduleType: 'Weekend & Holiday Service',
      stops: [
        { name: 'Hostel Block 1 & 2', timeMorning: '09:00 AM', timeEvening: '07:15 PM' },
        { name: 'Hostel Block 3 & 4', timeMorning: '09:10 AM', timeEvening: '07:05 PM' },
        { name: 'Central Library & Sports Complex', timeMorning: '09:20 AM', timeEvening: '07:00 PM' }
      ],
      activeAlert: 'Special weekend timetable active on Saturdays and Sundays.'
    }
  ],

  // 18. Notices & Circulars (Requirements 50 & 51)
  notices: [
    {
      id: 'not-01',
      title: 'End-Semester Theory & Practical Examination Schedule (May 2026)',
      description: 'The controller of examinations has officially released the schedule for Even Semesters 2, 4, 6 and 8. Hall tickets will be issued only to candidates having 75% or greater attendance.',
      category: 'Exam',
      priority: 'Urgent',
      publishedBy: 'Controller of Examinations',
      date: '2026-09-22',
      attachment: 'Official_Exam_Timetable_May2026.pdf',
      dept: 'All'
    },
    {
      id: 'not-02',
      title: 'CSE Department Smart India Hackathon & CodeFest 2026',
      description: 'All 3rd and 4th year CSE students are invited to register teams for the internal qualifying round in Turing Auditorium on October 8.',
      category: 'Department',
      priority: 'Important',
      publishedBy: 'Dr. Vikramaditya Sen (HOD)',
      date: '2026-09-20',
      attachment: 'Hackathon_Rules_Guide.pdf',
      dept: 'CSE'
    },
    {
      id: 'not-03',
      title: 'Classroom TB-201 Audiovisual Upgrade & Temporary Room Shift Notice',
      description: 'On Thursday afternoon, TB-201 projector replacement will take place. Classes will shift to Seminar Hall B.',
      category: 'Timetable',
      priority: 'Normal',
      publishedBy: 'Academic Facilities Section',
      date: '2026-09-23',
      attachment: null,
      dept: 'CSE'
    }
  ],

  // 19. Smart Notifications (Requirement 52 & 53)
  notifications: [
    {
      id: 'notif-01',
      type: 'Timetable Change',
      title: 'Room Change Alert: CS601 Distributed Systems',
      message: 'CS601 lecture has moved from TB-201 to Lab 3 for hands-on Paxos demonstration.',
      timestamp: '2026-09-24 08:32',
      read: false,
      role: 'Student'
    },
    {
      id: 'notif-02',
      type: 'Marks Update',
      title: 'Internal Assessment 1 Marks Finalized',
      message: 'Official scores for CS601 and CS604 have been reviewed and approved by HOD.',
      timestamp: '2026-09-23 15:10',
      read: false,
      role: 'Student'
    },
    {
      id: 'notif-03',
      type: 'Bus Alert',
      title: 'Route 04 Schedule Advisory',
      message: 'Bus 04 morning departure will be delayed by 10 minutes due to city road maintenance.',
      timestamp: '2026-09-24 07:15',
      read: true,
      role: 'Student'
    },
    {
      id: 'notif-04',
      type: 'Session Alert',
      title: 'Live Session Started: CS602 ML',
      message: 'Prof. Divya Menon has opened attendance window for Session SES-2026-0924-CS602-002.',
      timestamp: '2026-09-24 10:01',
      read: false,
      role: 'Student'
    }
  ],

  // 20. Events (Requirement 54)
  events: [
    {
      id: 'ev-01',
      title: 'International Conference on Distributed Cloud & AI Systems (ICDCAS 2026)',
      description: 'Keynote speakers from Google DeepMind, MIT, and IISc discussing frontier large-scale neural architectures.',
      date: '2026-10-28',
      time: '09:00 AM - 05:00 PM',
      venue: 'Main University Auditorium & Turing Complex',
      organizer: 'Dept of Computer Science & Engineering',
      category: 'Academic Conference',
      attachment: 'ICDCAS_Brochure_CallForPapers.pdf'
    },
    {
      id: 'ev-02',
      title: 'Annual Inter-Collegiate Cultural Festival "AURA 2026"',
      description: 'Music, theater, digital art, dance, and university battle of the bands.',
      date: '2026-11-05',
      time: '10:00 AM - 09:30 PM',
      venue: 'Campus Open Air Amphitheatre',
      organizer: 'Student Cultural Committee',
      category: 'Cultural'
    }
  ],

  // 21. Helpdesk Tickets (Requirement 55)
  helpdeskTickets: [
    {
      id: 'TICK-9081',
      studentId: 'usr-std-01',
      studentName: 'Aarav Sharma',
      subject: 'Correction of Internal Assessment Test 1 score entry',
      description: 'My IA1 re-evaluation marks in CS601 were approved for 19 but portal was showing 17.',
      category: 'Marks',
      createdDate: '2026-09-14',
      status: 'Resolved',
      assignedTo: 'Prof. Ananya Iyer',
      response: 'Score updated to 19 after verifying Question 3b answer sheet. HOD approval confirmed.'
    },
    {
      id: 'TICK-9082',
      studentId: 'usr-std-01',
      studentName: 'Aarav Sharma',
      subject: 'Smart India Hackathon On-Duty attendance credit confirmation',
      description: 'Submitted attendance exemption letter for 4 days grand finale attendance.',
      category: 'Attendance',
      createdDate: '2026-09-20',
      status: 'In Progress',
      assignedTo: 'Dr. Vikramaditya Sen (HOD)',
      response: 'Under departmental review with verification of event certificate.'
    }
  ],

  // 22. Student Feedback (Requirement 56)
  feedbackSubmissions: [
    {
      id: 'fb-01',
      studentId: 'usr-std-01',
      category: 'Faculty Instruction',
      target: 'Prof. Ananya Iyer (CS601 Distributed Systems)',
      rating: 5,
      comments: 'Hands-on live lab demonstrations on Raft and gRPC make complex consensus protocols easy to grasp.',
      date: '2026-09-15',
      anonymous: true
    },
    {
      id: 'fb-02',
      studentId: 'usr-std-01',
      category: 'Facilities & Labs',
      target: 'CS-Lab 3 High-Performance Cluster',
      rating: 4,
      comments: 'Workstations perform great, but two monitors on row 4 need HDMI cable replacement.',
      date: '2026-09-18',
      anonymous: true
    }
  ],

  // 23. Academic Records (Semesters 1 - 6) (Requirement 61)
  academicRecords: {
    'usr-std-01': [
      { semester: 1, term: 'Fall 2021', sgpa: 8.95, credits: 22, attendancePct: 91.2, status: 'First Class with Distinction', passed: true },
      { semester: 2, term: 'Spring 2022', sgpa: 9.10, credits: 24, attendancePct: 90.5, status: 'First Class with Distinction', passed: true },
      { semester: 3, term: 'Fall 2022', sgpa: 9.25, credits: 23, attendancePct: 88.0, status: 'First Class with Distinction', passed: true },
      { semester: 4, term: 'Spring 2023', sgpa: 9.30, credits: 24, attendancePct: 89.4, status: 'First Class with Distinction', passed: true },
      { semester: 5, term: 'Fall 2023', sgpa: 9.15, credits: 22, attendancePct: 87.5, status: 'First Class with Distinction', passed: true },
      { semester: 6, term: 'Spring 2024 (Current)', sgpa: 9.24, credits: 21, attendancePct: 88.4, status: 'Pursuing (In Flight)', passed: null }
    ]
  },

  // 24. Audit History (Requirement 70)
  auditLogs: [
    { id: 'aud-001', user: 'Prof. Ananya Iyer', role: 'Teacher', action: 'START_SESSION', module: 'Session Engine', dateTime: '2026-09-24 09:00:15', oldValue: 'Status: Scheduled', newValue: 'Status: Attendance Active (SES-2026-0924-CS601-001)', reason: 'Commenced scheduled morning lecture' },
    { id: 'aud-002', user: 'Prof. Ananya Iyer', role: 'Teacher', action: 'SAVE_ATTENDANCE', module: 'Attendance', dateTime: '2026-09-24 09:12:44', oldValue: '0 recorded', newValue: '42 Present, 3 Absent', reason: 'Official daily register submission' },
    { id: 'aud-003', user: 'Dr. Vikramaditya Sen', role: 'HOD', action: 'APPROVE_TIMETABLE_CHANGE', module: 'Timetable', dateTime: '2026-09-24 08:31:02', oldValue: 'Room TB-201', newValue: 'Room Lab 3', reason: 'Approved laboratory benchmark session' },
    { id: 'aud-004', user: 'Dr. Vikramaditya Sen', role: 'HOD', action: 'FINALIZE_MARKS', module: 'Internal Marks', dateTime: '2026-09-23 15:00:20', oldValue: 'Status: Submitted', newValue: 'Status: FINALIZED', reason: 'Department marks audit completed' },
    { id: 'aud-005', user: 'Dr. Robert Hawthorne', role: 'Admin', action: 'SYNC_SEMESTER_CONFIG', module: 'Academic Settings', dateTime: '2026-09-20 11:10:00', oldValue: 'Term: Odd 2024', newValue: 'Term: Even 2024-25', reason: 'Term calendar progression' }
  ],

  // 25. Geofence & GPS Campus Coordinates (Thandavapura Main Campus, NH 766)
  geofenceConfig: {
    institutionName: "CampusConnect Institute of Technology",
    campusName: "Thandavapura Main Campus",
    address: "Mysore–Ooty Road, just off NH 766, Nanjangud Taluk, Thandavapura, Karnataka 571302, India",
    latitude: 12.183700,
    longitude: 76.694200,
    geofenceRadiusMeters: 300,
    accuracyThresholdMeters: 80,
    maxAllowedSpeedMps: 15,
    antiSpoofingEnabled: true
  }
};

// Database Store Manager with LocalStorage Persistence
class MasterDBStore {
  constructor() {
    this.db = this.loadDatabase();
  }

  loadDatabase() {
    try {
      const saved = localStorage.getItem(DB_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.users)) {
          // If Excel 5th sem students exist, ensure all 135 are in parsed.users
          if (typeof window !== 'undefined' && window.EXCEL_5TH_SEM_STUDENTS && window.EXCEL_5TH_SEM_STUDENTS.length > 0) {
            const existingIds = new Set(parsed.users.map(u => u.id));
            const missing = window.EXCEL_5TH_SEM_STUDENTS.filter(s => !existingIds.has(s.id));
            if (missing.length > 0) {
              parsed.users = [...missing, ...parsed.users];
              this.saveDatabase(parsed);
            }
          }
          if (!parsed.geofenceConfig) {
            parsed.geofenceConfig = { ...INITIAL_MOCK_DATABASE.geofenceConfig };
          }
          if (parsed.users.some(u => u.usn === '4MN24CS007')) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load database from localStorage, initializing fresh', e);
    }
    // Fallback: Ensure INITIAL_MOCK_DATABASE contains all 5th sem students
    if (typeof window !== 'undefined' && window.EXCEL_5TH_SEM_STUDENTS && window.EXCEL_5TH_SEM_STUDENTS.length > 0) {
      const existingIds = new Set(INITIAL_MOCK_DATABASE.users.map(u => u.id));
      const missing = window.EXCEL_5TH_SEM_STUDENTS.filter(s => !existingIds.has(s.id));
      if (missing.length > 0) {
        INITIAL_MOCK_DATABASE.users = [...missing, ...INITIAL_MOCK_DATABASE.users];
      }
    }
    this.saveDatabase(INITIAL_MOCK_DATABASE);
    return JSON.parse(JSON.stringify(INITIAL_MOCK_DATABASE));
  }

  saveDatabase(data) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
      this.db = data;
    } catch (e) {
      console.error('Failed to save database to localStorage', e);
    }
  }

  reset() {
    this.saveDatabase(INITIAL_MOCK_DATABASE);
    return this.db;
  }
}

window.masterDB = new MasterDBStore();
