const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');
const COMPS_FILE = path.join(DATA_DIR, 'companies.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJSON(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error(`[Opportunities API] Error loading ${filePath}:`, e.message);
    }
    return defaultValue;
}

function saveJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`[Opportunities API] Error saving ${filePath}:`, e.message);
    }
}

// Initial seed if empty
let opportunities = loadJSON(OPPS_FILE, [
    {
        id: 'opp-demo-1',
        companyId: 'comp-acme-tech',
        companyName: 'Acme AI Systems',
        type: 'internship',
        title: 'Full Stack & AI Engineer Intern',
        department: 'AI & Engineering',
        description: 'Join Acme AI Systems to build scalable generative AI tools and full-stack web applications for enterprise clients.',
        requiredSkills: [
            { id: 'sk-1', name: 'Python', category: 'required' },
            { id: 'sk-2', name: 'React', category: 'required' },
            { id: 'sk-3', name: 'TypeScript', category: 'required' }
        ],
        preferredSkills: [
            { id: 'sk-4', name: 'PyTorch', category: 'preferred' },
            { id: 'sk-5', name: 'Docker', category: 'preferred' }
        ],
        eligibility: 'B.Tech / B.E / M.Tech in CS or related fields',
        location: 'Bangalore, India (Hybrid)',
        workMode: 'hybrid',
        employmentType: 'Internship',
        salary: '₹35,000 / month',
        deadline: '2026-11-30',
        status: 'active',
        applicantsCount: 14,
        shortlistedCount: 3,
        createdAt: new Date().toISOString().split('T')[0]
    }
]);

let companies = loadJSON(COMPS_FILE, [
    {
        id: 'comp-acme-tech',
        name: 'Acme AI Systems',
        logoUrl: '',
        location: 'Bangalore, India',
        description: 'Pioneering next-gen AI automation and intelligence engines.',
        website: 'https://acme.ai'
    }
]);

// GET /api/opportunities - Fetch all active opportunities & associated companies
const axios = require('axios');
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5050';

