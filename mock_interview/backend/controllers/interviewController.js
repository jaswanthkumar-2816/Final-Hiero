const SessionManager = require('../services/sessionManager');
const AIEngine = require('../services/aiEngine');
const ResumeParser = require('../services/resumeParser');
const FollowUpEngine = require('../services/followUpEngine');
const ScoringEngine = require('../services/scoringEngine');
const SkillParser = require('../services/parser');
const { v4: uuidv4 } = require('uuid');

class InterviewController {
    static async startSession(req, res) {
        try {
            const { name, role, resume_text, job_description } = req.body;
            const sessionId = uuidv4();

            // 1. Parse and Map skills immediately
            const skillMapping = await SkillParser.parseAndMap(resume_text, job_description || "");

            const session = await SessionManager.createSession(sessionId, { 
                name, role, resume_text, job_description, skillMapping 
            });

            // Generate first question based on mapping (Priority: MISSING > WEAK > MATCH)
            const firstQuestion = await AIEngine.generateQuestion({
                role,
                resume_text,
                job_description,
                skillMapping,
                history: [],
                attack_targets: skillMapping.mapping.MISSING.map(m => m.skill).concat(skillMapping.mapping.WEAK_MATCH.map(w => w.skill)),
                topicStep: 0,
                allow_incident: false
            });

            session.history.push({ 
                role: "assistant", 
                content: firstQuestion.reply, 
                skill: firstQuestion.skill, 
                evaluation: firstQuestion.evaluation,
                source: firstQuestion.source
            });

            res.json({ 
                session_id: sessionId, 
                first_question: firstQuestion,
                skill_mapping: skillMapping.mapping
            });
        } catch (error) {
            console.error("StartSession Error:", error);
            res.status(500).json({ error: "Failed to start interview session." });
        }
    }

