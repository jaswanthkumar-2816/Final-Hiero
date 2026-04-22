/**
 * projects-modal.js  —  Hiero Projects Portal
 * Renders 5 starter project cards and a 6-tab detail modal.
 * Public API: window.ProjectsModal.init(containerSelector)
 */
(function () {
    'use strict';

    // ── Static project data ────────────────────────────────────────────────
    const PROJECTS = [
        {
            id: 'portfolio',
            icon: '🌐',
            title: 'Personal Portfolio Website',
            tags: ['HTML', 'CSS', 'JavaScript'],
            difficulty: 'Easy',
            duration: '1–2 weeks',
            description: 'Build a stunning portfolio to showcase your skills, projects, and resume to potential employers.',
            objectives: ['Responsive multi-page layout', 'Smooth scroll & animations', 'Contact form', 'Deploy to GitHub Pages']
        },
        {
            id: 'todo',
            icon: '✅',
            title: 'To-Do List App',
            tags: ['JavaScript', 'LocalStorage'],
            difficulty: 'Easy',
            duration: '3–5 days',
            description: 'Create a fully functional task manager with priorities, due dates, and persistent local storage.',
            objectives: ['Add / edit / delete tasks', 'Filter by status', 'LocalStorage persistence', 'Drag & drop reordering']
        },
        {
            id: 'weather',
            icon: '🌤️',
            title: 'Weather Dashboard',
            tags: ['JavaScript', 'REST API', 'CSS'],
            difficulty: 'Easy',
            duration: '4–6 days',
            description: 'Fetch real-time weather data from a public API and display it with beautiful charts and animations.',
            objectives: ['OpenWeatherMap API integration', '5-day forecast', 'Geolocation support', 'Animated weather icons']
        },
        {
            id: 'guessing',
            icon: '🎲',
            title: 'Number Guessing Game',
            tags: ['JavaScript', 'HTML', 'CSS'],
            difficulty: 'Easy',
            duration: '2–3 days',
            description: 'Build an interactive number guessing game with difficulty levels, high-score tracking, and sound effects.',
            objectives: ['Random number generation', 'Difficulty modes', 'Score tracking', 'Animated feedback']
        },
        {
            id: 'expense',
            icon: '💰',
            title: 'Expense Tracker',
            tags: ['JavaScript', 'Charts', 'LocalStorage'],
            difficulty: 'Easy',
            duration: '5–7 days',
            description: 'Track income and expenses with category breakdowns, monthly summaries, and visual charts.',
            objectives: ['Add/delete transactions', 'Category tags', 'Chart.js pie/bar charts', 'Export to CSV']
        }
    ];

    // ── In-memory cache  { projectId: { youtube, github, docs } } ─────────
    const cache = {};
    let activeChatHistory = [];
    let activeProject = null;

    // ── Styles ─────────────────────────────────────────────────────────────
    const CSS = `
.pm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.pm-card {
  background: #0a1a0a;
  border: 1px solid #1a3d1a;
  border-radius: 14px;
  padding: 18px 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  user-select: none;
}
.pm-card:hover {
  border-color: #00e040;
  background: #0d200d;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,224,64,0.15);
}
.pm-card-icon { font-size: 2rem; }
.pm-card-title { font-size: 0.95rem; font-weight: 700; color: #c8f0c8; line-height: 1.3; }
.pm-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
.pm-tag {
  font-size: 0.7rem; font-weight: 600;
  background: rgba(0,224,64,0.1); border: 1px solid #1a3d1a;
  color: #00a030; border-radius: 6px; padding: 2px 7px;
}
.pm-card-meta { font-size: 0.75rem; color: #4a7a4a; margin-top: 2px; }
.pm-card-diff { font-size: 0.72rem; font-weight: 700; color: #00e040; }

/* ── Modal ───────────────────────────────────────────────────────────── */
.pm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  animation: pm-fade-in 0.2s ease;
}
@keyframes pm-fade-in { from { opacity: 0 } to { opacity: 1 } }
.pm-modal {
  background: #050d05;
  border: 1px solid #2a5f2a;
  border-radius: 20px;
  width: 100%; max-width: 860px;
  max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(0,224,64,0.08);
  animation: pm-slide-up 0.25s ease;
}
@keyframes pm-slide-up { from { transform: translateY(20px); opacity:0 } to { transform: none; opacity:1 } }

.pm-modal-header {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #1a3d1a;
  flex-shrink: 0;
}
.pm-modal-icon { font-size: 2.2rem; }
.pm-modal-title-wrap { flex: 1; }
.pm-modal-title { font-size: 1.2rem; font-weight: 800; color: #c8f0c8; line-height: 1.3; }
.pm-modal-subtitle { font-size: 0.78rem; color: #4a7a4a; margin-top: 2px; }
.pm-close-btn {
  background: none; border: 1px solid #1a3d1a;
  color: #7ab07a; border-radius: 8px;
  padding: 6px 12px; cursor: pointer; font-size: 1.1rem;
  transition: all 0.2s;
}
.pm-close-btn:hover { background: #1a3d1a; color: #c8f0c8; }

/* ── Tabs ────────────────────────────────────────────────────────────── */
.pm-tabs {
  display: flex; gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid #1a3d1a;
  overflow-x: auto;
  flex-shrink: 0;
}
.pm-tab {
  background: none; border: none; border-bottom: 2px solid transparent;
  color: #4a7a4a; padding: 12px 16px;
  font-size: 0.82rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: all 0.2s;
}
.pm-tab:hover { color: #7ab07a; }
.pm-tab.active { color: #00e040; border-bottom-color: #00e040; }

/* ── Tab body ────────────────────────────────────────────────────────── */
.pm-body {
  flex: 1; overflow-y: auto;
  padding: 20px 24px;
}
.pm-panel { display: none; }
.pm-panel.active { display: block; }

/* loading / error states */
.pm-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 40px 0; color: #4a7a4a; font-size: 0.9rem;
}
.pm-spinner {
  width: 36px; height: 36px;
  border: 3px solid #1a3d1a;
  border-top-color: #00e040;
  border-radius: 50%;
  animation: pm-spin 0.8s linear infinite;
}
@keyframes pm-spin { to { transform: rotate(360deg) } }
.pm-error { color: #ff6b6b; background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2); border-radius: 10px; padding: 14px 18px; font-size: 0.88rem; }

/* ── Overview tab ────────────────────────────────────────────────────── */
.pm-overview-desc { color: #7ab07a; font-size: 0.95rem; line-height: 1.7; margin-bottom: 20px; }
.pm-overview-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.pm-badge {
  padding: 5px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;
  border: 1px solid #2a5f2a; color: #00e040; background: rgba(0,224,64,0.08);
}
.pm-obj-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.pm-obj-list li {
  display: flex; align-items: flex-start; gap: 10px;
  color: #c8f0c8; font-size: 0.88rem;
  background: #0a1a0a; border: 1px solid #1a3d1a;
  border-radius: 10px; padding: 10px 14px;
}
.pm-obj-list li::before { content: '→'; color: #00e040; font-weight: 700; flex-shrink: 0; }

/* ── YouTube tab ─────────────────────────────────────────────────────── */
.pm-video-list { display: flex; flex-direction: column; gap: 12px; }
.pm-video-card {
  background: #0a1a0a; border: 1px solid #1a3d1a;
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: flex-start; gap: 14px;
  transition: border-color 0.2s;
}
.pm-video-card:hover { border-color: #2a5f2a; }
.pm-video-thumb {
  width: 72px; height: 48px; border-radius: 8px;
  background: linear-gradient(135deg, #0d200d, #1a3d1a);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; flex-shrink: 0;
}
.pm-video-info { flex: 1; min-width: 0; }
.pm-video-title { font-size: 0.88rem; font-weight: 700; color: #c8f0c8; line-height: 1.3; margin-bottom: 4px; }
.pm-video-meta { font-size: 0.75rem; color: #4a7a4a; margin-bottom: 4px; }
.pm-video-desc { font-size: 0.78rem; color: #7ab07a; line-height: 1.5; }
.pm-video-link {
  display: inline-block; margin-top: 8px;
  font-size: 0.75rem; font-weight: 700;
  color: #00e040; background: rgba(0,224,64,0.08);
  border: 1px solid #1a3d1a; border-radius: 6px;
  padding: 4px 10px; text-decoration: none; transition: all 0.2s;
}
.pm-video-link:hover { background: rgba(0,224,64,0.18); border-color: #00e040; }

/* ── GitHub tab ──────────────────────────────────────────────────────── */
.pm-repo-list { display: flex; flex-direction: column; gap: 12px; }
.pm-repo-card {
  background: #0a1a0a; border: 1px solid #1a3d1a;
  border-radius: 12px; padding: 14px 16px;
  transition: border-color 0.2s;
}
.pm-repo-card:hover { border-color: #2a5f2a; }
.pm-repo-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
.pm-repo-name { font-size: 0.9rem; font-weight: 800; color: #00e040; }
.pm-repo-stars { font-size: 0.78rem; color: #7ab07a; }
.pm-repo-desc { font-size: 0.82rem; color: #7ab07a; line-height: 1.5; margin-bottom: 8px; }
.pm-repo-topics { display: flex; flex-wrap: wrap; gap: 4px; }
.pm-repo-topic { font-size: 0.7rem; background: rgba(0,224,64,0.07); border: 1px solid #1a3d1a; color: #4a7a4a; border-radius: 5px; padding: 2px 7px; }
.pm-repo-link {
  display: inline-block; margin-top: 8px;
  font-size: 0.75rem; font-weight: 700;
  color: #00e040; background: rgba(0,224,64,0.08);
  border: 1px solid #1a3d1a; border-radius: 6px;
  padding: 4px 10px; text-decoration: none; transition: all 0.2s;
}
.pm-repo-link:hover { background: rgba(0,224,64,0.18); border-color: #00e040; }

/* ── Docs tab ────────────────────────────────────────────────────────── */
.pm-docs-section { margin-bottom: 20px; }
.pm-docs-section h4 { color: #00e040; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.pm-docs-overview { color: #7ab07a; font-size: 0.9rem; line-height: 1.7; }
.pm-prereq-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.pm-prereq-list li { display: flex; align-items: center; gap: 8px; color: #c8f0c8; font-size: 0.85rem; }
.pm-prereq-list li::before { content: '⚙'; color: #00a030; }
.pm-steps-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.pm-step {
  display: flex; gap: 12px; align-items: flex-start;
  background: #0a1a0a; border: 1px solid #1a3d1a;
  border-radius: 10px; padding: 12px 14px;
}
.pm-step-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(0,224,64,0.12); border: 1px solid #2a5f2a;
  color: #00e040; font-size: 0.78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pm-step-content { flex: 1; }
.pm-step-title { font-size: 0.88rem; font-weight: 700; color: #c8f0c8; margin-bottom: 4px; }
.pm-step-desc { font-size: 0.82rem; color: #7ab07a; line-height: 1.5; }
.pm-resources-list { display: flex; flex-direction: column; gap: 8px; }
.pm-resource {
  display: flex; align-items: center; gap: 10px;
  background: #0a1a0a; border: 1px solid #1a3d1a;
  border-radius: 10px; padding: 10px 14px;
}
.pm-resource-type {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  background: rgba(0,224,64,0.08); border: 1px solid #1a3d1a;
  color: #00a030; border-radius: 5px; padding: 2px 7px; flex-shrink: 0;
}
.pm-resource-info { flex: 1; min-width: 0; }
.pm-resource-name { font-size: 0.85rem; font-weight: 700; color: #c8f0c8; }
.pm-resource-desc { font-size: 0.78rem; color: #4a7a4a; }
.pm-resource-link { font-size: 0.78rem; color: #00e040; text-decoration: none; flex-shrink: 0; }
.pm-resource-link:hover { text-decoration: underline; }

/* ── Search tab ──────────────────────────────────────────────────────── */
.pm-search-form { display: flex; gap: 8px; margin-bottom: 20px; }
.pm-search-input {
  flex: 1; background: #0a1a0a; border: 1px solid #2a5f2a;
  border-radius: 10px; padding: 10px 14px;
  color: #c8f0c8; font-size: 0.88rem; outline: none;
  transition: border-color 0.2s;
}
.pm-search-input:focus { border-color: #00e040; }
.pm-search-btn {
  background: rgba(0,224,64,0.12); border: 1px solid #2a5f2a;
  color: #00e040; border-radius: 10px; padding: 10px 18px;
  font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.pm-search-btn:hover { background: rgba(0,224,64,0.22); }
.pm-search-answer {
  background: #0a1a0a; border: 1px solid #1a3d1a;
  border-radius: 12px; padding: 16px;
  color: #c8f0c8; font-size: 0.88rem; line-height: 1.7;
  white-space: pre-wrap; word-break: break-word;
}

/* ── Chat tab ────────────────────────────────────────────────────────── */
.pm-chat-messages {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 14px; max-height: 340px; overflow-y: auto;
}
.pm-msg {
  max-width: 85%; padding: 10px 14px;
  border-radius: 12px; font-size: 0.85rem; line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}
.pm-msg.user {
  background: rgba(0,224,64,0.12); border: 1px solid #2a5f2a;
  color: #c8f0c8; align-self: flex-end; border-bottom-right-radius: 4px;
}
.pm-msg.assistant {
  background: #0a1a0a; border: 1px solid #1a3d1a;
  color: #c8f0c8; align-self: flex-start; border-bottom-left-radius: 4px;
}
.pm-chat-form { display: flex; gap: 8px; }
.pm-chat-input {
  flex: 1; background: #0a1a0a; border: 1px solid #2a5f2a;
  border-radius: 10px; padding: 10px 14px;
  color: #c8f0c8; font-size: 0.88rem; outline: none;
  resize: none; min-height: 44px; max-height: 100px;
  transition: border-color 0.2s; font-family: inherit;
}
.pm-chat-input:focus { border-color: #00e040; }
.pm-chat-send {
  background: rgba(0,224,64,0.12); border: 1px solid #2a5f2a;
  color: #00e040; border-radius: 10px; padding: 10px 18px;
  font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s; align-self: flex-end;
}
.pm-chat-send:hover:not(:disabled) { background: rgba(0,224,64,0.22); }
.pm-chat-send:disabled { opacity: 0.4; cursor: default; }
`;

    // ── Inject CSS ─────────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('pm-styles')) return;
        const style = document.createElement('style');
        style.id = 'pm-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    // ── Render project cards ───────────────────────────────────────────────
    function renderCards(container) {
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'pm-grid';

        PROJECTS.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'pm-card';
            card.innerHTML = `
        <div class="pm-card-icon">${proj.icon}</div>
        <div class="pm-card-title">${proj.title}</div>
        <div class="pm-card-tags">${proj.tags.map(t => `<span class="pm-tag">${t}</span>`).join('')}</div>
        <div class="pm-card-meta">${proj.duration}</div>
        <div class="pm-card-diff">${proj.difficulty}</div>
      `;
            card.addEventListener('click', () => openModal(proj));
            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    // ── Modal ──────────────────────────────────────────────────────────────
    function openModal(proj) {
        activeProject = proj;
        activeChatHistory = [];
        if (!cache[proj.id]) cache[proj.id] = {};

        const overlay = document.createElement('div');
        overlay.className = 'pm-overlay';
        overlay.id = 'pm-overlay';

        overlay.innerHTML = `
      <div class="pm-modal" role="dialog" aria-modal="true" aria-label="${proj.title}">
        <div class="pm-modal-header">
          <div class="pm-modal-icon">${proj.icon}</div>
          <div class="pm-modal-title-wrap">
            <div class="pm-modal-title">${proj.title}</div>
            <div class="pm-modal-subtitle">${proj.tags.join(' · ')} · ${proj.difficulty} · ${proj.duration}</div>
          </div>
          <button class="pm-close-btn" id="pm-close" aria-label="Close">✕</button>
        </div>

        <div class="pm-tabs">
          <button class="pm-tab active" data-tab="overview">📋 Overview</button>
          <button class="pm-tab" data-tab="youtube">▶️ YouTube</button>
          <button class="pm-tab" data-tab="github">🐙 GitHub</button>
          <button class="pm-tab" data-tab="docs">📄 Docs</button>
          <button class="pm-tab" data-tab="search">🔍 AI Search</button>
          <button class="pm-tab" data-tab="chat">💬 Orbit Chat</button>
        </div>

        <div class="pm-body">
          ${buildOverviewPanel(proj)}
          ${buildPlaceholderPanel('youtube', 'YouTube recommendations')}
          ${buildPlaceholderPanel('github', 'GitHub repositories')}
          ${buildPlaceholderPanel('docs', 'project documentation')}
          ${buildSearchPanel()}
          ${buildChatPanel(proj)}
        </div>
      </div>
    `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Event listeners
        overlay.querySelector('#pm-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', handleEsc);

        overlay.querySelectorAll('.pm-tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab, proj));
        });

        // Chat submit
        const chatForm = overlay.querySelector('#pm-chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', e => {
                e.preventDefault();
                sendChatMessage(proj);
            });
        }

        // Search submit
        const searchForm = overlay.querySelector('#pm-search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', e => {
                e.preventDefault();
                runSearch(proj);
            });
        }
    }

    function closeModal() {
        const overlay = document.getElementById('pm-overlay');
        if (overlay) overlay.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
    }

    function handleEsc(e) { if (e.key === 'Escape') closeModal(); }

    function switchTab(tabName, proj) {
        document.querySelectorAll('.pm-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        document.querySelectorAll('.pm-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tabName));

        // Lazy-load tabs that require API calls
        const loaded = cache[proj.id];
        if (tabName === 'youtube' && !loaded.youtube) fetchYoutube(proj);
        if (tabName === 'github' && !loaded.github) fetchGithub(proj);
        if (tabName === 'docs' && !loaded.docs) fetchDocs(proj);
    }

    // ── Panel builders ─────────────────────────────────────────────────────
    function buildOverviewPanel(proj) {
        return `
      <div class="pm-panel active" data-panel="overview">
        <p class="pm-overview-desc">${proj.description}</p>
        <div class="pm-overview-badges">
          ${proj.tags.map(t => `<span class="pm-badge">${t}</span>`).join('')}
          <span class="pm-badge">⏱ ${proj.duration}</span>
          <span class="pm-badge">📊 ${proj.difficulty}</span>
        </div>
        <h4 style="color:#00e040;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Project Objectives</h4>
        <ul class="pm-obj-list">
          ${proj.objectives.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>
    `;
    }

    function buildPlaceholderPanel(name, label) {
        return `
      <div class="pm-panel" data-panel="${name}" id="pm-panel-${name}">
        <div class="pm-loading" id="pm-loading-${name}">
          <div class="pm-spinner"></div>
          <span>Loading ${label}…</span>
        </div>
        <div id="pm-content-${name}" style="display:none"></div>
      </div>
    `;
    }

    function buildSearchPanel() {
        return `
      <div class="pm-panel" data-panel="search">
        <form class="pm-search-form" id="pm-search-form">
          <input class="pm-search-input" id="pm-search-input" placeholder="Ask anything about this project…" autocomplete="off" />
          <button class="pm-search-btn" type="submit">Ask AI</button>
        </form>
        <div id="pm-search-result"></div>
      </div>
    `;
    }

    function buildChatPanel(proj) {
        return `
      <div class="pm-panel" data-panel="chat">
        <div class="pm-chat-messages" id="pm-chat-messages">
          <div class="pm-msg assistant">👋 Hi! I'm Orbit. I'm here to help you build <strong>${proj.title}</strong>. Ask me anything — architecture, code, debugging, best practices.</div>
        </div>
        <form class="pm-chat-form" id="pm-chat-form">
          <textarea class="pm-chat-input" id="pm-chat-input" placeholder="Type a message…" rows="1"></textarea>
          <button class="pm-chat-send" type="submit" id="pm-chat-send">Send</button>
        </form>
      </div>
    `;
    }

    // ── API fetchers ───────────────────────────────────────────────────────
    async function fetchYoutube(proj) {
        setLoading('youtube', true);
        try {
            const res = await fetch('/api/projects/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectTitle: proj.title, tags: proj.tags })
            });
            const data = await res.json();
            cache[proj.id].youtube = data;
            renderYoutube(data.videos || []);
        } catch (err) {
            showError('youtube', 'Could not load YouTube recommendations. ' + err.message);
        }
        setLoading('youtube', false);
    }

    async function fetchGithub(proj) {
        setLoading('github', true);
        try {
            const res = await fetch('/api/projects/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectTitle: proj.title, tags: proj.tags })
            });
            const data = await res.json();
            cache[proj.id].github = data;
            renderGithub(data.repos || []);
        } catch (err) {
            showError('github', 'Could not load GitHub repositories. ' + err.message);
        }
        setLoading('github', false);
    }

    async function fetchDocs(proj) {
        setLoading('docs', true);
        try {
            const res = await fetch('/api/projects/docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectTitle: proj.title, tags: proj.tags })
            });
            const data = await res.json();
            cache[proj.id].docs = data;
            renderDocs(data);
        } catch (err) {
            showError('docs', 'Could not generate documentation. ' + err.message);
        }
        setLoading('docs', false);
    }

    async function runSearch(proj) {
        const input = document.getElementById('pm-search-input');
        const resultEl = document.getElementById('pm-search-result');
        const query = input?.value.trim();
        if (!query) return;

        resultEl.innerHTML = '<div class="pm-loading"><div class="pm-spinner"></div><span>Thinking…</span></div>';

        try {
            const res = await fetch('/api/projects/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, projectTitle: proj.title, tags: proj.tags })
            });
            const data = await res.json();
            resultEl.innerHTML = `<div class="pm-search-answer">${escHtml(data.answer || 'No answer returned.')}</div>`;
        } catch (err) {
            resultEl.innerHTML = `<div class="pm-error">Error: ${err.message}</div>`;
        }
    }

    async function sendChatMessage(proj) {
        const input = document.getElementById('pm-chat-input');
        const sendBtn = document.getElementById('pm-chat-send');
        const messages = document.getElementById('pm-chat-messages');
        const text = input?.value.trim();
        if (!text) return;

        input.value = '';
        sendBtn.disabled = true;

        activeChatHistory.push({ role: 'user', content: text });
        appendMsg(messages, 'user', text);

        const typingEl = appendMsg(messages, 'assistant', '⏳ Orbit is thinking…');

        try {
            const res = await fetch('/api/projects/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: activeChatHistory, projectTitle: proj.title, tags: proj.tags })
            });
            const data = await res.json();
            const reply = data.reply || 'Sorry, I could not respond.';
            activeChatHistory.push({ role: 'assistant', content: reply });
            typingEl.textContent = reply;
        } catch (err) {
            typingEl.textContent = 'Error: ' + err.message;
            typingEl.style.color = '#ff6b6b';
        }

        sendBtn.disabled = false;
        messages.scrollTop = messages.scrollHeight;
    }

    // ── Render functions ───────────────────────────────────────────────────
    function renderYoutube(videos) {
        const el = document.getElementById('pm-content-youtube');
        if (!el) return;
        el.innerHTML = `<div class="pm-video-list">${videos.map(v => `
      <div class="pm-video-card">
        <div class="pm-video-thumb">▶️</div>
        <div class="pm-video-info">
          <div class="pm-video-title">${escHtml(v.title)}</div>
          <div class="pm-video-meta">📺 ${escHtml(v.channel)} · ⏱ ${escHtml(v.duration)}</div>
          <div class="pm-video-desc">${escHtml(v.description)}</div>
          <a class="pm-video-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(v.searchQuery)}" target="_blank" rel="noopener">
            Search on YouTube ↗
          </a>
        </div>
      </div>
    `).join('')}</div>`;
        el.style.display = 'block';
    }

    function renderGithub(repos) {
        const el = document.getElementById('pm-content-github');
        if (!el) return;
        el.innerHTML = `<div class="pm-repo-list">${repos.map(r => `
      <div class="pm-repo-card">
        <div class="pm-repo-header">
          <span class="pm-repo-name">🐙 ${escHtml(r.name)}</span>
          <span class="pm-repo-stars">⭐ ${escHtml(r.stars)} · ${escHtml(r.language)}</span>
        </div>
        <div class="pm-repo-desc">${escHtml(r.description)}</div>
        <div class="pm-repo-topics">${(r.topics || []).map(t => `<span class="pm-repo-topic">${escHtml(t)}</span>`).join('')}</div>
        <a class="pm-repo-link" href="https://github.com/search?q=${encodeURIComponent(r.searchQuery)}" target="_blank" rel="noopener">
          Search on GitHub ↗
        </a>
      </div>
    `).join('')}</div>`;
        el.style.display = 'block';
    }

    function renderDocs(data) {
        const el = document.getElementById('pm-content-docs');
        if (!el) return;
        const steps = (data.steps || []).map(s => `
      <li class="pm-step">
        <div class="pm-step-num">${s.step}</div>
        <div class="pm-step-content">
          <div class="pm-step-title">${escHtml(s.title)}</div>
          <div class="pm-step-desc">${escHtml(s.description)}</div>
        </div>
      </li>`).join('');

        const resources = (data.resources || []).map(r => `
      <div class="pm-resource">
        <span class="pm-resource-type">${escHtml(r.type)}</span>
        <div class="pm-resource-info">
          <div class="pm-resource-name">${escHtml(r.name)}</div>
          <div class="pm-resource-desc">${escHtml(r.description)}</div>
        </div>
        <a class="pm-resource-link" href="${escHtml(r.url)}" target="_blank" rel="noopener">↗</a>
      </div>`).join('');

        el.innerHTML = `
      <div class="pm-docs-section">
        <h4>Overview</h4>
        <p class="pm-docs-overview">${escHtml(data.overview || '')}</p>
      </div>
      <div class="pm-docs-section">
        <h4>Prerequisites</h4>
        <ul class="pm-prereq-list">${(data.prerequisites || []).map(p => `<li>${escHtml(p)}</li>`).join('')}</ul>
      </div>
      <div class="pm-docs-section">
        <h4>Implementation Steps</h4>
        <ul class="pm-steps-list">${steps}</ul>
      </div>
      <div class="pm-docs-section">
        <h4>Resources</h4>
        <div class="pm-resources-list">${resources}</div>
      </div>
    `;
        el.style.display = 'block';
    }

    // ── Utility ────────────────────────────────────────────────────────────
    function setLoading(tab, show) {
        const loadEl = document.getElementById(`pm-loading-${tab}`);
        if (loadEl) loadEl.style.display = show ? 'flex' : 'none';
    }

    function showError(tab, msg) {
        const el = document.getElementById(`pm-content-${tab}`);
        if (el) { el.innerHTML = `<div class="pm-error">⚠️ ${msg}</div>`; el.style.display = 'block'; }
    }

    function appendMsg(container, role, text) {
        const div = document.createElement('div');
        div.className = `pm-msg ${role}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    function escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Public API ─────────────────────────────────────────────────────────
    function init(selector) {
        injectStyles();
        const containers = document.querySelectorAll(selector || '[data-pm-auto]');
        containers.forEach(container => renderCards(container));
    }

    window.ProjectsModal = { init };

    // Auto-init if data-pm-auto is present
    document.addEventListener('DOMContentLoaded', () => {
        const auto = document.querySelectorAll('[data-pm-auto]');
        if (auto.length) { injectStyles(); auto.forEach(c => renderCards(c)); }
    });
})();
