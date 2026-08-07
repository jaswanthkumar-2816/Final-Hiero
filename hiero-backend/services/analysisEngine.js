// =============================================================================
// analysisEngine.js — Hiero Career Platform — Strict Analysis Engine v2.0
// =============================================================================
// Produces comprehensive structured results:
//   matchedSkills, missingSkills, extraSkills, jdSkills, resumeSkills
//   jdSkillsWithImportance (Critical / Important / Optional tiers)
//   weighted score (Skills 40% + Projects 25% + Experience 15% + Education 10% + Bonus 10%)
//   atsScore, atsKeywords, atsFormatting, atsReadability, atsStructure, atsActionVerbs
//   recruiterInsights { strengths, concerns, proTip }
//   learningTrack with progress %
//   projectSuggestions with reason per suggestion
// =============================================================================

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ---------------------------------------------------------------------------
// COMPREHENSIVE SKILL LIBRARY (200+ skills)
// ---------------------------------------------------------------------------
const TECH_SKILLS = [
  'Python','JavaScript','TypeScript','Java','C++','C#','Go','Rust','PHP','Ruby','Swift','Kotlin','R','Scala','MATLAB',
  'React','React.js','Next.js','Vue.js','Angular','Svelte','HTML','CSS','Tailwind CSS','Bootstrap','SASS',
  'Node.js','Express.js','FastAPI','Django','Flask','Spring Boot','Laravel','NestJS','GraphQL','REST API','gRPC',
  'SQL','MySQL','PostgreSQL','MongoDB','Redis','Elasticsearch','Firebase','DynamoDB','SQLite','Cassandra','Oracle',
  'Machine Learning','Deep Learning','Data Science','NLP','Computer Vision','TensorFlow','PyTorch','Keras',
  'Scikit-learn','Pandas','NumPy','Matplotlib','Seaborn','OpenCV','Hugging Face','LLM','Generative AI',
  'Data Analysis','Data Visualization','Statistics','A/B Testing','Jupyter','Web Speech API',
  'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','Jenkins','GitHub Actions','Terraform','Ansible',
  'Linux','Bash','Shell Scripting','Nginx','Apache','Microservices','Serverless','Cloud Computing',
  'Git','GitHub','GitLab','Jira','Confluence','Agile','Scrum','Kanban','TDD','BDD','REST','API',
  'JWT','OAuth','WebSockets','Postman','Swagger','React Native','Flutter','Android','iOS',
  'Cybersecurity','Penetration Testing','OWASP','SSL/TLS','OpenAI','LangChain','Prompt Engineering',
];

const NON_TECH_SKILLS = [
  'Customer Service','Inventory Management','Visual Merchandising','SOP Compliance',
  'Shrinkage Control','Sales','Communication','Excel','Tally','Teamwork','Leadership',
  'Store Operations','Staff Scheduling','Audit','Process Improvement','Recruitment',
  'HR','Human Resources','Talent Acquisition','Onboarding','Performance Management',
  'Finance','Accounting','Bookkeeping','Tax','Financial Analysis','Budget',
  'Supply Chain','Logistics','Procurement','Vendor Management','Quality Control',
  'Marketing','Digital Marketing','SEO','Brand Management','Campaign Management',
  'Social Media','Content Writing','CRM','Lead Generation','Negotiation',
  'Teaching','Curriculum Development','Education','Training','Healthcare','Patient Care','HIPAA',
];

const ACTION_VERBS = [
  'built','developed','designed','implemented','deployed','optimized','improved',
  'created','led','managed','architected','reduced','increased','automated',
  'engineered','launched','delivered','integrated','maintained','collaborated',
  'analyzed','achieved','established','streamlined','accelerated',
];

const METRIC_PATTERNS = [
  /\d+\s*%/gi,
  /\$\s*\d+/gi,
  /\d+\s*(users|clients|customers|projects|months|years|hours|days|requests|ms|seconds)/gi,
  /\d+x\s*(faster|improvement|increase|decrease|growth)/gi,
  /(increased|decreased|improved|reduced|grew|boosted)\s+by\s+\d+/gi,
];

const TECH_INDICATORS = [
  'software','developer','engineer','programmer','data','machine learning','ai','ml','backend',
  'frontend','fullstack','devops','cloud','python','javascript','java','react','node','api',
  'database','algorithm','code','coding','system','architecture','deployment','stack',
];

