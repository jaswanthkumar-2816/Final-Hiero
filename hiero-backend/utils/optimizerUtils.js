import axios from 'axios';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

/**
 * Extract text from PDF or TXT file
 */
export async function extractTextFromFile(filePath, mimeType) {
    try {
        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text || '';
        } else if (mimeType === 'text/plain') {
            return fs.readFileSync(filePath, 'utf8');
        }
        return '';
    } catch (error) {
        logger.error('File extraction error:', error);
        return '';
    }
}

/**
 * Call OpenRouter to optimize resume based on Job Description
 */
export async function optimizeResumeWithAI(resumeText, jdText) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is missing');
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) optimizer and career coach.
Your task is to analyze a user's resume and a job description to generate an improved, ATS-optimized version of the resume tailored to the specific job role.

INPUTS:
1. Resume Content: (Extracted text from user's current resume)
2. Job Description: (Target job requirements)

CONSTRAINTS:
- Do NOT fabricate any experiences, degrees, or certifications that the user does not have.
- You CAN rephrase, restructure, and emphasize existing experiences to align with the JD keywords and responsibilities.
- You CAN suggest adding missing relevant skills if the user likely possesses them based on their mentioned experience.
- Use standard ATS-friendly section headers.
- Ensure high keyword density for terms found in the JD, used naturally.
- The output MUST be a valid JSON object containing the optimized data and analysis.

JSON STRUCTURE REQUIRED:
{
  "optimizedData": {
    "personalInfo": { "fullName": "", "email": "", "phone": "", "address": "", "linkedin": "", "website": "" },
    "summary": "Professional summary optimized for the JD",
    "experience": [ { "jobTitle": "", "company": "", "startDate": "", "endDate": "", "description": "Bullet points with JD keywords" } ],
    "education": [ { "degree": "", "school": "", "gradYear": "", "gpa": "" } ],
    "projects": [ { "name": "", "tech": "", "description": "", "link": "", "duration": "" } ],
    "skills": "Comma separated technical and soft skills",
    "certifications": ["..."],
    "achievements": "..."
  },
  "analysis": {
    "ats_score": number (0-100),
    "missing_keywords": ["..."],
    "suggested_skills": ["..."],
    "improvements_made": "Specific list of optimization strategies applied"
  }
}`;

    try {
        const { data } = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'openai/gpt-3.5-turbo', // Or 'anthropic/claude-3-haiku' for speed
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `RESUME:\n${resumeText}\n\nJD:\n${jdText}` }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://hiero.in',
                    'X-Title': 'Hiero ATS Optimizer'
                }
            }
        );

        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        logger.error('AI Optimization error:', error.response?.data || error.message);
        throw new Error('Failed to optimize resume with AI');
    }
}
