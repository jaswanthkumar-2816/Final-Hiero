// Central analysis engine extracted from legacy "hiero analysis part/index.js"
// Provides reusable, async functions for resume/JD analysis.
import fs from 'fs';
import { createRequire } from 'module';

// Use require for CommonJS pdf-parse
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// --- Skill + domain helpers (trimmed & curated) ---
const TECH_KEYWORDS = [ 'python','java','javascript','sql','react','node','docker','kubernetes','machine learning','data science','ai','html','css','devops','cloud','aws','azure','gcp','pandas','numpy','git' ];

const NON_TECH_KEYWORDS = [ 'customer service','inventory','merchandising','sales','accounting','finance','bookkeeping','audit','tax','recruitment','hr','logistics','supply chain','operations','marketing','digital marketing','seo','brand','curriculum','classroom','patient','healthcare','quality control','process improvement' ];

// Added: richer non‑tech sub-domain detection
const NON_TECH_SUBDOMAINS = {
  retail: ['retail','store','inventory','merchandising','shrinkage','pos','customer service','visual merchandising','sop','shift','staff scheduling'],
  finance: ['finance','accounting','bookkeeping','tally','tax','ledger','financial analysis','budget','audit'],
  hr: ['hr','human resources','recruitment','talent acquisition','onboarding','employee relations','performance management'],
  operations: ['operations','supply chain','logistics','process improvement','quality control','vendor','procurement'],
  sales: ['sales','lead generation','negotiation','client','crm','pipeline'],
  marketing: ['marketing','digital marketing','seo','brand','campaign','social media','content'],
  education: ['curriculum','classroom','student','education','teaching','assessment'],
  healthcare: ['patient','healthcare','clinical','medical','hipaa']
};

// Added: canonical non‑tech skill variant mapping -> single display label
const NON_TECH_SKILL_VARIANTS = {
  'Customer Service': ['customer service','customer support','customer care','client service','customer satisfaction'],
  'Inventory Management': ['inventory management','inventory control','stock management','stock control','inventory tracking'],
  'Visual Merchandising': ['visual merchandising','merchandising','store display','store layout','product presentation'],
  'SOP Compliance': ['sop compliance','sop','standard operating procedure','standard operating procedures','process compliance'],
  'Shrinkage Control': ['shrinkage control','loss prevention','inventory shrinkage','theft prevention'],
  'Sales': ['sales','sales techniques','sales strategy','selling','upselling'],
  'Communication': ['communication','communications','verbal communication','written communication'],
  'Excel': ['excel','ms excel','microsoft excel','spreadsheet'],
  'Tally': ['tally'],
  'Teamwork': ['teamwork','team work','collaboration','team collaboration'],
  'Leadership': ['leadership','team leadership','people management'],
  'Store Operations': ['store operations','store operation','retail operations'],
  'Staff Scheduling': ['staff scheduling','shift scheduling','shift roster','roster planning'],
  'Audit': ['audit','auditing','store audit'],
  'Process Improvement': ['process improvement','process optimization','workflow improvement']
};

// Small canonical TECH skill list for scoring
const CANONICAL_SKILLS = [
  'Python','JavaScript','React','Node.js','SQL','HTML','CSS','Java','C++','Docker','Kubernetes','Machine Learning','Data Analysis'
];

export function classifyDomain(text='') {
  const t = text.toLowerCase();
  let tech = 0, nonTech = 0;
  TECH_KEYWORDS.forEach(k=>{ if (t.includes(k)) tech++; });
  NON_TECH_KEYWORDS.forEach(k=>{ if (t.includes(k)) nonTech++; });
  return tech >= nonTech ? 'tech' : 'non-tech';
}

// Added: detect a more specific non‑tech sub-domain (retail / finance / etc.)
function detectNonTechSubDomain(text='') {
  const t = text.toLowerCase();
  let best = null; let bestScore = 0;
  Object.entries(NON_TECH_SUBDOMAINS).forEach(([sub, keys]) => {
    const score = keys.reduce((acc,k)=> acc + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = sub; }
  });
  return best; // may be null
}

