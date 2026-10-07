/**
 * Generate KARTHIK.S resume PDF using HIERO Cool template.
 * Usage: node generate_karthik_resume.js
 */
const fs = require('fs');
const path = require('path');
const { generateUnifiedResume } = require('./routes/unifiedTemplates');

const bullets = [
  'Deputy Controller of Examinations from 2024 till date (Autonomous college).',
  'Event Coordinator from 2010 — Technical Symposium, Conference, Seminars, Workshops, Guest Lectures.',
  'BoS member at Nandha Arts & Science College since 2024.',
  'Industrial Visit Coordinator from 2008 till date.',
  'Social media promoter for the college since 2020 till date.',
  'ERP management coordinator from 2013 till date.',
  'Admission Coordinator from 2008 till date.',
  'External Examiner — question paper setting, theory and practical valuation.'
];

const karthikData = {
  personalInfo: {
    fullName: 'KARTHIK.S',
    roleTitle: 'Assistant Professor · Computer Applications',
    email: 'skarthik.mca2005@gmail.com',
    phone: '9500360004',
    address: '10, Vairam Street, Municipal Colony, Erode — 638004, Tamil Nadu',
    dateOfBirth: '13th March 1984',
    nationality: 'Indian (Hindu)',
    gender: 'Male'
  },
  summary:
    'To get a teaching career in an institution that entails initiative, innovation and responsibility where I can feel the spirit of enhancing my knowledge and grow along with the institution.',
  skills: [
    { name: 'C / C++', level: 90 },
    { name: 'Java', level: 88 },
    { name: 'Python', level: 85 },
    { name: 'Visual Basic', level: 82 },
    { name: 'Software Engineering', level: 88 },
    { name: 'Computer Networks', level: 85 },
    { name: 'Communication', level: 92 },
    { name: 'Presentation', level: 90 }
  ],
  languages: [
    { name: 'English', level: 90 },
    { name: 'Tamil', level: 95 },
    { name: 'Telugu', level: 80 }
  ],
  experience: [
    {
      jobTitle: 'Assistant Professor',
      company: 'Nandha Arts and Science College, Erode — Dept. of Computer Applications',
      startDate: 'June 2008',
      endDate: 'Present',
      years: 'June 2008 — Present',
      points: bullets,
      description: bullets.join('\n')
    }
  ],
  education: [
    { degree: 'Ph.D.', institution: 'Bharathiar University — Nandha Arts & Science College', year: 'Pursuing', gpa: '—' },
    { degree: 'M.Phil. (57%)', institution: 'Bharathiar University — Kongu Arts and Science College', year: '2013', gpa: '57%' },
    { degree: 'M.C.A (72%)', institution: 'Anna University — Mahendra Engineering College', year: '2008', gpa: '72%' },
    { degree: 'B.C.A (56%)', institution: 'Bharathiar University — Kongu Arts and Science College', year: '2005', gpa: '56%' },
    { degree: 'Higher Secondary (83.25%)', institution: 'Bharathi Vidya Bhavan Matriculation Hr.Sec.School', year: '2002', gpa: '83.25%' },
    { degree: 'S.S.L.C (79%)', institution: 'Bharathi Vidya Bhavan Matriculation Hr.Sec.School', year: '2000', gpa: '79%' }
  ],
  projects: [
    {
      title: 'Paper — Integrating Multimedia in the K-12 Classroom',
      jobTitle: 'Paper — Integrating Multimedia in the K-12 Classroom',
      company: 'Nandha Arts and Science College, Erode',
      years: 'Presented',
      description: 'Presented a paper on Integrating Multimedia in the K-12 Classroom.'
    },
    {
      title: 'Guest Lecture — Visual Basic IDE',
      jobTitle: 'Guest Lecture — Visual Basic IDE',
      company: 'Sri Vasavi College, Erode',
      years: 'Delivered',
      description: 'Guest Lecture on Visual Basic IDE.'
    },
    {
      title: 'Resource Person — Class 12 Computer Science',
      jobTitle: 'Resource Person — Class 12 Computer Science',
      company: 'Govt. Hr. Sec. School, Avinashi',
      years: '2016–2017',
      description: 'Handled basics of Computer Science for 12th students.'
    },
    {
      title: 'Judge — GATES’2016',
      jobTitle: 'Judge — GATES’2016',
      company: 'Nandha Arts and Science College, Erode',
      years: '2016',
      description: 'Judge in Intra-Department Meet, Department of Computer Science.'
    }
  ],
  certifications: [
    { name: 'Workshop — 2D, WEB, VFX (Animation Camp, Erode)' },
    { name: 'National Conference — Innovative Trends in Information Technology (Sri Vasavi College)' },
    { name: 'National Level Workshop — Big Data Analytics (Kongu Arts and Science College)' },
    { name: 'National Level Conference — Smart Approaches in Computer Paradigms (Navarasam Arts & Science College)' },
    { name: 'Orientation Program — Spoken Tutorial, IIT Bombay (Bharathiar University)' }
  ],
  achievements: [
    { name: 'Father’s Name: SELVAM.G · DOB: 13th March 1984 · Languages: English, Tamil, Telugu' },
    { name: 'Hobbies: Listening to music, Reading newspapers' },
    { name: 'Declaration dated 24.07.18, Place: Erode' }
  ],
  template: 'hiero-cool'
};

async function main() {
  const outPath = path.join(__dirname, 'KARTHIK_S_HIERO_Cool_Resume.pdf');
  const out = fs.createWriteStream(outPath);
  await generateUnifiedResume(karthikData, 'hiero-cool', out);
  console.log('Created:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
