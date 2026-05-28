class ScoringEngine {
    static calculateFinalScore(history) {
        if (!history || history.length === 0) return 0;
        
        const validEvaluations = history.filter(h => h.evaluation).map(h => h.evaluation);
        if (validEvaluations.length === 0) return 5.0;

        // WEIGHTED SCORING ENGINE
        // Logic Depth: 60% | Clarity: 25% | Confidence: 15%
        const totalWeightedScore = validEvaluations.reduce((acc, ev) => {
            const logic = (ev.logic_depth || 0) * 0.6;
            const clarity = (ev.clarity || 0) * 0.25;
            const confidence = (ev.confidence || 0) * 0.15;
            return acc + (logic + clarity + confidence);
        }, 0);

        const avgScore = totalWeightedScore / validEvaluations.length;

        // Apply penalties for hallucinations
        const hallucinations = validEvaluations.filter(ev => ev.hallucination === true).length;
        const finalScore = Math.max(0, avgScore - (hallucinations * 1.5)); // Increased penalty for hallucinations

        return parseFloat(finalScore.toFixed(1));
    }

    static getHiringDecision(score, history) {
        const evaluations = history.filter(h => h.evaluation).map(h => h.evaluation);
        
        // DETERMINISTIC REJECTION RULES
        const hallucinationsCount = evaluations.filter(e => e.hallucination).length;
        const lowLogicCount = evaluations.filter(e => e.logic_depth < 4).length;
        const totalQuestions = evaluations.length;

        // Check for contradiction violations in history (manually flagged in content for now or logic memory)
        const contradictions = history.filter(h => h.skill === "Logic / Consistency").length;

        // Rule 1: Contradiction + Weak Logic = HARD_REJECT
        if (contradictions > 0 || (hallucinationsCount > 0 && lowLogicCount > 0)) {
            return "HARD_REJECT (Reason: Technical Contradiction or Critical Logic Deficit)";
        }

        // Rule 2: Chronic Vagueness (Low Logic across >50% of session)
        if (totalQuestions >= 3 && (lowLogicCount / totalQuestions) > 0.5) {
            return "HARD_REJECT (Reason: Repeated technical vagueness)";
        }

        if (score >= 8.5) return "STRONG_HIRE";
        if (score >= 6.5) return "BORDERLINE";
        return "HARD_REJECT";
    }

    static generateImprovementPlan(history) {
        // Logic to extract weak skills from history
        const weakSkills = history
            .filter(h => h.evaluation && h.evaluation.logic_depth < 6)
            .map(h => h.skill);
        
        return [...new Set(weakSkills)];
    }
}

module.exports = ScoringEngine;
