const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');
const crypto = require('crypto');
const EvalQuestionBank = require('../models/EvalQuestionBank');
const EvalAttempt = require('../models/EvalAttempt');
const UserSkill = require('../models/UserSkill');
const Resume = require('../models/Resume');

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'qwen/qwen3.8-27b';

const LEVELS = {
    1: { quizCount: 3, codingCount: 0, timeSec: 5 * 60, passPct: 70, quizPool: 18, codingPool: 0, label: 'Level 1 · Easy', minutes: 5 },
    2: { quizCount: 5, codingCount: 1, timeSec: 20 * 60, passPct: 75, quizPool: 18, codingPool: 6, label: 'Level 2 · Mid', minutes: 20 },
    3: { quizCount: 7, codingCount: 3, timeSec: 45 * 60, passPct: 80, quizPool: 20, codingPool: 8, label: 'Level 3 · Hard', minutes: 45 }
};
const LEVEL_CERT = {
    1: { name: 'BEGINNER', tagline: 'BUILDING YOUR FOUNDATION' },
    2: { name: 'INTERMEDIATE', tagline: 'STRENGTHENING YOUR CORE' },
    3: { name: 'ADVANCED', tagline: 'MASTERING THE SKILL' }
};

function countQuizCorrect(attempt, answers) {
    const ans = answers || attempt.answers || [];
    let quizCorrect = 0;
    (attempt.quizItems || []).forEach((q, i) => {
        if (Number(ans[i]) === Number(q.correctIndex)) quizCorrect += 1;
    });
    return quizCorrect;
}

function lookupCandidateName(userId, fallback) {
    const clean = (value) => {
        const name = String(value || '').replace(/\s+/g, ' ').trim();
        if (!name) return '';
        const lower = name.toLowerCase();
        if (['user', 'hiero learner', 'your name', 'guest', 'guest-user', 'undefined', 'null'].includes(lower)) return '';
        return name;
    };
    const fromBody = clean(fallback);
    if (fromBody) return fromBody;
    try {
        const auth = require('./auth');
        const users = auth.users || [];
        const uid = String(userId || '');
        const user = users.find((u) =>
            String(u.id) === uid ||
            String(u.email) === uid ||
            String(u.googleId) === uid
        );
        return clean(user && (user.name || user.fullName || user.username));
    } catch (e) {
        return '';
    }
}

function certificateFields(attempt, extras = {}) {
    const quizTotal = (attempt.quizItems || []).length;
    const quizCorrect = extras.quizCorrect != null ? extras.quizCorrect : countQuizCorrect(attempt);
    const coding = extras.codingResults || attempt.codingSubmissions || [];
    const codingSolved = coding.filter((c) => Number(c.totalTests) > 0 && Number(c.passedTests) >= Number(c.totalTests)).length;
    const codingTotal = (attempt.codingItems || []).length;
    const level = Number(attempt.level) || 1;
    const meta = LEVEL_CERT[level] || LEVEL_CERT[1];
    const rawId = String(attempt._id || crypto.randomBytes(3).toString('hex'));
    const candidateName = lookupCandidateName(attempt.userId, extras.candidateName);
    return {
        quizCorrect,
        quizTotal,
        codingSolved,
        codingTotal,
        questionsSolved: quizCorrect + codingSolved,
        questionsTotal: quizTotal + codingTotal,
        level,
        levelName: meta.name,
        levelTagline: meta.tagline,
        skillName: attempt.skillName || '',
        certificateId: 'H-QUIZ-' + rawId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase(),
        issuedAt: (attempt.submittedAt || new Date()).toISOString(),
        candidateName,
        fullName: candidateName
    };
}
const COOLDOWN_HOURS = 0; // temporarily disabled — set back to 24 to restore fail cooldown
const MAX_ATTEMPTS_PER_MONTH = 0; // temporarily disabled — set back to 8 to restore monthly cap

function skillIdOf(name) {
    return String(name || 'python').toLowerCase().replace(/[^a-z0-9+]+/g, '-').replace(/^-|-$/g, '') || 'python';
}

