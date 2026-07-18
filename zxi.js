(function() {
    "use strict";

    // আপনার মেইন ব্যাকএন্ড সার্ভার ইউআরএল
    const SERVER_URL = "https://zxi-file-loader.ah4734536.workers.dev"; 

    // ক্লিনআপ মডিউল: আগে থেকে কোনো উইন্ডো ওপেন থাকলে তা রিমুভ করবে
    const oldBox = document.getElementById('zxi-auth-box');
    if(oldBox) oldBox.remove();
    const oldCredit = document.getElementById('zxi-floating-credit');
    if(oldCredit) oldCredit.remove();
    const oldMusicBtn = document.getElementById('zxi-music-btn');
    if(oldMusicBtn) oldMusicBtn.remove();

    let matrixInterval = null;

    // নিওন ও ম্যাট্রিক্স স্টাইলিং ইনজেকশন
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes matrix-pulse {
            0%, 100% { box-shadow: 0 0 30px rgba(0,255,65,0.25); }
            50% { box-shadow: 0 0 50px rgba(0,255,65,0.55); }
        }
        .zxi-clickable-credit { position: fixed; bottom: 18px; right: 22px; font-size: 15px; font-weight: bold; font-family: monospace; letter-spacing: 2px; z-index: 2147483647; text-decoration: none; cursor: pointer; color: #00ff41; text-shadow: 0 0 8px #00ff41; }
        .zxi-mode-btn { width: 100%; padding: 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; font-family: monospace; letter-spacing: 1px; margin-bottom: 14px; border: 1px solid #00ff41; background: rgba(0,0,0,0.75); color: #00ff41; transition: all 0.3s ease; text-shadow: 0 0 5px #00ff41; position: relative; z-index: 2; }
        .zxi-mode-btn:hover { background: #00ff41; color: #000; box-shadow: 0 0 20px #00ff41; text-shadow: none; }
        .zxi-input-matrix { width: 100%; padding: 16px; margin-bottom: 20px; border: 1px solid #00ff41; border-radius: 8px; background: rgba(0,0,0,0.6); color: #fff; text-align: center; font-size: 14px; outline: none; font-family: monospace; transition: all 0.3s; position: relative; z-index: 2; }
        .zxi-input-matrix:focus { box-shadow: 0 0 15px #00ff41; }
        .zxi-ripple { position: absolute; background: rgba(0, 255, 65, 0.45); border-radius: 50%; pointer-events: none; transform: scale(0); animation: zxi-ripple-effect 0.5s cubic-bezier(0.1, 0.8, 0.3, 1); z-index: 999999; }
        @keyframes zxi-ripple-effect { to { transform: scale(5); opacity: 0; } }
    `;
    document.head.appendChild(styleSheet);

    // টাচ/ক্লিক রিপল ইফেক্ট
    const createRipple = (clientX, clientY) => {
        const ripple = document.createElement('div');
        ripple.className = 'zxi-ripple';
        document.body.appendChild(ripple);
        ripple.style.left = `${clientX - 10}px`;
        ripple.style.top = `${clientY - 10}px`;
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.addEventListener('animationend', () => ripple.remove());
    };
    window.addEventListener('click', (e) => createRipple(e.clientX, e.clientY));

    // মেইন প্যানেল কন্টেইনার
    const box = document.createElement('div');
    box.id = 'zxi-auth-box';
    box.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(5,15,5,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);color:#00ff41;padding:40px 30px;border-radius:16px;z-index:2147483647;font-family:"Courier New",Courier,monospace;text-align:center;box-shadow:0 0 40px rgba(0,255,65,0.35), inset 0 0 20px rgba(0,255,65,0.1);border:1px solid #00ff41;width:380px;box-sizing:border-box;overflow:hidden;';
    box.style.animation = "matrix-pulse 4s infinite ease-in-out";
    
    // ইন্টারফেস ১: লগইন ভিউ
    box.innerHTML = `
      <canvas id="matrix-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; opacity:0.18; pointer-events:none;"></canvas>
      <div style="position:relative; z-index:2;">
        <button id="zxi-panel-close" style="position:absolute;top:-25px;right:-15px;background:none;border:none;color:#ff3333;font-size:18px;cursor:pointer;font-family:monospace;font-weight:bold;outline:none;">[X]</button>
        <h3 style="margin:10px 0 4px 0;color:#00ff41;font-size:22px;font-weight:900;letter-spacing:2px;text-shadow:0 0 8px #00ff41;">// ZXI SYSTEM</h3>
        <p style="margin:0 0 25px 0;color:#666;font-size:11px;letter-spacing:3px;">SECURE.CORE.LOGIN</p>
        <input type="password" id="zxi-key-input" class="zxi-input-matrix" placeholder="[ ENTER ACCESS KEY ]">
        <button id="zxi-login-btn" style="width:100%;background:#00ff41;color:#000;border:none;padding:16px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px;font-family:monospace;box-shadow:0 0 15px rgba(0,255,65,0.4);letter-spacing:2px;position:relative;z-index:2;">INITIALIZE_DECRYPT</button>
        <div id="zxi-status" style="margin-top:20px;font-size:11px;font-weight:bold;color:#555;letter-spacing:1px;">STATUS: STANDBY</div>
      </div>
    `;
    document.body.appendChild(box);

    // ক্যানভাস ম্যাট্রিক্স রেইন এনিমেশন
    function initMatrixRain() {
        const canvas = document.getElementById('matrix-canvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = box.offsetWidth;
        canvas.height = box.offsetHeight;

        const alphabet = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const fontSize = 11;
        const columns = canvas.width / fontSize;
        const rainDrops = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(5, 15, 5, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet[Math.floor(Math.random() * alphabet.length)];
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
                if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        };
        matrixInterval = setInterval(draw, 30);
    }
    setTimeout(initMatrixRain, 100);

    // প্যানেল বন্ধ করার ফাংশন
    function cleanup() {
        if(matrixInterval) clearInterval(matrixInterval);
        box.remove();
    }
    document.getElementById('zxi-panel-close').addEventListener('click', cleanup);

    // ইন্টারফেস ২: বাইপাস কনসোল ভিউ
    function showMainOptionsPanel() {
        if(matrixInterval) clearInterval(matrixInterval);
        box.innerHTML = `
            <canvas id="matrix-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; opacity:0.18; pointer-events:none;"></canvas>
            <div style="position:relative; z-index:2;">
                <button id="zxi-panel-close" style="position:absolute;top:-25px;right:-15px;background:none;border:none;color:#ff3333;font-size:18px;cursor:pointer;font-family:monospace;font-weight:bold;">[X]</button>
                <h3 style="margin:10px 0 4px 0;color:#00ff41;font-size:20px;font-weight:800;font-family:monospace;text-shadow:0 0 8px #00ff41;">// TERMINAL_READY</h3>
                <p style="margin:0 0 24px 0;color:#666;font-size:11px;letter-spacing:1px;">MODULE_LOADED_SUCCESSFULLY</p>
                <input type="text" id="zxi-bypass-input" class="zxi-input-matrix" placeholder="[ PASTE TARGET URL ]">
                <button id="zxi-fetch-bypass-btn" style="width:100%;background:#00ff41;color:#000;border:none;padding:16px;border-radius:8px;font-weight:bold;cursor:pointer;font-family:monospace;letter-spacing:1px;box-shadow:0 0 15px rgba(0,255,65,0.3)">RUN_EXPLOIT</button>
                <div id="zxi-bypass-status" style="margin-top:20px;font-size:11px;font-weight:bold;color:#555;letter-spacing:1px;">STATUS: ACTIVE</div>
            </div>
        `;
        setTimeout(initMatrixRain, 100);
        document.getElementById('zxi-panel-close').addEventListener('click', cleanup);

        const bypassInput = document.getElementById('zxi-bypass-input');
        const fetchBtn = document.getElementById('zxi-fetch-bypass-btn');
        const bStatus = document.getElementById('zxi-bypass-status');

        fetchBtn.addEventListener('click', async () => {
            const urlVal = bypassInput.value.trim();
            if (!urlVal) {
                bStatus.innerHTML = "<span style='color:#ff3333;'>[!] ERROR: EMPTY URL</span>";
                return;
            }

            bStatus.innerHTML = "<span style='color:#00ff41;'>[~] PROCESSING DATA...</span>";
            fetchBtn.disabled = true;

            try {
                const response = await fetch(`${SERVER_URL}/api/bypass?url=${encodeURIComponent(urlVal)}`);
                const data = await response.json();
                
                if (data && data.bypassed_url) {
                    bStatus.innerHTML = "<span style='color:#00ff41;'>[+] INJECTED SUCCESSFUL ✓</span>";
                    bypassInput.value = data.bypassed_url;
                    bypassInput.select();
                    
                    fetchBtn.outerHTML = `<button id="zxi-copy-btn" style="width:100%;background:#00ff41;color:#000;border:none;padding:16px;border-radius:8px;font-weight:bold;cursor:pointer;font-family:monospace;">[📋] COPY RESULT</button>`;
                    document.getElementById('zxi-copy-btn').addEventListener('click', () => {
                        navigator.clipboard.writeText(data.bypassed_url);
                        bStatus.innerHTML = "<span style='color:#00ff41;'>COPIED! TERMINATING...</span>";
                        setTimeout(cleanup, 1000);
                    });
                } else {
                    bStatus.innerHTML = "<span style='color:#ff3333;'>[!] SERVER REJECTED REQUEST</span>";
                    fetchBtn.disabled = false;
                }
            } catch (err) {
                bStatus.innerHTML = "<span style='color:#ff3333;'>[!] CONNECTION ERROR</span>";
                fetchBtn.disabled = false;
            }
        });
    }

    // লগইন সাবমিট হ্যান্ডলার 
    const keyInput = document.getElementById('zxi-key-input');
    const loginBtn = document.getElementById('zxi-login-btn');
    const statusDiv = document.getElementById('zxi-status');

    loginBtn.addEventListener('click', () => {
        const inputKey = keyInput.value.trim();
        if(!inputKey) { 
            statusDiv.innerHTML = "<span style='color:#ff3333;'>[!] ENTER ACCESS KEY</span>"; 
            return; 
        }
        
        statusDiv.innerHTML = "<span style='color:#00ff41;'>AUTHENTICATING...</span>";
        
        setTimeout(() => {
            // ডিফল্ট পাসওয়ার্ড 'admin' দেওয়া আছে। আপনার প্রোফাইল বা নাম.txt লজিক অনুযায়ী এটি পরিবর্তন করে নিতে পারেন।
            if (inputKey === "admin") {
                statusDiv.innerHTML = "<span style='color:#00ff41;'>ACCESS GRANTED</span>";
                setTimeout(showMainOptionsPanel, 800);
            } else {
                statusDiv.innerHTML = "<span style='color:#ff3333;'>[!] WRONG ACCESS KEY</span>";
            }
        }, 600);
    });

})();
