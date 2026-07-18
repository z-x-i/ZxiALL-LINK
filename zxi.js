javascript:(function() {
    "use strict";

    const RAILWAY_SERVER_URL = "https://zxi-file-loader.ah4734536.workers.dev"; 

    let userIndex = -1;
    if (typeof window.ZXI_BOOKMARK_LOAD !== "undefined") {
        userIndex = 0;
    } else {
        for (let i = 1; i <= 500; i++) {
            if (typeof window['ZXI' + i + '_BOOKMARK_LOAD'] !== "undefined") {
                userIndex = i;
                break;
            }
        }
    }

    if (userIndex === -1) {
        console.log("%cAccess Denied - Bookmark Required", "color:#ff0000;font-size:15px;font-weight:bold");
        return;
    }

    const sKey = "Hey";

    const _d = {
        r: `\( {RAILWAY_SERVER_URL}/?file=zxi.txt&key= \){sKey}`,
        p: `\( {RAILWAY_SERVER_URL}/?file=zx.txt&key= \){sKey}`,
        t: `${RAILWAY_SERVER_URL}/?file=button.txt`,
        m: `${RAILWAY_SERVER_URL}/?file=music.txt`,
        n: `${RAILWAY_SERVER_URL}/?file=name.txt`, 
        s: 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(15,23,42,0.95);backdrop-filter:blur(40px);color:#fff;padding:35px 30px;border-radius:28px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.2);border:1px solid rgba(251,191,36,0.4);width:380px;'
    };

    let zxiAudio = null;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let source = null;
    let animationFrameId = null;
    let isMusicLoading = false;

    (async function() {
        const oldBox = document.getElementById('zxi-auth-box');
        if(oldBox) oldBox.remove();
        
        const oldCredit = document.getElementById('zxi-floating-credit');
        if(oldCredit) oldCredit.remove();

        const oldMusicBtn = document.getElementById('zxi-music-btn');
        if(oldMusicBtn) oldMusicBtn.remove();

        let systemName = "VPLINK BYPASS";
        let userTelegram = "https://t.me/zxiowner"; 
        let correctPassword = "";

        try {
            const nameRes = await fetch(_d.n + '&t=' + Date.now());
            const nameText = await nameRes.text();
            const lines = nameText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
            
            if (lines[userIndex]) {
                const matches = lines[userIndex].match(/"([^"]+)"/g);
                if (matches && matches.length >= 3) {
                    systemName = matches[0].replace(/"/g, '');      
                    userTelegram = matches[1].replace(/"/g, '');    
                    correctPassword = matches[2].replace(/"/g, ''); 
                }
            }
        } catch(e) {
            console.error("Initialization error:", e);
        }

        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            @keyframes zxi-liquid-glow {
                0%,100% { box-shadow: 0 0 30px rgba(251,191,36,0.6), inset 0 0 25px rgba(255,255,255,0.35); }
                50% { box-shadow: 0 0 60px rgba(251,191,36,0.9), inset 0 0 40px rgba(255,255,255,0.5); }
            }
            .zxi-clickable-credit { position: fixed; bottom: 18px; right: 22px; font-size: 17px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: 0.5px; z-index: 2147483647; text-decoration: none; cursor: pointer; color: rgba(251,191,36,0.95); text-shadow: 0 0 18px rgba(251,191,36,0.8); }
            .zxi-mode-btn { width: 100%; padding: 16px; border-radius: 20px; font-weight: 700; cursor: pointer; font-size: 15.5px; letter-spacing: 0.6px; margin-bottom: 14px; border: 1px solid rgba(251,191,36,0.3); background: rgba(255,255,255,0.09); backdrop-filter: blur(25px); color: #fff; transition: all 0.45s cubic-bezier(0.23,1,0.32,1); box-shadow: 0 8px 25px rgba(0,0,0,0.4); }
            .zxi-mode-btn:hover { transform: translateY(-4px); background: rgba(251,191,36,0.2); box-shadow: 0 18px 40px rgba(251,191,36,0.5); }
        `;
        document.head.appendChild(styleSheet);

        const creditLink = document.createElement('a');
        creditLink.id = 'zxi-floating-credit';
        creditLink.className = 'zxi-clickable-credit';
        creditLink.innerText = '@zxiowner';
        creditLink.href = userTelegram; 
        creditLink.target = '_blank';
        document.body.appendChild(creditLink);

        const musicBtn = document.createElement('button');
        musicBtn.id = 'zxi-music-btn';
        musicBtn.style.cssText = 'position:fixed; bottom:20px; left:20px; background:rgba(255,255,255,0.1); backdrop-filter:blur(25px); border:1px solid rgba(251,191,36,0.4); color:#fff; border-radius:50%; width:56px; height:56px; cursor:pointer; font-size:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px rgba(0,0,0,0.4); z-index:2147483647;';
        musicBtn.textContent = '🔇';
        document.body.appendChild(musicBtn);

        const box = document.createElement('div');
        box.id = 'zxi-auth-box';
        box.style.cssText = _d.s;
        
        box.innerHTML = `
          <h3 style="margin:0 0 8px 0;color:#fcd34d;font-size:26px;font-weight:800;letter-spacing:1px;">VPLINK BYPASS</h3>
          <p style="margin:0 0 26px 0;color:#94a3b8;font-size:13.5px;letter-spacing:1px;">ENTER LICENSE KEY</p>
          <input type="text" id="zxi-key-input" placeholder="ENTER KEY HERE" style="width:100%;padding:16px;margin-bottom:20px;border:1px solid rgba(251,191,36,0.3);border-radius:18px;background:rgba(255,255,255,0.07);color:#fff;text-align:center;font-size:15.5px;outline:none;">
          <button id="zxi-login-btn" style="width:100%;background:linear-gradient(90deg,#fb923c,#f59e0b);color:#0f172a;border:none;padding:17px;border-radius:18px;font-weight:700;cursor:pointer;font-size:16px;box-shadow:0 10px 25px rgba(251,191,36,0.5);">VERIFY & RUN</button>
          <button id="zxi-telegram-btn" style="width:100%;background:rgba(255,255,255,0.09);color:#fff;border:1px solid rgba(251,191,36,0.3);padding:16px;border-radius:18px;font-weight:600;cursor:pointer;margin-top:12px;">TELEGRAM</button>
          <div id="zxi-status" style="margin-top:20px;font-size:13px;font-weight:600;color:#64748b;">READY</div>
        `;
        document.body.appendChild(box);

        async function setupVisualizer() {
            if (audioContext) return;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.3; 
                dataArray = new Uint8Array(analyser.frequencyBinCount);
                source = audioContext.createMediaElementSource(zxiAudio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
            } catch(e) {}
        }

        musicBtn.addEventListener('click', async () => {
            if (isMusicLoading) return;
            if (!zxiAudio) {
                try {
                    isMusicLoading = true; musicBtn.textContent = '⏳';
                    const res = await fetch(_d.m + '&t=' + Date.now());
                    const audioUrl = (await res.text()).trim();
                    if(audioUrl && audioUrl.startsWith('http')) {
                        const audioFetch = await fetch(audioUrl);
                        const blobUrl = URL.createObjectURL(await audioFetch.blob());
                        zxiAudio = new Audio(blobUrl); zxiAudio.loop = true; zxiAudio.crossOrigin = "anonymous";
                    } else { isMusicLoading = false; musicBtn.textContent = '🔇'; return; }
                } catch(err) { isMusicLoading = false; musicBtn.textContent = '🔇'; return; }
                isMusicLoading = false;
            }
            if (audioContext && audioContext.state === 'suspended') { await audioContext.resume(); }
            if (zxiAudio.paused) {
                await setupVisualizer();
                zxiAudio.play().then(() => {
                    musicBtn.textContent = '🔊'; musicBtn.style.color = '#fb923c';
                    musicBtn.style.borderColor = '#fb923c';
                }).catch(err => {});
            } else {
                zxiAudio.pause(); musicBtn.textContent = '🔇'; musicBtn.style.color = '#fff';
            }
        });

        const keyInput = document.getElementById('zxi-key-input');
        const loginBtn = document.getElementById('zxi-login-btn');
        const tgBtn = document.getElementById('zxi-telegram-btn');
        const statusDiv = document.getElementById('zxi-status');

        tgBtn.addEventListener('click', () => window.open(userTelegram, '_blank'));

        function startVisualizerAnimation(selectedSeconds, redirectUrl) {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position:fixed; top:0; left:0; width:100%; height:100%; 
                background:rgba(15,23,42,0.75); backdrop-filter:blur(12px); z-index:2147483647; 
                display:flex; align-items:center; justify-content:center;
            `;

            overlay.innerHTML = `
                <div style="text-align:center; position:relative;">
                    <div style="position:relative; width:400px; height:400px; margin:0 auto; display:flex; align-items:center; justify-content:center;">
                        <canvas id="zxi-visualizer-canvas" width="400" height="400" style="position:absolute; top:0; left:0; z-index:2; pointer-events:none;"></canvas>
                        <div id="zxi-glow-core" style="position:absolute; top:50%; left:50%; width:190px; height:190px; border-radius:50%; background:radial-gradient(circle, rgba(251,191,36,0.85) 0%, transparent 70%); filter: blur(45px); opacity:0.9; animation: zxi-liquid-glow 2.2s ease-in-out infinite; z-index:1; transform:translate(-50%,-50%);"></div>
                        <svg width="280" height="280" style="transform:rotate(-90deg); position:relative; z-index:3;">
                            <circle cx="140" cy="140" r="105" fill="rgba(255,255,255,0.08)" stroke="rgba(251,191,36,0.15)" stroke-width="14"></circle>
                            <circle id="progress" cx="140" cy="140" r="105" fill="none" stroke="#fb923c" stroke-width="14" stroke-dasharray="660" stroke-dashoffset="660" stroke-linecap="round"></circle>
                        </svg>
                        <div id="countdown-text" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:78px; font-weight:800; color:#fff; text-shadow:0 0 45px #fb923c; z-index:4;">${selectedSeconds}</div>
                    </div>
                    <p id="zxi-redirect-label" style="margin-top:30px; color:#fcd34d; font-size:16.5px; font-weight:700; letter-spacing:2px;">REDIRECTING...</p>
                </div>
            `;
            document.body.appendChild(overlay);

            const canvas = document.getElementById('zxi-visualizer-canvas');
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const baseRadius = 88; 
            let colorHue = 30; 
            
            const progressRing = overlay.querySelector('#progress');
            const countdownText = overlay.querySelector('#countdown-text');
            const redirectLabel = overlay.querySelector('#zxi-redirect-label');

            function drawSpectrum() {
                animationFrameId = requestAnimationFrame(drawSpectrum);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                colorHue = (colorHue + 0.7) % 360; 
                const currentNeonColor = `hsl(${colorHue}, 100%, 70%)`;
                let dynamicRadiusPulse = baseRadius;

                if (analyser && zxiAudio && !zxiAudio.paused) {
                    analyser.getByteFrequencyData(dataArray);
                    let lowBass = 0;
                    for(let b = 0; b < 5; b++) { lowBass += dataArray[b] || 0; }
                    lowBass = lowBass / 5;
                    dynamicRadiusPulse = baseRadius + (lowBass / 10);
                } else if (dataArray) { dataArray.fill(0); }

                const totalPoints = 56; 
                if (!dataArray) return;

                progressRing.style.stroke = currentNeonColor;
                countdownText.style.textShadow = `0 0 40px ${currentNeonColor}`;
                redirectLabel.style.color = currentNeonColor;

                ctx.beginPath();
                for (let i = 0; i <= totalPoints; i++) {
                    const angle = (i / totalPoints) * Math.PI * 2;
                    let mirrorAngle = (i % (totalPoints / 4)) / (totalPoints / 4) * Math.PI * 0.5;
                    let baseIdx = Math.floor(Math.sin(mirrorAngle) * (dataArray.length * 0.65));
                    let sideIdx = (baseIdx + 2) % dataArray.length;
                    let blendedVal = ((dataArray[baseIdx] || 0) * 0.7) + ((dataArray[sideIdx] || 0) * 0.3);
                    
                    let normalized = blendedVal / 255;
                    let boostedVal = Math.min(255, Math.pow(normalized, 1.1) * 255 * 6);

                    const iSpikeTip = (i % 2 === 0); 
                    let sharpHeight = iSpikeTip ? (5 + ((boostedVal / 255) * 52)) : (-3 + ((boostedVal / 255) * 5));
                    const finalPointsRadius = dynamicRadiusPulse + sharpHeight;

                    const x = centerX + Math.cos(angle) * finalPointsRadius;
                    const y = centerY + Math.sin(angle) * finalPointsRadius;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.lineWidth = 4; ctx.strokeStyle = currentNeonColor; ctx.shadowBlur = 18; ctx.shadowColor = currentNeonColor;
                ctx.stroke();

                ctx.beginPath();
                for (let i = 0; i <= totalPoints; i++) {
                    const angle = (i / totalPoints) * Math.PI * 2;
                    let mirrorAngle = (i % (totalPoints / 4)) / (totalPoints / 4) * Math.PI * 0.5;
                    let baseIdx = Math.floor(Math.sin(mirrorAngle) * (dataArray.length * 0.65));
                    let sideIdx = (baseIdx + 2) % dataArray.length;
                    let blendedVal = ((dataArray[baseIdx] || 0) * 0.7) + ((dataArray[sideIdx] || 0) * 0.3);
                    
                    let normalized = blendedVal / 255;
                    let boostedVal = Math.min(255, Math.pow(normalized, 1.1) * 255 * 6);
                    
                    const iSpikeTip = (i % 2 === 0);
                    let sharpHeight = iSpikeTip ? (5 + ((boostedVal / 255) * 52)) : (-3 + ((boostedVal / 255) * 5));
                    const finalPointsRadiusInner = dynamicRadiusPulse + (sharpHeight * 0.9);

                    const x = centerX + Math.cos(angle) * finalPointsRadiusInner;
                    const y = centerY + Math.sin(angle) * finalPointsRadiusInner;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.lineWidth = 1.4; ctx.strokeStyle = '#ffffff'; ctx.shadowBlur = 6; ctx.shadowColor = '#ffffff';
                ctx.stroke();
                ctx.shadowBlur = 0; 
            }
            drawSpectrum();

            let timeLeft = selectedSeconds;
            const progress = overlay.querySelector('#progress');
            const circumference = 660;

            const timer = setInterval(() => {
                timeLeft--;
                countdownText.textContent = timeLeft;
                progress.style.strokeDashoffset = circumference * (timeLeft / selectedSeconds);

                if (timeLeft <= 0) {
                    clearInterval(timer); cancelAnimationFrame(animationFrameId);
                    if(zxiAudio) zxiAudio.pause();
                    if(musicBtn) musicBtn.remove();
                    overlay.remove(); 
                    window.location.replace(redirectUrl);
                }
            }, 1000);
        }

        function triggerPowerZxPanel(engineMode) {
            const titleText = "VPLINK BYPASS";
            const subTitle = "SUPPORTED: VPLINK ONLY";
            const placeholderText = "https://vplink.in/...";

            box.innerHTML = `
                <button id="zxi-back-btn" style="position:absolute;top:18px;left:20px;background:none;border:none;color:#94a3b8;font-size:26px;cursor:pointer;">←</button>
                <h3 style="margin:35px 0 10px 0;color:#fcd34d;font-size:24px;font-weight:800;">${titleText}</h3>
                <p style="margin:0 0 24px 0;color:#94a3b8;font-size:13px;">${subTitle}</p>
                <input type="text" id="zxi-bypass-input" placeholder="${placeholderText}" style="width:100%;padding:16px;margin-bottom:20px;border:1px solid rgba(251,191,36,0.3);border-radius:18px;background:rgba(255,255,255,0.07);color:#fff;text-align:center;">
                <button id="zxi-fetch-bypass-btn" style="width:100%;background:linear-gradient(90deg,#fb923c,#f59e0b);color:#0f172a;border:none;padding:17px;border-radius:18px;font-weight:700;cursor:pointer;">START BYPASS</button>
                <div id="zxi-bypass-status" style="margin-top:20px;font-size:13px;font-weight:600;color:#64748b;">READY</div>
            `;
            document.getElementById('zxi-back-btn').addEventListener('click', showMainOptionsPanel);

            const bypassInput = document.getElementById('zxi-bypass-input');
            const fetchBtn = document.getElementById('zxi-fetch-bypass-btn');
            const bStatus = document.getElementById('zxi-bypass-status');

            fetchBtn.addEventListener('click', async () => {
                const urlVal = bypassInput.value.trim();
                if (!urlVal || !urlVal.includes('vplink.in/')) {
                    bStatus.innerHTML = "<span style='color:#f87171;'>INVALID LINK! URL MUST BE VPLINK.</span>"; return;
                }

                bStatus.innerHTML = "<span style='color:#fb923c;'>BYPASSING...</span>";
                fetchBtn.disabled = true;

                try {
                    const response = await fetch(`\( {RAILWAY_SERVER_URL}/api/bypass?mode=power&user=\( {userIndex}&url= \){encodeURIComponent(urlVal)}`);
                    const data = await response.json();
                    
                    if (data && data.status === "success" && data.bypassed_url) {
                        bStatus.innerHTML = "<span style='color:#4ade80;'>BYPASS SUCCESSFUL ✓</span>";
                        fetchBtn.outerHTML = `<button id="zxi-copy-bypass-btn" style="width:100%;background:linear-gradient(90deg,#fb923c,#f59e0b);color:#0f172a;border:none;padding:17px;border-radius:18px;font-weight:700;cursor:pointer;">📋 COPY BYPASS LINK</button>`;
                        document.getElementById('zxi-copy-bypass-btn').addEventListener('click', () => {
                            navigator.clipboard.writeText(data.bypassed_url).then(() => {
                                alert("✅ Link Copied Successfully!");
                                box.remove();
                            });
                        });
                    } else {
                        bStatus.innerHTML = "<span style='color:#f87171;'>TRY AGAIN</span>"; fetchBtn.disabled = false;
                    }
                } catch (err) {
                    bStatus.innerHTML = "<span style='color:#f87171;'>SERVER ERROR</span>"; fetchBtn.disabled = false;
                }
            });
        }

        function showMainOptionsPanel() {
            box.innerHTML = `
                <h3 style="margin:0 0 8px 0;color:#fcd34d;font-size:24px;font-weight:800;">SELECT SYSTEM ENGINE</h3>
                <p style="margin:0 0 26px 0;color:#94a3b8;font-size:13.5px;letter-spacing:1px;">CHOOSE YOUR MODULE</p>
                <button id="zxi-choice-powerzx" class="zxi-mode-btn">🔥 ALL VPLINK BYPASS</button>
                <button id="zxi-choice-powerplus" class="zxi-mode-btn">✨ HUNTER + BYPASS</button>
            `;

            document.getElementById('zxi-choice-powerzx').addEventListener('click', () => triggerPowerZxPanel("power"));
            document.getElementById('zxi-choice-powerplus').addEventListener('click', () => triggerPowerZxPanel("powerplus"));
        }

        loginBtn.addEventListener('click', () => {
            const inputKey = keyInput.value.trim();
            if(!inputKey) { statusDiv.innerHTML = "<span style='color:#f87171;'>PLEASE INPUT KEY!</span>"; return; }
            statusDiv.innerHTML = "<span style='color:#fb923c;'>CONNECTING SERVER...</span>";
            
            setTimeout(() => {
                if (correctPassword !== "" && inputKey === correctPassword) {
                    statusDiv.innerHTML = "<span style='color:#4ade80;'>KEY VALIDATED ✓</span>";
                    setTimeout(showMainOptionsPanel, 800);
                } else {
                    statusDiv.innerHTML = "<span style='color:#f87171;'>INVALID LICENSE KEY!</span>";
                }
            }, 500);
        });
    })();
})();