function shuffle(list) {
    const arr = [...(list || [])];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickN(list, n) {
    return shuffle(list).slice(0, n);
}

function q(id, question, options, correctIndex, subTopic, difficulty) {
    return { id, question, options, correctIndex, subTopic, difficulty };
}

function skillQuizBank(skill, level) {
    const s = String(skill || '').toLowerCase();
    const git = {
        1: [
            q('git-1-1', 'What does `git status` show?', ['The full commit history of every branch', 'What is changed, staged, or untracked in your working tree right now', 'Only the files that were deleted', 'Remote pull-request comments'], 1, 'Basic commands', 'Easy'),
            q('git-1-2', 'What does `git add file.txt` do?', ['Commits file.txt to the remote', 'Deletes file.txt from the repo', 'Puts file.txt in the staging area for the next commit', 'Creates a new branch named file.txt'], 2, 'Staging & commits', 'Easy'),
            q('git-1-3', 'A Git commit is best described as:', ['A saved snapshot of the staged changes, with a message', 'A backup zip of the whole computer', 'A lock that stops other people editing', 'A temporary undo that disappears on restart'], 0, 'Staging & commits', 'Easy'),
            q('git-1-4', 'What is a branch in Git?', ['A copy of the .git folder on disk', 'A movable pointer to a line of commits', 'A deleted commit', 'A remote-only tag'], 1, 'Branching', 'Easy'),
            q('git-1-5', 'Which command creates a new commit from staged files?', ['git push', 'git commit -m "message"', 'git clone', 'git status'], 1, 'Staging & commits', 'Easy'),
            q('git-1-6', 'What does `git log` show?', ['Only untracked files', 'The history of commits', 'Your Git password', 'Disk space used by node_modules'], 1, 'Basic commands', 'Easy'),
            q('git-1-7', 'The working tree is:', ['The files you see and edit in the project folder', 'Only files on GitHub', 'The stash list', 'The reflog'], 0, 'Basic commands', 'Easy'),
            q('git-1-8', 'What does `git clone <url>` do?', ['Deletes a remote repo', 'Copies a remote repository onto your machine', 'Renames the current branch', 'Pushes your commits'], 1, 'Basic commands', 'Easy')
        ],
        2: [
            q('git-2-1', 'What is the main difference between merge and rebase?', ['Merge deletes history; rebase cannot', 'Merge creates a merge commit that joins histories; rebase replays your commits on top of another branch', 'They are the same command', 'Rebase only works on tags'], 1, 'Merging', 'Medium'),
            q('git-2-2', 'What does `git fetch` do?', ['Downloads remote updates but does not change your current branch files', 'Uploads all local commits', 'Deletes remote branches', 'Creates a merge commit automatically'], 0, 'Remotes', 'Medium'),
            q('git-2-3', 'What does `git pull` usually do?', ['Only shows the diff', 'Fetch from the remote, then merge (or rebase) into your current branch', 'Pushes and then deletes the branch', 'Resets hard to origin'], 1, 'Remotes', 'Medium'),
            q('git-2-4', 'You see <<<<<<< HEAD in a file. What is that?', ['A comment Git ignores', 'A merge conflict marker showing both sides of a clash', 'A successful merge', 'A signed tag'], 1, 'Conflicts', 'Medium'),
            q('git-2-5', 'origin/main means:', ['Your local main branch', 'The main branch as last seen on the remote named origin', 'A stash', 'The first commit ever'], 1, 'Remotes', 'Medium'),
            q('git-2-6', 'When should you rebase instead of merge?', ['To keep a linear history of your local commits on top of updated main, before sharing', 'To delete the remote', 'Whenever you want to lose commits', 'Only after git clone'], 0, 'Rebase', 'Medium'),
            q('git-2-7', 'git checkout -- file.txt (or git restore file.txt) does what?', ['Pushes the file', 'Discards local uncommitted changes in that file', 'Creates a branch', 'Renames the file on the remote'], 1, 'Conflicts', 'Medium'),
            q('git-2-8', 'A fast-forward merge happens when:', ['Histories diverged and Git must create a merge commit', 'The branch you merge in is a straight continuation, so Git just moves the pointer', 'You rebase onto a tag', 'The repo is empty'], 1, 'Merging', 'Medium')
        ],
        3: [
            q('git-3-1', 'What is git reflog useful for?', ['Finding commits that are no longer on a branch, including after a reset', 'Changing the remote URL only', 'Formatting patches for email', 'Signing tags'], 0, 'Recovery', 'Hard'),
            q('git-3-2', 'git reset --hard HEAD~1 will:', ['Keep changes staged', 'Move HEAD back one commit and discard those changes from the working tree', 'Only unstage files', 'Push the undo to origin'], 1, 'History rewrite', 'Hard'),
            q('git-3-3', 'A Git hook is:', ['A script that runs on a Git event, such as pre-commit', 'A remote alias', 'A merge strategy', 'A packed object'], 0, 'Hooks', 'Hard'),
            q('git-3-4', 'git cherry-pick <hash> does what?', ['Deletes that commit', 'Copies that commit onto your current branch', 'Renames the branch', 'Fetches one file'], 1, 'History rewrite', 'Hard')
        ]
    };
    const python = {
        1: [
            q('py-1-1', 'What does a Python function return if it has no return statement?', ['0', 'None', 'False', 'An error'], 1, 'Functions', 'Easy'),
            q('py-1-2', 'Which symbol starts a comment in Python?', ['//', '#', '<!--', '--'], 1, 'Syntax', 'Easy'),
            q('py-1-3', 'How do you write a list of three numbers in Python?', ['(1, 2, 3)', '{1, 2, 3} as the only option', '[1, 2, 3]', 'list 1 2 3'], 2, 'Variables', 'Easy')
        ],
        2: [
            q('py-2-1', 'When is a dictionary a better choice than a list?', ['When you look up values by a key', 'When you only need the first item', 'Never', 'Only for numbers'], 0, 'Lists & dicts', 'Medium'),
            q('py-2-2', 'What does `len("git")` return?', ['2', '3', '4', 'Error'], 1, 'Syntax', 'Medium')
        ],
        3: [
            q('py-3-1', 'A decorator in Python is used to:', ['Wrap a function and change or extend its behavior', 'Delete a class', 'Compile C code', 'Open a socket'], 0, 'Decorators', 'Hard')
        ]
    };
    const java = {
        1: [
            q('jv-1-1', 'What is the difference between a class and an object?', ['They are the same', 'A class is the blueprint; an object is one instance created from it', 'An object is the blueprint; a class is in memory only', 'Classes cannot have methods'], 1, 'Classes & objects', 'Easy'),
            q('jv-1-2', 'A constructor is used to:', ['Destroy an object', 'Create and initialize a new object', 'Import a package', 'End the program'], 1, 'Constructors', 'Easy')
        ],
        2: [
            q('jv-2-1', 'An interface in Java is best used when:', ['You want a contract of methods that classes can implement', 'You need a single concrete class only', 'You want to store primitives', 'You want to replace main()'], 0, 'Interfaces', 'Medium')
        ],
        3: [
            q('jv-3-1', 'Which collection is best for lookups by a unique key?', ['ArrayList', 'HashMap', 'LinkedList', 'Stack only'], 1, 'Collections', 'Hard')
        ]
    };
    let bank = git;
    if (s.includes('python')) bank = python;
    else if (s.includes('java') || s.includes('oop')) bank = java;
    else if (!s.includes('git')) {
        const label = skill || 'this skill';
        bank = {
            1: [q('g-1-1', `What is the first thing you should understand about ${label}?`, [`How ${label} is used in a real workflow`, 'Only interview trivia', 'Keyboard shortcuts only', 'It can be ignored'], 0, 'Core concepts', 'Easy')],
            2: [q('g-2-1', `When two ${label} approaches differ, you should:`, ['Pick at random', 'Choose based on the problem constraints', 'Always use the newest tool', 'Avoid both'], 1, 'Practical patterns', 'Medium')],
            3: [q('g-3-1', `What is the safest recovery step when ${label} goes wrong?`, ['Delete everything immediately', 'Understand the current state, then apply a known fix', 'Ignore the error', 'Restart the OS only'], 1, 'Best practices', 'Hard')]
        };
    }
    const list = bank[level] || bank[1] || [];
    return list.map((item, i) => ({ ...item, id: item.id || `sk-${level}-${i + 1}` }));
}

function fallbackQuiz(skill, level) {
    const curated = skillQuizBank(skill, level);
    const need = LEVELS[level].quizPool;
    if (curated.length >= LEVELS[level].quizCount) {
        const out = [];
        while (out.length < need) {
            curated.forEach((item, i) => {
                if (out.length >= need) return;
                out.push({ ...item, id: `${item.id}-p${out.length + 1}` });
            });
        }
        return out;
    }
    return curated;
}

function looksGenericQuestion(q) {
    return /which statement is most accurate/i.test(String(q?.question || ''));
}

function fallbackCoding(skill, level) {
    return [
        {
            id: `fb-c-${level}-1`,
            prompt: 'Write count_staged(statuses). statuses is a list of strings like "staged" or "unstaged". Return how many items equal "staged".',
            starterCode: 'def count_staged(statuses):\n    # return how many items are exactly "staged"\n    return 0\n',
            functionName: 'count_staged',
            testCases: [
                { name: 'two', args: [['staged', 'unstaged', 'staged']], expected: 2 },
                { name: 'none', args: [['unstaged', 'unstaged']], expected: 0 },
                { name: 'empty', args: [[]], expected: 0 }
            ],
            timeLimitSec: 8,
            subTopic: 'Functions',
            difficulty: 'Medium'
        },
        {
            id: `fb-c-${level}-2`,
            prompt: 'Write last_word(message). Return the last word in the commit message string. Words are separated by spaces.',
            starterCode: 'def last_word(message):\n    # return the last word\n    return ""\n',
            functionName: 'last_word',
            testCases: [
                { name: 'basic', args: ['fix login bug'], expected: 'bug' },
                { name: 'one', args: ['init'], expected: 'init' },
                { name: 'spaces', args: ['add new file'], expected: 'file' }
            ],
            timeLimitSec: 8,
            subTopic: 'Strings',
            difficulty: 'Medium'
        }
    ].slice(0, Math.max(LEVELS[level].codingPool, 1));
}

async function generateBank(skillName, level) {
    const cfg = LEVELS[level];
    let quizPool = [];
    let codingPool = [];
    if (GROQ_API_KEY) {
        try {
            const prompt = `Generate a Hiero Eval question bank for skill "${skillName}" at Level ${level}.
Return ONLY valid JSON:
{
  "quiz": [
    { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "subTopic": "...", "difficulty": "Easy|Medium|Hard" }
  ],
  "coding": [
    { "prompt": "single-function problem", "starterCode": "def solve(...):\\n    pass\\n", "functionName": "solve", "testCases": [{"name":"t1","args":[1],"expected":1}], "subTopic": "...", "difficulty": "Easy" }
  ]
}
Rules:
- quiz length: ${cfg.quizPool}
- coding length: ${cfg.codingPool}
- Each question must be a concrete fact or scenario, not "which statement is most accurate"
- Each option must be a full, distinct answer. Exactly one is correct.
- Tag every item with a real subTopic of ${skillName}
- Coding questions must be single-function Python, no files, no imports
- 3-5 hidden-style testCases per coding item`;
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 5000
            }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 25000 });
            const raw = groqRes.data.choices?.[0]?.message?.content || '';
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                quizPool = (parsed.quiz || []).map((q, i) => ({
                    id: `q-${level}-${i + 1}`,
                    question: q.question,
                    options: (q.options || []).slice(0, 4),
                    correctIndex: Number(q.correctIndex) || 0,
                    subTopic: q.subTopic || 'Core concepts',
                    difficulty: q.difficulty || 'Easy'
                }));
                codingPool = (parsed.coding || []).map((c, i) => ({
                    id: `c-${level}-${i + 1}`,
                    prompt: c.prompt,
                    starterCode: c.starterCode || 'def solve(n):\n    return n\n',
                    functionName: c.functionName || 'solve',
                    testCases: (c.testCases || []).slice(0, 5),
                    timeLimitSec: 8,
                    subTopic: c.subTopic || 'Functions',
                    difficulty: c.difficulty || 'Medium'
                }));
            }
        } catch (e) {
            console.warn('[Eval] Groq bank error:', e.message);
        }
    }
    if (quizPool.length < cfg.quizCount || quizPool.some(looksGenericQuestion)) quizPool = fallbackQuiz(skillName, level);
    if (cfg.codingCount && codingPool.length < cfg.codingCount) codingPool = fallbackCoding(skillName, level);
    return { quizPool, codingPool, source: quizPool[0]?.id?.startsWith('fb-') ? 'fallback' : 'ai_generated' };
}

