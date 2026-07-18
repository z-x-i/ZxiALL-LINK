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
            box-sizing: border-box; position: relative; z-index: 5;
        }
        .zxi-premium-input:focus {
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.05);
        }
        .zxi-premium-btn {
            width: 100%; padding: 16px; border-radius: 14px;
            font-weight: 600; cursor: pointer; font-size: 14px;
            font-family: 'Segoe UI', system-ui, sans-serif; letter-spacing: 1px;
            border: 1px solid rgba(255, 255, 255, 0.8);
            background: #ffffff; color: #000000;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
            position: relative; z-index: 5;
        }
    `;
    document.head.appendChild(styleSheet);

    const globalOverlay = document.createElement('div');
    globalOverlay.id = 'zxi-global-overlay';
    globalOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#020204; z-index:2147483646; overflow:hidden; display:flex; align-items:center; justify-content:center;';
    
    globalOverlay.innerHTML = `
        <!-- ব্যাকগ্রাউন্ড ও গ্লাস ড্রপলেট ক্যানভাস -->
        <canvas id="zxi-rain-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;"></canvas>
        
        <!-- মেইন গ্লাস ইন্টারফেস বক্স -->
        <div id="zxi-auth-box" style="position:relative; z-index:2; background:rgba(10, 10, 12, 0.5); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); color:#ffffff; padding:55px 40px 45px 40px; border-radius:28px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align:center; border:1px solid rgba(255, 255, 255, 0.06); width:400px; box-sizing:border-box; animation: ui-entrance 0.5s cubic-bezier(0.16, 1, 0.3, 1); overflow:hidden;">
            
            <!-- বক্সের ওপরে পানি গড়িয়ে পড়ার ক্যানভাস -->
            <canvas id="zxi-box-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:3; pointer-events:none;"></canvas>

            <button id="zxi-sound-toggle" style="position:absolute; top:25px; left:25px; background:none; border:none; color:rgba(255,255,255,0.4); font-size:13px; cursor:pointer; font-weight:500; outline:none; transition:0.3s; padding:0; z-index:10;">🔊 MUTE</button>
            <button id="zxi-panel-close" style="position:absolute; top:25px; right:25px; background:none; border:none; color:rgba(255,255,255,0.4); font-size:13px; cursor:pointer; font-weight:500; outline:none; transition:0.3s; padding:0; z-index:10;">✕ CLOSE</button>
            
            <div id="zxi-dynamic-content" style="margin-top: 15px; position:relative; z-index:4;">
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

    // মেইন রিয়েলিস্টিক গ্লাস ড্রপলেট ফিজিক্স ইঞ্জিন
    function initRealisticRainAndSplash() {
        const bgCanvas = document.getElementById('zxi-rain-canvas');
        const boxCanvas = document.getElementById('zxi-box-canvas');
        const authBox = document.getElementById('zxi-auth-box');
        
        if (!bgCanvas || !boxCanvas || !authBox) return;
        
        const bgCtx = bgCanvas.getContext('2d');
        const boxCtx = boxCanvas.getContext('2d');

        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        
        boxCanvas.width = authBox.offsetWidth;
        boxCanvas.height = authBox.offsetHeight;

        const maxBgDrops = 130; 
        const bgDrops = [];
        const boxDroplets = []; // UI বক্সের ওপর জমার ফোঁটা

        // ব্যাকগ্রাউন্ডের বৃষ্টি জেনারেট
        for (let i = 0; i < maxBgDrops; i++) {
            bgDrops.push({
                x: Math.random() * bgCanvas.width,
                y: Math.random() * -bgCanvas.height,
                length: Math.random() * 25 + 25, 
                speed: Math.random() * 20 + 18, 
                opacity: Math.random() * 0.22 + 0.08, 
                weight: Math.random() * 1.5 + 1.2 
            });
        }

        // UI বক্সের ভেতর ড্রপলেট অ্যাড করার ফাংশন (রিয়ালিস্টিক ওয়াটার ডায়নামিক্স)
        function spawnBoxDroplet() {
            if (boxDroplets.length < 45) { // সর্বোচ্চ ৪৫ টি ফোঁটা একসাথে থাকবে
                boxDroplets.push({
                    x: Math.random() * boxCanvas.width,
                    y: Math.random() * -20,
                    r: Math.random() * 2.5 + 1.5, // ফোঁটার ব্যাসার্ধ/সাইজ
                    speedY: Math.random() * 0.6 + 0.2, // ধীরে বেয়ে নামার স্পিড
                    speedX: (Math.random() - 0.5) * 0.2, // হালকা আঁকাবাঁকা পথ
                    alpha: Math.random() * 0.3 + 0.3,
                    trail: [] // পেছনের পানির দাগ
                });
            }
        }

        function draw() {
            // ১. ব্যাকগ্রাউন্ড রেইন ড্রয়িং
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            for (let i = 0; i < maxBgDrops; i++) {
                const d = bgDrops[i];
                bgCtx.beginPath();
                bgCtx.moveTo(d.x, d.y);
                bgCtx.lineTo(d.x + 1.2, d.y + d.length);
                bgCtx.strokeStyle = `rgba(175, 210, 255, ${d.opacity})`;
                bgCtx.lineWidth = d.weight;
                bgCtx.lineCap = 'round';
                bgCtx.stroke();

                d.y += d.speed;
                d.x += 0.5;

                if (d.y > bgCanvas.height) {
                    d.y = Math.random() * -50;
                    d.x = Math.random() * bgCanvas.width;
                }
            }

            // ২. UI বক্সের কাঁচের ওপর ড্রপলেট গড়িয়ে পড়া (Realistic Dripping)
            boxCtx.clearRect(0, 0, boxCanvas.width, boxCanvas.height);
            
            if (Math.random() < 0.08) spawnBoxDroplet(); // নির্দিষ্ট সময় পর পর নতুন ফোঁটা তৈরি

            for (let i = boxDroplets.length - 1; i >= 0; i--) {
                const p = boxDroplets[i];

                // ফোঁটার পেছনের ওয়াটার ট্রেইল ড্রয়িং (বাস্তব লুক দেওয়ার জন্য)
                boxCtx.beginPath();
                boxCtx.moveTo(p.x, p.y);
                if(p.trail.length > 0) {
                    for(let j = 0; j < p.trail.length; j++) {
                        boxCtx.lineTo(p.trail[j].x, p.trail[j].y);
                    }
                }
                boxCtx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.15})`;
                boxCtx.lineWidth = p.r * 1.2;
                boxCtx.lineCap = 'round';
                boxCtx.lineJoin = 'round';
                boxCtx.stroke();

                // মূল পানির বিন্দু (Droplet Head) ড্রয়িং
                boxCtx.beginPath();
                boxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                boxCtx.fillStyle = `rgba(240, 248, 255, ${p.alpha})`;
                boxCtx.fill();

                // আলোর গ্লো রিফ্লেকশন ইফেক্ট (বাস্তব বিন্দুর মতো শাইন করবে)
                boxCtx.beginPath();
                boxCtx.arc(p.x - p.r*0.3, p.y - p.r*0.3, p.r*0.2, 0, Math.PI * 2);
                boxCtx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 1.5})`;
                boxCtx.fill();

                // ট্রেইল হিস্ট্রি সেভ করা
                p.trail.push({x: p.x, y: p.y});
                if(p.trail.length > 15) p.trail.shift();

                // ফিজিক্স মুভমেন্ট আপডেট (নিচের দিকে নামা এবং হালকা পাশে যাওয়া)
                p.y += p.speedY;
                p.x += p.speedX;

                // মাঝে মাঝে ফোঁটার গতি সামান্য বাড়ে বা দিক পরিবর্তন হয় (রিয়ালিস্টিক লিকুইড মোশন)
                if(Math.random() > 0.98) {
                    p.speedX = (Math.random() - 0.5) * 0.4;
                    p.speedY = Math.random() * 1.2 + 0.4;
                }

                // বক্সের নিচে চলে গেলে রিমুভ করা
                if (p.y > boxCanvas.height + 10) {
                    boxDroplets.splice(i, 1);
                }
            }

            rainAnimationId = requestAnimationFrame(draw);
        }

        window.addEventListener('resize', () => {
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
            boxCanvas.width = authBox.offsetWidth;
            boxCanvas.height = authBox.offsetHeight;
        });

        draw();
    }
    setTimeout(initRealisticRainAndSplash, 100);

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
