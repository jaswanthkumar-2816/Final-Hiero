import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Quiz from './pages/Quiz.jsx';
import LearnRedirect from './pages/LearnRedirect.jsx';
import LearnPath from './pages/LearnPath.jsx';
import Solve from './pages/Solve.jsx';
import Visualize from './pages/Visualize.jsx';
import Eval from './pages/Eval.jsx';
import EvalRound from './pages/EvalRound.jsx';
import EvalCongrats from './pages/EvalCongrats.jsx';
import Result from './pages/Result.jsx';
import ResumeBuilder from './pages/ResumeBuilder.jsx';
import Analysis from './pages/Analysis.jsx';
import Started from './pages/Started.jsx';
import Companies, { Company } from './pages/Companies.jsx';
import Playlist from './pages/Playlist.jsx';
import Pricing from './pages/Pricing.jsx';
import Feedback from './pages/Feedback.jsx';
import {
  AdaptiveTest, HieroAstra, HieroExplained, JobSuccess, Login, MockInterview,
  ProjectPage, Questions, ResumeForm, ResumeReview, SkillProblems,
} from './pages/RestPages.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Started />} />
            <Route path="/started" element={<Started />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/learn" element={<LearnRedirect />} />
            <Route path="/learn-beginner" element={<LearnPath track="beginner" />} />
            <Route path="/learn-intermediate" element={<LearnPath track="intermediate" />} />
            <Route path="/solve" element={<Solve />} />
            <Route path="/solve-beginner" element={<Solve />} />
            <Route path="/solve-intermediate" element={<Solve />} />
            <Route path="/visualize" element={<Visualize />} />
            <Route path="/eval" element={<Eval />} />
            <Route path="/eval-round" element={<EvalRound />} />
            <Route path="/eval-congrats" element={<EvalCongrats />} />
            <Route path="/result" element={<Result />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/resume-form" element={<ResumeForm />} />
            <Route path="/resume-review" element={<ResumeReview />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/company" element={<Company />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/skill-problems" element={<SkillProblems />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/problems" element={<Questions />} />
            <Route path="/hiero-explained" element={<HieroExplained />} />
            <Route path="/hiero-astra" element={<HieroAstra />} />
            <Route path="/adaptive-test" element={<AdaptiveTest />} />
            <Route path="/job_success" element={<JobSuccess />} />
            <Route path="/success" element={<JobSuccess />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