async function getBank(skillName, level) {
    const skillId = skillIdOf(skillName);
    let bank = null;
    try {
        bank = await EvalQuestionBank.findOne({ skillId, level });
        if (
            bank &&
            bank.cachedUntil > new Date() &&
            (bank.quizPool || []).length >= LEVELS[level].quizCount &&
            !(bank.quizPool || []).some(looksGenericQuestion)
        ) {
            return bank;
        }
    } catch (e) {}
    const generated = await generateBank(skillName, level);
    try {
        bank = await EvalQuestionBank.findOneAndUpdate(
            { skillId, level },
            {
                skillId,
                skillName,
                level,
                quizPool: generated.quizPool,
                codingPool: generated.codingPool,
                source: generated.source,
                generatedAt: new Date(),
                cachedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            { upsert: true, new: true }
        );
    } catch (e) {
        return { skillId, skillName, level, ...generated };
    }
    return bank;
}

function recommendedLevel(userSkill) {
    const tier = String(userSkill?.proficiencyLevel || 'foundational');
    if (tier === 'advanced' || tier === 'masterclass') return 3;
    if (tier === 'core') return 2;
    return 1;
}

async function recentAttempts(userId, skillId) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return EvalAttempt.find({ userId, skillId, startedAt: { $gte: monthAgo } }).sort({ startedAt: -1 });
}

