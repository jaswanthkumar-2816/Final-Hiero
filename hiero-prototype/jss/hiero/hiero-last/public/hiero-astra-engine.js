    /**
     * Hiero Astra engine — official lockup from hiero_logo.svg
     * Paths are sampled with getPointAtLength, same as the OpenAI Astra mark.
     */

    const canvas = document.getElementById('field');
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    // Offscreen bloom canvas for additive stellar glow
    const bloomCanvas = document.createElement('canvas');
    const bloomCtx = bloomCanvas.getContext('2d', { alpha: true });

    const TAU = Math.PI * 2;
    const DEG2RAD = Math.PI / 180;
    const SAMPLES_PER_PATH = 520;

    // Configuration & State
    const CONFIG = {
      particleCount: 4000,
      antiCount: 800,
      lotusHaloCount: 100,
      lotusFeedCount: 100,
      magnetRadius: 190,
      ringRadius: 78,
      lerpSpeed: 0.085,
      warpZ: 60,
      depthScale: 720,
      rotSpeedY: 0.0032,
      rotSpeedX: 0.0008,
      heroFlareCount: 10,
      wordmarkY: 0.40,
      disturbRadius: 150,
      disturbForce: 78,
      disturbIn: 0.18,
      disturbOut: 0.055
    };

    const STATE = {
      dpr: 1,
      w: window.innerWidth,
      h: window.innerHeight,
      cx: window.innerWidth / 2,
      cy: window.innerHeight / 2,
      scale: 1,
      sparkleScale: 1,
      
      currentMode: 'swirl',
      morphProgress: 0.0,
      targetMorph: 0.0,
      
      // Camera & Mouse rotation
      yaw: 0.0,
      pitch: 14 * DEG2RAD,
      roll: 0.0,
      
      mouseX: 0,
      mouseY: 0,
      targetMouseX: 0,
      targetMouseY: 0,
      isDragging: false,
      lastDragX: 0,
      lastDragY: 0,

      // Options
      flaresEnabled: false,
      orbitEnabled: false,
      speedMultiplier: 2.6,

      // Particles & Assets
      stars: [],
      anti: [],
      lotusHalo: [],
      lotusFeed: [],
      lotusPos: null,
      sprites: {},
      pathsData: [],
      lotusImg: null,
      lastPointerAt: 0,
      pointerSX: 0,
      pointerSY: 0,
      pointerOver: false,

      t0: performance.now(),
      lastT: performance.now()
    };

    // Math utilities
    function rand(min, max) { return min + Math.random() * (max - min); }
    function pickBrandColor(i) {
      const t = i % 8;
      return t < 6 ? 'green' : t === 6 ? 'orange' : 'white';
    }
    function pickLogoColor(i) {
      const t = i % 8;
      return t < 6 ? 'green' : t === 6 ? 'orange' : 'white';
    }
    function spriteKeyFor(colorType) {
      return colorType === 'orange' ? 'orangePoint' : colorType === 'white' ? 'whitePoint' : 'greenPoint';
    }
    function mixedSize() {
      return Math.random() < 0.62 ? rand(0.5, 1.05) : rand(1.15, 2.0);
    }
    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
    function gaussianRand() {
      let u = 0, v = 0;
      while (!u) u = Math.random();
      while (!v) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(TAU * v);
    }

    // Pre-render star textures
    function createGlowSprite(coreColor, haloColor, size = 64) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const r = size / 2;
      const grad = g.createRadialGradient(r, r, 0, r, r, r * 0.55);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.08, coreColor);
      grad.addColorStop(0.2, haloColor);
      grad.addColorStop(0.42, haloColor.replace(/[\d\.]+\)$/, '0.14)'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(r, r, r, 0, TAU);
      g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(r, r, Math.max(1, size * 0.05), 0, TAU);
      g.fill();
      return c;
    }

    // Pre-render authentic 4-Point Star Lens Flare (Diffraction Spikes)
    function createDiffractionFlareSprite(coreColor, rayColor, size = 150) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const cx = size / 2, cy = size / 2;

      // 1. Central brilliant glow corona
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
      grad.addColorStop(0, coreColor);
      grad.addColorStop(0.08, rayColor);
      grad.addColorStop(0.35, rayColor.replace(/[\d\.]+\)$/, '0.12)'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, size * 0.4, 0, TAU);
      g.fill();

      // 2. Horizontal diffraction spike needle
      const hGrad = g.createLinearGradient(0, cy, size, cy);
      hGrad.addColorStop(0, 'rgba(255,255,255,0)');
      hGrad.addColorStop(0.35, rayColor.replace(/[\d\.]+\)$/, '0.35)'));
      hGrad.addColorStop(0.5, coreColor);
      hGrad.addColorStop(0.65, rayColor.replace(/[\d\.]+\)$/, '0.35)'));
      hGrad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = hGrad;
      g.beginPath();
      g.moveTo(0, cy);
      g.lineTo(cx, cy - 2.0);
      g.lineTo(size, cy);
      g.lineTo(cx, cy + 2.0);
      g.closePath();
      g.fill();

      // 3. Vertical diffraction spike needle
      const vGrad = g.createLinearGradient(cx, 0, cx, size);
      vGrad.addColorStop(0, 'rgba(255,255,255,0)');
      vGrad.addColorStop(0.35, rayColor.replace(/[\d\.]+\)$/, '0.35)'));
      vGrad.addColorStop(0.5, coreColor);
      vGrad.addColorStop(0.65, rayColor.replace(/[\d\.]+\)$/, '0.35)'));
      vGrad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = vGrad;
      g.beginPath();
      g.moveTo(cx, 0);
      g.lineTo(cx + 2.0, cy);
      g.lineTo(cx, size);
      g.lineTo(cx - 2.0, cy);
      g.closePath();
      g.fill();

      // 4. Diagonal sheen (45 deg)
      g.save();
      g.translate(cx, cy);
      g.rotate(Math.PI / 4);
      const diagGrad = g.createLinearGradient(-size * 0.26, 0, size * 0.26, 0);
      diagGrad.addColorStop(0, 'rgba(255,255,255,0)');
      diagGrad.addColorStop(0.5, rayColor.replace(/[\d\.]+\)$/, '0.38)'));
      diagGrad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = diagGrad;
      g.fillRect(-size * 0.26, -0.7, size * 0.52, 1.4);
      g.rotate(Math.PI / 2);
      g.fillRect(-size * 0.26, -0.7, size * 0.52, 1.4);
      g.restore();

      return c;
    }

    function initSprites() {
      STATE.sprites = {
        greenPoint: createGlowSprite('rgba(190,255,186,1)', 'rgba(50,193,74,1)', 56),
        orangePoint: createGlowSprite('rgba(255,220,176,1)', 'rgba(255,122,24,1)', 56),
        whitePoint: createGlowSprite('rgba(255,255,255,1)', 'rgba(240,250,255,0.95)', 56),
        antiPoint: createGlowSprite('rgba(50,193,74,0.85)', 'rgba(50,193,74,0.6)', 36),
        forestFlare: createDiffractionFlareSprite('rgba(190,255,186,1)', 'rgba(50,193,74,1)', 140),
        emeraldFlare: createDiffractionFlareSprite('rgba(255,220,176,1)', 'rgba(255,122,24,1)', 140)
      };
    }

    async function loadHieroSvg() {
      const host = document.getElementById('hieroShapeHost');
      const res = await fetch('hiero_logo_paths.svg', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load hiero_logo_paths.svg');
      host.innerHTML = await res.text();
    }

    function loadLotusImage() {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          STATE.lotusImg = img;
          resolve(img);
        };
        img.onerror = () => reject(new Error('Could not load lotus-glow.png'));
        img.src = 'lotus-glow.png';
      });
    }

    function logoRadius() {
      const minDim = Math.min(STATE.w, STATE.h);
      return (minDim * 0.38) * STATE.scale;
    }

    function drawLotusUnder(maxY, minX, maxX, t) {
      const img = STATE.lotusImg;
      if (!img || !img.width) return;
      const span = Math.max(160, maxX - minX);
      const dw = span * 0.48;
      const dh = dw * (img.height / img.width);
      const cx = STATE.cx;
      const cy = maxY + dh * 0.48;
      STATE.lotusPos = { cx, cy, dw, dh };

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = 1;
      ctx.shadowColor = 'rgba(109, 220, 71, 0.28)';
      ctx.shadowBlur = 12;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();

      drawLotusHalo(cx, cy, dw * 0.58, dh * 0.62, t);
    }

    function initLotusFeed() {
      const lanes = 7;
      const feed = [];
      for (let i = 0; i < CONFIG.lotusFeedCount; i++) {
        const lane = i % lanes;
        feed.push({
          laneT: lanes === 1 ? 0 : (lane / (lanes - 1)) - 0.5,
          prog: (i / CONFIG.lotusFeedCount),
          speed: rand(0.14, 0.2),
          size: mixedSize(),
          colorType: pickBrandColor(i)
        });
      }
      STATE.lotusFeed = feed;
    }

    function drawLotusFeed(projected, dt) {
      const lotus = STATE.lotusPos;
      if (!lotus || !projected.length || !STATE.lotusFeed.length) return;

      let logoBottom = -Infinity;
      for (let i = 0; i < projected.length; i++) {
        if (projected[i].y > logoBottom) logoBottom = projected[i].y;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < STATE.lotusFeed.length; i++) {
        const p = STATE.lotusFeed[i];
        p.prog += p.speed * dt;
        if (p.prog >= 1) p.prog -= 1;

        const x0 = lotus.cx + p.laneT * lotus.dw * 0.28;
        const y0 = lotus.cy - lotus.dh * 0.12;
        const x1 = STATE.cx + p.laneT * lotus.dw * 0.16;
        const y1 = logoBottom - 6;
        const x = x0 + (x1 - x0) * p.prog;
        const y = y0 + (y1 - y0) * p.prog;
        const fade = Math.sin(p.prog * Math.PI);
        const spriteKey = spriteKeyFor(p.colorType);
        const size = 10.5 + p.size * 7.5;
        ctx.globalAlpha = clamp(0.16 + fade * 0.52, 0.1, 0.72);
        ctx.drawImage(STATE.sprites[spriteKey], x - size / 2, y - size / 2, size, size);
      }

      ctx.restore();
    }

    function initLotusHalo() {
      const halo = [];
      for (let i = 0; i < CONFIG.lotusHaloCount; i++) {
        halo.push({
          a: (i / CONFIG.lotusHaloCount) * TAU,
          r: rand(0.82, 1.02),
          speed: rand(0.12, 0.22),
          size: mixedSize(),
          phase: rand(0, TAU),
          colorType: pickBrandColor(i)
        });
      }
      STATE.lotusHalo = halo;
    }

    function drawLotusHalo(cx, cy, rx, ry, t) {
      if (!STATE.lotusHalo.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < STATE.lotusHalo.length; i++) {
        const p = STATE.lotusHalo[i];
        const a = p.a + t * p.speed;
        const x = cx + Math.cos(a) * rx * p.r;
        const y = cy + Math.sin(a) * ry * p.r;
        const spriteKey = spriteKeyFor(p.colorType);
        const size = 10.5 + p.size * 6;
        ctx.globalAlpha = clamp(0.28 + 0.16 * Math.sin(t * 1.2 + p.phase), 0.16, 0.52);
        ctx.drawImage(STATE.sprites[spriteKey], x - size / 2, y - size / 2, size, size);
      }
      ctx.restore();
    }

    function sampleSvgPaths() {
      const svg = document.querySelector('#hieroShapeHost svg');
      const pathElements = svg ? [...svg.querySelectorAll('path')] : [];
      const vb = svg && svg.viewBox && svg.viewBox.baseVal
        ? svg.viewBox.baseVal
        : { width: 672, height: 584 };
      const SVG_CX = vb.width / 2;
      const SVG_CY = vb.height / 2;
      const SVG_SCALE = Math.max(vb.width, vb.height) / 2;
      STATE.pathsData = [];

      for (let k = 0; k < pathElements.length; k++) {
        const el = pathElements[k];
        const totalLen = el.getTotalLength();
        if (totalLen < 8) continue;
        const count = Math.max(80, Math.min(SAMPLES_PER_PATH, Math.round(totalLen / 1.15)));
        const samples = [];

        for (let i = 0; i <= count; i++) {
          const dist = (i / count) * totalLen;
          const pt = el.getPointAtLength(dist);

          const d1 = Math.max(0, dist - 1.5);
          const d2 = Math.min(totalLen, dist + 1.5);
          const p1 = el.getPointAtLength(d1);
          const p2 = el.getPointAtLength(d2);

          let tx = p2.x - p1.x;
          let ty = p2.y - p1.y;
          const mag = Math.hypot(tx, ty) || 1;
          tx /= mag;
          ty /= mag;

          samples.push({
            x: (pt.x - SVG_CX) / SVG_SCALE,
            y: (pt.y - SVG_CY) / SVG_SCALE,
            nx: -ty,
            ny: tx
          });
        }

        STATE.pathsData.push({
          totalLength: totalLen,
          samples: samples,
          sampleCount: count
        });
      }

      STATE.pathsData = STATE.pathsData.filter((p) => {
        const meanY = p.samples.reduce((sum, s) => sum + s.y, 0) / p.samples.length;
        return meanY < CONFIG.wordmarkY;
      });

      recenterSamples(STATE.pathsData);
    }

    function recenterSamples(paths) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < paths.length; i++) {
        const samples = paths[i].samples;
        for (let j = 0; j < samples.length; j++) {
          const s = samples[j];
          if (s.x < minX) minX = s.x;
          if (s.x > maxX) maxX = s.x;
          if (s.y < minY) minY = s.y;
          if (s.y > maxY) maxY = s.y;
        }
      }
      if (!isFinite(minX)) return;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const ext = Math.max(maxX - minX, maxY - minY) / 2 || 1;
      const sc = 0.98 / ext;
      for (let i = 0; i < paths.length; i++) {
        const samples = paths[i].samples;
        for (let j = 0; j < samples.length; j++) {
          samples[j].x = (samples[j].x - cx) * sc;
          samples[j].y = (samples[j].y - cy) * sc;
        }
      }
    }

    function getPathPoint(pathIndex, tNorm) {
      const pData = STATE.pathsData[pathIndex];
      if (!pData || !pData.samples.length) return { x: 0, y: 0, nx: 1, ny: 0 };
      const count = pData.sampleCount || (pData.samples.length - 1);
      const norm = ((tNorm % 1.0) + 1.0) % 1.0;
      const idxFloat = norm * count;
      const i0 = Math.floor(idxFloat);
      const i1 = (i0 + 1) % pData.samples.length;
      const frac = idxFloat - i0;

      const s0 = pData.samples[i0];
      const s1 = pData.samples[i1];

      return {
        x: s0.x + (s1.x - s0.x) * frac,
        y: s0.y + (s1.y - s0.y) * frac,
        nx: s0.nx + (s1.nx - s0.nx) * frac,
        ny: s0.ny + (s1.ny - s0.ny) * frac
      };
    }

    function pickWeightedPath() {
      const weights = STATE.pathsData.map((p) => p.totalLength);
      const sum = weights.reduce((a, b) => a + b, 0) || 1;
      let r = Math.random() * sum;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
      }
      return Math.max(0, weights.length - 1);
    }

    function initAntiGravity() {
      const field = [];
      for (let i = 0; i < CONFIG.antiCount; i++) {
        field.push({
          x: (i + Math.random()) / CONFIG.antiCount,
          y: Math.random(),
          fall: rand(0.10, 0.18),
          size: rand(7, 13),
          colorType: pickBrandColor(i)
        });
      }
      STATE.anti = field;
    }

    function updateAntiGravity(dt) {
      for (let i = 0; i < STATE.anti.length; i++) {
        const p = STATE.anti[i];
        p.y += p.fall * dt;
        if (p.y > 1.04) {
          p.y -= 1.08;
          p.x = Math.random();
        }
      }
    }

    function drawAntiGravity() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < STATE.anti.length; i++) {
        const p = STATE.anti[i];
        const x = p.x * STATE.w;
        const y = p.y * STATE.h;
        const spriteKey = spriteKeyFor(p.colorType);
        ctx.globalAlpha = p.colorType === 'white' ? 0.22 : 0.34;
        ctx.drawImage(STATE.sprites[spriteKey], x - p.size / 2, y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // Build Particles mapped to Lotus Shape points & Swirl paths
    function initParticles() {
      initAntiGravity();
      initLotusHalo();
      initLotusFeed();

      const lotusPoints = ((window.LOTUS_POINTS && window.LOTUS_POINTS.length)
        ? window.LOTUS_POINTS
        : []
      ).filter((lp) => lp[1] < CONFIG.wordmarkY);

      if (lotusPoints.length) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < lotusPoints.length; i++) {
          const x = lotusPoints[i][0], y = lotusPoints[i][1];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const ext = Math.max(maxX - minX, maxY - minY) / 2 || 1;
        const sc = 0.98 / ext;
        for (let i = 0; i < lotusPoints.length; i++) {
          lotusPoints[i] = [
            (lotusPoints[i][0] - cx) * sc,
            (lotusPoints[i][1] - cy) * sc,
            lotusPoints[i][2] || 0
          ];
        }
      }

      const stars = [];
      const count = CONFIG.particleCount;

      for (let i = 0; i < count; i++) {
        // Lotus home coordinate
        let lx = 0, ly = 0, isBoundary = 0;
        if (lotusPoints.length > 0) {
          const lp = lotusPoints[i % lotusPoints.length];
          lx = lp[0];
          ly = lp[1];
          isBoundary = lp[2] || 0;
        } else {
          // Math fallback if array missing
          const angle = Math.random() * TAU;
          const r = Math.pow(Math.random(), 0.5) * 0.8;
          lx = Math.cos(angle) * r;
          ly = Math.sin(angle) * r;
        }

        const pathIndex = STATE.pathsData.length ? pickWeightedPath() : 0;
        const tAlong = Math.random();
        const scatterNorm = gaussianRand() * 0.1;
        const scatterZ = gaussianRand() * 0.08;

        const colorType = pickLogoColor(i);
        const flareType = colorType === 'orange' ? 'orange' : colorType === 'white' ? 'white' : 'green';

        // Hero flares at key lotus peaks
        const isHeroFlare = (i < CONFIG.heroFlareCount) || (isBoundary && Math.abs(lx) < 0.08 && ly < -0.65);

        // 3D petal curving for lotus: center stands forward, sides cup outward
        const lotusZ = (Math.cos(lx * Math.PI * 0.9) * 0.32 - (ly + 0.1) * 0.18 + gaussianRand() * 0.04);

        stars.push({
          // Lotus coordinates
          lx: lx,
          ly: ly,
          lz: lotusZ,
          driftAngle: Math.random() * TAU,
          driftSpeed: rand(0.6, 2.0),
          driftRadius: rand(0.008, 0.024),

          // Swirl coordinates
          pathIndex: pathIndex,
          tAlong: tAlong,
          speed: rand(0.07, 0.13),
          scatterNorm: scatterNorm,
          scatterZ: scatterZ,

          // Visuals
          size: mixedSize(),
          baseAlpha: isHeroFlare ? rand(0.49, 0.6) : rand(0.41, 0.57),
          twinkleSpeed: rand(0.7, 2.6),
          phase: rand(0, TAU),
          colorType: colorType,
          hasFlare: isHeroFlare,
          flareType: flareType,
          flareScale: rand(0.8, 1.35),
          ox: 0,
          oy: 0
        });
      }

      STATE.stars = stars;
    }

    function resize() {
      STATE.dpr = Math.min(window.devicePixelRatio || 1, 2);
      STATE.w = window.innerWidth;
      STATE.h = window.innerHeight;
      STATE.cx = STATE.w / 2;
      // On a phone the headline block eats the bottom third, so the lotus sits
      // lower than on a desktop to centre it in the space it actually has
      // rather than leaving a band of empty black under the reflection.
      STATE.cy = STATE.h * (STATE.h > STATE.w ? 0.355 : 0.32);

      canvas.width = Math.floor(STATE.w * STATE.dpr);
      canvas.height = Math.floor(STATE.h * STATE.dpr);
      ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);

      // The lotus is sized against whichever dimension actually constrains it:
      // the width on a phone held upright, the shorter side anywhere else. The
      // old minDim/880 formula took the width on a portrait phone and the
      // height on a desktop, so the same expression meant two different things
      // and the lotus came out about a third of its intended size on mobile.
      const minDim = Math.min(STATE.w, STATE.h);
      const portrait = STATE.h > STATE.w;
      // Portrait is bounded by both edges: the width, and the height left over
      // once the headline block has taken the bottom third. The height term
      // only bites on short screens (a 360x640 Android), where sizing off the
      // width alone ran the reflection into the headline.
      // Landscape gets the same treatment against the headline block, which is
      // roughly 250px tall there. On a full desktop this never bites (1080px of
      // height allows a larger lotus than the width rule asks for), so big
      // screens look exactly as before; it only rescues short laptop windows.
      const targetRadius = portrait
        ? Math.min(STATE.w * 0.46, STATE.h * 0.21)
        : Math.max(110, Math.min(minDim * 0.425, STATE.h * 0.68 - 250));
      STATE.scale = clamp(targetRadius / (minDim * 0.38), 0.72, 1.30);

      // Sparkle sprites are drawn at a fixed pixel size, so a smaller lotus
      // packs them tighter and additive blending burns the petals out to flat
      // white. Scale them with the lotus, against the desktop radius they were
      // tuned at, so a phone gets the same picture rather than a brighter one.
      // Not a straight ratio: a phone's lotus is physically small, so sparkles
      // scaled strictly in proportion thin out into faint specks. The gentle
      // curve keeps them a shade fatter than proportional on small screens --
      // bright enough to read as petals -- while leaving desktop untouched.
      STATE.sparkleScale = clamp(Math.pow(logoRadius() / 460, 0.72), 0.44, 1);

      bloomCanvas.width = Math.max(160, Math.floor(STATE.w / 4));
      bloomCanvas.height = Math.max(120, Math.floor(STATE.h / 4));
    }

    // 3D Point Calculation with seamless morphing
    function compute3DPoint(star, timeNow, morph) {
      // Compact radius: around 28% of minDim (scaled nicely, not overly big)
      const baseRadius = logoRadius();

      const lotusPx = star.lx * baseRadius;
      const lotusPy = star.ly * baseRadius;
      const lotusPz = star.lz * (baseRadius * 0.55);

      // 2. Swirl 3D coordinates (if needed during morph or swirl mode)
      let swirlPx = 0, swirlPy = 0, swirlPz = 0;
      if (morph < 0.99) {
        const flow = (star.tAlong + timeNow * star.speed * 0.14) % 1.0;
        const sample = getPathPoint(star.pathIndex, flow);
        const swirlRad = baseRadius;
        const ribbonOffset = star.scatterNorm * (swirlRad * 0.008);
        
        swirlPx = (sample.x * swirlRad) + (sample.nx * ribbonOffset);
        swirlPy = (sample.y * swirlRad) + (sample.ny * ribbonOffset);
        
        const weavePhase = (flow * TAU) + (star.pathIndex * 0.35);
        swirlPz = Math.sin(weavePhase) * (swirlRad * 0.012) + star.scatterZ * (swirlRad * 0.01);
      }

      // Linear interpolation between Swirl (0) and Lotus (1)
      if (morph >= 0.99) {
        return { x: lotusPx, y: lotusPy, z: lotusPz };
      } else if (morph <= 0.01) {
        return { x: swirlPx, y: swirlPy, z: swirlPz };
      } else {
        return {
          x: swirlPx + (lotusPx - swirlPx) * morph,
          y: swirlPy + (lotusPy - swirlPy) * morph,
          z: swirlPz + (lotusPz - swirlPz) * morph
        };
      }
    }

    // 3D Camera Rotation
    function rotate3D(p, cosY, sinY, cosX, sinX, cosZ, sinZ) {
      // Yaw around Y
      const x1 = p.x * cosY + p.z * sinY;
      const y1 = p.y;
      const z1 = -p.x * sinY + p.z * cosY;

      // Pitch around X
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      // Roll around Z
      const x3 = x2 * cosZ - y2 * sinZ;
      const y3 = x2 * sinZ + y2 * cosZ;
      const z3 = z2;

      return { x: x3, y: y3, z: z3 };
    }

    function drawWaterAndReflection(projected, t, dt) {
      if (!projected.length) return;

      let maxY = -Infinity;
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (p.y > maxY) maxY = p.y;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
      }

      const waterLine = clamp(maxY + 8, STATE.h * 0.38, STATE.h * 0.68);
      const waterH = STATE.h - waterLine;
      if (waterH < 28) return;

      const water = ctx.createLinearGradient(0, waterLine - 8, 0, STATE.h);
      water.addColorStop(0, 'rgba(8, 28, 6, 0.0)');
      water.addColorStop(0.06, 'rgba(18, 48, 12, 0.16)');
      water.addColorStop(0.22, 'rgba(12, 36, 8, 0.34)');
      water.addColorStop(1, 'rgba(4, 12, 3, 0.62)');
      ctx.fillStyle = water;
      ctx.fillRect(0, waterLine - 8, STATE.w, waterH + 8);

      const span = Math.max(120, maxX - minX);
      const shade = ctx.createRadialGradient(STATE.cx, waterLine + 8, 8, STATE.cx, waterLine + 8, span * 0.48);
      shade.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
      shade.addColorStop(0.45, 'rgba(109, 220, 71, 0.08)');
      shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.ellipse(STATE.cx, waterLine + 10, span * 0.44, 16, 0, 0, TAU);
      ctx.fill();

      drawLotusUnder(maxY, minX, maxX, t);
      drawLotusFeed(projected, dt);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const step = projected.length > 1200 ? 3 : 2;
      for (let i = 0; i < projected.length; i += step) {
        const p = projected[i];
        const rel = waterLine - p.y;
        if (rel < 2 || rel > 360) continue;

        const wave = Math.sin(p.x * 0.032 + t * 3.2) * 11 + Math.sin(p.x * 0.07 + t * 1.8 + p.star.phase) * 5;
        const rx = p.x + wave;
        const ry = waterLine + rel * 0.78 + Math.sin(p.x * 0.04 + t * 2.5) * 3.5;
        if (ry > STATE.h + 8) continue;

        const fade = clamp(1 - rel / 340, 0.1, 1);
        const s = p.star;
        const spriteKey = spriteKeyFor(s.colorType);
        const sprite = STATE.sprites[spriteKey];
        const size = s.size * 18 * p.scale * (0.78 + p.depthNorm * 0.14);
        ctx.globalAlpha = clamp(p.alpha * 0.22 * fade, 0.04, 0.22);
        ctx.drawImage(sprite, rx - size / 2, ry - size * 0.28, size, size * 0.5);
      }

      ctx.restore();
    }

    // Main Render Loop
    function render(now) {
      const dt = Math.min((now - STATE.lastT) / 1000, 0.1);
      STATE.lastT = now;
      const t = (now - STATE.t0) / 1000 * STATE.speedMultiplier;

      // Smooth mouse damping & camera tilt
      STATE.mouseX += (STATE.targetMouseX - STATE.mouseX) * 0.055;
      STATE.mouseY += (STATE.targetMouseY - STATE.mouseY) * 0.055;

      // Smooth morphing between Lotus and Swirl
      STATE.morphProgress += (STATE.targetMorph - STATE.morphProgress) * 0.06;

      if (STATE.orbitEnabled && STATE.morphProgress < 0.5) {
        STATE.yaw += CONFIG.rotSpeedY * STATE.speedMultiplier;
      }

      const totalYaw = STATE.orbitEnabled ? STATE.yaw + STATE.mouseX * 0.12 : 0;
      const totalPitch = STATE.orbitEnabled ? STATE.pitch + STATE.mouseY * 0.08 : 0;
      const totalRoll = 0;

      // Trigonometry
      const cosY = Math.cos(totalYaw), sinY = Math.sin(totalYaw);
      const cosX = Math.cos(totalPitch), sinX = Math.sin(totalPitch);
      const cosZ = Math.cos(totalRoll), sinZ = Math.sin(totalRoll);

      // Deep dark void
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, STATE.w, STATE.h);

      updateAntiGravity(dt);
      drawAntiGravity();

      const coreVig = ctx.createRadialGradient(STATE.cx, STATE.cy, 15, STATE.cx, STATE.cy, 280 * STATE.scale);
      coreVig.addColorStop(0, 'rgba(109, 220, 71, 0.072)');
      coreVig.addColorStop(0.45, 'rgba(109, 220, 71, 0.024)');
      coreVig.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreVig;
      ctx.beginPath();
      ctx.arc(STATE.cx, STATE.cy, 280 * STATE.scale, 0, TAU);
      ctx.fill();

      // Transform & Project Constellation Stars in 3D
      const projected = [];
      const cameraDist = CONFIG.depthScale;
      const morph = STATE.morphProgress;

      for (let i = 0; i < STATE.stars.length; i++) {
        const star = STATE.stars[i];
        const p3d = compute3DPoint(star, t, morph);
        const r3d = rotate3D(p3d, cosY, sinY, cosX, sinX, cosZ, sinZ);

        const depth = cameraDist + r3d.z;
        if (depth < 40) continue;

        const projScale = cameraDist / depth;
        let screenX = STATE.cx + r3d.x * projScale;
        let screenY = STATE.cy + r3d.y * projScale;

        let targetOx = 0;
        let targetOy = 0;
        if (STATE.pointerOver) {
          const dx = screenX - STATE.pointerSX;
          const dy = screenY - STATE.pointerSY;
          const dist = Math.hypot(dx, dy);
          if (dist < CONFIG.disturbRadius) {
            const falloff = 1 - dist / CONFIG.disturbRadius;
            const push = falloff * falloff * CONFIG.disturbForce;
            const inv = dist > 0.001 ? 1 / dist : 0;
            targetOx = dx * inv * push;
            targetOy = dy * inv * push;
          }
        }
        const ease = (targetOx !== 0 || targetOy !== 0) ? CONFIG.disturbIn : CONFIG.disturbOut;
        star.ox += (targetOx - star.ox) * ease;
        star.oy += (targetOy - star.oy) * ease;
        screenX += star.ox;
        screenY += star.oy;

        // Depth cueing
        const depthNorm = clamp((r3d.z + 200) / 400, 0.3, 1.2);
        const twinkle = 0.9 + 0.1 * Math.sin(t * star.twinkleSpeed + star.phase);
        const colorBoost = star.colorType === 'white' ? 1 : 1.22;
        const alpha = clamp(star.baseAlpha * depthNorm * twinkle * colorBoost, 0.36, star.colorType === 'white' ? 0.6 : 0.88);

        projected.push({
          star,
          x: screenX,
          y: screenY,
          z: r3d.z,
          scale: projScale,
          alpha: alpha,
          depthNorm: depthNorm
        });
      }

      // Sort by Z for proper depth order
      projected.sort((a, b) => a.z - b.z);

      // Render stars with additive blending
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const s = p.star;

        const spriteKey = spriteKeyFor(s.colorType);
        const sprite = STATE.sprites[spriteKey];
        const orangeBoost = s.colorType === 'orange' ? 1.18 : 1;
        const renderSize = s.size * 23.04 * p.scale * STATE.sparkleScale * (0.88 + p.depthNorm * 0.08) * orangeBoost;

        ctx.globalAlpha = s.colorType === 'white' ? p.alpha : clamp(p.alpha * 1.18, 0, 0.92);
        ctx.drawImage(sprite, p.x - renderSize / 2, p.y - renderSize / 2, renderSize, renderSize);

        // 4-Point Diffraction Lens Flare
        if (STATE.flaresEnabled && s.hasFlare && p.depthNorm > 0.42) {
          const flareSprite = s.flareType === 'orange'
            ? STATE.sprites.emeraldFlare
            : STATE.sprites.forestFlare;

          const flareSize = 48 * p.scale * STATE.sparkleScale * s.flareScale * (0.8 + p.depthNorm * 0.3);
          ctx.globalAlpha = clamp(p.alpha * 0.66, 0, 1);
          ctx.drawImage(flareSprite, p.x - flareSize / 2, p.y - flareSize / 2, flareSize, flareSize);
        }
      }

      ctx.restore();

      // no bloom — keep sparkles as sharp points

      drawWaterAndReflection(projected, t, dt);

      requestAnimationFrame(render);
    }

    // Interactivity
    function setupInteractivity() {
      window.addEventListener('resize', () => {
        resize();
      });

      // Pointer tracking
      window.addEventListener('pointermove', (e) => {
        STATE.pointerSX = e.clientX;
        STATE.pointerSY = e.clientY;
        STATE.pointerOver = true;
        if (STATE.isDragging) {
          const deltaX = e.clientX - STATE.lastDragX;
          const deltaY = e.clientY - STATE.lastDragY;
          STATE.yaw += deltaX * 0.005;
          STATE.pitch = clamp(STATE.pitch + deltaY * 0.005, -30 * DEG2RAD, 45 * DEG2RAD);
          STATE.lastDragX = e.clientX;
          STATE.lastDragY = e.clientY;
        } else {
          STATE.targetMouseX = (e.clientX / STATE.w - 0.5) * 2;
          STATE.targetMouseY = (e.clientY / STATE.h - 0.5) * 2;
          STATE.lastPointerAt = performance.now();
        }
      });

      window.addEventListener('pointerleave', () => {
        STATE.pointerOver = false;
      });
      document.addEventListener('pointerout', (e) => {
        if (!e.relatedTarget) STATE.pointerOver = false;
      });

      window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.ui') || e.target.closest('button') || e.target.closest('a')) return;
        STATE.isDragging = true;
        STATE.lastDragX = e.clientX;
        STATE.lastDragY = e.clientY;
      });

      window.addEventListener('pointerup', () => {
        STATE.isDragging = false;
      });

      window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          STATE.pointerSX = t.clientX;
          STATE.pointerSY = t.clientY;
          STATE.pointerOver = true;
          STATE.targetMouseX = (t.clientX / STATE.w - 0.5) * 2;
          STATE.targetMouseY = (t.clientY / STATE.h - 0.5) * 2;
          STATE.lastPointerAt = performance.now();
        }
      }, { passive: true });

      const toggleFlaresBtn = document.getElementById('toggleFlaresBtn');
      if (toggleFlaresBtn) {
        toggleFlaresBtn.addEventListener('click', () => {
          STATE.flaresEnabled = !STATE.flaresEnabled;
          toggleFlaresBtn.classList.toggle('active', STATE.flaresEnabled);
        });
      }

      const toggleOrbitBtn = document.getElementById('toggleOrbitBtn');
      if (toggleOrbitBtn) {
        toggleOrbitBtn.addEventListener('click', () => {
          STATE.orbitEnabled = !STATE.orbitEnabled;
          toggleOrbitBtn.classList.toggle('active', STATE.orbitEnabled);
        });
      }
    }

    async function boot() {
      try {
        await loadHieroSvg();
      } catch (err) {
        console.error(err);
      }
      try {
        await loadLotusImage();
      } catch (err) {
        console.error(err);
      }
      initSprites();
      sampleSvgPaths();
      initParticles();
      resize();
      setupInteractivity();
      requestAnimationFrame(render);
    }

    boot();
