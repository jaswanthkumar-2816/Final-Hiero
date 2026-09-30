const Groq = require('groq-sdk');
const config = require('../config');

// Safe JSON parser and repairer
function safeJsonParse(rawString) {
    if (!rawString || typeof rawString !== 'string') return null;

    let text = rawString.trim();

    // Strip markdown code fences if model wrapped response in ```json ... ```
    if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // Direct JSON parse attempt
    try {
        return JSON.parse(text);
    } catch (err) {
        // Attempt basic repairs: finding first { and last }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const sliced = text.substring(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(sliced);
            } catch (err2) {
                // Try fixing common trailing comma issues
                const cleaned = sliced
                    .replace(/,\s*([}\]])/g, '$1')
                    .replace(/[\u201C\u201D]/g, '"');
                return JSON.parse(cleaned);
            }
        }
        throw new Error(`Failed to parse AI JSON response: ${err.message}`);
    }
}

/**
 * System prompt designed for faithful, complete resume extraction with dynamic extra section handling.
 */
function buildSystemPrompt(anchors = {}) {
    return `You are an elite, highly accurate Resume Information Extraction Engine.
Your mission is to extract every piece of data from the resume text with 100% faithfulness.
Never hallucinate, never invent degrees, companies, achievements, or years of experience.

CRITICAL INSTRUCTIONS:
1. PERSONAL INFO:
   - fullName: Full name of candidate.
   - professionalTitle: The candidate's stated job title or headline (e.g. "Senior Software Engineer", "UX Designer", "Assistant Professor"). If it is not stated at the top, copy the job title of their most recent position. If neither exists, return "" — do NOT invent a title from skills or guesswork.
   - email: Candidate's email address.
   - phone: Candidate's phone number.
   - address: Location / city / state / country.
   - linkedin: LinkedIn profile URL.
   - github: GitHub profile URL.
   - portfolio: Personal website / portfolio URL (NEVER extract an email address domain like 'email.com' or 'gmail.com').
   - dateOfBirth: Date of birth if provided.

2. SUMMARY / OBJECTIVE:
   - Extract the exact summary, career objective, or profile verbatim. Do not rephrase or summarize.

3. WORK EXPERIENCE:
   - Array of positions: jobTitle, company, location, startDate, endDate, isCurrent (boolean), bulletPoints (array of strings preserving numbers/metrics), description (full text with bullets).
   - DATE FORMAT (STRICT): return every startDate/endDate as "YYYY-MM" (e.g. "2023-01"). If only a year is printed, use "YYYY-01". If the role is ongoing, set endDate to "Present" and isCurrent to true. Never return a bare month name.

3b. BULLET POINTS:
   - Each bulletPoints entry is ONE complete, self-contained bullet from the resume. Never merge two separate bullets into one string, and never split one bullet across two entries just because the PDF wrapped the line.

4. INTERNSHIPS:
   - Array of internship positions (if separate from full-time experience): role, organization, startDate, endDate, description.
   - Same strict "YYYY-MM" date format as work experience.

5. EDUCATION:
   - Array of degrees: degree (e.g. "B.Tech Computer Science", "MCA", "High School"), institution (University or Board), college (affiliated college if distinct), location, gradYear (e.g. "2024" or "Pursuing"), cgpaOrPercentage (e.g. "8.6 CGPA", "95%", "3.9/4.0").

6. SKILLS:
   - Categorize technical skills: programmingLanguages, frameworksLibraries, databases, cloudDevops, toolsPlatforms.
   - softSkills: communication, leadership, problem solving, etc.
   - allSkills: flat array of all skills found in the resume.

7. PROJECTS:
   - Array of projects: title, role, techStack (array), duration (e.g. "2023" or "6 months"), description, bulletPoints (array), link (GitHub or live URL), achievement (e.g. "40% performance improvement" or metrics).

8. CERTIFICATIONS:
   - Array of certifications: name, issuingOrganization, issueDate, credentialUrl.

9. LANGUAGES:
   - Array of languages: language name, proficiency (if mentioned, else "Proficient").

10. DEDICATED SECTIONS:
   - achievements: Array of strings or bullet points for awards, honors, competitions, hackathons.
   - For ALL array sections below, each array element is exactly ONE item from the resume. Do not concatenate several awards, papers or activities into a single string.
   - publications: Array of strings or bullet points for research papers, publications, patents.
   - hobbies: Array of strings or comma-separated hobbies and interests.
   - extraCurricular: Array of strings or bullet points for clubs, sports, volunteering.

11. ⭐ NOVEL / EXTRA / ADDITIONAL HEADINGS (CRITICAL):
   - You MUST inspect the resume for any sections that are NOT covered by the standard fields above.
   - Examples include:
     • Seminars, Workshops & Conferences
     • Guest Lectures & Invited Talks
     • Patents & Intellectual Property
     • Professional Memberships & Affiliations
     • Any unique headings not covered above!
   - Capture each one into the "additionalDetails" array with:
     - "heading": The clean, exact title of the section (e.g. "Seminars & Workshops", "Patents").
     - "content": Clean formatted string with bullet points (• ) preserving all details, dates, and venues.
     - "items": Array of individual string bullet points.
   - NEVER put company names (like "Google", "Stripe"), job titles, degrees, or contact info in "additionalDetails".

Return strict JSON adhering to this structure:
{
  "personalInfo": {
    "fullName": "",
    "professionalTitle": "",
    "email": "",
    "phone": "",
    "address": "",
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "dateOfBirth": "",
    "gender": "",
    "nationality": ""
  },
  "summary": "",
  "skills": {
    "programmingLanguages": [],
    "frameworksLibraries": [],
    "databases": [],
    "cloudDevops": [],
    "toolsPlatforms": [],
    "softSkills": [],
    "allSkills": []
  },
  "experience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "isCurrent": false,
      "bulletPoints": [],
      "description": ""
    }
  ],
  "internships": [
    {
      "role": "",
      "organization": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "fieldOfStudy": "",
      "institution": "",
      "college": "",
      "location": "",
      "gradYear": "",
      "cgpaOrPercentage": ""
    }
  ],
  "projects": [
    {
      "title": "",
      "role": "",
      "techStack": [],
      "duration": "",
      "description": "",
      "bulletPoints": [],
      "link": "",
      "achievement": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuingOrganization": "",
      "issueDate": "",
      "credentialUrl": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ],
  "achievements": [],
  "publications": [],
  "hobbies": [],
  "extraCurricular": [],
  "additionalDetails": [
    {
      "heading": "Section Heading",
      "content": "• Bullet 1\\n• Bullet 2",
      "items": ["Bullet 1", "Bullet 2"]
    }
  ]
}`;
}

