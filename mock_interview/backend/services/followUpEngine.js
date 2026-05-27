class FollowUpEngine {
    static classifyAnswer(answer) {
        if (!answer) return "NONE";
        if (answer.length < 20) return "WEAK";
        
        const vagueKeywords = ["microservices", "scale", "performance", "efficient", "load balancer", "optimized", "cloud", "distributed", "better", "faster"]; 
        const isGeneric = vagueKeywords.some(k => answer.toLowerCase().includes(k)) || answer.length < 50;
        
        const hesitationWords = ["maybe", "i think", "sort of", "perhaps", "actually i'm not sure"];
        const isUnsure = hesitationWords.some(word => answer.toLowerCase().includes(word));
        
        if (isUnsure) return "UNSURE";
        if (isGeneric && answer.length < 60) return "VAGUE";
        return "STRONG";
    }

    static decideDifficulty(evaluation, currentDifficulty) {
        const { logic_depth } = evaluation;
        const difficulties = ["Fundamental", "Intermediate", "High", "Lethal"];
        let idx = difficulties.indexOf(currentDifficulty);

        if (logic_depth >= 8 && idx < 3) {
            return difficulties[idx + 1];
        } else if (logic_depth <= 3 && idx > 0) {
            return difficulties[idx - 1]; 
        }
        return currentDifficulty;
    }

    static extractTechnicalKeywords(text) {
        if (!text) return [];
        const techKeywords = ["Redis", "Node.js", "Kafka", "Docker", "Kubernetes", "Express", "MongoDB", "SQL", "NoSQL", "Microservices", "Load Balancer", "Service Discovery", "Sharding", "Replication", "Consistency", "Latency", "Throughput", "Transactions", "REST", "gRPC", "Protobuf"];
        
        const found = techKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(text));
        const capitalized = text.match(/\b[A-Z][a-z0-9\.]+\b/g) || [];
        
        return [...new Set([...found, ...capitalized])];
    }

    static isBuzzwordHeavy(text) {
        const buzzwords = ["AI-driven", "scalable", "optimized", "cutting-edge", "seamless", "efficient", "robust", "cloud-native"];
        const count = buzzwords.filter(b => text.toLowerCase().includes(b)).length;
        return count >= 2;
    }
}

module.exports = FollowUpEngine;
