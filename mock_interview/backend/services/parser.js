const { Groq } = require('groq-sdk');

class SkillParser {
    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }

    async parseAndMap(resumeText, jdText) {
        const prompt = `
        Analyze the following Resume and Job Description (JD).
        
        1. Extract technical skills from both.
        2. Map them into three categories:
           - MATCH: Skill exists in both with clear detail in resume.
           - WEAK_MATCH: Skill in JD is mentioned in resume but lacks technical implementation detail.
           - MISSING: Skill is required in JD but not present in resume.
        3. Identify 2-3 key technical projects from the resume.

        RESUME:
        ${resumeText}

        JOB DESCRIPTION:
        ${jdText}

        OUTPUT FORMAT (STRICT JSON ONLY):
        {
          "mapping": {
            "MATCH": [
              {"skill": "...", "resume_context": "..."}
            ],
            "WEAK_MATCH": [
              {"skill": "...", "resume_context": "..."}
            ],
            "MISSING": [
              {"skill": "..."}
            ]
          },
          "projects": [
            {"name": "...", "description": "..."}
          ]
        }
        `;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error("SkillParser Error:", error);
            return { mapping: { MATCH: [], WEAK_MATCH: [], MISSING: [] }, projects: [] };
        }
    }
}

module.exports = new SkillParser();
