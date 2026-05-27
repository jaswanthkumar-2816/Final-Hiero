const { Groq } = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class AIEngine {
    static buildPrompt(data) {
        return `
You are an ELITE, ADVERSARIAL FAANG Interviewer (Staff/Principal Level). You have access to a detailed Skill Mapping between the Candidate's Resume and the Job Description (JD).

SKILL MAPPING:
${JSON.stringify(data.skillMapping, null, 2)}

BANNED WORDS: "strategy", "approach", "elaborate", "good start", "nice", "interesting", "tell me more", "can you".
REPLACEMENT PHRASES: "Be specific.", "Explain implementation.", "How exactly.", "Stop. That's vague."

QUESTION STRATEGY (STRICT):
1. GAPS / MISSING SKILLS: If a skill is in JD but NOT on Resume, do NOT start with an incident. Start with a cold Awareness Check: "Your resume does not mention [Skill]. What is your precise understanding of how we achieve [Goal of Skill]?"
2. WEAK MATCHES: Mention the specific project or claim from the resume, then force technical implementation details.
3. MATCHES: Immediately jump into architectural failures and performance tradeoffs.

PERSONALITY RULES:
1. AUDIT THE GAP: Prioritize attacked ${JSON.stringify(data.attack_targets)}.
2. INCIDENT MODE (30-40% of questions): ONLY use if data.allow_incident is true. State: "Scenario: [Specific Technology] just crashed/lagged/failed. [Specific Symptom]. What happens next?"
3. NO PRAISE: Never encourage. Be blunt and technical.
4. FINAL DECISION GATE: If data.is_final_gate is true, state: "You're borderline. This question decides your outcome."

INPUT:
Role: ${data.role}
Resume: ${data.resume_text}
JD: ${data.job_description}
History: ${JSON.stringify(data.history)}
Last Answer: "${data.answer || "N/A"}"

OUTPUT (STRICT JSON ONLY):
{
  "reply": "Cold, direct assessment or awareness check.",
  "skill": "Specific sub-skill being attacked",
  "source": "RESUME | JD | GAP | LOGIC",
  "difficulty": "Intermediate | High | Lethal",
  "follow_up_type": "CLARIFICATION | CHALLENGE | INCIDENT | FAILURE_SCENARIO",
  "evaluation": {
    "logic_depth": 0-10,
    "clarity": 0-10,
    "confidence": 0-10,
    "hallucination": true/false
  }
}
        `;
    }

    static async generateQuestion(data) {
        const prompt = this.buildPrompt(data);

        try {
            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile", // Using versatile which is widely available
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("AIEngine Error:", error);
            // Fallback response if AI fails
            return {
                reply: "Could you elaborate on the architecture of your last major project?",
                skill: "Architecture",
                difficulty: "Intermediate",
                follow_up_type: "NEW",
                evaluation: { logic_depth: 5, clarity: 5, confidence: 5, hallucination: false }
            };
        }
    }
}

module.exports = AIEngine;
