const express = require('express');
const router = express.Router();
const UserSkill = require('../models/UserSkill');
const VideoLibrary = require('../models/VideoLibrary');
const UserVideoProgress = require('../models/UserVideoProgress');
const SkillMicroQuiz = require('../models/SkillMicroQuiz');
const User = require('../models/User');

// Helper: Calculate Tier from Score
function calculateTier(score) {
    const s = Number(score) || 0;
    if (s <= 40) return 'foundational';
    if (s <= 60) return 'core';
    if (s < 100) return 'advanced';
    return 'masterclass';
}

// Helper: Localized Skill Names
const SKILL_NAMES_LOCALIZED = {
    react: { en: 'React.js', te: 'రియాక్ట్.జేఎస్', hi: 'रिएक्ट.जेएस', ta: 'ரியாக்ட்.ஜேஎஸ்', kn: 'ರಿಯಾಕ್ಟ್.ಜೆಎಸ್', ml: 'റിയാക്ട്.ജെഎസ്' },
    python: { en: 'Python', te: 'పైథాన్', hi: 'पायथन', ta: 'பைதான்', kn: 'పైథాన్', ml: 'പൈത്തൺ' },
    system_design: { en: 'System Design', te: 'సిస్టమ్ డిజైన్', hi: 'सिस्टम डिजाइन', ta: 'சிஸ்டம் டிசைன்', kn: 'ಸಿಸ್ಟಮ್ ಡಿಸೈನ್', ml: 'സിസ്റ്റം ഡിസൈൻ' },
    aws: { en: 'AWS Cloud', te: 'ఎడబ్ల్యూఎస్ క్లౌడ్', hi: 'एडब्ल्यूएस क्लाउड', ta: 'ஏடபிள்யூஎஸ் கிளவுட்', kn: 'ಎಡಬ್ಲ್ಯೂಎಸ್ ಕ್ಲೌಡ್', ml: 'എഡബ്ല്യുഎസ് ക്ലൗഡ്' },
    tensorflow: { en: 'TensorFlow', te: 'టెన్సర్‌ఫ్లో', hi: 'टेंसरफ्लो', ta: 'டென்சர்ப்ளோ', kn: 'ಟೆನ್ಸರ್ ಫ್ಲೋ', ml: 'ടെൻസർഫ്ലോ' },
    javascript: { en: 'JavaScript', te: 'జావాస్క్రిప్ట్', hi: 'जावास्क्रिप्ट', ta: 'ஜாவாஸ்கிரிப்ட்', kn: 'ಜಾವಾಸ್ಕ್ರಿಪ್ಟ್', ml: 'ജാവസ്ക്രിപ്റ്റ്' }
};

