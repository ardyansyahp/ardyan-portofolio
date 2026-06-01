// Paksa browser untuk selalu mulai dari paling atas saat refresh
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Logika sederhana untuk animasi dan interaksi
document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio Loaded. Clean & Lightning Fast.");

    // 1. BOOT SEQUENCE LOGIC
    const bootScreen = document.getElementById('boot-screen');
    const bootTextContainer = document.getElementById('boot-text');

    const bootMessages = [
        "> Initializing Ardyan's System...",
        "> Loading S2SMFG Protocols... OK",
        "> Connecting to Robot Printer... OK",
        "> Injecting Flutter Dependencies... OK",
        "> Welcome. Terminal is ready for input."
    ];

    document.body.classList.add('booting');

    let msgIndex = 0;

    function showNextMessage() {
        if (msgIndex < bootMessages.length) {
            const p = document.createElement('p');
            p.textContent = bootMessages[msgIndex];
            bootTextContainer.appendChild(p);
            msgIndex++;

            // Random delay between 200ms and 600ms
            const delay = Math.floor(Math.random() * 400) + 200;
            setTimeout(showNextMessage, delay);
        } else {
            // Finish boot
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                document.body.classList.remove('booting');
                // Trigger fade ins
                document.querySelectorAll('main, footer, nav').forEach(el => {
                    el.style.opacity = 1;
                    el.style.transition = 'opacity 0.8s ease';
                });
                
                // Mulai observe animasi scroll HANYA setelah boot screen menghilang
                // agar animasi section pertama (hero) terlihat oleh user
                const revealElements = document.querySelectorAll('.reveal');
                revealElements.forEach(el => revealObserver.observe(el));
            }, 800);
        }
    }

    // Start boot sequence
    setTimeout(showNextMessage, 500);

    // --- SOUND DESIGN ---
    const clackAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playClackSound() {
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
            'help': 'Available commands: <br>- <span class="highlight">whoami</span>: About me<br>- <span class="highlight">projects</span>: List my core projects<br>- <span class="highlight">skills</span>: My tech stack<br>- <span class="highlight">contact</span>: How to reach me<br>- <span class="highlight">clear</span>: Clear terminal<br><br><span style="color:#ef4444; font-size:12px;">[RESTRICTED: \'hire-me\' protocol detected. Requires \'sudo\' privileges]</span>',
            'whoami': 'Ardyan Syahputra. Web Developer & System Integrator. I build digital ecosystems and automate factory floors.',
            'projects': '1. S2SMFG: <a href="projects/s2smfg.html" class="highlight" style="text-decoration: underline;">[View Case Study]</a><br>2. Direct-to-Printer Robot: <a href="projects/robot-printer.html" class="highlight" style="text-decoration: underline;">[View Case Study]</a><br>3. Asakai Dashboard: <a href="projects/asakai-dashboard.html" class="highlight" style="text-decoration: underline;">[View Case Study]</a><br>4. Logistics Driver App: <a href="projects/logistics-app.html" class="highlight" style="text-decoration: underline;">[View Case Study]</a>',
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

                // 1. EASTER EGG LOGIC
                if (val === 'sudo hire-me') {
                    terminalInput.disabled = true; 
                    const steps = [
                        { msg: "> ACCESS GRANTED.", delay: 500 },
                        { msg: "> Executing Ardyan_Recruitment_Protocol.exe...", delay: 1500 },
                        { msg: "> CV is ready for extraction.", delay: 2500 },
                        { msg: "<a href='CV_Ardyan_Syahputra.pdf' download='CV_Ardyan_Syahputra.pdf' class='btn btn-primary' style='margin-top:10px; display:inline-block; font-family:var(--font-mono);'>[ Unduh CV ]</a>", delay: 3500 }
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

    // 6. CUSTOM CURSOR
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    if (cursorDot && cursorRing) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Adding slight delay to ring for smooth effect
            setTimeout(() => {
                cursorRing.style.left = `${posX}px`;
                cursorRing.style.top = `${posY}px`;
            }, 50);
        });

        // Hover states
        const interactables = document.querySelectorAll('a, button, input, .magnetic-btn, .bento-connect');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorRing.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                cursorRing.classList.remove('cursor-hover');
            });
        });
    }

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

});
