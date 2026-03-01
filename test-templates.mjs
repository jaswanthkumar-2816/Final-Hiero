import fs from 'fs';
import path from 'path';
import { loadLatexTemplate } from './hiero backend/utils/latexUtils.js';

const mockData = {
  template: 'professionalcv',
  basic: { full_name: 'Test User', contact_info: { email: 'test@example.com', phone: '1234567890' }, career_summary: 'Motivated engineer with strong fundamentals.', website: 'https://example.com' },
  education: [ { degree: 'B.Tech Electronics', institution: 'ABC University', year: '2024', gpa: '8.6/10' }, { degree: 'Intermediate', institution: 'XYZ Junior College', year: '2020' } ],
  projects: [ { name: 'IoT Sensor Hub', year: '2023', description: 'Low‑power environmental monitoring' }, { title: 'Resume Builder', date: '2024', description: 'Dynamic LaTeX PDF system' } ],
  skills: { technical: ['C','Python','Embedded C','Verilog'], management: ['Leadership','Planning'] },
  certifications: [ { name: 'MATLAB Associate', issuer: 'MathWorks', year: '2023' }, { title: 'PCB Design', provider: 'Online', date: '2024' } ],
  achievements: [ { title: 'Hackathon Winner', year: '2023', description: 'Built AI edge prototype' } ],
  hobbies: [ { hobby: 'Reading' }, { hobby: 'Cycling' } ],
  personal_details: { dob: '01-01-2000', gender: 'Male', nationality: 'Indian', marital_status: 'Single', languages: ['English','Hindi'] },
  references: [ { name: 'Dr. Mentor', relationship: 'Professor', email: 'mentor@example.com' } ]
};

const templates = ['professionalcv','modernsimple','awesomecv','altacv','deedycv','elegant','functional'];

if (!fs.existsSync('temp')) fs.mkdirSync('temp');

for (const t of templates) {
  try { const tex = loadLatexTemplate(t, mockData); fs.writeFileSync(path.join('temp', `${t}.tex`), tex); console.log('Generated', t); }
  catch(e){ console.error('Failed', t, e.message); }
}
