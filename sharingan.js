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

  // ---------- state ----------
  let t = 0;
  let blink = 0;            // 0 = open, 1 = fully closed
  let blinkTimer = randRange(120, 260);
  let mode = 0;              // which mangekyou pattern
  const modes = ['sharingan', 'itachiMS', 'kamui', 'susanoo'];
  let modeSwitchTimer = randRange(300, 500);
  let modeTransition = 0;    // 0..1 fade between patterns

  function randRange(a, b) { return a + Math.random() * (b - a); }

  // subtle flicker for glow / embers
  const embers = Array.from({ length: 40 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.6 + 0.3,
    s: Math.random() * 0.6 + 0.2,
    o: Math.random()
  }));

  function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.05, w / 2, h / 2, h * 0.75);
    g.addColorStop(0, 'rgba(90,0,0,0.20)');
    g.addColorStop(0.5, 'rgba(20,0,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // drifting embers for atmosphere
    ctx.save();
    embers.forEach(e => {
      e.o += 0.01 * (Math.random() > 0.5 ? 1 : -1);
      e.o = Math.max(0, Math.min(0.9, e.o));
      const ex = e.x * w;
      const ey = (e.y * h + t * e.s * 10) % h;
      ctx.beginPath();
      ctx.fillStyle = `rgba(220,30,30,${e.o * 0.5})`;
      ctx.arc(ex, ey, e.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // realistic almond eye socket with lid shadow
  function eyeSocket(cx, cy, ew, eh, closeAmt, mirror) {
    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);

    const openH = eh * (1 - closeAmt * 0.96);

    ctx.beginPath();
    ctx.moveTo(-ew * 0.52, 0);
    ctx.bezierCurveTo(-ew * 0.22, -openH * 0.95, ew * 0.28, -openH * 0.8, ew * 0.52, -openH * 0.05);
    ctx.bezierCurveTo(ew * 0.2, openH * 0.55, -ew * 0.28, openH * 0.45, -ew * 0.52, 0);
    ctx.closePath();
    ctx.clip();

    // sclera gradient (slightly off-white, warm, with vein hints)
    const sg = ctx.createRadialGradient(0, openH * 0.1, ew * 0.05, 0, 0, ew * 0.6);
    sg.addColorStop(0, '#f2ece6');
    sg.addColorStop(0.6, '#e7ddd2');
    sg.addColorStop(1, '#c9baa8');
    ctx.fillStyle = sg;
    ctx.fillRect(-ew, -eh, ew * 2, eh * 2);

    // faint red veins near tear duct
    ctx.strokeStyle = 'rgba(160,30,30,0.25)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const sx = -ew * 0.48, sy = randRange(-openH * 0.2, openH * 0.2);
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + ew * 0.15, sy + randRange(-6, 6), sx + ew * 0.3, sy + randRange(-4, 4));
      ctx.stroke();
    }

    // shading at lid crease
    const shade = ctx.createLinearGradient(0, -openH, 0, openH);
    shade.addColorStop(0, 'rgba(0,0,0,0.55)');
    shade.addColorStop(0.25, 'rgba(0,0,0,0.0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = shade;
    ctx.fillRect(-ew, -eh, ew * 2, eh * 2);

    ctx.restore();
    return openH;
  }

  function drawIris(cx, cy, r, openH, closeAmt, glowT) {
    if (closeAmt > 0.97) return;
    ctx.save();
    ctx.translate(cx, cy);

    // clip to open eye slit so iris doesn't spill outside during blink
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.6, openH, 0, 0, Math.PI * 2);
    ctx.clip();

    // outer glow
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.2);
    glow.addColorStop(0, `rgba(220,20,20,${0.35 + 0.15 * glowT})`);
    glow.addColorStop(1, 'rgba(220,20,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // iris base — deep red with radial fibers
    const irisGrad = ctx.createRadialGradient(-r * 0.15, -r * 0.15, r * 0.1, 0, 0, r);
    irisGrad.addColorStop(0, '#ff2b2b');
    irisGrad.addColorStop(0.5, '#c50d10');
    irisGrad.addColorStop(1, '#5c0507');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // fine radial fiber texture
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
      ctx.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
    return true;
  }

  function drawTomoe(r) {
    ctx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.05);
      ctx.quadraticCurveTo(r * 0.55, -r * 0.05, r * 0.62, r * 0.28);
      ctx.quadraticCurveTo(r * 0.5, r * 0.5, r * 0.22, r * 0.42);
      ctx.quadraticCurveTo(r * 0.05, r * 0.3, 0, -r * 0.05);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.6, r * 0.02, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
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
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
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

  function drawSusanoo(r) {
    ctx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.9, -r * 0.12);
      ctx.lineTo(r * 0.9, r * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
  }

  function drawPattern(name, r) {
    if (name === 'sharingan') return drawTomoe(r);
    if (name === 'itachiMS') return drawItachiMS(r);
    if (name === 'kamui') return drawKamui(r);
    if (name === 'susanoo') return drawSusanoo(r);
  }

  function drawUpperLid(cx, cy, ew, eh, closeAmt, mirror) {
    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);
    const openH = eh * (1 - closeAmt * 0.96);

    // lash line
    ctx.beginPath();
    ctx.moveTo(-ew * 0.54, 0.03 * eh);
    ctx.bezierCurveTo(-ew * 0.22, -openH * 1.0, ew * 0.28, -openH * 0.85, ew * 0.55, -openH * 0.02);
    ctx.lineWidth = eh * 0.1;
    ctx.strokeStyle = '#040404';
    ctx.lineCap = 'round';
    ctx.stroke();

    // lash line highlight (skin fold)
    ctx.beginPath();
    ctx.moveTo(-ew * 0.5, -openH * 0.15);
    ctx.bezierCurveTo(-ew * 0.15, -openH * 1.3, ew * 0.25, -openH * 1.15, ew * 0.5, -openH * 0.4);
    ctx.lineWidth = eh * 0.05;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.stroke();

    ctx.restore();
  }

  function drawEye(cx, cy, ew, eh, mirror, patternName, rotationSign) {
    const openH = eyeSocket(cx, cy, ew, eh, blink, mirror);
    const r = eh * 0.5;

    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);
    const glowPulse = 0.5 + 0.5 * Math.sin(t * 1.4);
    drawIris(0, -openH * 0.02, r, openH, blink, glowPulse);

    if (blink < 0.9) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -openH * 0.02, r * 1.6, openH, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(0, -openH * 0.02);
      ctx.rotate(rotationSign * t * 0.35);
      drawPattern(patternName, r);
      ctx.restore();
    }
    ctx.restore();

    drawUpperLid(cx, cy, ew, eh, blink, mirror);
  }

  function animate() {
    t += 0.016;
    drawBackground();

    const eyeDistance = Math.min(w * 0.24, 210);
    const eyeWidth = Math.min(w * 0.30, 230);
    const eyeHeight = eyeWidth * 0.5;
    const cyPos = h / 2;

    // blink cycle
    blinkTimer -= 1;
    if (blinkTimer <= 0) {
      blink = Math.min(1, blink + 0.18);
      if (blink >= 1) blinkTimer = -8; // hold closed briefly
      if (blinkTimer < -8) { blinkTimer = randRange(150, 320); }
    } else if (blink > 0) {
      blink = Math.max(0, blink - 0.14);
    }

    // pattern switching, only while eyes are (nearly) closed for a clean transform
    modeSwitchTimer -= 1;
    if (modeSwitchTimer <= 0 && blink > 0.85) {
      mode = (mode + 1) % modes.length;
      modeSwitchTimer = randRange(280, 480);
    }

    drawEye(w / 2 - eyeDistance, cyPos, eyeWidth, eyeHeight, false, modes[mode], 1);
    drawEye(w / 2 + eyeDistance, cyPos, eyeWidth, eyeHeight, true, modes[mode], -1);

    // vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    window.__itachiEyesRAF = requestAnimationFrame(animate);
  }

  animate();

  c.addEventListener('click', () => {
    cancelAnimationFrame(window.__itachiEyesRAF);
    c.remove();
    window.__itachiEyesActive = false;
  });
})();
