// CampusConnect Academic ERP - Centralized Mock Data & State Store
// Features localStorage synchronization for dynamic persistence across user sessions

const STORAGE_KEY = 'campusconnect_data_v4';

const INITIAL_DATA = {
  departments: [
    { id: 'CSE', name: 'Computer Science and Engineering', code: 'CSE', hod: 'Dr. Vikramaditya Sen', building: 'Turing Block', studentCount: 420, facultyCount: 28 },
    { id: 'ECE', name: 'Electronics & Communication Engineering', code: 'ECE', hod: 'Dr. Meenakshi Sundaram', building: 'Maxwell Hall', studentCount: 380, facultyCount: 24 },
    { id: 'IT', name: 'Information Technology', code: 'IT', hod: 'Dr. Arjun Rao', building: 'Shannon Complex', floors: 3, studentCount: 310, facultyCount: 20 },
    { id: 'MECH', name: 'Mechanical Engineering', code: 'MECH', hod: 'Dr. Sanjay Verma', building: 'Newton Block', studentCount: 290, facultyCount: 22 },
    { id: 'EEE', name: 'Electrical & Electronics Engineering', code: 'EEE', hod: 'Dr. K. Radhakrishnan', building: 'Faraday Hall', studentCount: 260, facultyCount: 19 }
  ],

  semesters: [
    { id: 1, name: 'Semester 1', type: 'Odd', year: '1st Year', active: false },
    { id: 2, name: 'Semester 2', type: 'Even', year: '1st Year', active: false },
    { id: 3, name: 'Semester 3', type: 'Odd', year: '2nd Year', active: false },
    { id: 4, name: 'Semester 4', type: 'Even', year: '2nd Year', active: true },
    { id: 5, name: 'Semester 5', type: 'Odd', year: '3rd Year', active: true },
    { id: 6, name: 'Semester 6', type: 'Even', year: '3rd Year', active: true },
    { id: 7, name: 'Semester 7', type: 'Odd', year: '4th Year', active: false },
    { id: 8, name: 'Semester 8', type: 'Even', year: '4th Year', active: true }
  ],

  currentAcademicYear: '2024-2025',
  currentTerm: 'Academic Term 2024-25',

  users: [
    ...(typeof window !== 'undefined' && window.EXCEL_5TH_SEM_STUDENTS ? window.EXCEL_5TH_SEM_STUDENTS : []),
    // --- STUDENTS ---
    {
      id: 'std-01',
      role: 'Student',
      email: 'aarav.sharma@campus.edu',
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      rollNo: '21CS042',
      department: 'CSE',
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      phone: '+91 98765 43210',
      cgpa: 9.18,
      attendancePercentage: 88.4,
      advisor: 'Prof. Ananya Iyer',
      dob: '2003-08-14',
      bloodGroup: 'O+',
      emergencyContact: '+91 98765 00001 (Parent)',
      address: 'Hostel Block 4, Room 312, North Campus'
    },
    {
      id: 'std-02',
      role: 'Student',
      email: 'priya.patel@campus.edu',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      rollNo: '21CS089',
      department: 'CSE',
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      phone: '+91 98765 43211',
      cgpa: 7.45,
      attendancePercentage: 68.2, // Warning: < 75%
      advisor: 'Prof. Divya Menon',
      dob: '2003-11-22',
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 00002',
      address: 'Hostel Block 2, Room 104'
    },
    {
      id: 'std-03',
      role: 'Student',
      email: 'rohan.verma@campus.edu',
      name: 'Rohan Verma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      rollNo: '22EC015',
      department: 'ECE',
      semester: 4,
      section: 'B',
      batch: '2022-2026',
      phone: '+91 98765 43212',
      cgpa: 8.52,
      attendancePercentage: 84.1,
      advisor: 'Dr. Rajesh Kumar',
      dob: '2004-03-10',
      bloodGroup: 'A+',
      emergencyContact: '+91 98765 00003',
      address: 'Day Scholar, Metro City'
    },
    {
      id: 'std-04',
      role: 'Student',
      email: 'sneha.k@campus.edu',
      name: 'Sneha Kulkarni',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      rollNo: '21IT023',
      department: 'IT',
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      phone: '+91 98765 43213',
      cgpa: 9.05,
      attendancePercentage: 91.0,
      advisor: 'Dr. Arjun Rao',
      dob: '2003-05-19',
      bloodGroup: 'AB+',
      emergencyContact: '+91 98765 00004',
      address: 'Hostel Block 1, Room 208'
    },
    {
      id: 'std-05',
      role: 'Student',
      email: 'kunal.das@campus.edu',
      name: 'Kunal Das',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      rollNo: '21CS019',
      department: 'CSE',
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      phone: '+91 98765 43214',
      cgpa: 8.70,
      attendancePercentage: 86.5,
      advisor: 'Prof. Ananya Iyer',
      dob: '2003-09-02',
      bloodGroup: 'O-',
      emergencyContact: '+91 98765 00005',
      address: 'Hostel Block 4, Room 410'
    },
    {
      id: 'std-06',
      role: 'Student',
      email: 'ananya.nair@campus.edu',
      name: 'Ananya Nair',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rollNo: '21CS055',
      department: 'CSE',
      semester: 6,
      section: 'A',
      batch: '2021-2025',
      phone: '+91 98765 43215',
      cgpa: 9.35,
      attendancePercentage: 92.5,
      advisor: 'Prof. Divya Menon',
      dob: '2003-01-30',
      bloodGroup: 'A-',
      emergencyContact: '+91 98765 00006',
      address: 'Hostel Block 2, Room 301'
    },

    // --- TEACHERS ---
    {
      id: 'tch-01',
      role: 'Teacher',
      email: 'ananya.iyer@faculty.campus.edu',
      name: 'Prof. Ananya Iyer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      empId: 'FAC-CSE-108',
      department: 'CSE',
      designation: 'Associate Professor',
      specialization: 'Distributed Computing & Cloud Architecture',
      phone: '+91 98765 11101',
      office: 'Turing Block, Room 214',
      assignedCourses: ['CS601', 'CS603', 'CS605']
    },
    {
      id: 'tch-02',
      role: 'Teacher',
      email: 'rajesh.kumar@faculty.campus.edu',
      name: 'Dr. Rajesh Kumar',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      empId: 'FAC-ECE-204',
      department: 'ECE',
      designation: 'Professor',
      specialization: 'Digital Signal Processing & Embedded VLSI',
      phone: '+91 98765 11102',
      office: 'Maxwell Hall, Room 310',
      assignedCourses: ['EC401', 'EC402']
    },
    {
      id: 'tch-03',
      role: 'Teacher',
      email: 'divya.menon@faculty.campus.edu',
      name: 'Prof. Divya Menon',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
      empId: 'FAC-CSE-115',
      department: 'CSE',
      designation: 'Assistant Professor',
      specialization: 'Machine Learning & Deep Neural Nets',
      phone: '+91 98765 11103',
      office: 'Turing Block, Room 218',
      assignedCourses: ['CS602']
    },

    // --- HOD ---
    {
      id: 'hod-01',
      role: 'HOD',
      email: 'hod.cse@campus.edu',
      name: 'Dr. Vikramaditya Sen',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
      empId: 'HOD-CSE-001',
      department: 'CSE',
      designation: 'Head of Department & Senior Professor',
      specialization: 'Compiler Optimization & High Performance Systems',
      phone: '+91 98765 22201',
      office: 'Turing Block, HOD Secretariat (Room 301)',
      experience: '22 Years'
    },
    {
      id: 'hod-02',
      role: 'HOD',
      email: 'hod.ece@campus.edu',
      name: 'Dr. Meenakshi Sundaram',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      empId: 'HOD-ECE-002',
      department: 'ECE',
      designation: 'Head of Department & Professor',
      specialization: 'Wireless Communications & Antenna Design',
      phone: '+91 98765 22202',
      office: 'Maxwell Hall, HOD Secretariat (Room 205)',
      experience: '20 Years'
    },

    // --- ADMIN ---
    {
      id: 'adm-01',
      role: 'Admin',
      email: 'admin@campus.edu',
      name: 'Dr. Robert Hawthorne',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      empId: 'ADM-REG-001',
      department: 'Central Administration',
      designation: 'Dean of Academic Affairs & Registrar',
      phone: '+91 98765 99999',
      office: 'Senate House, Executive Suite 101'
    }
  ],

  courses: [
    {
      id: 'CS601',
      code: 'CS601',
      name: 'Distributed Systems',
      department: 'CSE',
      semester: 6,
      credits: 4,
      instructor: 'Prof. Ananya Iyer',
      instructorId: 'tch-01',
      classroom: 'TB-201',
      syllabusOverview: 'Consensus protocols, Paxos, Raft, Byzantine fault tolerance, RPC, distributed storage engines.'
    },
    {
      id: 'CS602',
      code: 'CS602',
      name: 'Machine Learning Applications',
      department: 'CSE',
      semester: 6,
      credits: 4,
      instructor: 'Prof. Divya Menon',
      instructorId: 'tch-03',
      classroom: 'TB-203',
      syllabusOverview: 'Supervised & unsupervised models, gradient descent, SVMs, neural networks, computer vision transformers.'
    },
    {
      id: 'CS603',
      code: 'CS603',
      name: 'Cloud Computing Architecture',
      department: 'CSE',
      semester: 6,
      credits: 3,
      instructor: 'Prof. Ananya Iyer',
      instructorId: 'tch-01',
      classroom: 'TB-201',
      syllabusOverview: 'Virtualization, microservices, container orchestration, Kubernetes, serverless event-driven architecture.'
    },
    {
      id: 'CS604',
      code: 'CS604',
      name: 'Compiler Design',
      department: 'CSE',
      semester: 6,
      credits: 4,
      instructor: 'Dr. Vikramaditya Sen',
      instructorId: 'hod-01',
      classroom: 'TB-Auditorium',
      syllabusOverview: 'Lexical analysis, LL(1) & LR parsers, syntax-directed translation, intermediate code, code generation.'
    },
    {
      id: 'CS605',
      code: 'CS605',
      name: 'Distributed Systems Lab',
      department: 'CSE',
      semester: 6,
      credits: 2,
      instructor: 'Prof. Ananya Iyer',
      instructorId: 'tch-01',
      classroom: 'CS-Lab 3',
      syllabusOverview: 'Socket programming, gRPC implementation, distributed caching with Redis, fault-tolerant replication.'
    },
    {
      id: 'EC401',
      code: 'EC401',
      name: 'Digital Signal Processing',
      department: 'ECE',
      semester: 4,
      credits: 4,
      instructor: 'Dr. Rajesh Kumar',
      instructorId: 'tch-02',
      classroom: 'MH-102',
      syllabusOverview: 'DFT, FFT algorithms, IIR and FIR filter design, multirate DSP, digital signal processors.'
    },
    {
      id: 'EC402',
      code: 'EC402',
      name: 'Microcontrollers & Embedded Systems',
      department: 'ECE',
      semester: 4,
      credits: 4,
      instructor: 'Dr. Rajesh Kumar',
      instructorId: 'tch-02',
      classroom: 'MH-104',
      syllabusOverview: 'ARM Cortex architecture, peripheral interfacing, timers, interrupts, RTOS fundamentals.'
    }
  ],

  // Student Attendance Records (Subject-wise & Scoped)
  attendance: {
    'std-01': [
      { courseId: 'CS601', courseName: 'Distributed Systems', attended: 32, total: 36, percentage: 88.9, faculty: 'Prof. Ananya Iyer' },
      { courseId: 'CS602', courseName: 'Machine Learning Applications', attended: 34, total: 38, percentage: 89.5, faculty: 'Prof. Divya Menon' },
      { courseId: 'CS603', courseName: 'Cloud Computing Architecture', attended: 26, total: 30, percentage: 86.7, faculty: 'Prof. Ananya Iyer' },
      { courseId: 'CS604', courseName: 'Compiler Design', attended: 31, total: 35, percentage: 88.6, faculty: 'Dr. Vikramaditya Sen' },
      { courseId: 'CS605', courseName: 'Distributed Systems Lab', attended: 15, total: 16, percentage: 93.8, faculty: 'Prof. Ananya Iyer' }
    ],
    'std-02': [
      { courseId: 'CS601', courseName: 'Distributed Systems', attended: 24, total: 36, percentage: 66.7, faculty: 'Prof. Ananya Iyer' },
      { courseId: 'CS602', courseName: 'Machine Learning Applications', attended: 26, total: 38, percentage: 68.4, faculty: 'Prof. Divya Menon' },
      { courseId: 'CS603', courseName: 'Cloud Computing Architecture', attended: 20, total: 30, percentage: 66.7, faculty: 'Prof. Ananya Iyer' },
      { courseId: 'CS604', courseName: 'Compiler Design', attended: 25, total: 35, percentage: 71.4, faculty: 'Dr. Vikramaditya Sen' },
      { courseId: 'CS605', courseName: 'Distributed Systems Lab', attended: 11, total: 16, percentage: 68.8, faculty: 'Prof. Ananya Iyer' }
    ],
    'std-03': [
      { courseId: 'EC401', courseName: 'Digital Signal Processing', attended: 32, total: 38, percentage: 84.2, faculty: 'Dr. Rajesh Kumar' },
      { courseId: 'EC402', courseName: 'Microcontrollers & Embedded Systems', attended: 29, total: 35, percentage: 82.9, faculty: 'Dr. Rajesh Kumar' }
    ]
  },

  // Student Internal Assessment Marks & Gradebook (Privacy Scoped)
  marks: {
    'std-01': [
      { courseId: 'CS601', courseName: 'Distributed Systems', test1: 28, test2: 27, assignment: 19, midterm: 18, total: 92, maxTotal: 100, grade: 'A+' },
      { courseId: 'CS602', courseName: 'Machine Learning Applications', test1: 29, test2: 28, assignment: 20, midterm: 19, total: 96, maxTotal: 100, grade: 'O' },
      { courseId: 'CS603', courseName: 'Cloud Computing Architecture', test1: 26, test2: 25, assignment: 18, midterm: 17, total: 86, maxTotal: 100, grade: 'A' },
      { courseId: 'CS604', courseName: 'Compiler Design', test1: 27, test2: 28, assignment: 19, midterm: 18, total: 92, maxTotal: 100, grade: 'A+' },
      { courseId: 'CS605', courseName: 'Distributed Systems Lab', test1: 29, test2: 30, assignment: 20, midterm: 19, total: 98, maxTotal: 100, grade: 'O' }
    ],
    'std-02': [
      { courseId: 'CS601', courseName: 'Distributed Systems', test1: 20, test2: 19, assignment: 15, midterm: 14, total: 68, maxTotal: 100, grade: 'B' },
      { courseId: 'CS602', courseName: 'Machine Learning Applications', test1: 22, test2: 21, assignment: 16, midterm: 15, total: 74, maxTotal: 100, grade: 'B+' },
      { courseId: 'CS603', courseName: 'Cloud Computing Architecture', test1: 21, test2: 20, assignment: 15, midterm: 14, total: 70, maxTotal: 100, grade: 'B' },
      { courseId: 'CS604', courseName: 'Compiler Design', test1: 23, test2: 22, assignment: 16, midterm: 15, total: 76, maxTotal: 100, grade: 'B+' },
      { courseId: 'CS605', courseName: 'Distributed Systems Lab', test1: 24, test2: 23, assignment: 17, midterm: 16, total: 80, maxTotal: 100, grade: 'A' }
    ],
    'std-03': [
      { courseId: 'EC401', courseName: 'Digital Signal Processing', test1: 26, test2: 25, assignment: 18, midterm: 17, total: 86, maxTotal: 100, grade: 'A' },
      { courseId: 'EC402', courseName: 'Microcontrollers & Embedded Systems', test1: 25, test2: 26, assignment: 17, midterm: 16, total: 84, maxTotal: 100, grade: 'A' }
    ]
  },

  // Assignments & Submissions
  assignments: [
    {
      id: 'asg-01',
      courseId: 'CS601',
      courseName: 'Distributed Systems',
      title: 'Implementation of Raft Consensus State Machine',
      description: 'Build a three-node Raft leader election cluster in Python or Go. Must demonstrate log replication and split-vote recovery.',
      dueDate: '2025-04-10',
      maxMarks: 20,
      assignedBy: 'Prof. Ananya Iyer',
      department: 'CSE',
      semester: 6,
      section: 'A',
      submissionsCount: 42,
      totalStudents: 45
    },
    {
      id: 'asg-02',
      courseId: 'CS603',
      courseName: 'Cloud Computing Architecture',
      title: 'Terraform & Kubernetes Blue-Green Deployment',
      description: 'Write Infrastructure-as-Code modules for an AWS/GCP Kubernetes cluster with zero-downtime blue-green rolling rollout.',
      dueDate: '2025-04-18',
      maxMarks: 20,
      assignedBy: 'Prof. Ananya Iyer',
      department: 'CSE',
      semester: 6,
      section: 'A',
      submissionsCount: 38,
      totalStudents: 45
    },
    {
      id: 'asg-03',
      courseId: 'CS602',
      courseName: 'Machine Learning Applications',
      title: 'Fine-Tuning BERT on Domain Specific Medical NLP',
      description: 'Implement HuggingFace transformer pipeline, report F1 score, confusion matrix, and deploy inference REST API.',
      dueDate: '2025-04-25',
      maxMarks: 20,
      assignedBy: 'Prof. Divya Menon',
      department: 'CSE',
      semester: 6,
      section: 'A',
      submissionsCount: 15,
      totalStudents: 45
    }
  ],

  // Student Specific Submissions (Aarav Sharma - std-01)
  studentSubmissions: {
    'std-01': [
      {
        assignmentId: 'asg-01',
        title: 'Implementation of Raft Consensus State Machine',
        submittedAt: '2025-04-08 19:42',
        file: 'raft_cluster_aarav_21cs042.zip',
        status: 'Graded',
        marksObtained: 19,
        maxMarks: 20,
        feedback: 'Exceptional test suite covering network partition and leader reelection.'
      },
      {
        assignmentId: 'asg-02',
        title: 'Terraform & Kubernetes Blue-Green Deployment',
        submittedAt: '2025-04-16 11:20',
        file: 'k8s_bluegreen_pipeline.tar.gz',
        status: 'Submitted',
        marksObtained: null,
        maxMarks: 20,
        feedback: 'Pending instructor evaluation.'
      }
    ]
  },

  // Timetable
  timetable: {
    'CSE_6_A': [
      { day: 'Monday', time: '09:00 - 10:00', course: 'CS601: Distributed Systems', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Monday', time: '10:00 - 11:00', course: 'CS602: Machine Learning', faculty: 'Prof. Divya Menon', room: 'TB-203' },
      { day: 'Monday', time: '11:15 - 12:15', course: 'CS604: Compiler Design', faculty: 'Dr. Vikramaditya Sen', room: 'TB-Auditorium' },
      { day: 'Monday', time: '13:30 - 16:30', course: 'CS605: Distributed Systems Lab', faculty: 'Prof. Ananya Iyer', room: 'CS-Lab 3' },

      { day: 'Tuesday', time: '09:00 - 10:00', course: 'CS603: Cloud Computing', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Tuesday', time: '10:00 - 11:00', course: 'CS601: Distributed Systems', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Tuesday', time: '11:15 - 12:15', course: 'CS602: Machine Learning', faculty: 'Prof. Divya Menon', room: 'TB-203' },
      { day: 'Tuesday', time: '13:30 - 15:30', course: 'Mini-Project / Mentorship', faculty: 'Faculty Mentors', room: 'TB-Sem Hall' },

      { day: 'Wednesday', time: '09:00 - 10:00', course: 'CS604: Compiler Design', faculty: 'Dr. Vikramaditya Sen', room: 'TB-Auditorium' },
      { day: 'Wednesday', time: '10:00 - 11:00', course: 'CS603: Cloud Computing', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Wednesday', time: '11:15 - 12:15', course: 'CS601: Distributed Systems', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Wednesday', time: '13:30 - 15:00', course: 'Industry Seminar / Guest Lecture', faculty: 'Guest Speaker', room: 'Central Audi' },

      { day: 'Thursday', time: '09:00 - 10:00', course: 'CS602: Machine Learning', faculty: 'Prof. Divya Menon', room: 'TB-203' },
      { day: 'Thursday', time: '10:00 - 11:00', course: 'CS604: Compiler Design', faculty: 'Dr. Vikramaditya Sen', room: 'TB-Auditorium' },
      { day: 'Thursday', time: '11:15 - 12:15', course: 'CS603: Cloud Computing', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Thursday', time: '13:30 - 16:30', course: 'Open Source Development Lab', faculty: 'Prof. Divya Menon', room: 'CS-Lab 1' },

      { day: 'Friday', time: '09:00 - 10:00', course: 'CS601: Distributed Systems', faculty: 'Prof. Ananya Iyer', room: 'TB-201' },
      { day: 'Friday', time: '10:00 - 11:00', course: 'CS602: Machine Learning', faculty: 'Prof. Divya Menon', room: 'TB-203' },
      { day: 'Friday', time: '11:15 - 12:15', course: 'Tutorial & Doubts Clarification', faculty: 'Teaching Assistants', room: 'TB-201' },
      { day: 'Friday', time: '13:30 - 15:00', course: 'Sports / Cultural Activity', faculty: 'Physical Director', room: 'Campus Arena' }
    ]
  },

  // Student Fees & Financial Statement (Privacy Scoped)
  studentFees: {
    'std-01': {
      semester: 6,
      academicYear: '2024-2025',
      totalTuitionFee: 2400,
      examinationFee: 250,
      labLibraryFee: 150,
      scholarshipDeduction: 500,
      netPayable: 2300,
      amountPaid: 2300,
      balanceDue: 0,
      paymentStatus: 'PAID_IN_FULL',
      invoices: [
        { id: 'INV-2025-601', title: 'Semester 6 Tuition & Composite Fee', amount: 2300, date: '2025-01-10', receiptNo: 'REC-CC-89421', status: 'Success' },
        { id: 'INV-2024-501', title: 'Semester 5 Tuition & Exam Fee', amount: 2300, date: '2024-07-15', receiptNo: 'REC-CC-76120', status: 'Success' }
      ]
    }
  },

  // Student Privacy Audit Logs (Requirement 5)
  studentPrivacyAuditLogs: {
    'std-01': [
      { id: 'log-01', timestamp: '2025-04-12 14:15', actor: 'Prof. Ananya Iyer (Teacher)', role: 'Teacher', action: 'Accessed Internal Test 2 Score Sheet', permission: 'CLASS_FACULTY_READ' },
      { id: 'log-02', timestamp: '2025-04-09 11:02', actor: 'Prof. Ananya Iyer (Teacher)', role: 'Teacher', action: 'Evaluated & Graded Assignment 1 (Raft)', permission: 'ASSIGNMENT_EVALUATION' },
      { id: 'log-03', timestamp: '2025-04-05 16:30', actor: 'Dr. Vikramaditya Sen (HOD)', role: 'HOD', action: 'Reviewed Dept Semester 6 Roll List & Attendance', permission: 'HOD_OVERSIGHT' },
      { id: 'log-04', timestamp: '2025-01-10 10:20', actor: 'Registrar Finance Office', role: 'Admin', action: 'Issued Tuition Fee Receipt REC-CC-89421', permission: 'FINANCE_AUDIT' }
    ]
  },

  // Grievances & Leave Requests (For HOD approval)
  leaveRequests: [
    {
      id: 'lr-101',
      studentId: 'std-01',
      studentName: 'Aarav Sharma',
      rollNo: '21CS042',
      department: 'CSE',
      semester: 6,
      type: 'On-Duty (Hackathon)',
      reason: 'Representing college at Smart India Hackathon Grand Finale in New Delhi',
      dates: '2025-04-20 to 2025-04-24 (4 Days)',
      proofDocument: 'sih_invitation_letter.pdf',
      status: 'Approved',
      submittedDate: '2025-04-02',
      approvedBy: 'Dr. Vikramaditya Sen (HOD)'
    },
    {
      id: 'lr-102',
      studentId: 'std-02',
      studentName: 'Priya Patel',
      rollNo: '21CS089',
      department: 'CSE',
      semester: 6,
      type: 'Medical Leave',
      reason: 'Suffering from viral fever with medical certificate attached',
      dates: '2025-04-12 to 2025-04-16 (5 Days)',
      proofDocument: 'medical_fit_cert.pdf',
      status: 'Pending',
      submittedDate: '2025-04-12',
      approvedBy: null
    },
    {
      id: 'lr-103',
      studentId: 'std-03',
      studentName: 'Rohan Verma',
      rollNo: '22EC015',
      department: 'ECE',
      semester: 4,
      type: 'Personal Leave',
      reason: 'Family urgent circumstance',
      dates: '2025-04-22 (1 Day)',
      proofDocument: null,
      status: 'Pending',
      submittedDate: '2025-04-14',
      approvedBy: null
    }
  ],

  // System & Department Announcements
  announcements: [
    {
      id: 'ann-01',
      title: 'End-Semester Examination Schedule - Even Term 2024-25',
      category: 'Exam Cell',
      target: 'All Students & Faculty',
      department: 'All',
      date: '2025-04-10',
      urgent: true,
      content: 'The final theory examinations for Semesters 2, 4, 6 and 8 will commence from May 12, 2025. Detailed timetable is available on the portal. Hall tickets will be issued only to candidates with minimum 75% attendance.'
    },
    {
      id: 'ann-02',
      title: 'CSE Department Research Symposium & Codeathon 2025',
      category: 'Department Event',
      target: 'CSE Students',
      department: 'CSE',
      date: '2025-04-08',
      urgent: false,
      content: 'Annual CSE Department Symposium will be hosted in Turing Hall on April 28. Registrations open for track presentations in AI, Cloud and Cybersecurity.'
    },
    {
      id: 'ann-03',
      title: 'Mandatory Faculty Mid-Term Appraisal & Internal Marks Submission',
      category: 'Academic Dean',
      target: 'Faculty & HODs',
      department: 'All',
      date: '2025-04-05',
      urgent: true,
      content: 'All faculty members are requested to lock Internal Test 2 scores and attendance logs by April 22 before 5:00 PM.'
    }
  ],

  // Audit Logs (Admin visibility)
  auditLogs: [
    { id: 'aud-01', timestamp: '2025-04-15 10:14:02', user: 'admin@campus.edu', role: 'Admin', event: 'USER_ROLE_VERIFIED', detail: 'Verified permissions for HOD CSE' },
    { id: 'aud-02', timestamp: '2025-04-15 09:30:18', user: 'ananya.iyer@faculty.campus.edu', role: 'Teacher', event: 'ATTENDANCE_LOG_SAVED', detail: 'Logged daily attendance for CS601 (Sem 6 Sec A: 42 present, 3 absent)' },
    { id: 'aud-03', timestamp: '2025-04-14 18:02:44', user: 'hod.cse@campus.edu', role: 'HOD', event: 'LEAVE_APPROVAL', detail: 'Approved On-Duty request lr-101 for Aarav Sharma (21CS042)' },
    { id: 'aud-04', timestamp: '2025-04-14 14:10:11', user: 'admin@campus.edu', role: 'Admin', event: 'CURRICULUM_SYNC', detail: 'Synchronized credit framework for Even Semesters 2024-25' }
  ]
};

// Data Store Manager with LocalStorage Persistence
class CampusStore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.users)) {
          if (typeof window !== 'undefined' && window.EXCEL_5TH_SEM_STUDENTS && window.EXCEL_5TH_SEM_STUDENTS.length > 0) {
            const existingIds = new Set(parsed.users.map(u => u.id));
            const missing = window.EXCEL_5TH_SEM_STUDENTS.filter(s => !existingIds.has(s.id));
            if (missing.length > 0) {
              parsed.users = [...missing, ...parsed.users];
              this.saveData(parsed);
            }
          }
          if (parsed.users.some(u => u.usn === '4MN24CS007')) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed, using initial mock data', e);
    }
    if (typeof window !== 'undefined' && window.EXCEL_5TH_SEM_STUDENTS && window.EXCEL_5TH_SEM_STUDENTS.length > 0) {
      const existingIds = new Set(INITIAL_DATA.users.map(u => u.id));
      const missing = window.EXCEL_5TH_SEM_STUDENTS.filter(s => !existingIds.has(s.id));
      if (missing.length > 0) {
        INITIAL_DATA.users = [...missing, ...INITIAL_DATA.users];
      }
    }
    this.saveData(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
    } catch (e) {
      console.error('LocalStorage save failed', e);
    }
  }

  resetToDefault() {
    this.saveData(INITIAL_DATA);
    return this.data;
  }

  // --- Student Specific Privacy-Scoped Getters ---
  getStudentPrivateProfile(studentId) {
    return this.data.users.find(u => u.id === studentId && u.role === 'Student') || null;
  }

  getStudentAttendance(studentId) {
    return this.data.attendance[studentId] || [];
  }

  getStudentMarks(studentId) {
    return this.data.marks[studentId] || [];
  }

  getStudentAssignments(semester, department) {
    return this.data.assignments.filter(a => a.semester === semester && (a.department === department || a.department === 'All'));
  }

  getStudentSubmissions(studentId) {
    return this.data.studentSubmissions[studentId] || [];
  }

  getStudentFees(studentId) {
    return this.data.studentFees[studentId] || null;
  }

  getStudentPrivacyAudit(studentId) {
    return this.data.studentPrivacyAuditLogs[studentId] || [];
  }

  getTimetable(department, semester, section) {
    const key = `${department}_${semester}_${section}`;
    return this.data.timetable[key] || this.data.timetable['CSE_6_A'] || [];
  }

  // --- Teacher Operations ---
  getTeacherAssignedCourses(teacherId) {
    const teacher = this.data.users.find(u => u.id === teacherId);
    if (!teacher || !teacher.assignedCourses) return [];
    return this.data.courses.filter(c => teacher.assignedCourses.includes(c.code));
  }

  getStudentsByClass(department, semester, section) {
    return this.data.users.filter(u => 
      u.role === 'Student' && 
      u.department === department && 
      u.semester === semester && 
      (!section || u.section === section)
    );
  }

  saveAttendanceRecord(courseId, date, attendanceMap) {
    // attendanceMap: { [studentId]: 'present' | 'absent' | 'late' }
    Object.keys(attendanceMap).forEach(studentId => {
      const isPresent = attendanceMap[studentId] === 'present' || attendanceMap[studentId] === 'late';
      const studentRecs = this.data.attendance[studentId];
      if (studentRecs) {
        const courseRec = studentRecs.find(c => c.courseId === courseId);
        if (courseRec) {
          courseRec.total += 1;
          if (isPresent) courseRec.attended += 1;
          courseRec.percentage = parseFloat(((courseRec.attended / courseRec.total) * 100).toFixed(1));
        }
      }
    });

    // Add audit log
    this.addAuditLog('ATTENDANCE_RECORDED', `Attendance marked for course ${courseId} on ${date}`);
    this.saveData(this.data);
    return true;
  }

  updateStudentMarks(studentId, courseId, scores) {
    // scores: { test1, test2, assignment, midterm }
    if (!this.data.marks[studentId]) {
      this.data.marks[studentId] = [];
    }
    const list = this.data.marks[studentId];
    let rec = list.find(m => m.courseId === courseId);
    const total = (Number(scores.test1) || 0) + (Number(scores.test2) || 0) + (Number(scores.assignment) || 0) + (Number(scores.midterm) || 0);
    
    let grade = 'F';
    if (total >= 90) grade = 'O';
    else if (total >= 80) grade = 'A+';
    else if (total >= 70) grade = 'A';
    else if (total >= 60) grade = 'B+';
    else if (total >= 50) grade = 'B';
    else if (total >= 40) grade = 'C';

    if (rec) {
      rec.test1 = Number(scores.test1);
      rec.test2 = Number(scores.test2);
      rec.assignment = Number(scores.assignment);
      rec.midterm = Number(scores.midterm);
      rec.total = total;
      rec.grade = grade;
    } else {
      const course = this.data.courses.find(c => c.code === courseId);
      list.push({
        courseId,
        courseName: course ? course.name : courseId,
        test1: Number(scores.test1),
        test2: Number(scores.test2),
        assignment: Number(scores.assignment),
        midterm: Number(scores.midterm),
        total,
        maxTotal: 100,
        grade
      });
    }

    // Add privacy access log for the student
    if (!this.data.studentPrivacyAuditLogs[studentId]) {
      this.data.studentPrivacyAuditLogs[studentId] = [];
    }
    this.data.studentPrivacyAuditLogs[studentId].unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Faculty Instructor',
      role: 'Teacher',
      action: `Updated marks for ${courseId} (Total: ${total}/100, Grade: ${grade})`,
      permission: 'GRADEBOOK_WRITE'
    });

    this.saveData(this.data);
    return true;
  }

  createAssignment(newAssignment) {
    const id = 'asg-' + Date.now();
    const assignment = {
      id,
      submissionsCount: 0,
      totalStudents: 45,
      ...newAssignment
    };
    this.data.assignments.unshift(assignment);
    this.addAuditLog('ASSIGNMENT_CREATED', `Assignment "${newAssignment.title}" published for ${newAssignment.courseId}`);
    this.saveData(this.data);
    return assignment;
  }

  submitAssignment(studentId, assignmentId, fileName) {
    if (!this.data.studentSubmissions[studentId]) {
      this.data.studentSubmissions[studentId] = [];
    }
    const asg = this.data.assignments.find(a => a.id === assignmentId);
    const title = asg ? asg.title : 'Assignment';

    const submission = {
      assignmentId,
      title,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      file: fileName || 'assignment_submission.pdf',
      status: 'Submitted',
      marksObtained: null,
      maxMarks: asg ? asg.maxMarks : 20,
      feedback: 'Awaiting instructor evaluation'
    };

    this.data.studentSubmissions[studentId].unshift(submission);
    if (asg) asg.submissionsCount = (asg.submissionsCount || 0) + 1;

    this.saveData(this.data);
    return submission;
  }

  // --- HOD Operations ---
  getDepartmentStats(departmentCode) {
    const dept = this.data.departments.find(d => d.code === departmentCode);
    const students = this.data.users.filter(u => u.role === 'Student' && u.department === departmentCode);
    const faculty = this.data.users.filter(u => u.role === 'Teacher' && u.department === departmentCode);
    const lowAttendance = students.filter(s => (s.attendancePercentage || 0) < 75);

    let avgAttendance = 0;
    if (students.length > 0) {
      avgAttendance = (students.reduce((acc, s) => acc + (s.attendancePercentage || 80), 0) / students.length).toFixed(1);
    }

    return {
      department: dept,
      studentCount: students.length,
      facultyCount: faculty.length,
      averageAttendance: avgAttendance,
      shortageCount: lowAttendance.length,
      lowAttendanceStudents: lowAttendance
    };
  }

  handleLeaveRequest(requestId, newStatus, approverName) {
    const req = this.data.leaveRequests.find(r => r.id === requestId);
    if (req) {
      req.status = newStatus;
      req.approvedBy = approverName || 'HOD';
      this.addAuditLog('LEAVE_DECISION', `${newStatus} request ${requestId} for ${req.studentName}`);
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- Admin Operations ---
  addUser(user) {
    const id = (user.role === 'Student' ? 'std-' : user.role === 'Teacher' ? 'tch-' : user.role === 'HOD' ? 'hod-' : 'adm-') + Date.now();
    const newUser = {
      id,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`,
      ...user
    };
    this.data.users.push(newUser);
    this.addAuditLog('USER_CREATED', `Added new ${user.role}: ${user.name} (${user.email})`);
    this.saveData(this.data);
    return newUser;
  }

  deleteUser(userId) {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const removed = this.data.users.splice(idx, 1)[0];
      this.addAuditLog('USER_DELETED', `Removed user ${removed.name} (${removed.email})`);
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  broadcastAnnouncement(announcement) {
    const id = 'ann-' + Date.now();
    const newAnn = {
      id,
      date: new Date().toISOString().slice(0, 10),
      ...announcement
    };
    this.data.announcements.unshift(newAnn);
    this.addAuditLog('ANNOUNCEMENT_POSTED', `Broadcasted: "${newAnn.title}"`);
    this.saveData(this.data);
    return newAnn;
  }

  addAuditLog(event, detail) {
    this.data.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: 'active_session',
      role: 'System',
      event,
      detail
    });
  }
}

// Global instance
window.campusStore = new CampusStore();
