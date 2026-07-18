(function() {
    "use strict";

    const SERVER_URL = "https://zxi-file-loader.ah4734536.workers.dev"; 
    const PASSWORD_URL = "https://raw.githubusercontent.com/z-x-i/zxi/refs/heads/main/zx.txt";
    const AUDIO_URL = "https://github.com/z-x-i/zxi/raw/refs/heads/main/zxi.mp3";

    const oldOverlay = document.getElementById('zxi-global-overlay');
    if(oldOverlay) oldOverlay.remove();

    let rainAnimationId = null;
    let rainAudio = null;
    let cachedPassword = null;

    async function fetchPassword() {
        try {
            const response = await fetch(`${PASSWORD_URL}?t=${Date.now()}`);
            const text = await response.text();
            cachedPassword = text.trim();
        } catch (e) {
            console.error("Token fetch error", e);
        }
    }
    fetchPassword();

    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes ui-entrance {
            from { opacity: 0; transform: scale(0.96); backdrop-filter: blur(0px); }
            to { opacity: 1; transform: scale(1); backdrop-filter: blur(25px); }
        }
        .zxi-premium-input {
            width: 100%; padding: 16px; margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px;
            background: rgba(15, 15, 20, 0.6); color: #fff;
            text-align: center; font-size: 15px; outline: none;
            font-family: 'Segoe UI', system-ui, sans-serif; transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .zxi-premium-input:focus {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
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
            box-shadow: 0 4px 25px rgba(255, 255, 255, 0.15);
        }
    `;
    document.head.appendChild(styleSheet);

    const globalOverlay = document.createElement('div');
    globalOverlay.id = 'zxi-global-overlay';
    globalOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#020204; z-index:2147483646; overflow:hidden; display:flex; align-items:center; justify-content:center;';
    
    globalOverlay.innerHTML = `
        <!-- ব্যাকগ্রাউন্ড ও বক্স কলাইড রেইন ক্যানভাস -->
        <canvas id="zxi-rain-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;"></canvas>
        
        <!-- মেইন গ্লাস ইন্টারফেস বক্স -->
        <div id="zxi-auth-box" style="position:relative; z-index:2; background:rgba(10, 10, 12, 0.45); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); color:#ffffff; padding:55px 40px 45px 40px; border-radius:28px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align:center; border:1px solid rgba(255, 255, 255, 0.06); width:400px; box-sizing:border-box; animation: ui-entrance 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
            
            <!-- অডিও বাটন এখন ক্লোজ বাটনের সমান্তরালে বাম পাসে সোজা চলে এসেছে -->
            <button id="zxi-sound-toggle" style="position:absolute; top:25px; left:25px; background:none; border:none; color:rgba(255,255,255,0.4); font-size:13px; cursor:pointer; font-weight:500; outline:none; transition:0.3s; padding:0;">🔊 MUTE</button>
            
            <button id="zxi-panel-close" style="position:absolute; top:25px; right:25px; background:none; border:none; color:rgba(255,255,255,0.4); font-size:13px; cursor:pointer; font-weight:500; outline:none; transition:0.3s; padding:0;">✕ CLOSE</button>
            
            <div id="zxi-dynamic-content" style="margin-top: 15px;">
                <h3 style="margin:0 0 6px 0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:-0.5px;">ZXI CONSOLE</h3>
                <p style="margin:0 0 35px 0; color:rgba(255, 255, 255, 0.4); font-size:13px;">Secure Access Terminal</p>
                
                <input type="password" id="zxi-key-input" class="zxi-premium-input" placeholder="Enter Authentication Key">
                <button id="zxi-login-btn" class="zxi-premium-btn">Unlock Terminal</button>
                
                <div id="zxi-status" style="margin-top:25px; font-size:12px; color:rgba(255,255,255,0.3); font-weight:500;">SYSTEM STATUS: STANDBY</div>
            </div>
        </div>
    `;
    document.body.appendChild(globalOverlay);

    function initRainAudio() {
        rainAudio = new Audio(AUDIO_URL); 
        rainAudio.loop = true;
        rainAudio.volume = 0.7;
        
        const startAudio = () => {
            rainAudio.play().catch(() => {});
            document.removeEventListener('click', startAudio);
        };
        document.addEventListener('click', startAudio);

        document.getElementById('zxi-sound-toggle').addEventListener('click', function() {
            if (rainAudio.paused) {
                rainAudio.play();
                this.textContent = "🔊 MUTE";
            } else {
                rainAudio.pause();
                this.textContent = "🔇 UNMUTE";
            }
        });
    }
    initRainAudio();

    // মেইন ফিজিক্স ড্রপলেট এবং বক্স ড্রিইপিং সিমুলেটর
    function initRealisticRainAndSplash() {
        const canvas = document.getElementById('zxi-rain-canvas');
        const authBox = document.getElementById('zxi-auth-box');
        if (!canvas || !authBox) return;
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const maxDrops = 140; 
        const drops = [];
        const splashes = [];
        const boxDrips = []; // বক্সে বেয়ে পড়া পানির ফোঁটা

        for (let i = 0; i < maxDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                length: Math.random() * 25 + 25, 
                speed: Math.random() * 20 + 20, 
                opacity: Math.random() * 0.25 + 0.1, 
                weight: Math.random() * 1.8 + 1.2 
            });
        }

        function createSplash(x, y) {
            const particleCount = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < particleCount; i++) {
                splashes.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() * -2.5) - 1,
                    radius: Math.random() * 1 + 0.8,
                    alpha: 0.5,
                    life: 1.0
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const boxRect = authBox.getBoundingClientRect();

            // ১. ব্যাকগ্রাউন্ডের মেইন রেইনফল ড্রয়িং
            for (let i = 0; i < maxDrops; i++) {
                const d = drops[i];
                
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + 1.5, d.y + d.length);
                ctx.strokeStyle = `rgba(180, 215, 255, ${d.opacity})`;
                ctx.lineWidth = d.weight;
                ctx.lineCap = 'round';
                ctx.stroke();

                d.y += d.speed;
                d.x += 0.6;

                // বক্সের ওপরের ওয়াটার কলিশন হ্যান্ডলিং
                if (d.x >= boxRect.left && d.x <= boxRect.right && d.y >= boxRect.top && d.y <= boxRect.top + 15) {
                    createSplash(d.x, boxRect.top);
                    
                    // বক্সে পানি বেয়ে পড়ার জন্য ড্রিইপ তৈরি হচ্ছে
                    if (Math.random() > 0.4) {
                        boxDrips.push({
                            x: d.x,
                            y: boxRect.top,
                            radius: Math.random() * 2 + 1.5, // পানির বিন্দুর সাইজ
                            speed: Math.random() * 1.5 + 1,  // বেয়ে পড়ার ধীর গতি
                            alpha: Math.random() * 0.4 + 0.3
                        });
                    }
                    
                    d.y = Math.random() * -50;
                    d.x = Math.random() * canvas.width;
                }
                else if (d.y > canvas.height) {
                    d.y = Math.random() * -50;
                    d.x = Math.random() * canvas.width;
                }
            }

            // ২. বক্সের গা বেয়ে রিয়ালিস্টিক পানি পড়া (Water Dripping Effect)
            for (let i = boxDrips.length - 1; i >= 0; i--) {
                const drip = boxDrips[i];
                
                ctx.beginPath();
                ctx.arc(drip.x, drip.y, drip.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 225, 255, ${drip.alpha})`;
                ctx.fill();

                // পানির ট্রেইল বা দাগ তৈরি করা
                ctx.beginPath();
                ctx.moveTo(drip.x, drip.y - 4);
                ctx.lineTo(drip.x, drip.y);
                ctx.strokeStyle = `rgba(200, 225, 255, ${drip.alpha * 0.4})`;
                ctx.lineWidth = drip.radius * 0.8;
                ctx.stroke();

                // পজিশন আপডেট (নিচের দিকে নামা)
                drip.y += drip.speed;

                // বক্সের নিচের বর্ডার পার হয়ে গেলে মুছে যাবে
                if (drip.y > boxRect.bottom) {
                    boxDrips.splice(i, 1);
                }
            }

            // ৩. বৃষ্টির ছিটা (Splashes) ড্রয়িং
            for (let i = splashes.length - 1; i >= 0; i--) {
                const p = splashes[i];
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 215, 255, ${p.alpha})`;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; 
                p.alpha -= 0.04;
                p.life -= 0.04;

                if (p.alpha <= 0 || p.life <= 0) {
                    splashes.splice(i, 1);
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
    setTimeout(initRealisticRainAndSplash, 60);

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
            <p style="margin:0 0 30px 0; color:rgba(255, 255, 255, 0.4); font-size:13px;">System decrypted and ready</p>
            
            <input type="text" id="zxi-bypass-input" class="zxi-premium-input" placeholder="Paste link instance here" style="text-align: left; padding-left: 18px;">
            <button id="zxi-fetch-bypass-btn" class="zxi-premium-btn">Execute Automation</button>
            
            <div id="zxi-bypass-status" style="margin-top:25px; font-size:12px; color:rgba(255,255,255,0.3); font-weight:500;">SYSTEM STATUS: INSTANCE_IDLE</div>
        `;

        const bypassInput = document.getElementById('zxi-bypass-input');
        const fetchBtn = document.getElementById('zxi-fetch-bypass-btn');
        const bStatus = document.getElementById('zxi-bypass-status');

        fetchBtn.addEventListener('click', async () => {
            const urlVal = bypassInput.value.trim();
            if (!urlVal) {
                bStatus.innerHTML = "<span style='color:#ff6b6b;'>[!] URL target link required</span>";
                return;
            }

            bStatus.innerHTML = "<span style='color:rgba(255,255,255,0.6);'>Resolving secure payload...</span>";
            fetchBtn.disabled = true;
            fetchBtn.style.opacity = "0.4";

            try {
                const response = await fetch(`${SERVER_URL}/api/bypass?url=${encodeURIComponent(urlVal)}`);
                const data = await response.json();
                
                if (data && data.bypassed_url) {
                    bStatus.innerHTML = "<span style='color:#51cf66;'>[+] Decryption successful ✓</span>";
                    bypassInput.value = data.bypassed_url;
                    bypassInput.select();
                    
                    fetchBtn.outerHTML = `<button id="zxi-copy-btn" class="zxi-premium-btn" style="background:#51cf66; color:#fff; border-color:#51cf66;">Copy Output Instance</button>`;
                    
                    document.getElementById('zxi-copy-btn').addEventListener('click', () => {
                        navigator.clipboard.writeText(data.bypassed_url);
                        bStatus.innerHTML = "<span style='color:#51cf66;'>Copied successfully. Erasing logs...</span>";
                        setTimeout(cleanup, 1200);
                    });
                } else {
                    bStatus.innerHTML = "<span style='color:#ff6b6b;'>[!] Injection parameters rejected</span>";
                    fetchBtn.disabled = false; fetchBtn.style.opacity = "1";
                }
            } catch (err) {
                bStatus.innerHTML = "<span style='color:#ff6b6b;'>[!] Transmission timeout occurred</span>";
                fetchBtn.disabled = false; fetchBtn.style.opacity = "1";
            }
        });
    }

    const keyInput = document.getElementById('zxi-key-input');
    const loginBtn = document.getElementById('zxi-login-btn');
    const statusDiv = document.getElementById('zxi-status');

    loginBtn.addEventListener('click', async () => {
        const inputKey = keyInput.value.trim();
        if(!inputKey) { 
            statusDiv.innerHTML = "<span style='color:#ff6b6b;'>Authentication token key required</span>"; 
            return; 
        }
        
        statusDiv.innerHTML = "<span style='color:rgba(255,255,255,0.5);'>Verifying live network token...</span>";
        
        if (!cachedPassword) {
            await fetchPassword();
        }

        setTimeout(() => {
            if (cachedPassword && inputKey === cachedPassword) {
                statusDiv.innerHTML = "<span style='color:#51cf66;'>ACCESS GRANTED</span>";
                setTimeout(showMainOptionsPanel, 600);
            } else {
                statusDiv.innerHTML = "<span style='color:#ff6b6b;'>Security key token mismatch error</span>";
            }
        }, 500);
    });

})();
