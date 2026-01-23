// Test script for resume-JD matching logic

const TECH_KEYWORDS = [
  'programming','developer','engineer','software','sql','mysql','postgres','database','data','analysis','analytics',
  'python','java','javascript','node','react','angular','vue','typescript','api','rest','graphql','microservices',
  'cloud','aws','azure','gcp','docker','kubernetes','devops','linux','git','ml','machine learning','deep learning','ai','nlp'
];

const NON_TECH_KEYWORDS = [
  'retail','store','sales','hr','human resources','finance','accounting','bookkeeping','tally','excel','customer',
  'merchandising','visual merchandising','inventory','inventory control','inventory management','sop','compliance',
  'shift','scheduling','cashier','billing','operations','logistics','procurement','marketing','hospitality',
  'front office','bpo','call center','teamwork','communication','people management','shrinkage','audit',
  'management','service','team','leadership','time management','problem solving','store operations','customer satisfaction','complaint handling'
];

const CANONICAL_SKILL_MAP = new Map([
  ['customer service','Customer Service'],
  ['customer support','Customer Service'],
  ['people management','People Management'],
  ['team management','People Management'],
  ['inventory management','Inventory Control'],
  ['inventory control','Inventory Control'],
  ['visual merchandising','Visual Merchandising'],
  ['merchandising','Visual Merchandising'],
  ['sop compliance','SOP Compliance'],
  ['shrinkage control','Shrinkage Control'],
  ['shift scheduling','Shift Scheduling'],
  ['sales','Sales'],
  ['excel','Excel'],
  ['tally','Tally'],
  ['communication','Communication'],
  ['teamwork','Teamwork'],
  ['leadership','Leadership'],
  ['python','Python'],
  ['java','Java'],
  ['javascript','JavaScript']
]);

function toTitleCase(s) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function extractSkillsFromText(text) {
  if (!text) return [];
  const lc = String(text).toLowerCase();
  const found = new Set();

  for (const [phrase, canonical] of CANONICAL_SKILL_MAP.entries()) {
    const pattern = new RegExp(`(?<![a-z0-9])${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, r => `\\${r}`)}(?![a-z0-9])`, 'i');
    if (pattern.test(lc)) found.add(canonical);
  }

  return Array.from(found);
}

function classifyDomain(jdText) {
  const lc = String(jdText || '').toLowerCase();
  let tech = 0, nonTech = 0;
  for (const k of TECH_KEYWORDS) if (lc.includes(k)) tech++;
  for (const k of NON_TECH_KEYWORDS) if (lc.includes(k)) nonTech++;
  return tech > nonTech ? 'tech' : 'non-tech';
}

function roundToNearestFive(n) {
  return Math.ceil((n || 0) / 5) * 5;
}

function matchSkills(resumeSkills, jdSkills) {
  const resumeSet = new Set(resumeSkills);
  const jdSet = new Set(jdSkills);
  const present = Array.from(jdSet).filter(s => resumeSet.has(s));
  const missing = Array.from(jdSet).filter(s => !resumeSet.has(s));
  const score = jdSet.size ? (present.length / jdSet.size) * 100 : 0;
  return { present, missing, score: roundToNearestFive(score) };
}

function suggestProjects(domain, missingSkills = []) {
  const suggestions = [];
  if (domain === 'tech') {
    suggestions.push('Build a CRUD web app with authentication and deploy it');
    suggestions.push('Analyze a public dataset and publish findings');
  } else {
    suggestions.push('Create an Excel template for inventory tracking and reporting');
    suggestions.push('Design a weekly shift schedule for store staff with peak hour coverage');
    suggestions.push('Develop a customer feedback collection form and summary report');
    
    for (const s of missingSkills.slice(0, 3)) {
      if (s === 'Inventory Control') suggestions.push('Perform a mock stock count and create variance report');
      else if (s === 'Visual Merchandising') suggestions.push('Plan a shelf layout and weekly VM refresh checklist');
      else if (s === 'People Management') suggestions.push('Design team performance review template');
    }
  }
  return Array.from(new Set(suggestions));
}

// Test with ASM example
const resumeText = "Customer Service Sales Excel Tally Communication Teamwork Leadership Time Management";
const jdText = "Assistant Store Manager responsibilities include Inventory Management, People Management, Visual Merchandising, Shift Scheduling, SOP Compliance, Customer Service, Sales Target Achievement.";

const domain = classifyDomain(jdText);
const resumeSkills = extractSkillsFromText(resumeText);
const jdSkills = extractSkillsFromText(jdText);
const { present, missing, score } = matchSkills(resumeSkills, jdSkills);
const suggestions = suggestProjects(domain, missing);

console.log('=== RESUME-JD MATCHING TEST ===');
console.log('Domain:', domain);
console.log('Resume Skills:', resumeSkills);
console.log('JD Skills:', jdSkills);
console.log('Present Skills:', present);
console.log('Missing Skills:', missing);
console.log('Match Score:', score + '%');
console.log('Suggestions:', suggestions);