    static async nextQuestion(req, res) {
        try {
            const { session_id, answer, biometrics } = req.body;
            const session = await SessionManager.getSession(session_id);

            if (!session) return res.status(404).json({ error: "Session not found." });

            session.history.push({ role: "user", content: answer });

            // 1. RULE ENGINE: CONTRADICTION CHECK
            const contradiction = await FollowUpEngine.detectContradiction(answer, session.history);
            if (contradiction) {
                const response = {
                    reply: contradiction,
                    skill: "Logic / Consistency",
                    difficulty: "High",
                    follow_up_type: "CHALLENGE",
                    evaluation: { logic_depth: 2, clarity: 4, confidence: 4, hallucination: false },
                    source: "LOGIC"
                };
                session.history.push({ role: "assistant", ...response });
                return res.json(response);
            }

            // 2. TONE & INTERRUPTION ENFORCEMENT (GLOBAL GATE)
            const answerClassification = FollowUpEngine.classifyAnswer(answer);
            const isVague = answerClassification === "VAGUE";
            const isBuzzwordHeavy = FollowUpEngine.isBuzzwordHeavy(answer);
            const isWeakOrUnsure = answerClassification === "WEAK" || answerClassification === "UNSURE";
            
            if (isVague || isBuzzwordHeavy || isWeakOrUnsure) session.weakAnswerCount += 1;

            const attack_targets = FollowUpEngine.extractTechnicalKeywords(answer);

            // 3. FINAL DECISION GATE CHECK (Mid-stream)
            const currentScore = ScoringEngine.calculateFinalScore(session.history);
            const assistantTurns = session.history.filter(h => h.role === "assistant").length;
            const isFinalGate = (assistantTurns >= 5) && (currentScore >= 4.5 && currentScore <= 7.0);

            // Determine if we should allow INCIDENT mode (Only if logic was strong previously)
            const lastEval = session.history.length > 0 ? (session.history[session.history.length-1].evaluation || {logic_depth: 0}) : {logic_depth: 5};
            const allowIncident = lastEval.logic_depth >= 6 && !isWeakOrUnsure;

            // Generate AI question
            let aiResponse = await AIEngine.generateQuestion({
                role: session.role,
                resume_text: session.resumeText,
                job_description: session.jdText,
                skillMapping: session.skillMapping,
                history: session.history,
                answer: answer,
                biometrics: biometrics,
                attack_targets: attack_targets,
                topicStep: session.topicStep,
                is_final_gate: isFinalGate,
                allow_incident: allowIncident
            });

            // 4. HUMAN PRESSURE PATTERNS (DELAYS)
            const delay = Math.floor(Math.random() * 1500) + 500;
            await new Promise(resolve => setTimeout(resolve, delay));

            // 5. HARD ENFORCEMENT & DEDUPLICATION (PRE-BRANCHING)
            const softeners = ["Can you elaborate", "Can you explain", "Let's discuss", "I see", "That's a", "Good start", "Interesting", "Tell me", "Great", "Excellent", "Well done"];
            softeners.forEach(s => {
                const regex = new RegExp(`^${s}[^,.!]*[,.! ]*(but )?`, 'i');
                aiResponse.reply = aiResponse.reply.replace(regex, '').trim();
                aiResponse.reply = aiResponse.reply.charAt(0).toUpperCase() + aiResponse.reply.slice(1);
            });
            
            // PRIORITY 1: Weak Answer Escalation
            if (isWeakOrUnsure || session.weakAnswerCount > 2) {
                aiResponse.reply = `This is a fundamental concept. Answer precisely. ${aiResponse.reply}`;
            } 
            // PRIORITY 2: Interruption Gate (Vague/Buzzword)
            else if (isVague || isBuzzwordHeavy || aiResponse.evaluation.logic_depth < 4) {
                const aiContainsInterruption = aiResponse.reply.toLowerCase().includes("stop") || aiResponse.reply.toLowerCase().includes("vague");
                if (aiContainsInterruption) {
                    aiResponse.reply = aiResponse.reply.replace(/^[^.?!]+[.?!]/, '').trim();
                }
                aiResponse.reply = `Stop. That's vague. Define this technically: ${aiResponse.reply}`;
            }

            // SHORT PUSH VARIATION POOL
            const pushes = ["Justify that. Specifically.", "Break that down. Now.", "Explain that clearly.", "Be precise. No fluff.", "Justify that implementation logic."];
            if ((isVague || isBuzzwordHeavy) && Math.random() < 0.3) {
                aiResponse.reply = `${pushes[Math.floor(Math.random() * pushes.length)]}`;
            }

            // Update session state
            const lastEvaluation = aiResponse.evaluation || { logic_depth: 5 };
            if (lastEvaluation.logic_depth >= 7) {
                session.topicStep = Math.min(3, session.topicStep + 1);
            } else {
                session.topicStep = session.topicStep; // Drill deeper
            }

            session.history.push({ role: "user", content: answer });
            session.history.push({
                role: "assistant",
                content: aiResponse.reply,
                skill: aiResponse.skill,
                evaluation: aiResponse.evaluation,
                topicStep: session.topicStep
            });

            res.json(aiResponse);
        } catch (error) {
            console.error("NextQuestion Error:", error);
            res.status(500).json({ error: "Failed to process next question." });
        }
    }

    static async endSession(req, res) {
        try {
            const { session_id } = req.body;
            const session = await SessionManager.getSession(session_id);

            if (!session) {
                return res.status(404).json({ error: "Session not found." });
            }

            const finalScore = ScoringEngine.calculateFinalScore(session.history);
            const decision = ScoringEngine.getHiringDecision(finalScore, session.history);
            const weakAreas = ScoringEngine.generateImprovementPlan(session.history);

            const report = {
                final_score: finalScore,
                decision: decision,
                summary: `Candidate showed ${finalScore > 7 ? 'excellent' : 'mixed'} depth in ${session.role} concepts.`,
                mistakes: session.history
                    .filter(h => h.evaluation && h.evaluation.logic_depth < 4)
                    .map(h => {
                        const text = h.content || h.reply || "";
                        return `Low depth in ${h.skill}: ${text.substring(0, 50)}...`;
                    }),
                improvement_plan: weakAreas.map(skill => `Deep dive into ${skill} implementation details.`)
            };

            await SessionManager.endSession(session_id);

            res.json(report);
        } catch (error) {
            console.error("EndSession Error:", error);
            res.status(500).json({ error: "Failed to generate interview report." });
        }
    }
}

module.exports = InterviewController;
