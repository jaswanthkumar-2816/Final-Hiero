const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const CURRICULUM_FILE = path.join(DATA_DIR, 'role-curriculum.json');
const ROADMAPS_FILE = path.join(DATA_DIR, 'roadmaps.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJSON(file, fallback) {
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
    return fallback;
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function roleKey(role) {
    return String(role || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function skillMatch(have, need) {
    const h = String(have || '').toLowerCase();
    const n = String(need || '').toLowerCase();
    return h === n || h.includes(n) || n.includes(h);
}

function loadCurriculum(role) {
    const all = loadJSON(CURRICULUM_FILE, {});
    const key = roleKey(role);
    if (all[key]) return { key, ...all[key] };
    const fuzzy = Object.keys(all).find((k) => key.includes(k) || k.includes(key));
    if (fuzzy && fuzzy !== 'default') return { key: fuzzy, ...all[fuzzy] };
    return { key: 'default', ...(all.default || { mustHave: [], goodToHave: [], projects: [] }) };
}

function buildPhases(currentYear, graduationYear) {
    const now = new Date();
    const grad = Number(graduationYear) || now.getFullYear() + (5 - (Number(currentYear) || 1));
    const year = Math.min(4, Math.max(1, Number(currentYear) || 1));
    const yearsLeft = Math.max(1, grad - now.getFullYear() + 1);
    const phaseCount = Math.min(4, Math.max(2, yearsLeft));
    const names = ['Foundations', 'Build projects', 'Internship-ready', 'Placement-ready'];
    const phases = [];
    for (let i = 0; i < phaseCount; i++) {
        const start = new Date(now.getFullYear(), now.getMonth() + i * 4, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + (i + 1) * 4, 0);
        if (i === phaseCount - 1) end.setFullYear(grad, 5, 30);
        phases.push({
            id: `phase-${i + 1}`,
            name: names[Math.min(i, names.length - 1)],
            order: i + 1,
            startMonth: start.toISOString().slice(0, 7),
            endMonth: end.toISOString().slice(0, 7),
            goals: []
        });
    }
    if (year === 1) phases[0].goals.push('Core basics for your dream role');
    if (phases[1]) phases[1].goals.push('Ship 1–2 portfolio projects');
    if (phases[2]) phases[2].goals.push('Apply for internships / campus drives');
    if (phases[3]) phases[3].goals.push('Placement applications + mock interviews');
    return { phases, graduationYear: grad, currentYear: year };
}

function generateRoadmap(body) {
    const domain = String(body.domain || '').trim() || 'General';
    const role = String(body.role || body.subdomain || '').trim() || 'Software Engineer';
    const profile = body.profile && typeof body.profile === 'object' ? body.profile : {};
    const haveSkills = []
        .concat(profile.skills || [])
        .concat(body.skills || [])
        .map(String)
        .filter(Boolean);

    const curriculum = loadCurriculum(role);
    const { phases, graduationYear, currentYear } = buildPhases(
        profile.currentYear || body.currentYear,
        profile.graduationYear || body.graduationYear
    );

    const skills = [];
    (curriculum.mustHave || []).forEach((name) => {
        const owned = haveSkills.some((s) => skillMatch(s, name));
        skills.push({
            name,
            priority: 'must-have',
            targetLevel: 'core',
            resources: [
                { label: `Learn ${name}`, href: `/quiz.html?skill=${encodeURIComponent(name)}` }
            ],
            status: owned ? 'have' : 'todo',
            masteryPct: owned ? 40 : 0
        });
    });
    (curriculum.goodToHave || []).forEach((name) => {
        const owned = haveSkills.some((s) => skillMatch(s, name));
        skills.push({
            name,
            priority: 'good-to-have',
            targetLevel: 'advanced',
            resources: [
                { label: `Learn ${name}`, href: `/quiz.html?skill=${encodeURIComponent(name)}` }
            ],
            status: owned ? 'have' : 'todo',
            masteryPct: owned ? 30 : 0
        });
    });

    const projects = (curriculum.projects || []).map((p, i) => ({
        id: `proj-${i + 1}`,
        title: p.title,
        difficulty: p.difficulty || 'medium',
        provesSkills: p.provesSkills || [],
        resumeBullet: p.resumeBullet || '',
        githubHint: p.githubHint || '',
        status: 'todo',
        phaseId: phases[Math.min(1, phases.length - 1)].id
    }));

    const milestones = [
        { id: 'm1', label: 'Finish foundations skills (must-have at 50%+)', dueBy: phases[0].endMonth, metric: 'skills_foundations', done: false },
        { id: 'm2', label: 'Ship first portfolio project', dueBy: (phases[1] || phases[0]).endMonth, metric: 'project_1', done: false },
        { id: 'm3', label: 'Internship / drive applications open', dueBy: (phases[2] || phases[phases.length - 1]).endMonth, metric: 'apply_window', done: false }
    ];

    const careerMoves = [
        { type: 'hackathon', whenPhase: phases[0].id, label: 'Join 1 campus hackathon', status: 'todo' },
        { type: 'cert', whenPhase: (phases[1] || phases[0]).id, label: 'Earn one role-relevant certification', status: 'todo' },
        { type: 'internship', whenPhase: (phases[2] || phases[phases.length - 1]).id, label: 'Apply to internships on Hiero / Connect drives', status: 'todo' },
        { type: 'apply', whenPhase: phases[phases.length - 1].id, label: 'Start placement / job applications', status: 'todo' }
    ];

    const mentorship = [
        { checkpointId: 'mentor-1', purpose: 'resume', label: 'Resume review after foundations', whenMilestone: 'm1', status: 'pending' },
        { checkpointId: 'mentor-2', purpose: 'project', label: 'Project review after first ship', whenMilestone: 'm2', status: 'pending' },
        { checkpointId: 'mentor-3', purpose: 'mock', label: 'Mock interview before apply window', whenMilestone: 'm3', status: 'pending' }
    ];

    const gapCount = skills.filter((s) => s.priority === 'must-have' && s.status === 'todo').length;

    return {
        id: `rm-${Date.now()}`,
        userId: body.userId || profile.email || 'guest',
        domain,
        role,
        curriculumKey: curriculum.key,
        tagline: 'Personalized and updated as you progress — not a perfect one-size plan.',
        baseline: {
            skills: haveSkills,
            cgpa: profile.cgpa || '',
            currentYear,
            graduationYear,
            college: profile.college || ''
        },
        target: {
            mustHave: curriculum.mustHave || [],
            goodToHave: curriculum.goodToHave || []
        },
        gapSummary: `${gapCount} must-have skill${gapCount === 1 ? '' : 's'} still open for ${role}`,
        phases,
        skills,
        projects,
        milestones,
        careerMoves,
        mentorship,
        links: {
            resumeScore: body.resumeScore || null,
            interviewScore: body.interviewScore || null,
            jobMatchScore: body.jobMatchScore || null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
    };
}

function persistRoadmap(roadmap) {
    const store = loadJSON(ROADMAPS_FILE, {});
    const uid = roadmap.userId || 'guest';
    store[uid] = roadmap;
    store.latest = roadmap;
    saveJSON(ROADMAPS_FILE, store);

    try {
        const Roadmap = require('../models/Roadmap');
        Roadmap.findOneAndUpdate(
            { userId: uid },
            { userId: uid, data: roadmap },
            { upsert: true, new: true }
        ).catch(() => {});
    } catch (e) {}

    return roadmap;
}

router.post('/generate', (req, res) => {
    try {
        const roadmap = generateRoadmap(req.body || {});
        persistRoadmap(roadmap);
        res.json({ success: true, roadmap });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/latest', (req, res) => {
    try {
        const store = loadJSON(ROADMAPS_FILE, {});
        const uid = req.query.userId || 'guest';
        const roadmap = store[uid] || store.latest || null;
        res.json({ success: true, roadmap });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/:userId', (req, res) => {
    try {
        const store = loadJSON(ROADMAPS_FILE, {});
        res.json({ success: true, roadmap: store[req.params.userId] || null });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.patch('/:id/progress', (req, res) => {
    try {
        const store = loadJSON(ROADMAPS_FILE, {});
        const body = req.body || {};
        let roadmap = null;
        for (const key of Object.keys(store)) {
            if (store[key] && store[key].id === req.params.id) {
                roadmap = store[key];
                break;
            }
        }
        if (!roadmap && store.latest && store.latest.id === req.params.id) roadmap = store.latest;
        if (!roadmap) return res.status(404).json({ success: false, error: 'Roadmap not found' });

        if (body.skillName) {
            const skill = (roadmap.skills || []).find((s) => skillMatch(s.name, body.skillName));
            if (skill) {
                if (body.masteryPct != null) skill.masteryPct = Number(body.masteryPct);
                if (body.status) skill.status = body.status;
                else if (skill.masteryPct >= 70) skill.status = 'done';
                else if (skill.masteryPct > 0) skill.status = 'learning';
            }
        }
        if (body.projectId) {
            const proj = (roadmap.projects || []).find((p) => p.id === body.projectId);
            if (proj && body.status) proj.status = body.status;
        }
        if (body.milestoneId) {
            const m = (roadmap.milestones || []).find((x) => x.id === body.milestoneId);
            if (m) m.done = !!body.done;
        }
        if (body.checkpointId) {
            const c = (roadmap.mentorship || []).find((x) => x.checkpointId === body.checkpointId);
            if (c && body.status) c.status = body.status;
        }
        if (body.links && typeof body.links === 'object') {
            roadmap.links = { ...(roadmap.links || {}), ...body.links };
        }
        roadmap.updatedAt = new Date().toISOString();
        persistRoadmap(roadmap);
        res.json({ success: true, roadmap });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
