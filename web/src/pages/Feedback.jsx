import { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { post, userId } from '../api/client.js';

export default function Feedback() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await post('/api/feedback/submit', { userId: userId(), message });
      setStatus('Thanks — feedback sent.');
      setMessage('');
    } catch (err) {
      setStatus(err.message);
    }
  }
  return (
    <AppShell>
      <h1 className="page-title">Feedback</h1>
      <form className="card form-grid" onSubmit={submit}>
        <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What should we improve?" />
        <button className="btn btn-main">Send</button>
        {status ? <p className="muted">{status}</p> : null}
      </form>
    </AppShell>
  );
}
