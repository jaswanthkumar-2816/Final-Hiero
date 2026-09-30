import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { post } from '../api/client.js';

function loadRound() {
  try { return JSON.parse(sessionStorage.getItem('hieroEvalRound') || 'null'); } catch { return null; }
}

export default function EvalRound() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initial = useMemo(loadRound, []);
  const skill = params.get('skill') || initial?.skill || 'Python';
  const track = params.get('track') || initial?.track || 'beginner';
  const [round, setRound] = useState(initial);
  const [code, setCode] = useState('');
  const [codeResult, setCodeResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const attempt = round?.attempt;
  const quiz = attempt?.quiz || [];
  const coding = attempt?.coding || [];
  const qIdx = round?.qIdx || 0;
  const question = quiz[qIdx];
  const inCoding = qIdx >= quiz.length && coding.length > 0;
  const cIdx = round?.cIdx || 0;

  useEffect(() => {
    if (!attempt) navigate(`/eval?skill=${encodeURIComponent(skill)}&track=${track}`);
  }, [attempt, navigate, skill, track]);

  useEffect(() => {
    if (inCoding) setCode(coding[cIdx]?.starter || coding[cIdx]?.starterCode || '');
  }, [inCoding, cIdx, coding]);

  function persist(next) {
    sessionStorage.setItem('hieroEvalRound', JSON.stringify(next));
    setRound(next);
  }

  function selectAnswer(index) {
    const answers = [...(round.answers || [])];
    answers[qIdx] = index;
    persist({ ...round, answers });
  }

  async function submitEval(codingSubs = round.codingSubs || []) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const json = await post('/api/eval/submit', {
        attemptId: attempt.attemptId,
        answers: round.answers,
        coding: codingSubs,
      });
      sessionStorage.setItem('hieroEvalCongrats', JSON.stringify({ skill: json.skill || skill, level: json.level, result: json }));
      if (json.passed) navigate(`/eval-congrats?skill=${encodeURIComponent(json.skill || skill)}&level=${encodeURIComponent(json.level || '')}`);
      else navigate(`/eval?skill=${encodeURIComponent(skill)}&track=${track}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function nextQuestion() {
    if (round.answers[qIdx] == null) {
      alert('Select an answer first.');
      return;
    }
    if (qIdx < quiz.length - 1) persist({ ...round, qIdx: qIdx + 1 });
    else if (coding.length) persist({ ...round, qIdx: quiz.length, cIdx: 0 });
    else await submitEval();
  }

  async function runCode() {
    const c = coding[cIdx];
    const json = await post('/api/eval/run-code', { attemptId: attempt.attemptId, questionId: c.id, code });
    const rec = { questionId: c.id, code, passedTests: json.passedTests || 0, totalTests: json.totalTests || 0 };
    const codingSubs = (round.codingSubs || []).filter((s) => s.questionId !== c.id).concat([rec]);
    persist({ ...round, codingSubs });
    setCodeResult(json.error || `${json.passedTests}/${json.totalTests} hidden tests passed`);
  }

  async function nextCode() {
    const c = coding[cIdx];
    const rec = (round.codingSubs || []).find((s) => s.questionId === c.id) || { questionId: c.id, code, passedTests: 0, totalTests: c.testCount || 0 };
    rec.code = code;
    const codingSubs = (round.codingSubs || []).filter((s) => s.questionId !== c.id).concat([rec]);
    if (cIdx < coding.length - 1) persist({ ...round, codingSubs, cIdx: cIdx + 1 });
    else await submitEval(codingSubs);
  }

  if (!attempt) return null;

  return (
    <div className="eval-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <Link className="btn btn-ghost" to={`/eval?skill=${encodeURIComponent(skill)}&track=${track}`}>Back</Link>
        <ThemeToggle />
      </div>
      <div className="pill">Hiero Eval · {skill} · Level {round.chosenLevel}</div>
      {!inCoding && question ? (
        <section className="card">
          <h2>{question.prompt || question.question}</h2>
          <div className="problem-list" style={{ marginTop: 16 }}>
            {(question.options || []).map((opt, i) => (
              <button key={i} className={`problem-item${round.answers[qIdx] === i ? ' active' : ''}`} onClick={() => selectAnswer(i)}>{opt}</button>
            ))}
          </div>
          <button className="btn btn-main" style={{ marginTop: 16 }} onClick={nextQuestion}>Next</button>
        </section>
      ) : null}
      {inCoding && coding[cIdx] ? (
        <section className="card">
          <h2>{coding[cIdx].prompt || coding[cIdx].title}</h2>
          <textarea className="code-area" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="solve-actions">
            <button className="btn btn-ghost" onClick={runCode}>Run</button>
            <button className="btn btn-main" onClick={nextCode} disabled={submitting}>Next</button>
          </div>
          {codeResult ? <p className="muted">{codeResult}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
