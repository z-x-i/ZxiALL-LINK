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
  function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  // ---------------- blink state machine (fixed) ----------------
  // states: 'open' -> 'closing' -> 'closed' -> 'opening' -> 'open'
  let blinkState = 'open';
  let blinkStateTime = 0;
  let holdOpenDuration = rand(2200, 4500);
  const CLOSE_DUR = 160;   // ms
  const CLOSED_DUR = 140;  // ms
  const OPEN_DUR = 190;    // ms
  let blink = 0; // 0 = fully open, 1 = fully closed
  let patternSwitchedThisBlink = false;

  let mode = 0;
  const modes = ['sharingan', 'itachiMS', 'kamui'];

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
      blink = clamp(easeInOut(blinkStateTime / CLOSE_DUR), 0, 1);
      if (blinkStateTime >= CLOSE_DUR) {
        blink = 1;
        blinkState = 'closed';
        blinkStateTime = 0;
      }
    } else if (blinkState === 'closed') {
      blink = 1;
      if (!patternSwitchedThisBlink) {
        // occasionally change the eye pattern while the eyes are shut
        if (Math.random() < 0.55) mode = (mode + 1) % modes.length;
        patternSwitchedThisBlink = true;
      }
      if (blinkStateTime >= CLOSED_DUR) {
        blinkState = 'opening';
        blinkStateTime = 0;
      }
    } else if (blinkState === 'opening') {
      blink = clamp(1 - easeInOut(blinkStateTime / OPEN_DUR), 0, 1);
      if (blinkStateTime >= OPEN_DUR) {
        blink = 0;
        blinkState = 'open';
        blinkStateTime = 0;
        holdOpenDuration = rand(2200, 4500);
      }
    }
  }

  // ---------------- background ----------------
  function drawBackground(t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, h * 0.7);
    g.addColorStop(0, 'rgba(60,0,0,0.18)');
    g.addColorStop(0.55, 'rgba(10,0,0,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // ---------------- eye shape (sharp anime almond, matches reference) ----------------
  function eyePath(ew, eh, openAmt, mirror) {
    // openAmt: 1 = fully open, 0 = fully closed
    const upH = eh * 0.62 * openAmt;
    const lowH = eh * 0.34 * openAmt;
    ctx.save();
    if (mirror) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(-ew * 0.5, 0);
    ctx.quadraticCurveTo(-ew * 0.18, -upH * 1.15, ew * 0.08, -upH * 0.92);
    ctx.quadraticCurveTo(ew * 0.34, -upH * 0.55, ew * 0.52, 0);
    ctx.quadraticCurveTo(ew * 0.26, lowH * 0.95, -ew * 0.06, lowH * 0.8);
    ctx.quadraticCurveTo(-ew * 0.32, lowH * 0.6, -ew * 0.5, 0);
    ctx.closePath();
    ctx.restore();
    return { upH, lowH };
  }

  function drawEye(cx, cy, ew, eh, mirror, patternName, rotSign, t) {
    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);

    const openAmt = 1 - blink;
    const { upH, lowH } = eyePath(ew, eh, openAmt, false);

    // --- sclera (flat, clean, subtle depth only) ---
    ctx.save();
    ctx.clip();
    const scleraGrad = ctx.createLinearGradient(0, -upH, 0, lowH);
    scleraGrad.addColorStop(0, '#f5f1ec');
    scleraGrad.addColorStop(1, '#e3d8c9');
    ctx.fillStyle = scleraGrad;
    ctx.fillRect(-ew, -eh, ew * 2, eh * 2);

    // soft shadow tucked under the upper lid for depth
    const lidShade = ctx.createLinearGradient(0, -upH, 0, -upH * 0.2);
    lidShade.addColorStop(0, 'rgba(0,0,0,0.45)');
    lidShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lidShade;
    ctx.fillRect(-ew, -eh, ew * 2, eh);

    // --- iris ---
    if (openAmt > 0.04) {
      const r = Math.min(upH, ew * 0.34) * 0.98;
      ctx.save();
      ctx.translate(0, upH * 0.06);

      // outer red glow
      const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.1);
      glow.addColorStop(0, 'rgba(220,15,15,0.35)');
      glow.addColorStop(1, 'rgba(220,15,15,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
      ctx.fill();

      // flat bold red iris (clean anime shading, two-tone)
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#c30d10';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-r * 0.1, -r * 0.1, r * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = '#e2131a';
      ctx.fill();

      // thin dark outline
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.lineWidth = r * 0.06;
      ctx.strokeStyle = '#0a0a0a';
      ctx.stroke();

      // tomoe / mangekyou pattern
      ctx.save();
      ctx.rotate(rotSign * t * 0.25);
      drawPattern(patternName, r);
      ctx.restore();

      // small glossy highlight
      ctx.beginPath();
      ctx.ellipse(-r * 0.32, -r * 0.34, r * 0.14, r * 0.09, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();

      ctx.restore();
    }
    ctx.restore(); // end clip

    // --- crisp black outline of the whole eye (this is what reads as "anime real") ---
    eyePath(ew, eh, openAmt, false);
    ctx.lineWidth = eh * 0.085;
    ctx.strokeStyle = '#050303';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // sharp inner corner accent (tear duct point) for that hand-drawn look
    ctx.beginPath();
    ctx.moveTo(-ew * 0.5, -eh * 0.04);
    ctx.lineTo(-ew * 0.4, 0);
    ctx.lineTo(-ew * 0.5, eh * 0.04);
    ctx.strokeStyle = '#050303';
    ctx.lineWidth = eh * 0.04;
    ctx.stroke();

    ctx.restore();
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

  function drawKamui(r) {
    ctx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(r * 0.1, 0);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.22, r * 0.95, 0);
      ctx.quadraticCurveTo(r * 0.4, r * 0.32, 0, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.55, 0, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
  }

  function drawPattern(name, r) {
    if (name === 'itachiMS') return drawItachiMS(r);
    if (name === 'kamui') return drawKamui(r);
    return drawTomoe(r);
  }

  let t = 0;
  function animate(now) {
    const dt = now - last;
    last = now;
    t += dt / 1000;
    updateBlink(dt);

    drawBackground(t);

    const eyeDistance = Math.min(w * 0.24, 230);
    const eyeWidth = Math.min(w * 0.4, 300);   // bigger, less "toy"-like
    const eyeHeight = eyeWidth * 0.44;
    const cy = h / 2;

    drawEye(w / 2 - eyeDistance, cy, eyeWidth, eyeHeight, false, modes[mode], 1, t);
    drawEye(w / 2 + eyeDistance, cy, eyeWidth, eyeHeight, true, modes[mode], -1, t);

    // vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.75)');
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