const LANG_DISPLAY = {
    en: { name: 'English', native: 'English', flag: '🇬🇧' },
    te: { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    hi: { name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
    ta: { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    kn: { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    ml: { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' }
};

// Fallback Video Library Data Generator for regional languages & missing slots
function getFallbackVideosForSkill(skillId, tier, langCode) {
    const s = skillId.toLowerCase();
    const l = langCode || 'en';

    const videoIdPool = {
        react: {
            foundational: ['bMknfKXIFA8', 'SqcY0GlETPk', 'w7ejDZ8SWv8'],
            core: ['TNhaISOUy6Q', '35lXWvCuM8o', 'O6P86uwfdR0'],
            advanced: ['7kAW7Qx2yD0', 'd56mG7DezGs', 'cVw6-F648D4'],
            masterclass: ['ZCuYvjZfFA0', '00pxxT_4gLw', '4UZrsTqkcW4']
        },
        python: {
            foundational: ['_uQrJ0TkZlc', 'rfscVS0vtbw', 'kqtD5dpn9C8'],
            core: ['JeznW_7DlB0', 'HGOBQPFzWKo', '8ext9G7xfeg'],
            advanced: ['cKPlPJyQrtE', 'qUebd2NmbHU', '7k2v4kU_z9g'],
            masterclass: ['XGF3Qu4dUqk', '0vT9FwzB2pg', 'eWRfhZUzrAc']
        },
        system_design: {
            foundational: ['m8Icp_CidTG', 'SqcY0GlETPk', 'w7ejDZ8SWv8'],
            core: ['bUHFg8CZFws', '35lXWvCuM8o', 'O6P86uwfdR0'],
            advanced: ['UzLMhqg3_Wc', 'd56mG7DezGs', 'cVw6-F648D4'],
            masterclass: ['EpQMOvXbdFw', '00pxxT_4gLw', '4UZrsTqkcW4']
        },
        aws: {
            foundational: ['k1RI5locZE4', 'SqcY0GlETPk', 'w7ejDZ8SWv8'],
            core: ['3hLmDS179YE', '35lXWvCuM8o', 'O6P86uwfdR0'],
            advanced: ['Ia-UEOoPwtY', 'd56mG7DezGs', 'cVw6-F648D4'],
            masterclass: ['00pxxT_4gLw', 'ZCuYvjZfFA0', '4UZrsTqkcW4']
        }
    };

    const skillPool = videoIdPool[s] || videoIdPool['python'];
    const ids = skillPool[tier] || skillPool['foundational'];

    const langName = LANG_DISPLAY[l]?.native || 'English';

    const defaultTitles = {
        foundational: ['Foundational Syntax & Concepts', 'Essential Modules & Controls', 'Beginner Practice Lab'],
        core: ['Core Functionality & Patterns', 'Practical State & Workflow Design', 'Intermediate Hands-on Exercise'],
        advanced: ['Advanced Architecture Deep Dive', 'Production-Grade Application Build', 'Performance & Security Optimization'],
        masterclass: ['Production System Design & Architecture', 'Enterprise Scale Concurrency Patterns', 'Expert Masterclass Capstone']
    };

    const titles = defaultTitles[tier] || defaultTitles['foundational'];

    return ids.map((ytId, idx) => ({
        module_order: idx + 1,
        video_id: `fallback-${s}-${tier}-${l}-${idx+1}`,
        title: `${SKILL_NAMES_LOCALIZED[s]?.en || s} ${tier.toUpperCase()}: ${titles[idx]}`,
        title_localized: `${SKILL_NAMES_LOCALIZED[s]?.[l] || s} ${titles[idx]} (${langName})`,
        youtube_id: ytId,
        duration_sec: idx === 0 ? 1200 : idx === 1 ? 1800 : 2400,
        is_fallback: l !== 'en',
        fallback_language: l !== 'en' ? l : 'en'
    }));
}

// ─────────────────────────────────────────────────────
// A. GET /api/learning/dashboard
// ─────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const lang = (req.query.lang || 'en').toLowerCase();
        const userId = req.query.userId || req.user?.id || 'guest-user';

        // Fetch user preferences / user skills
        let userSkills = [];
        try {
            userSkills = await UserSkill.find({ userId });
        } catch (e) {}

        // Seed default user skills if none exist
        if (!userSkills || userSkills.length === 0) {
            const defaultSkills = [
                { skillId: 'react', skillName: 'React.js', score: 52, proficiencyLevel: 'core' },
                { skillId: 'system_design', skillName: 'System Design', score: 25, proficiencyLevel: 'foundational' },
                { skillId: 'python', skillName: 'Python', score: 35, proficiencyLevel: 'foundational' },
                { skillId: 'aws', skillName: 'AWS Cloud', score: 65, proficiencyLevel: 'advanced' }
            ];

            try {
                await Promise.all(defaultSkills.map(s => 
                    UserSkill.findOneAndUpdate(
                        { userId, skillId: s.skillId },
                        { $set: { userId, ...s } },
                        { upsert: true, new: true }
                    )
                ));
                userSkills = await UserSkill.find({ userId });
            } catch(e) {
                userSkills = defaultSkills.map(s => ({ ...s, userId }));
            }
        }

        const skillTracks = [];

        for (const us of userSkills) {
            const sId = us.skillId;
            const score = us.score || 0;
            const currentTier = calculateTier(score);

            // Determine next tier & score requirement
            let nextTier = 'core';
            let scoreToNextTier = Math.max(0, 41 - score);
            if (currentTier === 'core') {
                nextTier = 'advanced';
                scoreToNextTier = Math.max(0, 61 - score);
            } else if (currentTier === 'advanced') {
                nextTier = 'masterclass';
                scoreToNextTier = Math.max(0, 100 - score);
            } else if (currentTier === 'masterclass') {
                nextTier = 'masterclass';
                scoreToNextTier = 0;
            }

            // Query Video Library (CMS Table)
            let videoModules = [];
            try {
                const dbVideos = await VideoLibrary.find({
                    skillId: sId,
                    tier: currentTier,
                    languageCode: lang,
                    isActive: true
                }).sort({ moduleOrder: 1 }).limit(3);

                if (dbVideos && dbVideos.length > 0) {
                    videoModules = dbVideos.map(v => ({
                        module_order: v.moduleOrder,
                        video_id: v._id.toString(),
                        title: v.title,
                        title_localized: v.titleLocalized || v.title,
                        youtube_id: v.youtubeId,
                        duration_sec: v.durationSec || 1800,
                        is_fallback: false
                    }));
                }
            } catch (e) {}

            // Fallback chain for regional languages / unpopulated CMS slots
            if (videoModules.length < 3) {
                const fallbacks = getFallbackVideosForSkill(sId, currentTier, lang);
                videoModules = fallbacks.slice(0, 3);
            }

            // Fetch progress for this user + skill's videos
            let completedCount = 0;
            const youtubeIds = videoModules.map(v => v.youtube_id);
            
            let userProgressMap = {};
            try {
                const progressList = await UserVideoProgress.find({
                    userId,
                    skillId: sId,
                    youtubeId: { $in: youtubeIds }
                });

                progressList.forEach(p => {
                    userProgressMap[p.youtubeId] = p;
                });
            } catch (e) {}

            videoModules = videoModules.map(v => {
                const p = userProgressMap[v.youtube_id] || {};
                const status = p.status || 'not_started';
                const completionRate = p.completionRate || 0;

                if (status === 'completed' || completionRate >= 90) completedCount++;

                return {
                    ...v,
                    status: status === 'completed' || completionRate >= 90 ? 'completed' : status,
                    completion_rate: completionRate,
                    watched_duration_sec: p.watchedDurationSec || 0
                };
            });

            const progressPercent = Math.round((completedCount / 3) * 100);

            // Determine Level-Up Micro-Quiz Unlock Action
            let unlockAction = null;
            if (progressPercent === 100 && currentTier !== 'masterclass') {
                const localizedPrompt = {
                    en: `Take 5-Q Quiz to Unlock ${nextTier.toUpperCase()}`,
                    te: `${nextTier.toUpperCase()}ని అన్లాక్ చేయడానికి 5-ప్రశ్నల క్విజ్ రాయండి`,
                    hi: `${nextTier.toUpperCase()} अनलॉक करने के लिए 5-प्रश्नों की क्विज दें`,
                    ta: `${nextTier.toUpperCase()} திறக்க 5-கேள்வி வினாடி வினா எழுதவும்`,
                    kn: `${nextTier.toUpperCase()} ಅನ್‌ಲಾಕ್ ಮಾಡಲು 5-ಪ್ರಶ್ನೆಗಳ ರಸಪ್ರಶ್ನೆ ಬರೆಯಿರಿ`,
                    ml: `${nextTier.toUpperCase()} അൺലോക്ക് ചെയ്യാൻ 5-ചോദ്യ ക്വിസ് എഴുതുക`
                };

                unlockAction = {
                    type: 'micro_quiz',
                    quiz_id: `quiz-${sId}-${currentTier}-${nextTier}`,
                    label: `Take 5-Q Quiz to Unlock ${nextTier.toUpperCase()}`,
                    label_localized: localizedPrompt[lang] || localizedPrompt['en'],
                    source_tier: currentTier,
                    target_tier: nextTier
                };
            }

            const skillNameLocalized = SKILL_NAMES_LOCALIZED[sId]?.[lang] || SKILL_NAMES_LOCALIZED[sId]?.en || us.skillName || sId;

            skillTracks.push({
                skill_id: sId,
                skill_name: SKILL_NAMES_LOCALIZED[sId]?.en || us.skillName || sId,
                skill_name_localized: skillNameLocalized,
                current_tier: currentTier,
                current_score: score,
                progress_percent: progressPercent,
                next_tier: nextTier,
                score_to_next_tier: scoreToNextTier,
                video_modules: videoModules,
                unlock_action: unlockAction
            });
        }

        res.json({
            user_profile: {
                user_id: userId,
                preferred_language: lang,
                preferred_language_native: LANG_DISPLAY[lang]?.native || 'English',
                language_flag: LANG_DISPLAY[lang]?.flag || '🌐'
            },
            skill_tracks: skillTracks
        });

    } catch (error) {
        console.error('[Learning API] Dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch learning dashboard' });
    }
});

// ─────────────────────────────────────────────────────
// B. POST /api/learning/video/heartbeat
// ─────────────────────────────────────────────────────
router.post('/video/heartbeat', async (req, res) => {
    try {
        const { video_id, youtube_id, skill_id, userId, current_time_sec, duration_sec } = req.body;
        if (!youtube_id || !skill_id) {
            return res.status(400).json({ success: false, error: 'youtube_id and skill_id required' });
        }

        const uid = userId || req.user?.id || 'guest-user';
        const watchedSec = Number(current_time_sec) || 0;
        const totalSec = Number(duration_sec) || 1800;

        const completionRate = Math.min(100, Math.round((watchedSec / Math.max(totalSec, 1)) * 100));
        const status = completionRate >= 90 ? 'completed' : watchedSec > 10 ? 'in_progress' : 'not_started';

        let progress;
        try {
            progress = await UserVideoProgress.findOneAndUpdate(
                { userId: uid, skillId: skill_id, youtubeId: youtube_id },
                {
                    $set: {
                        videoId: video_id || youtube_id,
                        watchedDurationSec: watchedSec,
                        completionRate,
                        status,
                        updatedAt: new Date(),
                        ...(status === 'completed' ? { completedAt: new Date() } : {})
                    }
                },
                { upsert: true, new: true }
            );
        } catch (e) {
            progress = { userId: uid, skillId: skill_id, youtubeId: youtube_id, completionRate, status };
        }

        res.json({
            success: true,
            completion_rate: completionRate,
            status,
            watched_duration_sec: watchedSec
        });

    } catch (error) {
        console.error('[Learning API] Video heartbeat error:', error);
        res.status(500).json({ success: false, error: 'Heartbeat update failed' });
    }
});

// ─────────────────────────────────────────────────────
// C. GET /api/learning/quiz/unlock (Micro-Quiz Questions)
// ─────────────────────────────────────────────────────
router.get('/quiz/unlock', async (req, res) => {
    try {
        const { skill_id, quiz_id, lang } = req.query;
        const sId = (skill_id || 'react').toLowerCase();
        const l = (lang || 'en').toLowerCase();

        // 5 Micro-Quiz Questions for Level-Up Mobility
        const sampleQuestions = [
            {
                id: 1,
                question: `In ${SKILL_NAMES_LOCALIZED[sId]?.en || sId}, what is the main benefit of modular state encapsulation?`,
                options: ['Prevents global scope pollution & side effects', 'Increases file size', 'Disables compiler optimizations', 'Requires extra hardware'],
                correctIndex: 0,
                explanation: 'Encapsulating state prevents global pollution and unpredictable side effects.'
            },
            {
                id: 2,
                question: `Which technique optimizes runtime performance in ${sId}?`,
                options: ['Memoization and eliminating redundant operations', 'Synchronous blocking event loops', 'Disabling garbage collection', 'Hardcoding sleep delays'],
                correctIndex: 0,
                explanation: 'Memoization avoids redundant calculations by caching results.'
            },
            {
                id: 3,
                question: `What is the correct way to handle asynchronous errors in ${sId}?`,
                options: ['Catch rejections with try/catch or .catch() handlers', 'Ignore error logs', 'Restart the server', 'Return hardcoded null'],
                correctIndex: 0,
                explanation: 'Asynchronous exceptions should always be caught and handled gracefully.'
            },
            {
                id: 4,
                question: `Which architectural pattern decouples dependencies in ${sId}?`,
                options: ['Dependency Injection & Interface Abstraction', 'Global mutable variables', 'Tight monolithic coupling', 'Unencrypted local storage'],
                correctIndex: 0,
                explanation: 'Dependency injection allows modules to be swapped cleanly without breaking consumers.'
            },
            {
                id: 5,
                question: `Before promoting code to production in ${sId}, you should ensure?`,
                options: ['Input validation, secure credentials, and error monitoring', 'Disabling HTTPS', 'Removing all unit tests', 'Exposing API keys in public JS'],
                correctIndex: 0,
                explanation: 'Input validation and secure secret management are critical for production security.'
            }
        ];

        res.json({
            success: true,
            quiz_id: quiz_id || `quiz-${sId}`,
            skill_id: sId,
            language_code: l,
            passing_score: 70,
            questions: sampleQuestions
        });
    } catch (error) {
        console.error('[Learning API] Quiz unlock error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch micro-quiz' });
    }
});

