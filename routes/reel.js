const express = require('express');
const { Groq } = require('groq-sdk');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });

router.post('/generate', async (req, res) => {
    try {
        const { topic, audience, platform } = req.body;
        
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const prompt = `
Generate a 30-second Instagram reel content for: ${topic}.
Target Audience: ${audience || 'General'}
Platform: ${platform || 'Instagram'}

Please provide:
1. 🎤 Voiceover Script (Natural, engaging, and professional)
2. 📝 On-screen Captions (Key hooks and text overlays)
3. 🌍 Multi-language Hooks (Translate the main hook into Spanish, French, and Hindi)
4. 💡 Visual Suggestions (Short descriptions of what should be on screen)

Keep it high-energy and concise.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an expert social media content creator specializing in viral reels and short-form video scripts.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024
        });

        const content = completion.choices[0].message.content;
        res.json({ success: true, content });

    } catch (error) {
        console.error('Reel Generation Error:', error.message);
        res.status(500).json({ error: 'Failed to generate reel content' });
    }
});

module.exports = router;