router.get('/config', (req, res) => {
    res.json({
        success: true,
        levels: LEVELS,
        cooldownHours: COOLDOWN_HOURS,
        maxAttemptsPerMonth: MAX_ATTEMPTS_PER_MONTH,
        failPolicy: 'unverified',
        failPolicyNote: 'A failed eval never removes the skill from the resume. It stays unverified until the user passes.'
    });
});

router.get('/status', async (req, res) => {
    const userId = String(req.query.userId || 'guest-user');
    const skillName = String(req.query.skill || req.query.skillName || '').trim();
    if (!skillName) return res.status(400).json({ success: false, error: 'skill required' });
    const skillId = skillIdOf(skillName);
    let userSkill = null;
    try { userSkill = await UserSkill.findOne({ userId, skillId }); } catch (e) {}
    const attempts = await recentAttempts(userId, skillId).catch(() => []);
    const lastFail = attempts.find((a) => a.status === 'submitted' && !a.passed);
    let cooldownUntil = null;
    if (COOLDOWN_HOURS > 0 && lastFail && lastFail.submittedAt) {
        const until = new Date(lastFail.submittedAt.getTime() + COOLDOWN_HOURS * 3600 * 1000);
        if (until > new Date()) cooldownUntil = until;
    }
    const levelHistory = { 1: null, 2: null, 3: null };
    for (const a of attempts) {
        if (a.status !== 'submitted' || !a.level || levelHistory[a.level]) continue;
        levelHistory[a.level] = {
            score: a.score,
            passed: !!a.passed,
            submittedAt: a.submittedAt || a.startedAt
        };
    }
    const previews = { 1: null, 2: null, 3: null };
    try {
        const banks = await EvalQuestionBank.find({ skillId }).lean();
        for (const bank of banks || []) {
            const topics = [...new Set((bank.quizPool || []).map((q) => q.subTopic).filter(Boolean))].slice(0, 4);
            const sample = (bank.quizPool || []).find((q) => q.question)?.question || '';
            if (topics.length || sample) previews[bank.level] = { topics, sample };
        }
    } catch (e) {}
    res.json({
        success: true,
        skillName,
        skillId,
        recommendedLevel: recommendedLevel(userSkill),
        verifiedLevel: userSkill?.verifiedLevel || null,
        verifiedAt: userSkill?.verifiedAt || null,
        evalScore: userSkill?.evalScore || null,
        status: userSkill?.status || 'learning',
        attemptsThisMonth: attempts.length,
        cooldownUntil,
        cooldownHours: COOLDOWN_HOURS,
        canStart: !cooldownUntil && (MAX_ATTEMPTS_PER_MONTH === 0 || attempts.length < MAX_ATTEMPTS_PER_MONTH),
        levelHistory,
        previews
    });
});