const NON_TECH_INDICATORS = [
  'sales','marketing','retail','store','inventory','customer','hr','finance','accounting',
  'logistics','supply chain','operations','healthcare','education','teacher','nurse','manager',
];

// ---------------------------------------------------------------------------
// DOMAIN CLASSIFICATION
// ---------------------------------------------------------------------------
export function classifyDomain(text = '') {
  const t = text.toLowerCase();
  const techScore    = TECH_INDICATORS.reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0);
  const nonTechScore = NON_TECH_INDICATORS.reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0);
  return techScore >= nonTechScore ? 'tech' : 'non-tech';
}

// ---------------------------------------------------------------------------
// STRICT SKILL EXTRACTION (word boundary matching)
// ---------------------------------------------------------------------------
export function extractSkills(text = '', domain = 'tech') {
  const t = text.toLowerCase();
  const pool = domain === 'non-tech' ? NON_TECH_SKILLS : TECH_SKILLS;
  const found = new Set();

  pool.forEach(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
    const regex = new RegExp(`(^|[\\s,.:;()\\[\\]/\\-])${escaped}([\\s,.:;()\\[\\]/\\-]|$)`, 'i');
    if (regex.test(t)) found.add(skill);
  });

  if (!found.size) found.add(domain === 'tech' ? 'Python' : 'Customer Service');
  return [...found];
}

// ---------------------------------------------------------------------------
// IMPORTANCE TIER ASSIGNMENT
// ---------------------------------------------------------------------------
function assignImportanceTiers(jdText, jdSkills) {
  const t = jdText.toLowerCase();
  const scored = jdSkills.map(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const freq = (t.match(regex) || []).length;
    const pos  = t.indexOf(skill.toLowerCase());
    const posScore = pos === -1 ? 0 : Math.max(0, 100 - Math.round((pos / t.length) * 100));
    return { skill, score: freq * 10 + posScore };
  }).sort((a, b) => b.score - a.score);

  const n = scored.length;
  const critBound = Math.max(1, Math.round(n * 0.35));
  const impBound  = Math.max(critBound + 1, Math.round(n * 0.70));

  return scored.map((item, idx) => ({
    skill:      item.skill,
    importance: idx < critBound ? 'Critical' : idx < impBound ? 'Important' : 'Optional',
  }));
}

// ---------------------------------------------------------------------------
// SKILL MATCHING
// ---------------------------------------------------------------------------
export function matchSkills(resumeSkills = [], jdSkills = []) {
  const rSet = new Set(resumeSkills.map(s => s.toLowerCase().trim()));
  const jdSet = new Set(jdSkills.map(s => s.toLowerCase().trim()));

  const present  = jdSkills.filter(s => rSet.has(s.toLowerCase().trim()));
  const missing  = jdSkills.filter(s => !rSet.has(s.toLowerCase().trim()));
  const extra    = resumeSkills.filter(s => !jdSet.has(s.toLowerCase().trim()));
  const matchPct = (present.length / Math.max(jdSkills.length, 1)) * 100;

  return { present, missing, extra, matchPct };
}

// ---------------------------------------------------------------------------
// ATS SCORING (strict heuristics)
// ---------------------------------------------------------------------------
function computeATSScore(resumeText) {
  const t = resumeText.toLowerCase();

  const requiredSections = ['experience','education','skills','projects','summary','objective','achievements'];
  const foundSections    = requiredSections.filter(s => t.includes(s));
  const structureScore   = Math.round((foundSections.length / requiredSections.length) * 100);

  const verbsFound       = ACTION_VERBS.filter(v => new RegExp(`\\b${v}\\w*\\b`, 'i').test(resumeText));
  const actionVerbsScore = Math.min(100, Math.round((verbsFound.length / 10) * 100));

  const metricMatches    = METRIC_PATTERNS.reduce((c, p) => c + (resumeText.match(p) || []).length, 0);
  const achievementsScore = Math.min(100, metricMatches * 15);

  const wordCount        = resumeText.split(/\s+/).filter(Boolean).length;
  const formattingScore  = wordCount < 150 ? 50 : wordCount < 300 ? 70 : wordCount < 800 ? 95 : 85;

  const avgWordsPerLine  = wordCount / Math.max(resumeText.split('\n').length, 1);
  const readabilityScore = avgWordsPerLine > 20 ? 75 : avgWordsPerLine > 8 ? 92 : 80;

  const keywordsScore    = Math.min(100, Math.round(structureScore * 0.5 + actionVerbsScore * 0.3 + Math.min(achievementsScore, 30)));

  const finalATS = Math.round(
    keywordsScore    * 0.30 +
    formattingScore  * 0.20 +
    readabilityScore * 0.20 +
    structureScore   * 0.20 +
    actionVerbsScore * 0.10
  );

  return {
    atsScore:              Math.max(50, Math.min(100, finalATS)),
    atsKeywords:           Math.max(50, Math.min(100, keywordsScore)),
    atsFormatting:         Math.max(60, Math.min(100, formattingScore)),
    atsReadability:        Math.max(55, Math.min(100, readabilityScore)),
    atsStructure:          Math.max(50, Math.min(100, structureScore)),
    atsActionVerbs:        Math.max(40, Math.min(100, actionVerbsScore)),
    measurableAchievements: metricMatches,
  };
}

