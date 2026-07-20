(function () {
  if (window.__itachiEyesActive) return;
  window.__itachiEyesActive = true;

  const c = document.createElement('canvas');
  c.id = 'itachiSharinganCanvas';
  Object.assign(c.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh',
    zIndex: '2147483647', background: '#000',
    cursor: 'pointer', touchAction: 'none'
  });
  document.body.appendChild(c);

  const ctx = c.getContext('2d');
  let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }

  // ---------------- blink state machine ----------------
  let blinkState = 'open';
  let blinkStateTime = 0;
  let holdOpenDuration = rand(3200, 6000);
  const CLOSE_DUR = 650;   // ms
  const CLOSED_DUR = 260;  // ms
  const OPEN_DUR = 700;    // ms
  let blink = 0;

  let mode = 0;
  const modes = ['basic', 'sharingan', 'itachiMS'];
  let patternSwitchedThisBlink = false;

  let last = performance.now();

  function updateBlink(dt) {
    blinkStateTime += dt;
    if (blinkState === 'open') {
      blink = 0;
      if (blinkStateTime >= holdOpenDuration) {
        blinkState = 'closing';
        blinkStateTime = 0;
        patternSwitchedThisBlink = false;
      }
    } else if (blinkState === 'closing') {
      blink = clamp(easeInOutSine(blinkStateTime / CLOSE_DUR), 0, 1);
      if (blinkStateTime >= CLOSE_DUR) {
        blink = 1;
        blinkState = 'closed';
        blinkStateTime = 0;
      }
    } else if (blinkState === 'closed') {
      blink = 1;
      if (!patternSwitchedThisBlink) {
        // Guarantee pattern switch on EVERY blink sequence
        mode = (mode + 1) % modes.length;
        patternSwitchedThisBlink = true;
      }
      if (blinkStateTime >= CLOSED_DUR) {
        blinkState = 'opening';
        blinkStateTime = 0;
      }
    } else if (blinkState === 'opening') {
      blink = clamp(1 - easeInOutSine(blinkStateTime / OPEN_DUR), 0, 1);
      if (blinkStateTime >= OPEN_DUR) {
        blink = 0;
        blinkState = 'open';
        blinkStateTime = 0;
        holdOpenDuration = rand(3200, 6000);
      }
    }
  }

  // ---------------- background ----------------
  function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, h * 0.7);
    g.addColorStop(0, 'rgba(50,0,0,0.15)');
    g.addColorStop(0.55, 'rgba(8,0,0,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // ---------------- eye shape ----------------
  function eyePath(ew, eh, openAmt) {
    const upPeak = eh * 0.72 * openAmt;
    const lowBulge = eh * 0.20 * openAmt;
    const outerY = eh * 0.08 * openAmt;
    const innerY = -eh * 0.30 * openAmt;

    ctx.beginPath();
    ctx.moveTo(-ew * 0.5, outerY);
    ctx.quadraticCurveTo(-ew * 0.18, -upPeak, ew * 0.12, -upPeak * 0.86);
    ctx.quadraticCurveTo(ew * 0.38, -upPeak * 0.48, ew * 0.5, innerY);
    ctx.quadraticCurveTo(ew * 0.14, lowBulge, -ew * 0.06, lowBulge * 0.88);
    ctx.quadraticCurveTo(-ew * 0.3, lowBulge * 0.45, -ew * 0.5, outerY);
    ctx.closePath();
    return { upPeak, lowBulge, outerY, innerY };
  }

  function drawEye(cx, cy, ew, eh, mirror, patternName, rotSign, t) {
    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) {
      ctx.scale(-1, 1); // Exact fix for orientation
    }

    const openAmt = 1 - blink;
    const geo = eyePath(ew, eh, openAmt);

    // --- sclera ---
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#f7f4ef';
    ctx.fillRect(-ew, -eh, ew * 2, eh * 2);

    const lidShade = ctx.createLinearGradient(0, -geo.upPeak, 0, -geo.upPeak * 0.3);
    lidShade.addColorStop(0, 'rgba(0,0,0,0.25)');
    lidShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lidShade;
    ctx.fillRect(-ew, -eh, ew * 2, eh);

    // --- iris ---
    if (openAmt > 0.03) {
      const midY = (geo.upPeak * -0.55 + geo.lowBulge * 0.5) * 0.55;
      const r = Math.min(ew * 0.26, (geo.upPeak + geo.lowBulge) * 0.42);
      ctx.save();
      ctx.translate(-ew * 0.03, midY);

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#c4090c';
      ctx.fill();

      ctx.save();
      ctx.rotate(rotSign * t * 0.2);
      drawPattern(patternName, r);
      ctx.restore();

      ctx.restore();
    }
    ctx.restore();

    // --- outline ---
    eyePath(ew, eh, openAmt);
    ctx.lineWidth = eh * 0.07;
    ctx.strokeStyle = '#040202';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  function drawBasicDots(r) {
    ctx.fillStyle = '#0a0a0a';
    const dots = [
      { x: 0.18, y: -0.38, s: 0.17 },
      { x: -0.42, y: 0.02, s: 0.14 },
      { x: 0.30, y: 0.42, s: 0.15 }
    ];
    dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x * r, d.y * r, d.s * r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawTomoe(r) {
    ctx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.04);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.08, r * 0.6, r * 0.26);
      ctx.quadraticCurveTo(r * 0.48, r * 0.48, r * 0.2, r * 0.4);
      ctx.quadraticCurveTo(r * 0.05, r * 0.28, 0, -r * 0.04);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.58, r * 0.02, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.17, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
  }

  function drawItachiMS(r) {
    ctx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(r * 0.15, -r * 0.35, r * 0.55, -r * 0.5, r * 0.85, -r * 0.15);
      ctx.bezierCurveTo(r * 0.6, -r * 0.05, r * 0.35, r * 0.15, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
  }

  function drawPattern(name, r) {
    if (name === 'sharingan') return drawTomoe(r);
    if (name === 'itachiMS') return drawItachiMS(r);
    return drawBasicDots(r);
  }

  let t = 0;
  function animate(now) {
    const dt = now - last;
    last = now;
    t += dt / 1000;
    updateBlink(dt);

    drawBackground();

    const eyeDistance = Math.min(w * 0.24, 230);
    const eyeWidth = Math.min(w * 0.4, 300);
    const eyeHeight = eyeWidth * 0.42;
    const cy = h / 2;

    // Fixed left and right eye mirroring logic
    drawEye(w / 2 - eyeDistance, cy, eyeWidth, eyeHeight, true, modes[mode], 1, t);
    drawEye(w / 2 + eyeDistance, cy, eyeWidth, eyeHeight, false, modes[mode], -1, t);

    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    window.__itachiEyesRAF = requestAnimationFrame(animate);
  }
  window.__itachiEyesRAF = requestAnimationFrame(animate);

  c.addEventListener('click', () => {
    cancelAnimationFrame(window.__itachiEyesRAF);
    c.remove();
    window.__itachiEyesActive = false;
  });
})();
