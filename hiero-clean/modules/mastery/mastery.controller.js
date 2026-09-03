/**
 * HIERO — Mastery Controller
 * Handles all mastery-related requests.
 * Consolidates mastery.js + adaptive-mastery.js into one clean module.
 */

const { buildSkillTree } = require('./tree.service');
const { calcMasteryPct, getUserId, generateGenericQuiz } = require('../../utils/helpers');
const { MASTERY } = require('../../config/constants');
const StudentProgress = require('../../models/StudentProgress');
const DiagnosticResult = require('../../models/DiagnosticResult');
const UserSkill = require('../../models/UserSkill');

// ─── POST /set-beginner-level ──────────────────────────
async function setBeginnerLevel(req, res) {
    const { userId, skillName } = req.body;
    if (!userId || !skillName) return res.status(400).json({ success: false, error: 'userId and skillName required' });

    try {
        const tree = await buildSkillTree(skillName);
        const firstTopicId = tree.topics[0]?.id || 'topic-1';

        await StudentProgress.findOneAndUpdate(
            { userId, skillName: tree.skillName },
            { $set: { topicId: firstTopicId, startingTopicId: firstTopicId, state: 'LEARNING', masteryPct: 0, weakSubConcepts: [], updatedAt: new Date() } },
            { upsert: true }
        );

        res.json({ success: true, level: 'beginner', startingTopicId: firstTopicId, message: `Starting ${skillName} from scratch with ${tree.topics[0]?.name || 'Module 1'}!` });
    } catch (e) {
        console.error('[Mastery] set-beginner-level error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

// ─── POST /diagnostic-10q ──────────────────────────────
async function generateDiagnostic10q(req, res) {
    const { userId, skillName } = req.body;
    if (!skillName) return res.status(400).json({ success: false, error: 'skillName required' });

    try {
        const ai = require('../../utils/ai');
        let questions = [];

        // Try AI generation
        if (ai.isAvailable()) {
            try {
                const prompt = `Generate a 10-question diagnostic quiz for "${skillName}".
Progressive difficulty: Q1-3 Easy, Q4-7 Medium, Q8-10 Hard. 5 subtopics, 2 questions each.
Return ONLY: { "questions": [{ "id": 1, "difficulty": "Easy", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "subTopic": "Name" }] }`;
                const parsed = await ai.generateJSON(prompt, { temperature: 0.75 });
                if (Array.isArray(parsed.questions) && parsed.questions.length >= 8) {
                    questions = parsed.questions;
                }
            } catch (e) {
                console.warn('[Mastery] AI 10Q generation error:', e.message);
            }
        }

        // Fallback: generate generic quiz
        if (questions.length < 10) {
            questions = generateGenericQuiz(skillName, skillName).concat(
                generateGenericQuiz(skillName + ' intermediate', skillName),
                generateGenericQuiz(skillName + ' advanced', skillName)
            ).slice(0, 10);
        }

        // Format with difficulty labels
        questions = questions.slice(0, 10).map((q, idx) => ({
            id: idx + 1,
            question: q.question,
            options: q.options,
            subTopic: q.subTopic || 'Core Concepts',
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            difficulty: q.difficulty || (idx < 3 ? 'Easy' : idx <= 6 ? 'Medium' : 'Hard'),
        }));

        res.json({ success: true, skillName, questionCount: questions.length, questions });
    } catch (e) {
        console.error('[Mastery] diagnostic-10q error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

// ─── POST /grade-diagnostic-10q ────────────────────────
async function gradeDiagnostic10q(req, res) {
    const { userId, skillName, userAnswers, questions } = req.body;
    if (!userId || !skillName || !userAnswers || !questions) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const tree = await buildSkillTree(skillName);
        const normalizedSkill = tree.skillName;

        let totalCorrect = 0;
        const topicStats = {};

        questions.forEach((q, i) => {
            const ans = userAnswers[i];
            const subTopic = q.subTopic || 'Core';
            if (!topicStats[subTopic]) topicStats[subTopic] = { correct: 0, total: 0 };
            topicStats[subTopic].total += 1;
            if (ans === q.correctIndex) { totalCorrect += 1; topicStats[subTopic].correct += 1; }
        });

        const overallScore = Math.round((totalCorrect / Math.max(questions.length, 1)) * 100);
        const topicScores = {};
        const weakTopics = [];
        const strongTopics = [];

        Object.keys(topicStats).forEach(subTopic => {
            const stat = topicStats[subTopic];
            const pct = Math.round((stat.correct / Math.max(stat.total, 1)) * 100);
            topicScores[subTopic] = { correct: stat.correct, total: stat.total, scorePct: pct, status: pct < 70 ? 'WEAK' : 'STRONG' };
            if (pct < 70) weakTopics.push(subTopic);
            else strongTopics.push(subTopic);
        });

        // Detailed review
        const detailedReview = questions.map((q, i) => {
            const userChoice = userAnswers[i];
            const isCorrect = userChoice === q.correctIndex;
            return {
                questionNum: i + 1, question: q.question, subTopic: q.subTopic || 'Core',
                userAnswerIndex: userChoice, correctAnswerIndex: q.correctIndex, isCorrect,
                explanation: isCorrect
                    ? `Correct! "${q.options?.[q.correctIndex]}" demonstrates mastery.`
                    : `The correct answer is "${q.options?.[q.correctIndex]}". Focus on ${q.subTopic || 'this area'}.`,
            };
        });

        // Determine starting topic
        let startingTopicId = tree.topics[0]?.id || 'topic-1';
        let startingState = 'LEARNING';
        if (overallScore >= 80 && tree.topics.length > 1) { startingTopicId = tree.topics[tree.topics.length - 1]?.id; startingState = 'PRACTICING'; }
        else if (overallScore >= 50) { startingTopicId = tree.topics[1]?.id || tree.topics[0]?.id; startingState = 'PRACTICING'; }

        // Save results
        try { await DiagnosticResult.create({ userId, skillName: normalizedSkill, score: overallScore, startingTopicId, answers: userAnswers }); } catch (e) {}
        await StudentProgress.findOneAndUpdate(
            { userId, skillName: normalizedSkill },
            { $set: { topicId: startingTopicId, startingTopicId, state: startingState, masteryPct: Math.round(overallScore * 0.4), weakSubConcepts: weakTopics, updatedAt: new Date() } },
            { upsert: true }
        );

        const sId = normalizedSkill.toLowerCase().replace(/[^a-z0-9]/g, '');
        const tier = overallScore <= 40 ? 'foundational' : overallScore <= 60 ? 'core' : overallScore < 100 ? 'advanced' : 'masterclass';
        await UserSkill.findOneAndUpdate(
            { userId, skillId: sId },
            { $set: { userId, skillId: sId, skillName: normalizedSkill, score: overallScore, proficiencyLevel: tier, status: tier === 'masterclass' ? 'mastered' : 'learning', updatedAt: new Date() } },
            { upsert: true }
        ).catch(() => {});

        res.json({ success: true, skillName: normalizedSkill, overallScore, topicScores, weakTopics, strongTopics, startingTopicId, startingState, detailedReview });
    } catch (e) {
        console.error('[Mastery] grade-diagnostic-10q error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

// ─── POST /submit-practice ─────────────────────────────
async function submitPractice(req, res) {
    const { userId: rawUserId, skillName, topicId, passedTests, totalTests } = req.body;
    if (!rawUserId || !skillName) return res.status(400).json({ success: false, error: 'userId and skillName required' });

    const userId = rawUserId;
    const score = Math.round((passedTests / Math.max(totalTests, 1)) * 100);
    const tree = await buildSkillTree(skillName);

    try {
        const progress = await StudentProgress.findOneAndUpdate(
            { userId, skillName: tree.skillName },
            { $push: { practiceAttempts: { topicId, passedTests, totalTests, score, at: new Date() } }, $set: { updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        const newMastery = calcMasteryPct(progress);
        const newState = newMastery >= MASTERY.ASSESSMENT_READY ? 'ASSESSING' : 'PRACTICING';
        await StudentProgress.updateOne({ userId, skillName: tree.skillName }, { $set: { masteryPct: newMastery, state: newState } });

        res.json({ success: true, message: `Mastery: ${newMastery}% — ${newState === 'ASSESSING' ? 'Ready for assessment!' : 'Keep practicing!'}`, score, masteryPct: newMastery, state: newState, readyForAssessment: newMastery >= MASTERY.ASSESSMENT_READY });
    } catch (e) {
        console.error('[Mastery] submit-practice error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

// ─── POST /submit-assessment ───────────────────────────
async function submitAssessment(req, res) {
    const { userId, skillName, topicId, answers } = req.body;
    if (!userId || !skillName || !answers) return res.status(400).json({ success: false, error: 'Missing required fields' });

    try {
        const tree = await buildSkillTree(skillName);
        const topic = tree.topics.find(t => t.id === topicId) || tree.topics[0];
        const questions = topic?.diagnosticQuestions || [];

        const correct = answers.filter((ans, i) => questions[i] && ans === questions[i].correctIndex).length;
        const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
        const threshold = topic?.passThreshold || MASTERY.PASS_THRESHOLD;
        const passed = score >= threshold;

        const weakSubConcepts = answers
            .map((ans, i) => ans !== questions[i]?.correctIndex ? questions[i]?.subConcept : null)
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i);

        const progress = await StudentProgress.findOneAndUpdate(
            { userId, skillName: tree.skillName },
            { $push: { assessmentAttempts: { topicId: topic.id, answers, score, passed, weakSubConcepts, at: new Date() } }, $set: { lastAssessedAt: new Date(), weakSubConcepts: passed ? [] : weakSubConcepts, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        const newMastery = calcMasteryPct(progress);
        let newState;

        if (passed) {
            const currentIdx = tree.topics.findIndex(t => t.id === topic.id);
            const nextTopic = tree.topics[currentIdx + 1];
            if (nextTopic) {
                newState = 'LEARNING';
                await StudentProgress.updateOne({ userId, skillName: tree.skillName }, { $set: { state: 'LEARNING', topicId: nextTopic.id, masteryPct: Math.max(newMastery, score), updatedAt: new Date() } });
            } else {
                newState = 'MASTERED';
                await StudentProgress.updateOne({ userId, skillName: tree.skillName }, { $set: { state: 'MASTERED', masteryPct: Math.max(newMastery, score), updatedAt: new Date() } });
            }
        } else {
            newState = 'PRACTICING';
            await StudentProgress.updateOne({ userId, skillName: tree.skillName }, { $set: { state: 'PRACTICING', masteryPct: newMastery, updatedAt: new Date() } });
        }

        res.json({ success: true, score, passed, masteryPct: Math.max(newMastery, passed ? score : 0), state: newState, weakSubConcepts });
    } catch (e) {
        console.error('[Mastery] submit-assessment error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

// ─── GET /path/:userId/:skillName ──────────────────────
async function getPath(req, res) {
    const { userId, skillName } = req.params;
    try {
        const tree = await buildSkillTree(skillName);
        let progress = null;
        try { progress = await StudentProgress.findOne({ userId, skillName: tree.skillName }); } catch (e) {}

        const topicsWithState = tree.topics.map(topic => {
            const isActive = progress?.topicId === topic.id;
            const isCompleted = progress?.assessmentAttempts?.some(a => a.topicId === topic.id && a.passed);
            const prereqsMet = topic.prerequisites.every(prereqId =>
                progress?.assessmentAttempts?.some(a => a.topicId === prereqId && a.passed) || !progress
            );
            return {
                ...topic,
                state: isCompleted ? 'MASTERED' : isActive ? (progress?.state || 'NOT_STARTED') : prereqsMet && !isCompleted ? 'NOT_STARTED' : 'LOCKED',
                masteryPct: isActive ? (progress?.masteryPct || 0) : isCompleted ? 100 : 0,
                locked: !prereqsMet && !isCompleted && !isActive,
            };
        });

        res.json({
            success: true, skillName: tree.skillName, source: tree.source,
            currentTopicId: progress?.topicId || tree.topics[0]?.id,
            currentState: progress?.state || 'NOT_STARTED',
            overallMastery: progress?.masteryPct || 0,
            topics: topicsWithState,
        });
    } catch (e) {
        console.error('[Mastery] path error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

// ─── GET /overview/:userId ─────────────────────────────
async function getOverview(req, res) {
    const { userId } = req.params;
    try {
        let records = [];
        try { records = await StudentProgress.find({ userId }); } catch (e) {}
        const skills = records.map(r => ({ skillName: r.skillName, state: r.state, masteryPct: r.masteryPct || 0, topicId: r.topicId, lastUpdated: r.updatedAt }));
        const overallReadiness = skills.length > 0 ? Math.round(skills.reduce((sum, s) => sum + s.masteryPct, 0) / skills.length) : 0;
        res.json({ success: true, userId, skills, overallReadiness });
    } catch (e) {
        console.error('[Mastery] overview error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

module.exports = {
    setBeginnerLevel,
    generateDiagnostic10q,
    gradeDiagnostic10q,
    submitPractice,
    submitAssessment,
    getPath,
    getOverview,
};