// ─────────────────────────────────────────────────────
// C2. POST /api/learning/quiz/submit (Tier Promotion)
// ─────────────────────────────────────────────────────
router.post('/quiz/submit', async (req, res) => {
    try {
        const { userId, skill_id, answers } = req.body;
        const uid = userId || req.user?.id || 'guest-user';
        const sId = (skill_id || 'react').toLowerCase();

        // Standard 5-question answer evaluation (correctIndex = 0 for sample)
        let correct = 0;
        if (Array.isArray(answers)) {
            answers.forEach((ans, idx) => {
                if (Number(ans) === 0 || ans === 'a' || ans === 0) correct++;
            });
        }

        const scorePct = Math.round((correct / 5) * 100);
        const passed = scorePct >= 70;

        let userSkill = await UserSkill.findOne({ userId: uid, skillId: sId });
        if (!userSkill) {
            userSkill = { userId: uid, skillId: sId, score: 52, proficiencyLevel: 'core' };
        }

        const currentTier = userSkill.proficiencyLevel || calculateTier(userSkill.score);
        let newTier = currentTier;
        let newScore = userSkill.score || 52;

        if (passed) {
            if (currentTier === 'foundational') {
                newTier = 'core';
                newScore = 55;
            } else if (currentTier === 'core') {
                newTier = 'advanced';
                newScore = 68;
            } else if (currentTier === 'advanced') {
                newTier = 'masterclass';
                newScore = 100;
            }

            try {
                await UserSkill.findOneAndUpdate(
                    { userId: uid, skillId: sId },
                    {
                        $set: {
                            score: newScore,
                            proficiencyLevel: newTier,
                            status: newTier === 'masterclass' ? 'mastered' : 'learning',
                            lastAttemptAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    { upsert: true }
                );
            } catch (e) {}

            return res.json({
                passed: true,
                new_score: newScore,
                new_tier: newTier,
                message: `🎉 Congratulations! You passed with ${scorePct}% and unlocked ${newTier.toUpperCase()} level for ${SKILL_NAMES_LOCALIZED[sId]?.en || sId}!`,
                redirect_to: `/learn?skill=${encodeURIComponent(sId)}`
            });
        } else {
            return res.json({
                passed: false,
                new_score: userSkill.score || 52,
                current_tier: currentTier,
                message: `You scored ${scorePct}%. 70% is required to level up. Review your video modules and try again!`,
                redirect_to: null
            });
        }

    } catch (error) {
        console.error('[Learning API] Quiz submit error:', error);
        res.status(500).json({ success: false, error: 'Failed to evaluate quiz' });
    }
});

// ─────────────────────────────────────────────────────
// D. PATCH /api/user/preferences (Update Language Choice)
// ─────────────────────────────────────────────────────
router.patch('/preferences', async (req, res) => {
    try {
        const { userId, preferred_language } = req.body;
        const uid = userId || req.user?.id || 'guest-user';
        const lang = (preferred_language || 'en').toLowerCase();

        try {
            await User.findByIdAndUpdate(uid, { $set: { 'social.preferredLanguage': lang } });
        } catch (e) {}

        res.json({
            success: true,
            preferred_language: lang,
            preferred_language_native: LANG_DISPLAY[lang]?.native || 'English',
            message: 'Language preference updated successfully'
        });
    } catch (error) {
        console.error('[Learning API] Preferences error:', error);
        res.status(500).json({ success: false, error: 'Failed to update preferences' });
    }
});

// ─────────────────────────────────────────────────────
// E. POST /api/learning/upsert-user-skills (Populate Skills from Quiz)
// ─────────────────────────────────────────────────────
router.post('/upsert-user-skills', async (req, res) => {
    try {
        const { userId, skillScores } = req.body;
        const uid = userId || 'guest-user';

        if (!skillScores || typeof skillScores !== 'object') {
            return res.status(400).json({ success: false, error: 'skillScores object required' });
        }

        const upserts = Object.entries(skillScores).map(([skillId, scoreVal]) => {
            const score = Number(scoreVal) || 0;
            const tier = calculateTier(score);
            return UserSkill.findOneAndUpdate(
                { userId: uid, skillId: skillId.toLowerCase() },
                {
                    $set: {
                        userId: uid,
                        skillId: skillId.toLowerCase(),
                        skillName: SKILL_NAMES_LOCALIZED[skillId.toLowerCase()]?.en || skillId,
                        score,
                        proficiencyLevel: tier,
                        status: tier === 'masterclass' ? 'mastered' : 'learning',
                        updatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );
        });

        await Promise.all(upserts);
        res.json({ success: true, message: 'User skills updated successfully' });

    } catch (error) {
        console.error('[Learning API] Upsert skills error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user skills' });
    }
});

module.exports = router;
