(function (global) {
  const TEMPLATE_SRC = 'hiero-quiz-certificate.jpg';
  const W = 1024;
  const H = 724;
  const SCALE = 2;
  const LEVELS = {
    1: { name: 'BEGINNER', tagline: 'BUILDING YOUR FOUNDATION' },
    2: { name: 'INTERMEDIATE', tagline: 'STRENGTHENING YOUR CORE' },
    3: { name: 'ADVANCED', tagline: 'MASTERING THE SKILL' }
  };

  let templateImage = null;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      if (templateImage && templateImage.complete) return resolve(templateImage);
      const img = new Image();
      img.onload = () => {
        templateImage = img;
        resolve(img);
      };
      img.onerror = () => reject(new Error('Could not load certificate template'));
      img.src = src;
    });
  }

  function waitForFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('italic 72px "Great Vibes"'),
      document.fonts.load('800 36px Inter'),
      document.fonts.load('700 22px Inter'),
      document.fonts.load('600 14px Inter')
    ]).catch(() => {});
  }

  function formatDate(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function fitText(ctx, text, maxWidth, fontFn) {
    let size = 64;
    ctx.font = fontFn(size);
    while (size > 28 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = fontFn(size);
    }
    return size;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function paint(canvas, data) {
    const s = SCALE;
    canvas.width = W * s;
    canvas.height = H * s;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.drawImage(templateImage, 0, 0, W, H);

    const name = String(data.fullName || data.candidateName || '').trim();
    if (!name) return;
    const level = Number(data.level) || 1;
    const meta = LEVELS[level] || LEVELS[1];
    const levelName = data.levelName || meta.name;
    const tagline = data.levelTagline || meta.tagline;
    const questions = Number(data.questionsSolved != null ? data.questionsSolved : data.questionsTotal) || 0;
    const progress = level + '/3';
    const certId = data.certificateId || 'H-QUIZ-XXXXXX';
    const issued = formatDate(data.issuedAt);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#fcfcfa';
    ctx.fillRect(318, 232, 454, 98);
    ctx.fillStyle = '#111111';
    const nameSize = fitText(ctx, name, 420, (n) => 'italic ' + n + 'px "Great Vibes", "Segoe Script", cursive');
    ctx.font = 'italic ' + nameSize + 'px "Great Vibes", "Segoe Script", cursive';
    ctx.fillText(name, 545, 278);
    ctx.strokeStyle = '#d7ddd8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(348, 322);
    ctx.lineTo(742, 322);
    ctx.stroke();

    ctx.fillStyle = '#ebffe6';
    roundRect(ctx, 448, 428, 236, 72, 8);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.font = '800 30px Inter, system-ui, sans-serif';
    let levelSize = 30;
    while (levelSize > 15 && ctx.measureText(levelName).width > 210) {
      levelSize -= 1;
      ctx.font = '800 ' + levelSize + 'px Inter, system-ui, sans-serif';
    }
    ctx.fillText(levelName, 566, 454);
    ctx.fillStyle = '#1f5133';
    ctx.font = '700 9px Inter, system-ui, sans-serif';
    ctx.fillText(tagline, 566, 486);

    ctx.fillStyle = '#fbfffa';
    ctx.fillRect(348, 520, 56, 48);
    ctx.fillRect(598, 524, 78, 26);
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'left';
    ctx.font = '800 32px Inter, system-ui, sans-serif';
    ctx.fillText(String(questions), 350, 548);
    ctx.font = '800 28px Inter, system-ui, sans-serif';
    ctx.fillText(progress, 602, 540);

    ctx.fillStyle = '#fcfcfa';
    ctx.fillRect(200, 642, 340, 52);
    ctx.fillStyle = '#475569';
    ctx.font = '500 11px Inter, system-ui, sans-serif';
    ctx.fillText('Date of Issue: ' + issued, 218, 662);
    ctx.fillText('Certificate ID: ' + certId, 218, 678);
  }

  async function render(canvas, data) {
    await Promise.all([loadImage(TEMPLATE_SRC), waitForFonts()]);
    paint(canvas, data || {});
    return canvas;
  }

  function download(canvas, data) {
    const safeName = String(data?.fullName || 'Hiero')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'Hiero';
    const levelName = data?.levelName || 'Level';
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Hiero_Quiz_Certificate_' + safeName + '_' + levelName + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, 'image/png');
  }

  async function resolveUserName() {
    function clean(value) {
      const name = String(value || '').replace(/\s+/g, ' ').trim();
      if (!name) return '';
      const lower = name.toLowerCase();
      if (['user', 'hiero learner', 'your name', 'guest', 'guest-user', 'undefined', 'null'].includes(lower)) return '';
      if (name.includes('@')) return name.split('@')[0].replace(/[._]+/g, ' ').trim();
      return name;
    }

    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        const fromUser = clean(user && (user.name || user.fullName || user.username));
        if (fromUser) return fromUser;
      }
    } catch (e) {}

    const saved = clean(localStorage.getItem('userName') || localStorage.getItem('name'));
    if (saved) return saved;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
      if (token && token.split('.').length === 3) {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const fromJwt = clean(payload && (payload.name || payload.fullName));
        if (fromJwt) return fromJwt;
      }
    } catch (e) {}

    const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
    if (token) {
      try {
        const res = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + token } });
        const json = await res.json();
        const fromApi = clean(json && (json.name || json.fullName));
        if (fromApi) return fromApi;
      } catch (e) {}
    }

    try {
      const resume = JSON.parse(localStorage.getItem('resumeData') || '{}');
      const fromResume = clean((resume.personalInfo && resume.personalInfo.fullName) || resume.fullName);
      if (fromResume) return fromResume;
    } catch (e) {}

    try {
      const auto = JSON.parse(localStorage.getItem('hiero_resume_autosave') || '{}');
      const fromAuto = clean((auto.personalInfo && auto.personalInfo.fullName) || auto.fullName);
      if (fromAuto) return fromAuto;
    } catch (e) {}

    return '';
  }

  global.HieroEvalCertificate = {
    LEVELS,
    render,
    download,
    resolveUserName,
    formatDate
  };
})(window);