router.post('/start', async (req, res) => {
    const { userId = 'guest-user', skill, skillName, level, challengeUp } = req.body || {};
    const name = String(skill || skillName || '').trim();
    if (!name) return res.status(400).json({ success: false, error: 'skill required' });
    const skillId = skillIdOf(name);
    let userSkill = null;
    try { userSkill = await UserSkill.findOne({ userId, skillId }); } catch (e) {}
    const recommended = recommendedLevel(userSkill);
    let chosen = Number(level) || recommended;
    if (chosen < 1 || chosen > 3) chosen = recommended;
    if (chosen > recommended && !challengeUp && chosen !== Number(level)) chosen = recommended;

    const attempts = await recentAttempts(userId, skillId).catch(() => []);
    if (MAX_ATTEMPTS_PER_MONTH > 0 && attempts.length >= MAX_ATTEMPTS_PER_MONTH) {
        return res.status(429).json({ success: false, error: 'Monthly attempt cap reached. Try again next month.' });
    }
    const lastFail = attempts.find((a) => a.status === 'submitted' && !a.passed);
    if (COOLDOWN_HOURS > 0 && lastFail?.submittedAt && Date.now() - lastFail.submittedAt.getTime() < COOLDOWN_HOURS * 3600 * 1000) {
        return res.status(429).json({
            success: false,
            error: `Wait ${COOLDOWN_HOURS} hours after a failed eval before retrying.`,
            cooldownUntil: new Date(lastFail.submittedAt.getTime() + COOLDOWN_HOURS * 3600 * 1000)
        });
    }

    const cfg = LEVELS[chosen];
    const bank = await getBank(name, chosen);
    const quizItems = pickN(bank.quizPool || [], cfg.quizCount).map((q) => {
        const options = [...(q.options || [])];
        const correctText = options[Number(q.correctIndex) || 0];
        const shuffled = shuffle(options);
        return {
            id: q.id || crypto.randomUUID(),
            question: q.question,
            options: shuffled,
            correctIndex: Math.max(0, shuffled.indexOf(correctText)),
            subTopic: q.subTopic
        };
    });
    const codingItems = pickN(bank.codingPool || [], cfg.codingCount).map((c) => ({
        id: c.id || crypto.randomUUID(),
        prompt: c.prompt,
        starterCode: c.starterCode,
        functionName: c.functionName,
        testCases: c.testCases,
        subTopic: c.subTopic
    }));

    const attempt = await EvalAttempt.create({
        userId,
        skillId,
        skillName: name,
        level: chosen,
        questionIds: quizItems.map((q) => q.id),
        codingQuestionIds: codingItems.map((c) => c.id),
        quizItems,
        codingItems,
        timeLimitSec: cfg.timeSec,
        passThreshold: cfg.passPct,
        status: 'in_progress',
        startedAt: new Date()
    });

    res.json({
        success: true,
        attemptId: attempt._id,
        level: chosen,
        recommendedLevel: recommended,
        challengeUp: chosen > recommended,
        label: cfg.label,
        timeLimitSec: cfg.timeSec,
        passThreshold: cfg.passPct,
        quiz: quizItems.map((q) => ({ id: q.id, question: q.question, options: q.options, subTopic: q.subTopic })),
        coding: codingItems.map((c) => ({
            id: c.id,
            prompt: c.prompt,
            starterCode: c.starterCode,
            functionName: c.functionName,
            subTopic: c.subTopic,
            testCount: (c.testCases || []).length
        }))
    });
});

function runPythonFunction(code, functionName, testCases, timeoutSec = 8) {
    const tests = JSON.stringify(testCases || []);
    const script = `
import json, traceback
USER_CODE = ${JSON.stringify(code)}
FN = ${JSON.stringify(functionName)}
CASES = json.loads(${JSON.stringify(tests)})
ns = {}
results = []
try:
    exec(USER_CODE, ns, ns)
    fn = ns.get(FN)
    if not callable(fn):
        raise Exception('Function %s not found' % FN)
    for i, case in enumerate(CASES):
        args = case.get('args')
        if not isinstance(args, list):
            args = [args]
        expected = case.get('expected')
        try:
            actual = fn(*args)
            ok = actual == expected
            results.append({"name": case.get("name") or ("Test %s" % (i+1)), "passed": ok, "expected": expected, "actual": actual})
        except Exception as e:
            results.append({"name": case.get("name") or ("Test %s" % (i+1)), "passed": False, "expected": expected, "actual": str(e)})
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e), "results": []}))
else:
    print(json.dumps({"ok": True, "results": results}))
`;
    return new Promise((resolve) => {
        const child = spawn('python3', ['-c', script], { timeout: (timeoutSec + 1) * 1000 });
        let out = '';
        let err = '';
        const t = setTimeout(() => {
            child.kill('SIGKILL');
            resolve({ ok: false, error: 'Time limit exceeded', results: [] });
        }, timeoutSec * 1000);
        child.stdout.on('data', (d) => { out += d.toString(); });
        child.stderr.on('data', (d) => { err += d.toString(); });
        child.on('close', () => {
            clearTimeout(t);
            try {
                const last = out.trim().split('\n').pop();
                resolve(JSON.parse(last));
            } catch (e) {
                resolve({ ok: false, error: err || e.message, results: [] });
            }
        });
    });
}