// ---------------------------------------------------------------------------
// WEIGHTED SCORE
// ---------------------------------------------------------------------------
function computeWeightedScore({ matchPct, resumeText, present, missing, extra, jdSkills }) {
  const skillsPts = Math.round((matchPct / 100) * 40);

  const hasProjects      = /project|built|developed|created|implemented|github|deployed/i.test(resumeText);
  const projectKeywords  = jdSkills.filter(s => resumeText.toLowerCase().includes(s.toLowerCase()));
  const projPts          = hasProjects
    ? Math.min(25, Math.round(15 + (projectKeywords.length / Math.max(jdSkills.length, 1)) * 10))
    : 8;

  const hasExp   = /experience|internship|worked at|employed|company|organization|role|position|junior|senior/i.test(resumeText);
  const yearsMatch = resumeText.match(/(\d+)\s*\+?\s*years?\s+(of\s+)?experience/i);
  const years    = yearsMatch ? parseInt(yearsMatch[1]) : 0;
  const expPts   = hasExp ? Math.min(15, 9 + Math.min(years * 2, 6)) : 5;

  const hasEdu   = /education|university|college|degree|bachelor|master|b\.tech|m\.tech|b\.e|m\.e|bsc|msc|phd/i.test(resumeText);
  const eduPts   = hasEdu ? 9 : 5;

  const bonusPts = Math.min(10, Math.round(extra.length * 1.5));

  const total = Math.min(100, skillsPts + projPts + expPts + eduPts + bonusPts);
  return { skillsPts, projPts, expPts, eduPts, bonusPts, finalScore: Math.max(20, total) };
}

// ---------------------------------------------------------------------------
// RECRUITER INSIGHTS
// ---------------------------------------------------------------------------
function generateRecruiterInsights(resumeText, present, missing, extra) {
  const strengths = [];
  const concerns  = [];

  if (present.length >= 5)                        strengths.push('Strong technical skill alignment with JD');
  if (/internship|intern/i.test(resumeText))       strengths.push('Relevant internship experience');
  if (/project|github|portfolio/i.test(resumeText)) strengths.push('Has project portfolio / GitHub');
  if (extra.length >= 3)                           strengths.push(`Brings ${extra.length} extra bonus skills beyond requirements`);
  if (/machine learning|ai|deep learning|llm|nlp/i.test(resumeText)) strengths.push('Strong AI/ML background');
  if (/full.?stack|backend.*frontend|frontend.*backend/i.test(resumeText)) strengths.push('Full stack development capabilities');
  if (strengths.length === 0)                      strengths.push('Good educational background');

  const metricCount = METRIC_PATTERNS.reduce((c, p) => c + (resumeText.match(p) || []).length, 0);
  if (metricCount < 2)  concerns.push('Projects lack measurable metrics — add numbers (e.g. 500+ users, 40% faster)');
  const sqlMissing = missing.find(s => /sql|database|db/i.test(s));
  if (sqlMissing)       concerns.push(`No ${sqlMissing} mentioned in resume`);
  const cloudMissing = missing.find(s => /cloud|aws|azure|gcp/i.test(s));
  if (cloudMissing)     concerns.push('No cloud deployment experience mentioned');
  if (!/agile|scrum/i.test(resumeText)) concerns.push('No Agile/Scrum methodology mentioned');
  if (concerns.length === 0 && missing.length > 0) concerns.push(`Missing ${missing.slice(0, 2).join(' and ')}`);

  const proTip = missing.length > 0
    ? `Add ${missing.slice(0, 3).join(', ')} to your skills and quantify project results to reach the top 10% of candidates.`
    : 'Excellent profile! Add measurable numbers to your bullet points to stand out even more.';

  return { strengths: strengths.slice(0, 5), concerns: concerns.slice(0, 4), proTip };
}

