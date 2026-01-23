// Test the enhanced domain-aware system

// Domain-specific skill banks
const DOMAIN_SKILL_BANKS = {
  tech: {
    core: ['Python', 'Java', 'JavaScript', 'SQL', 'React', 'Node.js'],
    advanced: ['Machine Learning', 'Docker', 'AWS', 'Kubernetes'],
  },
  nonTech: {
    retail: ['Customer Service', 'Visual Merchandising', 'Inventory Management'],
    finance: ['Financial Analysis', 'Accounting', 'Excel', 'Tally'],
    leadership: ['Team Management', 'Communication', 'Leadership']
  }
};

function enhancedDomainClassification(jdText) {
  const text = jdText.toLowerCase();
  
  const techKeywords = ['software', 'developer', 'programming', 'python', 'java', 'sql', 'api'];
  const nonTechKeywords = ['retail', 'store', 'sales', 'customer service', 'inventory', 'management'];
  
  let techScore = 0, nonTechScore = 0;
  for (const kw of techKeywords) if (text.includes(kw)) techScore++;
  for (const kw of nonTechKeywords) if (text.includes(kw)) nonTechScore++;
  
  return techScore > nonTechScore ? 'tech' : 'non-tech';
}

function dynamicSkillExtraction(text, domain) {
  const skills = domain === 'tech' ? 
    Object.values(DOMAIN_SKILL_BANKS.tech).flat() : 
    Object.values(DOMAIN_SKILL_BANKS.nonTech).flat();
  
  const found = [];
  const textLower = text.toLowerCase();
  
  for (const skill of skills) {
    if (textLower.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }
  return found;
}

function enhancedResumeMatching(resumeText, jdText) {
  const domain = enhancedDomainClassification(jdText);
  const resumeSkills = dynamicSkillExtraction(resumeText, domain);
  const jdSkills = dynamicSkillExtraction(jdText, domain);
  
  const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase()));
  const present = jdSkills.filter(s => resumeSet.has(s.toLowerCase()));
  const missing = jdSkills.filter(s => !resumeSet.has(s.toLowerCase()));
  
  const score = jdSkills.length > 0 ? Math.ceil((present.length / jdSkills.length) * 100 / 5) * 5 : 0;
  
  const suggestions = domain === 'tech' ? 
    ['Build a full-stack web app', 'Create REST API with documentation'] :
    ['Create Excel inventory system', 'Design customer service protocols'];
  
  return { domain, score, present, missing, jdSkills, resumeSkills, suggestions };
}

// Test cases
console.log('=== TEST 1: NON-TECH (Retail ASM) ===');
const asmResult = enhancedResumeMatching(
  'Customer Service Sales Excel Tally Communication Team Management',
  'Assistant Store Manager: Inventory Management, Customer Service, Visual Merchandising, Team Management'
);
console.log('Domain:', asmResult.domain);
console.log('Score:', asmResult.score + '%');
console.log('Present:', asmResult.present);
console.log('Missing:', asmResult.missing);
console.log('Suggestions:', asmResult.suggestions);

console.log('\n=== TEST 2: TECH (Software Developer) ===');
const devResult = enhancedResumeMatching(
  'Python JavaScript React SQL Node.js Git',
  'Software Developer: Python, React, Docker, AWS, Machine Learning, SQL'
);
console.log('Domain:', devResult.domain);
console.log('Score:', devResult.score + '%');
console.log('Present:', devResult.present);
console.log('Missing:', devResult.missing);
console.log('Suggestions:', devResult.suggestions);
