(function() {
    "use strict";

    const SERVER_URL = "https://zxi-file-loader.ah4734536.workers.dev"; 

    const oldOverlay = document.getElementById('zxi-global-overlay');
    if(oldOverlay) oldOverlay.remove();

    let rainAnimationId = null;
    let audioContext = null;
    let rainAudio = null;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes ui-entrance {
            from { opacity: 0; transform: scale(0.95); backdrop-filter: blur(0px); }
            to { opacity: 1; transform: scale(1); backdrop-filter: blur(20px); }
        }
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.05); }
            50% { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 255, 255, 0.15); }
        }
        .zxi-premium-input {
            width: 100%; padding: 16px; margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px;
            background: rgba(20, 20, 20, 0.6); color: #fff;
            text-align: center; font-size: 15px; outline: none;
            font-family: 'Segoe UI', system-ui, sans-serif; transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .zxi-premium-input:focus {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(30, 30, 30, 0.8);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }
        .zxi-premium-btn {
            width: 100%; padding: 16px; border-radius: 14px;
            font-weight: 600; cursor: pointer; font-size: 14px;
            font-family: 'Segoe UI', system-ui, sans-serif; letter-spacing: 1px;
            border: 1px solid rgba(255, 255, 255, 0.8);
            background: #ffffff; color: #000000;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
        }
        .zxi-premium-btn:hover {
            background: transparent; color: #ffffff;
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 25px rgba(255, 255, 255, 0.2);
        }
        .zxi-secondary-btn {
            width: 100%; padding: 14px; border-radius: 14px;
            font-weight: 500; cursor: pointer; font-size: 13px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7);
            margin-top: 10px; transition: all 0.3s ease;
        }
        .zxi-secondary-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
    `;
    document.head.appendChild(styleSheet);

    const globalOverlay = document.createElement('div');
    globalOverlay.id = 'zxi-global-overlay';
    globalOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#050508; z-index:2147483646; overflow:hidden; display:flex; align-items:center; justify-content:center;';
    
    globalOverlay.innerHTML = `
        <canvas id="zxi-rain-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;"></canvas>
        
        <button id="zxi-sound-toggle" style="position:fixed; top:30px; left:30px; z-index:2147483647; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:10px 18px; border-radius:20px; cursor:pointer; font-family:sans-serif; font-size:13px; backdrop-filter:blur(10px); transition:0.3s;">🔊 Mute Rain</button>

        <div id="zxi-auth-box" style="position:relative; z-index:2; background:rgba(15, 15, 20, 0.45); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); color:#ffffff; padding:50px 40px; border-radius:28px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align:center; border:1px solid rgba(255, 255, 255, 0.08); width:400px; box-sizing:border-box; animation: ui-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1), glow-pulse 5s infinite ease-in-out;">
            <button id="zxi-panel-close" style="position:absolute; top:25px; right:25px; background:none; border:none; color:rgba(255,255,255,0.4); font-size:14px; cursor:pointer; font-weight:500; outline:none; transition:0.3s;">✕ CLOSE</button>
            
            <div id="zxi-dynamic-content">
                <h3 style="margin:0 0 6px 0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:-0.5px;">ZXI CORE</h3>
                <p style="margin:0 0 35px 0; color:rgba(255, 255, 255, 0.4); font-size:13px; font-weight:400;">Secure Access Verification</p>
                
                <input type="password" id="zxi-key-input" class="zxi-premium-input" placeholder="Enter Access Token">
                <button id="zxi-login-btn" class="zxi-premium-btn">Verify & Initialize</button>
                
                <div id="zxi-status" style="margin-top:25px; font-size:12px; color:rgba(255,255,255,0.3); font-weight:500; letter-spacing:0.5px;">SYSTEM STATUS: IDLE</div>
            </div>
        </div>
    `;
    document.body.appendChild(globalOverlay);

    function initRainAudio() {
        rainAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2467/2467-84.wav"); 
        rainAudio.loop = true;
        rainAudio.volume = 0.6;
        
        rainAudio.play().catch(() => {
            const playOnInteraction = () => {
                rainAudio.play();
                document.removeEventListener('click', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
        });

        document.getElementById('zxi-sound-toggle').addEventListener('click', function() {
            if (rainAudio.paused) {
                rainAudio.play();
                this.textContent = "🔊 Mute Rain";
                this.style.background = "rgba(255,255,255,0.05)";
            } else {
                rainAudio.pause();
                this.textContent = "🔇 Unmute Rain";
                this.style.background = "rgba(255,68,68,0.15)";
            }
        });
    }
    initRainAudio();

    function initRealisticRain() {
        const canvas = document.getElementById('zxi-rain-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const maxDrops = 180;
        const drops = [];

        for (let i = 0; i < maxDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                length: Math.random() * 20 + 15,
                speed: Math.random() * 15 + 15,
                opacity: Math.random() * 0.15 + 0.05,
                weight: Math.random() * 1 + 0.5
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < maxDrops; i++) {
                const d = drops[i];
                
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + 1.5, d.y + d.length); 
                
                ctx.strokeStyle = `rgba(174, 219, 255, ${d.opacity})`; 
                ctx.lineWidth = d.weight;
                ctx.lineCap = 'round';
                ctx.stroke();

                d.y += d.speed;
                d.x += 0.5;

                if (d.y > canvas.height) {
                    d.y = Math.random() * -40;
                    d.x = Math.random() * canvas.width;
                }
            }
            rainAnimationId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        draw();
    }
    setTimeout(initRealisticRain, 50);

    function cleanup() {
        if (rainAnimationId) cancelAnimationFrame(rainAnimationId);
        if (rainAudio) {
            rainAudio.pause();
            rainAudio = null;
        }
        globalOverlay.remove();
    }
    document.getElementById('zxi-panel-close').addEventListener('click', cleanup);

    function showMainOptionsPanel() {
        const contentDiv = document.getElementById('zxi-dynamic-content');
        contentDiv.innerHTML = `
            <h3 style="margin:0 0 6px 0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">CONSOLE INTERFACE</h3>
            <p style="margin:0 0 30px 0; color:rgba(255, 255, 255, 0.4); font-size:13px;">Terminal authorized and ready</p>
            
            <input type="text" id="zxi-bypass-input" class="zxi-premium-input" placeholder="Paste target URL instance" style="text-align: left; padding-left: 18px;">
            <button id="zxi-fetch-bypass-btn" class="zxi-premium-btn">Execute Link Bypass</button>
            
            <div id="zxi-bypass-status" style="margin-top:25px; font-size:12px; color:rgba(255,255,255,0.3); font-weight:500;">SYSTEM STATUS: READY</div>
        `;

        const bypassInput = document.getElementById('zxi-bypass-input');
        const fetchBtn = document.getElementById('zxi-fetch-bypass-btn');
        const bStatus = document.getElementById('zxi-bypass-status');

        fetchBtn.addEventListener('click', async () => {
            const urlVal = bypassInput.value.trim();
            if (!urlVal) {
                bStatus.innerHTML = "<span style='color:#ff6b6b;'>[!] URL instance required</span>";
                return;
            }

            bStatus.innerHTML = "<span style='color:rgba(255,255,255,0.6);'>Resolving secure endpoint...</span>";
            fetchBtn.disabled = true;
            fetchBtn.style.opacity = "0.4";

            try {
                const response = await fetch(`${SERVER_URL}/api/bypass?url=${encodeURIComponent(urlVal)}`);
                const data = await response.json();
                
                if (data && data.bypassed_url) {
                    bStatus.innerHTML = "<span style='color:#51cf66;'>[+] Decryption successful ✓</span>";
                    bypassInput.value = data.bypassed_url;
                    bypassInput.select();
                    
                    fetchBtn.outerHTML = `<button id="zxi-copy-btn" class="zxi-premium-btn" style="background:#51cf66; color:#fff; border-color:#51cf66;">Copy Decrypted Link</button>`;
                    
                    document.getElementById('zxi-copy-btn').addEventListener('click', () => {
                        navigator.clipboard.writeText(data.bypassed_url);
                        bStatus.innerHTML = "<span style='color:#51cf66;'>Link copied. Cleaning logs...</span>";
                        setTimeout(cleanup, 1200);
                    });
                } else {
                    bStatus.innerHTML = "<span style='color:#ff6b6b;'>[!] Server rejected token parameters</span>";
                    fetchBtn.disabled = false; fetchBtn.style.opacity = "1";
                }
            } catch (err) {
                bStatus.innerHTML = "<span style='color:#ff6b6b;'>[!] Request transmission timeout</span>";
                fetchBtn.disabled = false; fetchBtn.style.opacity = "1";
            }
        });
    }

    const keyInput = document.getElementById('zxi-key-input');
    const loginBtn = document.getElementById('zxi-login-btn');
    const statusDiv = document.getElementById('zxi-status');

    loginBtn.addEventListener('click', () => {
        const inputKey = keyInput.value.trim();
        if(!inputKey) { 
            statusDiv.innerHTML = "<span style='color:#ff6b6b;'>Access key token required</span>"; 
            return; 
        }
        
        statusDiv.innerHTML = "<span style='color:rgba(255,255,255,0.5);'>Validating secure cryptographic key...</span>";
        
        setTimeout(() => {
            if (inputKey === "admin") {
                statusDiv.innerHTML = "<span style='color:#51cf66;'>ACCESS GRANTED</span>";
                setTimeout(showMainOptionsPanel, 600);
            } else {
                statusDiv.innerHTML = "<span style='color:#ff6b6b;'>Authentication mismatch error</span>";
            }
        }, 600);
    });

})();

