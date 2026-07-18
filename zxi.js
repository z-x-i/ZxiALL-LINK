(function() {
    "use strict";

    const SERVER_URL = "https://zxi-file-loader.ah4734536.workers.dev"; 
    const PASSWORD_URL = "https://raw.githubusercontent.com/z-x-i/zxi/refs/heads/main/zx.txt";
    const AUDIO_URL = "https://github.com/z-x-i/zxi/raw/refs/heads/main/zxi.mp3";

    // ক্লিনআপ: আগের এলিমেন্ট রিমুভ
    const oldOverlay = document.getElementById('zxi-global-overlay');
    if(oldOverlay) oldOverlay.remove();

    let rainAnimationId = null;
    let rainAudio = null;
    let cachedPassword = null;

    // পাসওয়ার্ডটি ব্যাকগ্রাউন্ডে আগে থেকেই ফেচ করে রাখা হচ্ছে
    async function fetchPassword() {
        try {
            const response = await fetch(`${PASSWORD_URL}?t=${Date.now()}`);
            const text = await response.text();
            cachedPassword = text.trim();
        } catch (e) {
            console.error("Failed to fetch secure token, falling back.", e);
        }
    }
    fetchPassword();

    // সিএসএস স্টাইল ইনজেকশন (গ্লাস মরফিজম UI)
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

    // ফুল-স্ক্রিন পিচ-ব্ল্যাক ওভারলে
    const globalOverlay = document.createElement('div');
    globalOverlay.id = 'zxi-global-overlay';
    globalOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#020204; z-index:2147483646; overflow:hidden; display:flex; align-items:center; justify-content:center;';
    
    globalOverlay.innerHTML = `
        <!-- রিয়ালিস্টিক রেইন ও স্প্ল্যাশ ক্যানভাস -->
        <canvas id="zxi-rain-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none;"></canvas>
        
        <!-- সাউন্ড কন্ট্রোল বাটন -->
        <button id="zxi-sound-toggle" style="position:fixed; top:30px; left:30px; z-index:2147483647; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:10px 18px; border-radius:20px; cursor:pointer; font-family:sans-serif; font-size:13px; backdrop-filter:blur(10px); transition:0.3s;">🔊 Mute Audio</button>

        <!-- মেইন ইন্টারফেস বক্স -->
        <div id="zxi-auth-box" style="position:relative; z-index:2; background:rgba(10, 10, 12, 0.45); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); color:#ffffff; padding:50px 40px; border-radius:28px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align:center; border:1px solid rgba(255, 255, 255, 0.06); width:400px; box-sizing:border-box; animation: ui-entrance 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
            <button id="zxi-panel-close" style="position:absolute; top:25px; right:25px; background:none; border:none; color:rgba(255,255,255,0.3); font-size:14px; cursor:pointer; font-weight:500; outline:none; transition:0.3s;">✕ CLOSE</button>
            
            <div id="zxi-dynamic-content">
                <h3 style="margin:0 0 6px 0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:-0.5px;">ZXI CONSOLE</h3>
                <p style="margin:0 0 35px 0; color:rgba(255, 255, 255, 0.4); font-size:13px;">Secure Access Terminal</p>
                
                <input type="password" id="zxi-key-input" class="zxi-premium-input" placeholder="Enter Authentication Key">
                <button id="zxi-login-btn" class="zxi-premium-btn">Unlock Terminal</button>
                
                <div id="zxi-status" style="margin-top:25px; font-size:12px; color:rgba(255,255,255,0.3); font-weight:500;">SYSTEM STATUS: STANDBY</div>
            </div>
        </div>
    `;
    document.body.appendChild(globalOverlay);

    // অডিও ইঞ্জিন (ইউজারের দেওয়া নির্দিষ্ট ট্র্যাক)
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
                this.textContent = "🔊 Mute Audio";
                this.style.background = "rgba(255,255,255,0.05)";
            } else {
                rainAudio.pause();
                this.textContent = "🔇 Unmute Audio";
                this.style.background = "rgba(255,68,68,0.15)";
            }
        });
    }
    initRainAudio();

    // আল্ট্রা-রিয়ালিস্টিক রেইন স্প্ল্যাশ ইঞ্জিন (Collision Detection with UI)
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

        // বৃষ্টির ফোঁটা জেনারেট করা (সাইজ বড় এবং ড্রপ থিকনেস বাড়ানো হয়েছে)
        for (let i = 0; i < maxDrops; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                length: Math.random() * 25 + 25,     // বড় ফোঁটা (২৫px থেকে ৫০px)
                speed: Math.random() * 20 + 20,     // দ্রুত গতিতে পড়ার জন্য
                opacity: Math.random() * 0.25 + 0.1, // বেশি উজ্জ্বল ও স্পষ্ট
                weight: Math.random() * 1.8 + 1.2    // ফোঁটাগুলো মোটা ও স্পষ্ট দেখাবে
            });
        }

        // স্প্ল্যাশ বা ছিটা তৈরি করার ফাংশন
        function createSplash(x, y) {
            const particleCount = Math.floor(Math.random() * 4) + 3; // প্রতি ফোঁটায় ৩-৬ টি ছিটা বের হবে
            for (let i = 0; i < particleCount; i++) {
                splashes.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 4, // ডানে-বামে ছিটকে যাওয়া
                    vy: (Math.random() * -3) - 1,    // ওপরের দিকে ছিটকে যাওয়া
                    radius: Math.random() * 1 + 0.8,
                    alpha: 0.5,
                    life: 1.0
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // মেইন UI বক্সের পজিশন ট্র্যাক করা (রিয়েল-টাইম কলিশন চেকিংয়ের জন্য)
            const boxRect = authBox.getBoundingClientRect();

            // ১. বৃষ্টির ফোঁটা ড্রয়িং ও আপডেট
            for (let i = 0; i < maxDrops; i++) {
                const d = drops[i];
                
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + 1.5, d.y + d.length); // বাতাসের কারণে স্লাইট অ্যাঙ্গেল
                ctx.strokeStyle = `rgba(180, 215, 255, ${d.opacity})`;
                ctx.lineWidth = d.weight;
                ctx.lineCap = 'round';
                ctx.stroke();

                // পজিশন আপডেট
                d.y += d.speed;
                d.x += 0.6;

                // UI বক্সের সাথে ধাক্কা লাগলে ছিটা (Splash) তৈরি হবে
                if (d.x >= boxRect.left && d.x <= boxRect.right && d.y >= boxRect.top && d.y <= boxRect.top + 15) {
                    createSplash(d.x, boxRect.top);
                    d.y = Math.random() * -50;
                    d.x = Math.random() * canvas.width;
                }
                // স্ক্রিনের নিচে চলে গেলে রিসেট
                else if (d.y > canvas.height) {
                    d.y = Math.random() * -50;
                    d.x = Math.random() * canvas.width;
                }
            }

            // ২. বৃষ্টির ছিটা (Splash Particles) ড্রয়িং ও আপডেট
            for (let i = splashes.length - 1; i >= 0; i--) {
                const p = splashes[i];
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 215, 255, ${p.alpha})`;
                ctx.fill();

                // ছিটার গতিপথ পরিবর্তন
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15; // গ্র্যাভিটি ইফেক্ট (ছিটা উঠে আবার নিচে পড়বে)
                p.alpha -= 0.04; // আস্তে আস্তে ভ্যানিশ হওয়া
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

    // সম্পূর্ণ ক্লোজ ও ক্লিনআপ
    function cleanup() {
        if (rainAnimationId) cancelAnimationFrame(rainAnimationId);
        if (rainAudio) {
            rainAudio.pause();
            rainAudio = null;
        }
        globalOverlay.remove();
    }
    document.getElementById('zxi-panel-close').addEventListener('click', cleanup);

    // সাকসেসফুল ভেরিফিকেশনের পর মূল অপশন প্যানেল
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

    // গিটহাব টক্সট ফাইল ম্যাচিং লগইন হ্যান্ডলার
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
        
        // ব্যাকগ্রাউন্ডে পাসওয়ার্ড ফেচ কমপ্লিট না হয়ে থাকলে আবার রিয়েল-টাইম ট্রাই করবে
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