router.post('/run-code', async (req, res) => {
    const { attemptId, questionId, code } = req.body || {};
    const attempt = await EvalAttempt.findById(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
        return res.status(400).json({ success: false, error: 'No active eval attempt.' });
    }
    const item = (attempt.codingItems || []).find((c) => c.id === questionId);
    if (!item) return res.status(400).json({ success: false, error: 'Coding question not found.' });
    const result = await runPythonFunction(code || '', item.functionName, item.testCases, 8);
    const passedTests = (result.results || []).filter((r) => r.passed).length;
    const totalTests = (item.testCases || []).length || (result.results || []).length;
    res.json({
        success: true,
        passedTests,
        totalTests,
        score: totalTests ? Math.round((passedTests / totalTests) * 100) : 0,
        results: result.results || [],
        error: result.error || null
    });
});

router.post('/heartbeat', async (req, res) => {
    const {
        attemptId, tabSwitch, copyPaste, event, durationSec, note,
        warningCount, flaggedForReview, cameraOn, cameraDenied, consented
    } = req.body || {};
    const attempt = await EvalAttempt.findById(attemptId);
    if (!attempt || attempt.status !== 'in_progress') return res.json({ success: true });
    if (tabSwitch) attempt.tabSwitches = (attempt.tabSwitches || 0) + 1;
    if (copyPaste) attempt.copyPasteEvents = (attempt.copyPasteEvents || 0) + 1;
    if (consented && !attempt.proctorConsentedAt) attempt.proctorConsentedAt = new Date();
    if (cameraOn != null) attempt.proctorCameraOn = !!cameraOn;
    if (cameraDenied) attempt.proctorCameraDenied = true;
    if (event) {
        attempt.proctorFlags = attempt.proctorFlags || [];
        attempt.proctorFlags.push({
            type: event,
            at: new Date(),
            durationSec: Number(durationSec) || 0,
            note: note || ''
        });
        if (attempt.proctorFlags.length > 50) attempt.proctorFlags = attempt.proctorFlags.slice(-50);
    }
    if (warningCount != null) attempt.proctorWarningCount = Number(warningCount) || 0;
    if (flaggedForReview) attempt.flaggedForReview = true;
    await attempt.save();
    res.json({
        success: true,
        tabSwitches: attempt.tabSwitches,
        copyPasteEvents: attempt.copyPasteEvents,
        warningCount: attempt.proctorWarningCount,
        flaggedForReview: attempt.flaggedForReview
    });
});

