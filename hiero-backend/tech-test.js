// Tech test
const resumeText = "Python JavaScript React Node.js Git SQL MongoDB";
const jdText = "Software Developer position requires Python, React, Node.js, Docker, AWS, PostgreSQL, Machine Learning experience.";

const TECH_KEYWORDS = ['programming','developer','engineer','software','sql','python','java','javascript','react','node','aws','docker','machine learning'];
const NON_TECH_KEYWORDS = ['retail','store','sales','inventory','merchandising'];
const CANONICAL_SKILL_MAP = new Map([
  ['python','Python'],['javascript','JavaScript'],['react','React'], 
  ['node.js','Node.js'],['sql','SQL'],['docker','Docker'],['aws','AWS'],
  ['machine learning','Machine Learning'],['postgresql','PostgreSQL']
]);

function extractSkillsFromText(text) {
  const lc = String(text).toLowerCase();
  const found = new Set();
  for (const [phrase, canonical] of CANONICAL_SKILL_MAP.entries()) {
    if (lc.includes(phrase)) found.add(canonical);
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

function matchSkills(resumeSkills, jdSkills) {
  const resumeSet = new Set(resumeSkills);
  const jdSet = new Set(jdSkills);
  const present = Array.from(jdSet).filter(s => resumeSet.has(s));
  const missing = Array.from(jdSet).filter(s => !resumeSet.has(s));
  const score = jdSet.size ? Math.ceil((present.length / jdSet.size) * 100 / 5) * 5 : 0;
  return { present, missing, score };
}

const domain = classifyDomain(jdText);
const resumeSkills = extractSkillsFromText(resumeText);
const jdSkills = extractSkillsFromText(jdText);
const { present, missing, score } = matchSkills(resumeSkills, jdSkills);

console.log('=== TECH TEST ===');
console.log('Domain:', domain);
console.log('Resume Skills:', resumeSkills);
console.log('JD Skills:', jdSkills);
console.log('Present Skills:', present);
console.log('Missing Skills:', missing);
console.log('Match Score:', score + '%');
