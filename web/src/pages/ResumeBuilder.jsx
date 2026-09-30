import { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { post, userId } from '../api/client.js';

const EMPTY = {
  name: '', email: '', phone: '', summary: '',
  skills: '', education: '', experience: '', projects: '',
};

export default function ResumeBuilder() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState('');

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setStatus('Saving…');
    try {
      const json = await post('/api/resume/save', { userId: userId(), ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) });
      setStatus(json.message || 'Resume saved');
      if (json.previewHtml || json.html) setPreview(json.previewHtml || json.html);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function previewResume() {
    setStatus('Building preview…');
    try {
      const json = await post('/api/resume/preview-resume', { userId: userId(), ...form });
      setPreview(json.html || json.previewHtml || '');
      setStatus(json.html || json.previewHtml ? 'Preview ready' : (json.message || 'Preview generated'));
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <AppShell>
      <div className="pill"><i className="fa-regular fa-file-lines" /> Resume builder</div>
      <h1 className="page-title">Build the same Hiero resume</h1>
      <p className="page-sub">This React page talks to the existing `/api/resume` backend. The original HTML builder remains at `/resume-builder.html`.</p>
      <form className="card form-grid" style={{ marginTop: 20 }} onSubmit={save}>
        {['name', 'email', 'phone', 'summary', 'skills', 'education', 'experience', 'projects'].map((key) => (
          key === 'summary' || key === 'education' || key === 'experience' || key === 'projects' ? (
            <textarea key={key} placeholder={key} value={form[key]} onChange={(e) => setField(key, e.target.value)} rows={4} />
          ) : (
            <input key={key} placeholder={key === 'skills' ? 'skills (comma separated)' : key} value={form[key]} onChange={(e) => setField(key, e.target.value)} />
          )
        ))}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-main" type="submit">Save</button>
          <button className="btn btn-ghost" type="button" onClick={previewResume}>Preview</button>
        </div>
        {status ? <p className="muted">{status}</p> : null}
      </form>
      {preview ? <div className="card" style={{ marginTop: 16 }} dangerouslySetInnerHTML={{ __html: preview }} /> : null}
    </AppShell>
  );
}
