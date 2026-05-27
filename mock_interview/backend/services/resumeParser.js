class ResumeParser {
    static parse(text) {
        if (!text) return { skills: [], projects: [], weak_signals: [] };

        // Basic keyword matching for demonstration
        const commonSkills = ["Node.js", "React", "MongoDB", "Python", "Docker", "Kubernetes", "AWS", "Microservices", "System Design"];
        const skills = commonSkills.filter(skill => 
            new RegExp(`\\b${skill}\\b`, 'i').test(text)
        );

        // Buzzword/Weak signals: patterns that might indicate superficial knowledge
        const buzzwords = ["AI-powered", "Blockchain", "Web3", "Scale", "Cutting-edge", "Innovative", "Seamless", "Robust"];
        const weak_signals = buzzwords.filter(word => 
            new RegExp(`\\b${word}\\b`, 'i').test(text)
        );

        // Simple project extraction: often lines starting with "Project" or having bullet points near titles
        const projectMatches = text.match(/(Project|Experience):?\s*([^\n\r.]+)/gi) || [];
        const projects = projectMatches.map(m => m.replace(/Project:?\s*/i, '').trim());

        return {
            skills,
            projects: [...new Set(projects)],
            weak_signals
        };
    }
}

module.exports = ResumeParser;
