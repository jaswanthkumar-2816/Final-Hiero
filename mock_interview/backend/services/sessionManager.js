const sessions = new Map();

class SessionManager {
    static async createSession(sessionId, data) {
        const session = {
            sessionId,
            userName: data.name,
            role: data.role,
            resumeText: data.resume_text,
            jdText: data.job_description || "",
            skillMapping: data.skillMapping || { mapping: { MATCH: [], WEAK_MATCH: [], MISSING: [] }, projects: [] },
            history: [],
            weakAreas: [],
            askedQuestions: [],
            askedSkills: [],
            currentDifficulty: "Fundamental",
            currentTopic: null,
            topicStep: 0,
            perTopicEvaluations: [],
            logicAssertions: [], // { claim: string, topic: string }
            weakAnswerCount: 0,
            startTime: Date.now(),
            lastProcessed: Date.now()
        };
        sessions.set(sessionId, session);
        return session;
    }

    static async getSession(sessionId) {
        return sessions.get(sessionId);
    }

    static async updateSession(sessionId, updates) {
        const session = sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates, { lastProcessed: Date.now() });
            sessions.set(sessionId, session);
        }
        return session;
    }

    static async endSession(sessionId) {
        const session = sessions.get(sessionId);
        if (session) {
            session.endTime = Date.now();
            // In a real app, we might persist to DB here
        }
        return session;
    }
}

module.exports = SessionManager;
