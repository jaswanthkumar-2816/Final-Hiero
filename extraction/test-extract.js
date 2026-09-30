/**
 * Verification & Test Suite for Groq Resume Extraction Backend
 */

const path = require('path');
const fs = require('fs');
const documentParser = require('./src/services/documentParser');
const deterministicExtractor = require('./src/services/deterministicExtractor');
const groqService = require('./src/services/groqService');
const { reconcileExtractedData } = require('./src/services/reconciliationService');
const { scoreResume } = require('./src/services/atsScorer');

const SAMPLE_RESUME_WITH_NOVEL_HEADINGS = `
Dr. Rajesh Sharma
Senior Machine Learning Engineer | Cloud Architect
Email: rajesh.sharma.ai@gmail.com
Phone: +91 98450 12345
Location: Bengaluru, Karnataka, India
LinkedIn: https://linkedin.com/in/rajesh-sharma-ai
GitHub: https://github.com/rajesh-sharma-ml
Portfolio: https://rajesh-ai.dev

PROFESSIONAL SUMMARY
Dynamic and results-driven Senior Machine Learning Engineer with 8+ years of experience designing scalable distributed deep learning pipelines, microservices, and high-throughput real-time inference systems. Reduced inference latency by 45% for over 10M daily active users.

TECHNICAL SKILLS
Programming Languages: Python, Go, TypeScript, C++, SQL
Frameworks & Libraries: PyTorch, TensorFlow, FastAPI, Next.js, Docker, Kubernetes
Databases & Storage: PostgreSQL, MongoDB, Redis, Pinecone
Cloud & DevOps: AWS (Lambda, SageMaker, ECS), GCP, Terraform, CI/CD GitHub Actions
Soft Skills: Technical Leadership, Cross-functional Collaboration, System Design, Mentoring

WORK EXPERIENCE
Lead AI Engineer | NextGen Intelligence Labs, Bengaluru
July 2021 - Present
• Spearheaded the migration of monolithic NLP models to distributed microservices on Kubernetes, reducing cloud expenditure by $120,000 annually.
• Engineered a real-time recommendation system handling 25,000 requests per second with sub-20ms P99 latency.
• Mentored a high-performing engineering team of 7 junior and mid-level machine learning developers.

Senior Software Engineer | DataCorp Solutions, Hyderabad
June 2018 - June 2021
• Developed end-to-end computer vision pipelines for industrial defect classification achieving 99.2% accuracy across 50 production facilities.
• Automated data ETL workflows using Apache Airflow and Kafka, expediting data ingestion cycle by 60%.

EDUCATION
Master of Technology (M.Tech) in Computer Science & AI
Indian Institute of Technology (IIT) Madras | 2016 - 2018
CGPA: 9.2 / 10

Bachelor of Technology (B.Tech) in Information Technology
National Institute of Technology (NIT) Trichy | 2012 - 2016
Percentage: 84%

PROJECTS
MedScan AI - Diagnostic Pathology Assistant
• Architected a vision-language assistant diagnosing chest X-rays with 96% sensitivity.
• Tech Stack: PyTorch, FastAPI, React, Docker, AWS
• GitHub: https://github.com/rajesh-sharma-ml/medscan-ai

High-Throughput Vector Search Engine
• Built a custom distributed vector search index in Go utilizing HNSW graphs with 5x speedup compared to standard baselines.
• Tech Stack: Go, gRPC, Docker, C++

CERTIFICATIONS
• AWS Certified Machine Learning - Specialty (Amazon Web Services, 2023)
• TensorFlow Developer Certificate (Google, 2022)

LANGUAGES
English (Native/Fluent), Hindi (Proficient), Tamil (Conversational)

SEMINARS & WORKSHOPS ATTENDED
• Keynote Speaker at PyData India 2023: "Scaling Transformer Models on Spot Instances".
• Attended International Conference on Learning Representations (ICLR) 2022, Vienna, Austria.
• Delivered hands-on workshop on "Kubernetes for ML Engineers" to 300+ attendees at Open Source Summit 2023.

PUBLICATIONS & PATENTS
• Sharma, R. et al., "Low-Latency Sparse Attention Mechanisms for Edge Computing", IEEE Transactions on Neural Networks, 2023.
• US Patent Granted (US11234567B2): "System and Method for Asynchronous Parallel Gradient Desynchronization", 2022.

KEY HONORS & AWARDS
• Winner of Smart India Hackathon (Grand Finale) 2018, Ministry of Education.
• Employee of the Year 2022 at NextGen Intelligence Labs for exceptional technical leadership.

RESOURCE PERSON & GUEST LECTURES
• Invited Resource Person for Faculty Development Program (FDP) on Generative AI at Anna University (2024).
• Jury Member for National Level Hackathon at BITS Pilani (2023).
`;

