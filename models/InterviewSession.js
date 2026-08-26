const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    index: { type: Number, required: true },
    questionText: { type: String, required: true },
    sourceQuestionId: { type: String, default: '' },
    category: { type: String, default: 'technical' }, // 'introduction', 'technical', 'resume_project', 'system_design', 'problem_solving', 'behavioral'
    skill: { type: String, default: '' },
    difficulty: { type: String, default: 'medium' },
    source: { type: String, default: 'company_question_bank' },
    reason: { type: String, default: '' },
    isFollowUp: { type: Boolean, default: false },
    followUpToQuestion: { type: Number, default: null },
    expectedTopics: { type: [String], default: [] },
    askedAt: { type: Date, default: Date.now }
}, { _id: false });

const answerSchema = new mongoose.Schema({
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    candidateAnswer: { type: String, required: true },
    transcript: { type: String, default: '' },
    answerTranscript: { type: String, default: '' },
    answerStatus: { type: String, default: 'ANSWERED' }, // 'ANSWERED', 'UNKNOWN', 'PARTIAL', 'NO_RESPONSE', 'UNCLEAR'
    technicalAccuracy: { type: String, default: 'evaluated' },
    videoUrl: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    coaching: {
        improvedPhrase: { type: String, default: '' },
        grammarTip: { type: String, default: '' },
        clarityScore: { type: Number, default: 8 }
    },
    evaluationScore: { type: Number, default: 8 },
    evaluationNotes: { type: String, default: '' },
    answeredAt: { type: Date, default: Date.now },
    durationSec: { type: Number, default: 0 }
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    resumeId: { type: String, default: null },
    companyId: { type: String, default: null },
    jobId: { type: String, default: null },
    companyName: { type: String, default: 'Technology Company' },
    jobRole: { type: String, default: 'Software Engineer' },
    duration: { type: Number, default: 5 }, // 5, 10, or 15 minutes
    durationSeconds: { type: Number, default: 300 }, // 300, 600, or 900 seconds
    questionLimit: { type: Number, default: 5 }, // 5, 10, or 15 questions
    resumeSnapshot: {
        fullName: { type: String, default: '' },
        professionalTitle: { type: String, default: '' },
        matchedSkills: { type: [String], default: [] },
        projects: { type: Array, default: [] },
        experience: { type: Array, default: [] },
        education: { type: Array, default: [] },
        summary: { type: String, default: '' }
    },
    jobDescriptionSnapshot: {
        title: { type: String, default: '' },
        company: { type: String, default: '' },
        requirements: { type: [String], default: [] },
        fullText: { type: String, default: '' }
    },
    blueprintSnapshot: {
        companyName: { type: String, default: '' },
        role: { type: String, default: '' },
        hiringBar: { type: String, default: '8.5 / 10' },
        culture: { type: String, default: '' },
        rounds: { type: Array, default: [] }
    },
    topicTracking: {
        topicsCovered: { type: [String], default: [] },
        topicsRemaining: { type: [String], default: [] },
        skillsEvaluated: { type: [String], default: [] }
    },
    currentQuestionIndex: { type: Number, default: 1 },
    questions: { type: [questionSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
    timerStarted: { type: Boolean, default: false },
    timerStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    status: {
        type: String,
        enum: ['INITIALIZED', 'INTRODUCTION', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'TERMINATED'],
        default: 'INITIALIZED'
    },
    scorecard: {
        overallScore: { type: Number, default: null },
        communicationScore: { type: Number, default: null },
        technicalScore: { type: Number, default: null },
        problemSolvingScore: { type: Number, default: null },
        resumeAlignmentScore: { type: Number, default: null },
        strengths: { type: [String], default: [] },
        areasToImprove: { type: [String], default: [] },
        recommendation: { type: String, default: '' },
        summary: { type: String, default: '' }
    },
    evaluation: {
        overallScore: { type: Number, default: null },
        technicalScore: { type: Number, default: null },
        communicationScore: { type: Number, default: null },
        relevanceScore: { type: Number, default: null },
        confidenceScore: { type: Number, default: null },
        problemSolvingScore: { type: Number, default: null },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        recommendations: { type: [String], default: [] }
    },
    recordings: [{
        questionNumber: { type: String, default: '' },
        questionText: { type: String, default: '' },
        candidateAnswer: { type: String, default: '' },
        url: { type: String, default: '' },
        videoUrl: { type: String, default: '' },
        audioUrl: { type: String, default: '' },
        duration: { type: Number, default: 0 },
        recordedAt: { type: Date, default: Date.now }
    }],
    recording: {
        available: { type: Boolean, default: false },
        storageType: { type: String, default: 'local' },
        url: { type: String, default: '' },
        videoPath: { type: String, default: '' },
        audioPath: { type: String, default: '' },
        duration: { type: Number, default: 0 },
        fileSize: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: null }
    },
    violations: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true }
});

const InterviewSession = mongoose.models.InterviewSession || mongoose.model('InterviewSession', interviewSessionSchema);

module.exports = InterviewSession;