class GroqExtractionService {
    constructor() {
        this.apiKey = config.groq.apiKey;
        this.client = this.apiKey ? new Groq({ apiKey: this.apiKey }) : null;
        this.primaryModel = config.groq.primaryModel;
        this.fallbackModels = config.groq.fallbackModels;
    }

    isAvailable() {
        return Boolean(this.client && this.apiKey);
    }

    /**
     * Executes AI completion with exponential backoff and automatic model failover.
     */
    async extractWithGroq(resumeText, deterministicAnchors = {}) {
        if (!this.isAvailable()) {
            throw new Error('GROQ_API_KEY is not configured in backend environment.');
        }

        // Limit input size safely for model context
        const truncatedText = resumeText.slice(0, 32000);
        const systemPrompt = buildSystemPrompt(deterministicAnchors);

        let userPrompt = `Extract this resume with extreme precision and fidelity:\n\n${truncatedText}`;
        if (deterministicAnchors.emails?.length || deterministicAnchors.phoneNumbers?.length || deterministicAnchors.urls) {
            userPrompt += `\n\n--- VERIFIED GROUND-TRUTH ANCHORS FOUND IN DOCUMENT ---\n${JSON.stringify(deterministicAnchors, null, 2)}`;
        }

        const modelChain = [this.primaryModel, ...this.fallbackModels];
        let lastError = null;

        for (const model of modelChain) {
            console.log(`[GroqService] Attempting extraction with model: ${model}...`);
            let attempts = 0;
            const maxAttempts = 2;

            while (attempts < maxAttempts) {
                attempts++;
                try {
                    const completion = await this.client.chat.completions.create({
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.05,
                        max_tokens: config.groq.maxTokens,
                        response_format: { type: 'json_object' }
                    });

                    const rawResponse = completion.choices[0]?.message?.content;
                    const parsed = safeJsonParse(rawResponse);

                    if (parsed && typeof parsed === 'object') {
                        console.log(`[GroqService] Extraction successful with model: ${model}`);
                        return {
                            success: true,
                            data: parsed,
                            modelUsed: model,
                            usage: completion.usage
                        };
                    }
                    throw new Error('Invalid JSON structure returned by Groq AI');
                } catch (err) {
                    lastError = err;
                    const isRateLimit = err.status === 429 || /rate_limit/i.test(err.message);
                    const isOverloaded = err.status === 503 || /overloaded/i.test(err.message);

                    console.warn(`[GroqService] Attempt ${attempts} with ${model} failed: ${err.message}`);

                    if ((isRateLimit || isOverloaded) && attempts < maxAttempts) {
                        const waitMs = 1500 * attempts;
                        console.log(`[GroqService] Waiting ${waitMs}ms before retry...`);
                        await new Promise(r => setTimeout(r, waitMs));
                    } else {
                        // Move to next model in fallback chain
                        break;
                    }
                }
            }
        }

        throw new Error(`All Groq extraction models failed. Last error: ${lastError?.message}`);
    }
}

module.exports = new GroqExtractionService();