// GET /api/opportunities - Fetch all active opportunities & associated companies
router.get('/', async (req, res) => {
    try {
        const { companyId, type } = req.query;
        let pyData = null;
        try {
            const pyRes = await axios.get(`${PYTHON_BACKEND_URL}/api/opportunities`, { timeout: 1500 });
            if (pyRes.status === 200 && pyRes.data && pyRes.data.opportunities) {
                pyData = pyRes.data;
            }
        } catch (pyErr) {
            // fallback silently
        }

        let filtered = pyData ? pyData.opportunities : loadJSON(OPPS_FILE, opportunities);
        let comps = pyData ? pyData.companies : loadJSON(COMPS_FILE, companies);

        if (companyId) {
            filtered = filtered.filter(o => o.companyId === companyId);
        }
        if (type) {
            filtered = filtered.filter(o => o.type === type);
        }

        res.json({
            success: true,
            opportunities: filtered,
            companies: comps
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/opportunities - Create a new opportunity from Connect-Portal or API
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (!body.title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const currentOpps = loadJSON(OPPS_FILE, opportunities);
        const currentComps = loadJSON(COMPS_FILE, companies);

        const companyId = body.companyId || `comp-${(body.companyName || 'partner').toLowerCase().replace(/\s+/g, '-')}`;
        const companyName = body.companyName || 'Verified HR Partner';

        // Check if company exists, if not create record
        let comp = currentComps.find(c => c.id === companyId);
        if (!comp) {
            comp = {
                id: companyId,
                name: companyName,
                logoUrl: body.logoUrl || '',
                location: body.location || 'India (Hybrid/Remote)',
                description: body.companyDescription || 'Verified partner company connecting directly with HIERO AI talent network.',
                website: body.website || ''
            };
            currentComps.unshift(comp);
            saveJSON(COMPS_FILE, currentComps);
            companies = currentComps;
        }

        const newOpp = {
            id: body.id || `opp-${Date.now()}`,
            companyId: companyId,
            companyName: companyName,
            logoUrl: body.logoUrl || comp.logoUrl || '',
            type: body.type || 'internship',
            title: body.title,
            department: body.department || 'Engineering',
            description: body.description || '',
            requiredSkills: body.requiredSkills || [],
            preferredSkills: body.preferredSkills || [],
            eligibility: body.eligibility || 'B.Tech/BE/MCA',
            location: body.location || 'India (Hybrid/Remote)',
            workMode: body.workMode || 'hybrid',
            employmentType: body.employmentType || (body.type === 'internship' ? 'Internship' : 'Full-time'),
            salary: body.salary || 'Competitive',
            deadline: body.deadline || '2026-12-31',
            status: 'active',
            applicantsCount: 0,
            shortlistedCount: 0,
            createdAt: new Date().toISOString().split('T')[0]
        };

        currentOpps.unshift(newOpp);
        saveJSON(OPPS_FILE, currentOpps);
        opportunities = currentOpps;

        // Async sync to Python backend on port 5050
        try {
            await axios.post(`${PYTHON_BACKEND_URL}/api/opportunities`, newOpp, { timeout: 2000 });
            console.log(`⚡ [Opportunities Route] Synced "${newOpp.title}" to Python Backend (5050)`);
        } catch (e) {
            // Warning log
        }

        console.log(`✨ [Opportunities Backend] New opportunity published: "${newOpp.title}" by ${companyName}`);

        res.status(201).json({
            success: true,
            opportunity: newOpp,
            company: comp
        });
    } catch (e) {
        console.error('Error creating opportunity:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// APPS_FILE for application persistence
const APPS_FILE = path.join(DATA_DIR, 'applications.json');

// POST /api/opportunities/apply - Candidate applies to an opportunity
router.post('/apply', (req, res) => {
    try {
        const body = req.body;
        const opportunityId = body.opportunityId || body.jobId || 'opp-demo-1';
        const companyName = body.companyName || 'Verified HR Partner';

        const currentOpps = loadJSON(OPPS_FILE, opportunities);
        const currentApps = loadJSON(APPS_FILE, []);

        const targetOpp = currentOpps.find(o => o.id === opportunityId || o.companyName === companyName);
        if (targetOpp) {
            targetOpp.applicantsCount = (targetOpp.applicantsCount || 0) + 1;
            saveJSON(OPPS_FILE, currentOpps);
        }

        const newApp = {
            id: `app-${Date.now()}`,
            opportunityId: targetOpp ? targetOpp.id : opportunityId,
            companyName: companyName,
            studentId: body.studentId || 'cand-1',
            studentName: body.studentName || 'Jaswanth Kumar',
            email: body.email || 'candidate@hiero.in',
            status: 'applied',
            matchScore: body.matchScore || 92,
            appliedAt: new Date().toISOString(),
            resumeUrl: body.resumeUrl || '/resumes/jaswanth_resume.pdf',
            skillsMatch: body.skillsMatch || {
                matched: ['Python', 'React', 'TypeScript', 'SQL'],
                missing: ['Docker']
            }
        };

        currentApps.unshift(newApp);
        saveJSON(APPS_FILE, currentApps);

        console.log(`📩 [Opportunities Backend] New application received for "${companyName}" (Role: ${targetOpp ? targetOpp.title : 'Software Engineer'})`);

        res.status(201).json({
            success: true,
            application: newApp
        });
    } catch (e) {
        console.error('Error submitting application:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/opportunities/applications - Fetch applications for Connect-Portal HR Inbox
router.get('/applications', (req, res) => {
    try {
        const { companyId, opportunityId } = req.query;
        let apps = loadJSON(APPS_FILE, []);
        if (opportunityId) {
            apps = apps.filter(a => a.opportunityId === opportunityId);
        }
        res.json({
            success: true,
            applications: apps
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