// Updated: skill extraction now handles richer non‑tech mapping + canonicalization
export function extractSkills(text='', domain='tech') {
  const t = text.toLowerCase();
  if (domain === 'non-tech') {
    const found = new Set();
    Object.entries(NON_TECH_SKILL_VARIANTS).forEach(([canonical, variants]) => {
      if (variants.some(v => t.includes(v))) found.add(canonical);
    });
    if (!found.size) found.add('Customer Service');
    return [...found];
  }
  // Tech path (unchanged logic but ensures canonical casing)
  const pool = TECH_KEYWORDS;
  const found = new Set();
  pool.forEach(k=>{ if (t.includes(k)) {
    const canon = CANONICAL_SKILLS.find(c=>c.toLowerCase()===k) || k.replace(/(^|\s)([a-z])/g,(m,sp,ch)=>sp+ch.toUpperCase());
    found.add(canon);
  }});
  if (!found.size) found.add('Python');
  return [...found];
}

export function matchSkills(resumeSkills=[], jdSkills=[]) {
  const rSet = new Set(resumeSkills.map(s=>s.toLowerCase()));
  const present = jdSkills.filter(s=> rSet.has(s.toLowerCase()));
  const missing = jdSkills.filter(s=> !rSet.has(s.toLowerCase()));
  const base = jdSkills.length || 1;
  let rawScore = (present.length / base) * 100;
  const score = Math.min(100, Math.ceil(rawScore/5)*5);
  return { present, missing, score };
}

export function suggestProjects(domain, missing=[]) {
  const suggestions = [];
  if (domain==='tech') {
    suggestions.push('Build a CRUD web app with auth & database', 'Analyze a public dataset and publish a notebook');
    missing.slice(0,5).forEach(s=>{
      if (s==='React') suggestions.push('Create a React dashboard with charts');
      else if (s==='Node.js') suggestions.push('Develop an Express API with JWT');
      else if (s==='Machine Learning') suggestions.push('Train a classification model & evaluate metrics');
      else suggestions.push(`Build a mini project showcasing ${s}`);
    });
  } else {
    // Non‑tech tailored project ideas
    suggestions.push('Build an Excel inventory / performance tracking sheet','Create a mock staff shift scheduling plan','Draft a store audit & shrinkage control checklist');
    missing.slice(0,5).forEach(s => {
      if (s==='Inventory Management') suggestions.push('Implement a sample inventory tracker (in Excel or Google Sheets)');
      else if (s==='Visual Merchandising') suggestions.push('Design a seasonal visual merchandising layout plan');
      else if (s==='SOP Compliance') suggestions.push('Write a mini SOP handbook for daily store opening & closing');
      else if (s==='Shrinkage Control') suggestions.push('Create a loss prevention action log template');
      else if (s==='Staff Scheduling') suggestions.push('Produce a 1-week optimized shift roster with peak coverage');
      else suggestions.push(`Develop a practical improvement project for ${s}`);
    });
  }
  return [...new Set(suggestions)];
}

export async function analyzeResumeAndJD(resumeText, jdText) {
  const domain = classifyDomain(jdText + '\n' + resumeText);
  const subDomain = domain === 'non-tech' ? detectNonTechSubDomain(jdText + '\n' + resumeText) : null;
  const resumeSkills = extractSkills(resumeText, domain);
  const jdSkills = extractSkills(jdText, domain);
  const { present, missing, score } = matchSkills(resumeSkills, jdSkills);
  const projectSuggestions = suggestProjects(domain, missing);
  const primary = missing[0] || (domain==='tech' ? 'Python' : 'Customer Service');
  const domainBadge = domain === 'tech' ? 'Tech' : `Non-Tech${subDomain ? ' (' + subDomain.replace(/(^|-)\w/g,m=>m.toUpperCase()) + ')' : ''}`;
  return {
    domain,
    subDomain,
    domainBadge, // For direct UI display
    score,
    presentSkills: present,
    missingSkills: missing,
    jdSkills,
    resumeSkills,
    projectSuggestions,
    suggestions: projectSuggestions, // backwards compatibility
    skillToLearnFirst: primary
  };
}

// Optional helper for future file parsing
export async function extractPdfTextIfNeeded(file) {
  if (!file) return '';
  try {
    const data = await pdfParse(file.buffer);
    return data.text || '';
  } catch (e) {
    return '';
  }
}