// ---------------------------------------------------------------------------
// LEARNING TRACK WITH PROGRESS
// ---------------------------------------------------------------------------
function generateLearningTrack(resumeText, matchedSkills, missingSkills) {
  const t = resumeText.toLowerCase();

  const matched = matchedSkills.slice(0, 2).map(skill => {
    const escaped  = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentions = (t.match(new RegExp(escaped, 'gi')) || []).length;
    return { skill, progress: Math.min(95, 50 + mentions * 15), priority: 'High', status: 'In Progress' };
  });

  const missingTrack = missingSkills.slice(0, 3).map((skill, i) => ({
    skill, progress: 0, priority: i === 0 ? 'High' : 'Medium', status: 'Not Started',
  }));

  return [...matched, ...missingTrack];
}

// ---------------------------------------------------------------------------
// PERSONALIZED PROJECT SUGGESTIONS
// ---------------------------------------------------------------------------
function generateProjectSuggestions(domain, missing) {
  const PROJECT_MAP = {
    'AWS':              { title: 'Deploy ML Model on AWS',                tags: ['AWS', 'EC2', 'S3', 'SageMaker'],     reason: 'missing Cloud Computing (AWS)' },
    'Cloud Computing':  { title: 'Cloud-Based Web App on AWS/GCP',        tags: ['AWS', 'Firebase', 'Serverless'],     reason: 'missing Cloud Computing' },
    'Docker':           { title: 'Containerized App with Docker Compose',  tags: ['Docker', 'Docker Compose', 'CI/CD'], reason: 'missing Docker' },
    'Kubernetes':       { title: 'Kubernetes Cluster Deployment',          tags: ['K8s', 'Helm', 'Docker', 'GKE'],     reason: 'missing Kubernetes' },
    'Machine Learning': { title: 'End-to-End ML Pipeline',                tags: ['Scikit-learn', 'Pandas', 'MLflow'],  reason: 'missing Machine Learning' },
    'SQL':              { title: 'Analytics Dashboard with SQL + Python',  tags: ['MySQL', 'PostgreSQL', 'Pandas'],     reason: 'missing SQL' },
    'React':            { title: 'React SPA with REST API Integration',   tags: ['React', 'Redux', 'Axios', 'Tailwind'], reason: 'missing React.js' },
    'React.js':         { title: 'React SPA with REST API Integration',   tags: ['React', 'Redux', 'Axios', 'Tailwind'], reason: 'missing React.js' },
    'Node.js':          { title: 'Node.js REST API with Auth & Tests',    tags: ['Node.js', 'Express', 'JWT', 'MongoDB'], reason: 'missing Node.js' },
    'Agile':            { title: 'Agile Sprint Board App',                tags: ['Scrum', 'Jira', 'Kanban'],           reason: 'missing Agile/Scrum' },
    'Agile / Scrum':    { title: 'Agile Sprint Board App',                tags: ['Scrum', 'Jira', 'Kanban'],           reason: 'missing Agile/Scrum' },
    'TypeScript':       { title: 'TypeScript Full-Stack App',             tags: ['TypeScript', 'Next.js', 'Prisma'],   reason: 'missing TypeScript' },
    'GraphQL':          { title: 'GraphQL API with Apollo',               tags: ['GraphQL', 'Apollo', 'React'],        reason: 'missing GraphQL' },
    'Python':           { title: 'Python Automation & Data Pipeline',     tags: ['Python', 'Pandas', 'FastAPI'],       reason: 'missing Python' },
    'Pandas':           { title: 'Data Analysis Project with Pandas',     tags: ['Pandas', 'NumPy', 'Matplotlib'],     reason: 'missing Pandas' },
    'TensorFlow':       { title: 'Image Classifier with TensorFlow',      tags: ['TensorFlow', 'Keras', 'CNN'],        reason: 'missing TensorFlow' },
  };

  const suggestions = [];
  const seen = new Set();

  for (const skill of missing) {
    if (suggestions.length >= 3) break;
    const proj = PROJECT_MAP[skill];
    if (proj && !seen.has(proj.title)) {
      seen.add(proj.title);
      suggestions.push({ ...proj, skillGap: skill, impact: suggestions.length === 0 ? 'High Impact' : 'Recommended' });
    }
  }

  const defaults = domain === 'tech'
    ? [
        { title: 'Personal Portfolio Website',       tags: ['React', 'CSS', 'GitHub Pages'], reason: 'showcase your projects',   skillGap: 'Portfolio',    impact: 'Recommended' },
        { title: 'Full-Stack CRUD App with Auth',    tags: ['Node.js', 'React', 'MongoDB'],  reason: 'demonstrate full-stack skills', skillGap: 'Full Stack', impact: 'Recommended' },
        { title: 'Data Dashboard with Charts',       tags: ['Python', 'Pandas', 'Streamlit'], reason: 'show data analysis skills', skillGap: 'Data',        impact: 'Medium Impact' },
      ]
    : [
        { title: 'Excel KPI Tracking Dashboard',     tags: ['Excel', 'Pivot Tables'],        reason: 'demonstrate data skills',  skillGap: 'Data',         impact: 'Recommended' },
        { title: 'Process Improvement Case Study',   tags: ['Flowchart', 'Analysis'],        reason: 'show analytical thinking', skillGap: 'Operations',   impact: 'Recommended' },
      ];

  for (const d of defaults) {
    if (suggestions.length >= 3) break;
    if (!seen.has(d.title)) { seen.add(d.title); suggestions.push(d); }
  }

  return suggestions.slice(0, 3);
}

