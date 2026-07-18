javascript:(function() {
    "use strict";

    // রেলওয়ে সার্ভার ইউআরএল এবং ইউজার ইনডেক্স সেটআপ (আগের লজিক অনুযায়ী)
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

    // পুরোনো প্যানেল থাকলে তা রিমুভ করা
    const oldBox = document.getElementById('zxi-vp-bypass-box');
    if(oldBox) oldBox.remove();

    // স্টাইলশীট যুক্ত করা (প্রিমিয়াম সাইবারপাঙ্ক গ্লো এবং অ্যানিমেশন)
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes zxi-glow-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.1); }
            50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.8), inset 0 0 25px rgba(255, 255, 255, 0.3); }
        }
        @keyframes zxi-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .zxi-vp-input:focus {
            border-color: #22d3ee !important;
            box-shadow: 0 0 15px rgba(34, 211, 238, 0.5) !important;
        }
    `;
    document.head.appendChild(styleSheet);

    // মেইন ইন্টারফেস তৈরি (প্রিমিয়াম ডার্ক গ্লাস মরফিজম ফ্রেম)
    const box = document.createElement('div');
    box.id = 'zxi-vp-bypass-box';
    box.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
        color: #fff; padding: 40px 30px; border-radius: 24px; z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center; box-shadow: 0 30px 70px rgba(0,0,0,0.8);
        border: 1px solid rgba(255, 255, 255, 0.15); width: 350px; box-sizing: border-box;
        animation: zxi-glow-pulse 4s infinite ease-in-out;
    `;
    
    box.innerHTML = `
      <button id="zxi-vp-close" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;outline:none;">✕</button>
      <h3 style="margin:0 0 6px 0;color:#22d3ee;font-size:24px;font-weight:900;letter-spacing:1px;text-shadow: 0 0 10px rgba(34,211,238,0.3);">ZXI BYPASS</h3>
      <p style="margin:0 0 25px 0;color:#94a3b8;font-size:12.5px;letter-spacing:1.5px;font-weight:600;">SUPPORTED: VPLINK ONLY</p>
      
      <input type="text" id="zxi-vp-input" class="zxi-vp-input" placeholder="https://vplink.in/..." 
             style="width:100%;padding:16px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.15);border-radius:14px;background:rgba(255,255,255,0.05);color:#fff;text-align:center;font-size:14.5px;outline:none;transition:all 0.3s ease;">
      
      <div id="zxi-progress-container" style="width:100%; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; margin-bottom:20px; overflow:hidden; display:none;">
          <div id="zxi-progress-bar" style="width:100%; height:100%; background:linear-gradient(90deg, #22d3ee, #a5b4fc); animation: zxi-loading-bar 1.5s infinite linear;"></div>
      </div>

      <button id="zxi-vp-btn" style="width:100%;background:linear-gradient(135deg,#22d3ee,#3b82f6);color:#0f172a;border:none;padding:16px;border-radius:14px;font-weight:700;cursor:pointer;font-size:15px;box-shadow:0 8px 20px rgba(34,211,238,0.3);transition:all 0.3s ease;">START BYPASS</button>
      <div id="zxi-vp-status" style="margin-top:18px;font-size:13px;font-weight:600;color:#64748b;letter-spacing:0.5px;">SYSTEM READY</div>
    `;
    document.body.appendChild(box);

    // ক্লোজ বাটন ফাংশনালিটি
    document.getElementById('zxi-vp-close').addEventListener('click', () => box.remove());

    const vpInput = document.getElementById('zxi-vp-input');
    const vpBtn = document.getElementById('zxi-vp-btn');
    const vpStatus = document.getElementById('zxi-vp-status');
    const progressContainer = document.getElementById('zxi-progress-container');

    vpBtn.addEventListener('click', async () => {
        const urlVal = vpInput.value.trim();
        
        // ইনপুট ভ্যালিডেশন
        if (!urlVal || !urlVal.includes('vplink.in/')) {
            vpStatus.innerHTML = "<span style='color:#f87171;'>INVALID LINK! URL MUST BE VPLINK.</span>";
            return;
        }

        // ইউজার ইন্টারফেস অ্যানিমেশন ও স্টেট পরিবর্তন
        vpStatus.innerHTML = "<span style='color:#22d3ee;'>BYPASSING LINK...</span>";
        vpBtn.disabled = true;
        vpBtn.style.opacity = "0.5";
        vpBtn.style.cursor = "not-allowed";
        progressContainer.style.display = "block";

        try {
            // API রিকোয়েস্ট পাঠানো
            const response = await fetch(`${RAILWAY_SERVER_URL}/api/bypass?mode=power&user=${userIndex}&url=${encodeURIComponent(urlVal)}`);
            const data = await response.json();
            
            progressContainer.style.display = "none";

            if (data && data.status === "success" && data.bypassed_url) {
                vpStatus.innerHTML = "<span style='color:#4ade80;'>BYPASS SUCCESSFUL ✓</span>";
                
                // বাটনকে কপি বাটনে রূপান্তর করা
                vpBtn.disabled = false;
                vpBtn.style.opacity = "1";
                vpBtn.style.cursor = "pointer";
                vpBtn.style.background = "linear-gradient(135deg,#4ade80,#10b981)";
                vpBtn.style.boxShadow = "0 8px 20px rgba(74,222,128,0.3)";
                vpBtn.innerHTML = "📋 COPY BYPASS LINK";
                
                // আসল বাইপাস লিংকটি ইনপুট বক্সে সুন্দরভাবে সেট করা
                vpInput.value = data.bypassed_url;
                vpInput.select(); 

                // কপি করার ইভেন্ট লিসেনার
                vpBtn.onclick = () => {
                    navigator.clipboard.writeText(data.bypassed_url).then(() => {
                        vpStatus.innerHTML = "<span style='color:#4ade80; font-weight:700;'>LINK COPIED TO CLIPBOARD!</span>";
                        setTimeout(() => { box.remove(); }, 1200);
                    }).catch(() => {
                        // ফলব্যাক যদি ক্লিপবোর্ড এপিআই কোনো কারণে ফেইল করে
                        alert("Bypassed URL: " + data.bypassed_url);
                        box.remove();
                    });
                };
            } else {
                resetButton("<span style='color:#f87171;'>BYPASS FAILED. TRY AGAIN!</span>");
            }
        } catch (err) {
            progressContainer.style.display = "none";
            resetButton("<span style='color:#f87171;'>SERVER ERROR! TONIGHT ONLY.</span>");
        }
    });

    function resetButton(statusHtml) {
        vpStatus.innerHTML = statusHtml;
        vpBtn.disabled = false;
        vpBtn.style.opacity = "1";
        vpBtn.style.cursor = "pointer";
        vpBtn.style.background = "linear-gradient(135deg,#22d3ee,#3b82f6)";
        vpBtn.innerHTML = "START BYPASS";
    }
})();