router.post('/submit', async (req, res) => {
    const { attemptId, answers = [], codingSubmissions = [], fullName, candidateName } = req.body || {};
    const attempt = await EvalAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found.' });
    if (attempt.status !== 'in_progress') {
        const cert = attempt.passed
            ? certificateFields(attempt, { candidateName: fullName || candidateName || attempt.candidateName })
            : {};
        return res.json({
            success: true,
            alreadySubmitted: true,
            passed: attempt.passed,
            score: attempt.score,
            weakSubTopics: attempt.weakSubTopics,
            ...cert
        });
    }
    const elapsed = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    if (elapsed > (attempt.timeLimitSec || 300) + 15) {
        attempt.status = 'expired';
    }

    let quizCorrect = 0;
    const weak = new Set();
    (attempt.quizItems || []).forEach((q, i) => {
        const ans = Number(answers[i]);
        if (ans === Number(q.correctIndex)) quizCorrect += 1;
        else if (q.subTopic) weak.add(q.subTopic);
    });
    const quizScore = (attempt.quizItems || []).length ? quizCorrect / attempt.quizItems.length : 1;

    const codingResults = [];
    for (const item of attempt.codingItems || []) {
        const sub = (codingSubmissions || []).find((s) => s.questionId === item.id) || {};
        const ran = await runPythonFunction(sub.code || '', item.functionName, item.testCases, 8);
        const passedTests = (ran.results || []).filter((r) => r.passed).length;
        const totalTests = (item.testCases || []).length || 1;
        const part = passedTests / totalTests;
        if (part < 1 && item.subTopic) weak.add(item.subTopic);
        codingResults.push({
            questionId: item.id,
            code: sub.code || '',
            passedTests,
            totalTests,
            score: Math.round(part * 100)
        });
    }
    const codingScore = codingResults.length
        ? codingResults.reduce((s, c) => s + c.score, 0) / (codingResults.length * 100)
        : 1;
    const quizWeight = attempt.codingItems.length ? 0.6 : 1;
    const codingWeight = attempt.codingItems.length ? 0.4 : 0;
    const score = Math.round((quizScore * quizWeight + codingScore * codingWeight) * 100);
    const passed = score >= (attempt.passThreshold || 70) && attempt.status !== 'expired';

    attempt.answers = answers;
    attempt.codingSubmissions = codingResults;
    attempt.score = score;
    attempt.passed = passed;
    attempt.timeTakenSec = elapsed;
    attempt.weakSubTopics = [...weak];
    if (req.body?.flaggedForReview || attempt.flaggedForReview) attempt.flaggedForReview = true;
    if (req.body?.endedForProctor) attempt.endedForProctor = true;
    if (req.body?.warningCount != null) attempt.proctorWarningCount = Number(req.body.warningCount) || attempt.proctorWarningCount || 0;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    const cert = passed
        ? certificateFields(attempt, { quizCorrect, codingResults, candidateName: fullName || candidateName })
        : null;
    if (cert?.candidateName) attempt.candidateName = cert.candidateName;
    await attempt.save();

    try {
        const update = {
            skillName: attempt.skillName,
            lastAttemptAt: new Date(),
            evalScore: score,
            updatedAt: new Date()
        };
        if (passed) {
            update.status = 'validated';
            update.verifiedLevel = attempt.level;
            update.verifiedAt = new Date();
            update.score = Math.max(score, 0);
        }
        await UserSkill.findOneAndUpdate(
            { userId: attempt.userId, skillId: attempt.skillId },
            { $set: update, $setOnInsert: { userId: attempt.userId, skillId: attempt.skillId, proficiencyLevel: 'foundational' } },
            { upsert: true, new: true }
        );
    } catch (e) {
        console.warn('[Eval] UserSkill update failed:', e.message);
    }

    const learnTrack = attempt.level === 1 ? 'beginner' : 'intermediate';
    res.json({
        success: true,
        passed,
        score,
        passThreshold: attempt.passThreshold,
        level: attempt.level,
        timeTakenSec: elapsed,
        weakSubTopics: attempt.weakSubTopics,
        tabSwitches: attempt.tabSwitches,
        flaggedForReview: !!attempt.flaggedForReview,
        endedForProctor: !!attempt.endedForProctor,
        proctorWarningCount: attempt.proctorWarningCount || 0,
        failPolicy: 'unverified',
        resumeNote: passed
            ? (attempt.flaggedForReview
                ? `Verified — Level ${attempt.level} is on your profile. This session was flagged for review.`
                : `Verified — Level ${attempt.level} is now on your profile.`)
            : 'This skill stays on your resume as unverified. Improve the missed topics, then re-verify.',
        nextLevel: passed && attempt.level < 3 ? attempt.level + 1 : null,
        next: passed
            ? (attempt.level < 3
                ? { level: attempt.level + 1, label: `Start Level ${attempt.level + 1}` }
                : null)
            : {
                href: `learn-${learnTrack}.html?skill=${encodeURIComponent(attempt.skillName)}&track=${learnTrack}&gap=${encodeURIComponent(attempt.weakSubTopics[0] || '')}`,
                label: 'Improve missed topics'
            },
        ...(passed && cert ? cert : {})
    });
});

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function skillNameOf(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.name || item.skill || item.label || item.title || '';
}

function mentionsSkill(text, skill) {
    if (!text || !skill) return false;
    return new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i').test(String(text));
}

function upsertSkillString(str, skill, badge) {
    const current = String(str || '').trim();
    if (!current) return badge;
    const re = new RegExp(`\\b${escapeRegex(skill)}\\b(?:\\s*\\([^)]*Hiero Verified[^)]*\\))?`, 'i');
    if (re.test(current)) return current.replace(re, badge);
    if (/\n/.test(current) && /:/.test(current)) return `${current.replace(/\s*$/, '')}\nHiero verified: ${badge}`;
    return `${current.replace(/\s*$/, '')}, ${badge}`;
}

function upsertSkillArray(list, skill, badge) {
    const next = Array.isArray(list) ? [...list] : [];
    const idx = next.findIndex((item) => mentionsSkill(skillNameOf(item), skill));
    if (idx >= 0) {
        const cur = next[idx];
        next[idx] = (cur && typeof cur === 'object')
            ? { ...cur, name: skill, skill, label: badge, verified: true }
            : badge;
    } else {
        next.push(badge);
    }
    return next;
}

function upsertSkillField(field, skill, badge) {
    if (field == null || field === '') return badge;
    if (typeof field === 'string') return upsertSkillString(field, skill, badge);
    if (Array.isArray(field)) return upsertSkillArray(field, skill, badge);
    if (typeof field === 'object') {
        const next = { ...field };
        const keys = Object.keys(next);
        let placed = false;
        for (const key of keys) {
            if (mentionsSkill(JSON.stringify(next[key]), skill)) {
                next[key] = upsertSkillField(next[key], skill, badge);
                placed = true;
                break;
            }
        }
        if (!placed) next.verified = upsertSkillArray(next.verified || [], skill, badge);
        return next;
    }
    return badge;
}

function upsertCert(field, skill, cert) {
    if (Array.isArray(field)) {
        if (field.some((item) => mentionsSkill(skillNameOf(item), skill) && /hiero/i.test(skillNameOf(item)))) {
            return field.map((item) => (mentionsSkill(skillNameOf(item), skill) && /hiero/i.test(skillNameOf(item)) ? cert : item));
        }
        return [...field, cert];
    }
    if (typeof field === 'string' && field.trim()) {
        if (mentionsSkill(field, skill) && /hiero/i.test(field)) return field;
        return `${field.replace(/\s*$/, '')}\n${cert}`;
    }
    return [cert];
}

