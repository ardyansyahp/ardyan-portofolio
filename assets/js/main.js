// Paksa browser untuk selalu mulai dari paling atas saat refresh
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Logika sederhana untuk animasi dan interaksi
document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio Loaded. Clean & Lightning Fast.");


    // --- SOUND DESIGN ---
    let clackAudioCtx = null;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            clackAudioCtx = new AudioContext();
        }
    } catch (e) {
        console.warn('AudioContext not supported or blocked');
    }

    function playClackSound() {
        if (!clackAudioCtx) return;
        if (clackAudioCtx.state === 'suspended') clackAudioCtx.resume();
        const osc = clackAudioCtx.createOscillator();
        const gainNode = clackAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000 + Math.random() * 200, clackAudioCtx.currentTime); // Slight randomization for realism
        osc.frequency.exponentialRampToValueAtTime(100, clackAudioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.05, clackAudioCtx.currentTime); // Very quiet
        gainNode.gain.exponentialRampToValueAtTime(0.01, clackAudioCtx.currentTime + 0.05);
        osc.connect(gainNode);
        gainNode.connect(clackAudioCtx.destination);
        osc.start();
        osc.stop(clackAudioCtx.currentTime + 0.05);
    }

    const factorySound = new Audio('assets/audio/transisi.mp3');

    // 2. FACTORY MODE LOGIC
    const factoryBtn = document.getElementById('factory-mode-btn');
    if (factoryBtn) {
        factoryBtn.addEventListener('click', () => {
            factorySound.currentTime = 0;
            factorySound.play().catch(e => console.log('Audio play failed', e));
            document.body.classList.toggle('factory-mode');
            if (document.body.classList.contains('factory-mode')) {
                factoryBtn.textContent = '[Terminate Override]';
            } else {
                factoryBtn.textContent = '[Execute Override]';
            }
        });
    }

    // 3. SCROLL REVEAL & METRICS
    const metrics = document.querySelectorAll('.metric-number');
    let metricsAnimated = false;

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // If it's the hero section, animate numbers
                if (entry.target.classList.contains('hero') && !metricsAnimated) {
                    metricsAnimated = true;
                    metrics.forEach(metric => {
                        const target = +metric.getAttribute('data-target');
                        const duration = 2000; // 2 seconds
                        const increment = target / (duration / 16); 
                        
                        let current = 0;
                        const updateCounter = () => {
                            current += increment;
                            if (current < target) {
                                metric.innerText = Math.ceil(current);
                                requestAnimationFrame(updateCounter);
                            } else {
                                metric.innerText = target;
                            }
                        };
                        updateCounter();
                    });
                }
            } else {
                // Mencegah bug "flicker" (tarik-tarikan) saat elemen keluar dari atas layar.
                // Class active HANYA dihapus jika elemen keluar dari BAWAH layar (scroll ke atas).
                if (entry.boundingClientRect.top > 0) {
                    entry.target.classList.remove('active');
                    
                    // Reset animasi angka jika hero section keluar dari viewport bawah
                    if (entry.target.classList.contains('hero')) {
                        metricsAnimated = false;
                        metrics.forEach(metric => {
                            metric.innerText = '0';
                        });
                    }
                }
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    // Terminal Logic
    const terminalBody = document.getElementById('terminal-body');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');

    if (terminalInput) {
        // Focus terminal on click anywhere in body
        terminalBody.addEventListener('click', () => {
            terminalInput.focus();
        });

        const commands = {
            'help': 'Available commands: <br>- <span class="highlight">whoami</span>: About me<br>- <span class="highlight">projects</span>: List my core projects<br>- <span class="highlight">skills</span>: My tech stack<br>- <span class="highlight">contact</span>: How to reach me<br>- <span class="highlight">halo</span>: System info fetch<br>- <span class="highlight">linkedin</span>: Open LinkedIn profile<br>- <span class="highlight">instagram</span>: Open Instagram profile<br>- <span class="highlight">email</span>: Open Gmail<br>- <span class="highlight">clear</span>: Clear terminal<br><br><span style="color:#ef4444; font-size:12px;">[RESTRICTED: \'hire-me\' protocol detected. Requires \'sudo\' privileges]</span>',
            'whoami': 'Ardyan Syahputra. Web Developer & System Integrator. I build digital ecosystems and automate factory floors.',
            'projects': '1. S2SMFG: <a href="projects/s2smfg" class="highlight" style="text-decoration: underline;">[View Case Study]</a><br>2. Direct-to-Printer Robot: <a href="projects/robot-printer" class="highlight" style="text-decoration: underline;">[View Case Study]</a><br>3. Asakai Dashboard: <a href="projects/asakai-dashboard" class="highlight" style="text-decoration: underline;">[View Case Study]</a><br>4. Logistics Driver App: <a href="projects/logistics-app" class="highlight" style="text-decoration: underline;">[View Case Study]</a>',
            'skills': 'PHP, Laravel, Livewire, Alpine.js, SQL, PowerShell, Flutter, Git, Docker, REST API.',
            'contact': 'Email: ardyansyahputra174@gmail.com<br>Location: Cikarang, Indonesia<br>Let\'s build something cool.',
        };

        terminalInput.addEventListener('keydown', function(e) {
            // Play clack sound on any key press (except enter which we might want to sound different, but let's keep it simple)
            if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
                playClackSound();
            }

            if (e.key === 'Enter') {
                const val = this.value.trim().toLowerCase();
                this.value = '';

                // Echo command
                const cmdEcho = document.createElement('p');
                cmdEcho.innerHTML = `<span class="prompt">guest@ardyan-sys:~$</span> ${val}`;
                terminalOutput.appendChild(cmdEcho);

                if (val === '') {
                    scrollToBottom();
                    return;
                }

                if (val === 'clear') {
                    terminalOutput.innerHTML = '';
                    return;
                }

                if (val === 'hire-me') {
                    const p = document.createElement('p');
                    p.className = 'sys-msg';
                    p.innerHTML = `<span style="color:#ef4444;">Permission denied.</span> The 'hire-me' protocol requires root privileges. Please run as <span class="highlight">sudo hire-me</span>.`;
                    terminalOutput.appendChild(p);
                    scrollToBottom();
                    return;
                }

                if (val === 'halo' || val === 'neofetch' || val === 'screenfetch') {
                    const asciiArt = `
                  -&#96;
                 .o+&#96;
                &#96;ooo/
               &#96;+oooo:
              &#96;+oooooo:
              -+oooooo+:
            &#96;/:-:++oooo+:
           &#96;/++++/+++++++:
          &#96;/++++++++++++++:
         &#96;/+++ooooooooooooo/&#96;
        ./ooosssso++osssssso+&#96;
       .oossssso-&#96;&#96;&#96;&#96;/ossssss+&#96;
      -osssssso.      :ssssssso.
     :osssssss/        osssso+++.
    /ossssssss/        +ssssooo/-
  &#96;/ossssso+/-        -:/+osssso+-
 &#96;+sso+:-&#96;               &#96;.-/+oso:
&#96;++:.                         &#96;-/+/
.&#96;                               &#96;/`;
                    const fetchHTML = `
<div style="display: flex; flex-wrap: wrap; gap: 20px; font-family: var(--font-mono); font-size: 13px; line-height: 1.4; margin-top: 10px; margin-bottom: 10px;">
<div style="color: #38bdf8; white-space: pre; font-weight: bold; font-size: 11px; line-height: 1.2;">${asciiArt}</div>
<div>
<span style="color: #38bdf8; font-weight: bold;">ardyan</span>@<span style="color: #38bdf8; font-weight: bold;">web-ecosystem</span>
<br><span style="color: #94a3b8;">---------------------</span>
<br><span style="color: #38bdf8; font-weight: bold;">OS:</span> Ardyan Portfolio OS
<br><span style="color: #38bdf8; font-weight: bold;">Kernel:</span> PHP, Laravel
<br><span style="color: #38bdf8; font-weight: bold;">Uptime:</span> 24/7 Problem Solving
<br><span style="color: #38bdf8; font-weight: bold;">Packages:</span> 150+ (composer, npm)
<br><span style="color: #38bdf8; font-weight: bold;">Shell:</span> bash & powershell
<br><span style="color: #38bdf8; font-weight: bold;">Resolution:</span> 4K Ultra HD
<br><span style="color: #38bdf8; font-weight: bold;">DE:</span> VScode
<br><span style="color: #38bdf8; font-weight: bold;">WM:</span> Windows 11
<br><span style="color: #38bdf8; font-weight: bold;">Theme:</span> Dark Mode [Custom]
<br><span style="color: #38bdf8; font-weight: bold;">CPU:</span> Highly Analytical Brain
<br><span style="color: #38bdf8; font-weight: bold;">Memory:</span> Coffee (16 Cups)
<br>
<div style="margin-top: 8px; display: flex; gap: 4px;">
<span style="display:inline-block; width:16px; height:16px; background:#475569;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#ef4444;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#22c55e;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#eab308;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#3b82f6;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#a855f7;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#06b6d4;"></span>
<span style="display:inline-block; width:16px; height:16px; background:#f8fafc;"></span>
</div>
</div>
</div>`;
                    terminalOutput.innerHTML += fetchHTML;
                    scrollToBottom();
                    return;
                }

                // Social Links Logic
                if (val === 'linkedin') {
                    terminalOutput.innerHTML += `<p class="sys-msg">> Opening LinkedIn profile...</p>`;
                    scrollToBottom();
                    window.open('https://www.linkedin.com/in/ardyan-syahputra', '_blank');
                    return;
                }
                
                if (val === 'instagram') {
                    terminalOutput.innerHTML += `<p class="sys-msg">> Opening Instagram profile...</p>`;
                    scrollToBottom();
                    window.open('https://www.instagram.com/ardaynsyahp', '_blank');
                    return;
                }

                if (val === 'email') {
                    terminalOutput.innerHTML += `<p class="sys-msg">> Opening Gmail...</p>`;
                    scrollToBottom();
                    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=ardyansyahputra174@gmail.com&su=Halo Ardyan!', '_blank');
                    return;
                }

                // 1. EASTER EGG LOGIC
                if (val === 'sudo hire-me') {
                    terminalInput.disabled = true; 
                    const steps = [
                        { msg: "> ACCESS GRANTED.", delay: 500 },
                        { msg: "> Executing Ardyan_Recruitment_Protocol.exe...", delay: 1500 },
                        { msg: "> CV is ready for extraction.", delay: 2500 },
                        { msg: "<a href='CV_Ardyan_Syahputra_Software_Engineer_EN.pdf' download='CV_Ardyan_Syahputra_Software_Engineer_EN.pdf' class='btn btn-primary' style='margin-top:10px; display:inline-block; font-family:var(--font-mono); margin-right: 10px;'>[ English CV ]</a><a href='CV_Ardyan_Syahputra_Software_Engineer_ID.pdf' download='CV_Ardyan_Syahputra_Software_Engineer_ID.pdf' class='btn btn-outline' style='margin-top:10px; display:inline-block; font-family:var(--font-mono);'>[ Indonesian CV ]</a>", delay: 3500 }
                    ];
                    
                    steps.forEach(step => {
                        setTimeout(() => {
                            const p = document.createElement('p');
                            p.className = 'sys-msg highlight';
                            p.innerHTML = step.msg;
                            terminalOutput.appendChild(p);
                            scrollToBottom();
                            if(step.delay === 3500) {
                                terminalInput.disabled = false;
                                terminalInput.focus();
                            }
                        }, step.delay);
                    });
                    return;
                }

                const response = document.createElement('p');
                response.className = 'sys-msg';

                if (commands[val]) {
                    response.innerHTML = commands[val];
                } else {
                    response.innerHTML = `Command not found: ${val}. Type <span class="highlight">'help'</span> for available commands.`;
                }

                terminalOutput.appendChild(response);
                scrollToBottom();
            }
        });

        function scrollToBottom() {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }

        // 4. 3D TILT EFFECT FOR TERMINAL
        const terminalWindow = document.querySelector('.terminal-window');
        if (terminalWindow) {
            terminalWindow.addEventListener('mousemove', (e) => {
                const rect = terminalWindow.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Max rotation 8 degrees for subtlety
                const rotateX = ((y - centerY) / centerY) * -8;
                const rotateY = ((x - centerX) / centerX) * 8;
                
                terminalWindow.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                terminalWindow.style.transition = 'transform 0.1s ease';
            });

            terminalWindow.addEventListener('mouseleave', () => {
                terminalWindow.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                terminalWindow.style.transition = 'transform 0.5s ease';
            });
        }
    }

    // 5. SCROLL PROGRESS & ACTIVE NAV
    const progressBar = document.getElementById('scroll-progress');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', () => {
        // Progress Bar
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (progressBar) progressBar.style.width = scrolled + '%';
        
        // Active Nav
        let current = '';
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (current && link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 7. HAMBURGER MENU MOBILE
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-links');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Start observing scroll animations since boot screen is removed
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

});