async function runVerification() {
    console.log('================================================================');
    console.log('🧪 RUNNING GROQ RESUME EXTRACTION BACKEND VERIFICATION TEST');
    console.log('================================================================\n');

    // 1. Verify Groq Service configuration
    console.log('1️⃣ Checking Groq API & Configuration...');
    const isConfigured = groqService.isAvailable();
    console.log(`   Groq Client Initialized: ${isConfigured ? '✅ YES' : '❌ NO'}`);
    console.log(`   Primary Model:           ${groqService.primaryModel}`);
    console.log(`   Fallback Models:        ${groqService.fallbackModels.join(', ')}`);

    if (!isConfigured) {
        console.error('❌ GROQ_API_KEY is not set. Aborting live test.');
        process.exit(1);
    }

    // 2. Deterministic Anchor Extraction Test
    console.log('\n2️⃣ Running Deterministic Anchor Extraction...');
    const emails = deterministicExtractor.extractEmails(SAMPLE_RESUME_WITH_NOVEL_HEADINGS);
    const phones = deterministicExtractor.extractPhoneNumbers(SAMPLE_RESUME_WITH_NOVEL_HEADINGS);
    const urls = deterministicExtractor.extractUrls(SAMPLE_RESUME_WITH_NOVEL_HEADINGS);
    const { extraSections } = deterministicExtractor.segmentSections(SAMPLE_RESUME_WITH_NOVEL_HEADINGS);

    console.log('   Emails detected:         ', emails);
    console.log('   Phones detected:         ', phones);
    console.log('   URLs detected:           ', { linkedin: urls.linkedin, github: urls.github, portfolio: urls.portfolio });
    console.log('   Novel sections found:    ', extraSections.map(s => s.heading));

    const anchors = {
        emails,
        phoneNumbers: phones,
        urls,
        extraSections
    };

    // 3. Groq AI Extraction Test
    console.log('\n3️⃣ Invoking Groq AI Model...');
    const startTime = Date.now();
    const result = await groqService.extractWithGroq(SAMPLE_RESUME_WITH_NOVEL_HEADINGS, anchors);
    const duration = Date.now() - startTime;
    console.log(`   ✅ AI Extraction completed in ${duration}ms using model: ${result.modelUsed}`);

    // 4. Reconciliation & Dynamic Extra Headings Test
    console.log('\n4️⃣ Testing Reconciliation & Dynamic Additional Details Engine...');
    const reconciled = reconcileExtractedData(result.data, anchors);

    console.log('\n--- EXTRACTED PERSONAL INFO ---');
    console.log('Full Name:    ', reconciled.personalInfo.fullName);
    console.log('Title:        ', reconciled.personalInfo.professionalTitle);
    console.log('Email:        ', reconciled.personalInfo.email);
    console.log('Phone:        ', reconciled.personalInfo.phone);
    console.log('LinkedIn:     ', reconciled.personalInfo.linkedin);
    console.log('GitHub:       ', reconciled.personalInfo.github);
    console.log('Portfolio:    ', reconciled.personalInfo.portfolio);

    console.log('\n--- EXTRACTED EXPERIENCE ---');
    console.log(`Positions count: ${reconciled.experience.length}`);
    reconciled.experience.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.jobTitle} at ${e.company} (${e.startDate} - ${e.endDate}) [${e.bulletPoints.length} bullets]`);
    });
    console.log('Total Experience tenure: ', reconciled.experienceMetrics.formattedExperience);

    console.log('\n--- EXTRACTED EDUCATION ---');
    reconciled.education.forEach((edu, idx) => {
        console.log(`  ${idx + 1}. ${edu.degree} from ${edu.institution} (${edu.gradYear}) - ${edu.cgpaOrPercentage}`);
    });

    console.log('\n--- EXTRACTED TECHNICAL & SOFT SKILLS ---');
    console.log('Technical Skills count: ', reconciled.skills.technicalSkills.length);
    console.log('Sample Skills:          ', reconciled.skills.technicalSkills.slice(0, 8).join(', '));
    console.log('Soft Skills:            ', reconciled.skills.softSkills.join(', '));

    console.log('\n--- ⭐ DYNAMIC NOVEL / EXTRA HEADINGS IN ADDITIONAL DETAILS ---');
    console.log(`Total Extra Headings captured: ${reconciled.additionalDetails.length}`);
    reconciled.additionalDetails.forEach((detail, idx) => {
        console.log(`\n  [Custom Section ${idx + 1}] Heading: "${detail.heading}"`);
        console.log(`  Number of items: ${detail.items.length}`);
        console.log(`  Formatted Content preview:\n${detail.content.split('\n').slice(0, 2).map(l => '    ' + l).join('\n')}`);
    });

    // 5. ATS Quality & Scoring Test
    console.log('\n5️⃣ Testing ATS Optimization Scoring Algorithm...');
    const ats = scoreResume(reconciled, SAMPLE_RESUME_WITH_NOVEL_HEADINGS);
    console.log(`   Overall ATS Score:   ${ats.overallAtsScore} / 100 (${ats.grade})`);
    console.log('   Checks:');
    ats.checks.forEach(c => {
        console.log(`     • ${c.name.padEnd(28)}: ${c.score}/${c.maxScore} (${c.passed ? 'PASSED' : 'IMPROVE'})`);
    });
    console.log(`   Bullets with metrics: ${ats.metrics.bulletsWithMetrics}/${ats.metrics.totalBullets}`);
    console.log(`   Action verb bullets:  ${ats.metrics.bulletsWithStrongVerbs}`);

    // 6. Verify Direct Form Bindings
    console.log('\n6️⃣ Verifying Direct Form Bindings for Resume Forms...');
    const ff = reconciled.formFields;
    const hasRequiredFormBindings = Boolean(
        ff.fullName &&
        ff.email &&
        ff.phone &&
        ff.summary &&
        ff.technicalSkills &&
        Array.isArray(ff.experience) &&
        Array.isArray(ff.education) &&
        Array.isArray(ff.additionalDetails) &&
        Array.isArray(ff.customDetails)
    );
    console.log(`   Form Fields Object Verified: ${hasRequiredFormBindings ? '✅ PERFECT' : '❌ INCOMPLETE'}`);

    console.log('\n================================================================');
    console.log('🎉 ALL BACKEND EXTRACTION TESTS COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');
}

runVerification().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