function pickResume(incoming, stored) {
    const a = incoming && typeof incoming === 'object' ? incoming : {};
    const b = stored && typeof stored === 'object' ? stored : {};
    const incomingLooksReal = !!(a.personalInfo || a.technicalSkills || a.experience || a.education || a.skills);
    if (incomingLooksReal) return { ...b, ...a };
    return { ...a, ...b };
}

function addVerifiedSkillToResume(raw, skill, level, score) {
    const data = raw && typeof raw === 'object' ? JSON.parse(JSON.stringify(raw)) : {};
    const badge = `${skill} (Hiero Verified · Level ${level})`;
    const cert = `Hiero Eval Verified — ${skill} Level ${level}${score ? ` · ${score}%` : ''}`;

    data.technicalSkills = upsertSkillField(data.technicalSkills, skill, badge);
    data.skills = upsertSkillField(data.skills, skill, badge);
    if (data.personalInfo && typeof data.personalInfo === 'object') {
        if (data.personalInfo.skills) data.personalInfo.skills = upsertSkillField(data.personalInfo.skills, skill, badge);
        if (!data.personalInfo.fullName && data.fullName) data.personalInfo.fullName = data.fullName;
    } else if (data.fullName) {
        data.personalInfo = { ...(data.personalInfo || {}), fullName: data.fullName };
    }
    if (!data.fullName && data.personalInfo?.fullName) data.fullName = data.personalInfo.fullName;

    data.matchedSkills = upsertSkillArray(data.matchedSkills || [], skill, badge);
    if (Array.isArray(data.missingSkills)) {
        data.missingSkills = data.missingSkills.filter((item) => !mentionsSkill(skillNameOf(item), skill));
    }
    data.certifications = upsertCert(data.certifications, skill, cert);
    if (data.professional_certifications) {
        data.professional_certifications = upsertCert(data.professional_certifications, skill, cert);
    }
    const verified = Array.isArray(data.verifiedSkills) ? [...data.verifiedSkills] : [];
    const rec = { name: skill, level, score, label: badge, source: 'hiero-eval', verifiedAt: new Date().toISOString() };
    const vIdx = verified.findIndex((item) => mentionsSkill(skillNameOf(item), skill));
    if (vIdx >= 0) verified[vIdx] = { ...(typeof verified[vIdx] === 'object' ? verified[vIdx] : {}), ...rec };
    else verified.push(rec);
    data.verifiedSkills = verified;
    data.hieroEvalAdded = { skill, level, score, badge, addedAt: new Date().toISOString() };
    data.updatedAt = new Date().toISOString();
    return data;
}

function getResumeStore() {
    try { return require('./resume').userResumesBackendStore; } catch (e) { return null; }
}

router.post('/add-to-resume', async (req, res) => {
    try {
        const body = req.body || {};
        const skill = String(body.skill || body.skillName || '').trim();
        if (!skill) return res.status(400).json({ success: false, error: 'skill required' });
        const userId = String(body.userId || 'guest-user');
        const skillId = body.skillId || skillIdOf(skill);

        let latest = null;
        try {
            latest = await EvalAttempt.findOne({ userId, skillId, passed: true }).sort({ submittedAt: -1, createdAt: -1 });
        } catch (e) {}

        if (body.attemptId && !latest) {
            try { latest = await EvalAttempt.findById(body.attemptId); } catch (e) {}
        }
        if (latest && latest.passed === false) {
            return res.status(403).json({ success: false, error: 'Pass this skill eval before adding it to your resume.' });
        }
        const level = Number(body.level || latest?.level || 1);
        const score = Number(body.score != null ? body.score : (latest?.score || 0));

        let stored = null;
        try {
            const doc = await Resume.findOne({ userId });
            if (doc?.data) stored = doc.data;
        } catch (e) {}
        const store = getResumeStore();
        if (!stored && store?.has(userId)) stored = store.get(userId);
        if (!stored && store?.has('latest_user')) stored = store.get('latest_user');

        const merged = pickResume(body.resumeData, stored);
        if (!merged.personalInfo) merged.personalInfo = {};
        if (!merged.personalInfo.fullName && body.fullName) merged.personalInfo.fullName = body.fullName;
        const data = addVerifiedSkillToResume(merged, skill, level, score);
        const created = !stored && !(body.resumeData && (body.resumeData.personalInfo || body.resumeData.technicalSkills || body.resumeData.skills));

        try {
            let resumeDoc = await Resume.findOne({ userId });
            if (!resumeDoc) resumeDoc = new Resume({ userId, data: {} });
            resumeDoc.data = data;
            resumeDoc.markModified('data');
            await resumeDoc.save();
        } catch (mongoErr) {
            console.warn('[Eval] Resume mongo save:', mongoErr.message);
        }
        if (store) {
            store.set(userId, data);
            store.set('latest_user', data);
        }

        return res.json({
            success: true,
            created,
            skill,
            level,
            score,
            badge: data.hieroEvalAdded?.badge,
            data
        });
    } catch (error) {
        console.error('[Eval] add-to-resume failed:', error);
        return res.status(500).json({ success: false, error: error.message || 'Could not add skill to resume.' });
    }
});

module.exports = router;