// ---------------------------------------------------------------------------
// MAIN ENTRY POINT
// ---------------------------------------------------------------------------
export async function analyzeResumeAndJD(resumeText, jdText) {
  const domain     = classifyDomain(jdText + '\n' + resumeText);
  const domainBadge = domain === 'tech' ? 'Tech' : 'Non-Tech';

  const resumeSkills = extractSkills(resumeText, domain);
  const jdSkills     = extractSkills(jdText, domain);

  const { present, missing, extra, matchPct } = matchSkills(resumeSkills, jdSkills);

  const { skillsPts, projPts, expPts, eduPts, bonusPts, finalScore } = computeWeightedScore({
    matchPct, resumeText, present, missing, extra, jdSkills,
  });

  const jdSkillsWithImportance = assignImportanceTiers(jdText, jdSkills);
  const atsData                = computeATSScore(resumeText);
  const recruiterInsights      = generateRecruiterInsights(resumeText, present, missing, extra);
  const learningTrack          = generateLearningTrack(resumeText, present, missing);
  const projectSuggestions     = generateProjectSuggestions(domain, missing);

  const scoreBreakdown = {
    skillsMatch:      { pts: skillsPts, max: 40, pct: Math.round((skillsPts / 40) * 100) },
    projectRelevance: { pts: projPts,   max: 25, pct: Math.round((projPts / 25) * 100) },
    experience:       { pts: expPts,    max: 15, pct: Math.round((expPts / 15) * 100) },
    education:        { pts: eduPts,    max: 10, pct: Math.round((eduPts / 10) * 100) },
    bonusSkills:      { pts: bonusPts,  max: 10, pct: Math.round((bonusPts / 10) * 100) },
    total:            skillsPts + projPts + expPts + eduPts + bonusPts,
  };

  const missingCritical = jdSkillsWithImportance
    .filter(j => j.importance === 'Critical' && missing.includes(j.skill)).length;

  const interviewChance = Math.min(98, Math.max(30,
    Math.round(finalScore * 0.5 + atsData.atsScore * 0.3 + 20 - missingCritical * 5)
  ));

  return {
    domain,
    domainBadge,
    score: finalScore,
    resumeSkills,
    jdSkills,
    matchedSkills:          present,
    presentSkills:          present,
    missingSkills:          missing,
    extraSkills:            extra,
    jdSkillsWithImportance,
    scoreBreakdown,
    skillsPts, projPts, expPts, eduPts, bonusPts,
    ...atsData,
    interviewChance,
    ppoReadiness:    Math.round(interviewChance * 0.97),
    profileStrength: Math.round((finalScore + atsData.atsScore) / 2),
    recruiterInsights,
    learningTrack,
    projectSuggestions,
    suggestions: projectSuggestions,
    skillToLearnFirst: missing[0] || present[0] || 'JavaScript',
  };
}

// ---------------------------------------------------------------------------
// PDF TEXT EXTRACTION HELPER
// ---------------------------------------------------------------------------
export async function extractPdfTextIfNeeded(file) {
  if (!file) return '';
  try {
    const data = await pdfParse(file.buffer);
    return data.text || '';
  } catch (e) {
    return '';
  }
}
