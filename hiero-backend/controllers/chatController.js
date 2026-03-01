import Resume from '../models/Resume.js';
import dotenv from 'dotenv';
import winston from 'winston';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const resumeChat = async (req, res) => {
  const { message } = req.body;
  const userId = req.userId;

  if (!message || !userId) {
    winston.error('Missing message or userId in /resume/chat', { userId, message });
    return res.status(400).json({ error: 'Missing message or userId' });
  }

  try {
    const prompt = `
You are a resume assistant.
Only respond with strict JSON in this format:

{
  "section": "<one of: basic, education, projects, skills, certifications, achievements, hobbies, personal_details, references, photo, template>",
  "data": [ ...fields from user message... ]
}

Never use any section name except those listed above.
For example, if the user says "I did a project on smart irrigation using IoT in 2024 for 3 months.", respond with:

{
  "section": "projects",
  "data": [
    {
      "name": "Smart Irrigation System",
      "description": "Developed using IoT",
      "duration": "3 months",
      "year": "2024"
    }
  ]
}

Now parse this:
"${message}"
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Remove Markdown code block markers if present
    text = text.replace(/```json|```/g, '').trim();

    console.log("🧠 Gemini reply:", text);

    const extracted = JSON.parse(text); // <- Might throw if invalid JSON
    const { section, data } = extracted;

    const validSections = [
      'basic',
      'education',
      'projects',
      'skills',
      'certifications',
      'achievements',
      'hobbies',
      'personal_details',
      'references',
      'photo',
      'template'
    ];
    if (!validSections.includes(section)) {
      winston.error('Invalid section parsed', { section, userId });
      return res.status(400).json({ error: 'Invalid resume section' });
    }

    await Resume.updateOne(
      { userId },
      { $set: { [`data.${section}`]: data } },
      { upsert: true }
    );
    const nextPrompt = getNextPrompt(section);
    res.json({ message: `Got it! ${nextPrompt}`, section, saved: true });
  } catch (error) {
    if (
      error.message &&
      error.message.includes('429 Too Many Requests')
    ) {
      return res.status(429).json({
        error: 'Gemini API quota exceeded. Please try again later or upgrade your plan.'
      });
    }
    winston.error('Gemini chatbot error:', { error: error.message });
    res.status(500).json({ error: 'Failed to process message' });
  }
};

function getNextPrompt(section) {
  const prompts = {
    basic: 'Tell me about your education.',
    education: 'What projects have you worked on?',
    projects: 'What technical skills do you have?',
    skills: 'Do you have any certifications?',
    certifications: 'Mention your achievements.',
    achievements: 'Any hobbies?',
    hobbies: 'Please provide personal details like DOB, gender.',
    personal_details: 'Any references?',
    references: 'Would you like to upload a photo next?',
    photo: 'Which template would you like to use (e.g., professionalcv)?',
    template: 'Would you like to generate your resume now?'
  };
  return prompts[section] || 'What else would you like to add to your resume?';
}