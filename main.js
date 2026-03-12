'use strict';

(function initCircuitCanvas() {
  const canvas = document.getElementById('circuit-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, nodes = [], pulses = [];

  function buildGraph() {
    nodes = []; pulses = [];
    const cols = Math.floor(W / 80);
    const rows = Math.floor(H / 80);
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (Math.random() > 0.35) {
          nodes.push({ x: c * 80 + (Math.random() - 0.5) * 30, y: r * 80 + (Math.random() - 0.5) * 30, connections: [] });
        }
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 120 && Math.random() > 0.5) {
          nodes[i].connections.push(j);
        }
      }
    }
  }

  function spawnPulse() {
    if (nodes.length < 2) return;
    const n = nodes[Math.floor(Math.random() * nodes.length)];
    if (!n.connections.length) return;
    pulses.push({ from: nodes.indexOf(n), to: n.connections[Math.floor(Math.random() * n.connections.length)], t: 0, speed: 0.012 + Math.random() * 0.018 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,255,159,0.06)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (const j of nodes[i].connections) {
        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(0,255,159,0.15)';
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, 2, 0, Math.PI * 2); ctx.fill(); }
    pulses = pulses.filter(p => p.t <= 1);
    for (const p of pulses) {
      const fx = nodes[p.from].x, fy = nodes[p.from].y;
      const tx = nodes[p.to].x,   ty = nodes[p.to].y;
      const x  = fx + (tx - fx) * p.t, y = fy + (ty - fy) * p.t;
      const g  = ctx.createRadialGradient(x, y, 0, x, y, 10);
      g.addColorStop(0, 'rgba(0,255,159,0.9)'); g.addColorStop(1, 'rgba(0,255,159,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      p.t += p.speed;
    }
    if (Math.random() < 0.04) spawnPulse();
    requestAnimationFrame(draw);
  }

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; buildGraph(); }
  window.addEventListener('resize', resize);
  resize(); draw();
})();

(function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu()  { document.getElementById('mobileMenu').classList.remove('open'); }

function switchLevel(level, btn) {
  document.querySelectorAll('.lesson-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('lessons-' + level).classList.add('active');
  btn.classList.add('active');
  document.querySelectorAll('#lessons-' + level + ' .reveal').forEach(el => {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('visible'), 50);
  });
}

function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

(function initLedDemo() {
  const LED_MAP = { ledR: 'on-red', ledG: 'on-green', ledB: 'on-blue' };
  let blinkTimer = null;
  window.toggleLed = id => document.getElementById(id).classList.toggle(LED_MAP[id]);
  window.blinkAll = function() {
    clearInterval(blinkTimer);
    let on = false;
    blinkTimer = setInterval(() => {
      Object.entries(LED_MAP).forEach(([id, cls]) => document.getElementById(id).classList.toggle(cls, on));
      on = !on;
    }, 300);
    setTimeout(() => { clearInterval(blinkTimer); allOff(); }, 4000);
  };
  window.allOff = function() {
    clearInterval(blinkTimer);
    Object.entries(LED_MAP).forEach(([id, cls]) => document.getElementById(id).classList.remove(cls));
  };
})();

(function initPinActivity() {
  const pins = document.querySelectorAll('.pin');
  if (!pins.length) return;
  setInterval(() => {
    const pin = pins[Math.floor(Math.random() * pins.length)];
    pin.classList.add('active');
    setTimeout(() => pin.classList.remove('active'), 1200);
  }, 1500);
})();

/* ═══════════════════════════════════════════════════════════
   CONTENT GATING
═══════════════════════════════════════════════════════════ */
window.applyGating = function(isLoggedIn) {
  const banner = document.getElementById('heroAccessBanner');

  if (isLoggedIn) {
    banner.classList.add('hidden');

    document.querySelectorAll('.lesson-locked-card').forEach(card => card.classList.add('unlocked'));
    document.querySelectorAll('[data-auth-required="true"]').forEach(el => el.classList.remove('locked-links'));

    document.getElementById('gate-intermediate').classList.add('hidden');
    document.getElementById('gate-advanced').classList.add('hidden');
    document.getElementById('grid-intermediate').style.display = '';
    document.getElementById('grid-advanced').style.display = '';

    document.querySelectorAll('.lesson-complete-btn').forEach(btn => btn.classList.remove('hidden'));
    document.querySelectorAll('.level-progress').forEach(el => el.classList.remove('hidden'));

    document.getElementById('quizGuestBanner').classList.add('hidden');
    document.getElementById('quizLeaderboard').classList.remove('hidden');
    document.getElementById('quizHintWrap').classList.remove('hidden');
    document.getElementById('quizLoggedMsg').classList.remove('hidden');
    document.getElementById('lock-intermediate').classList.add('hidden');
    document.getElementById('lock-advanced').classList.add('hidden');

    loadProgress();
    loadLeaderboard('beginner', document.querySelector('.lb-tab'));

  } else {
    banner.classList.remove('hidden');

    document.querySelectorAll('.lesson-locked-card').forEach(card => card.classList.remove('unlocked'));
    document.querySelectorAll('[data-auth-required="true"]').forEach(el => el.classList.add('locked-links'));

    document.getElementById('gate-intermediate').classList.remove('hidden');
    document.getElementById('gate-advanced').classList.remove('hidden');
    document.getElementById('grid-intermediate').style.display = 'none';
    document.getElementById('grid-advanced').style.display = 'none';

    document.querySelectorAll('.lesson-complete-btn').forEach(btn => btn.classList.add('hidden'));
    document.querySelectorAll('.level-progress').forEach(el => el.classList.add('hidden'));

    document.getElementById('quizGuestBanner').classList.remove('hidden');
    document.getElementById('quizLeaderboard').classList.add('hidden');
    document.getElementById('quizHintWrap').classList.add('hidden');
    document.getElementById('quizLoggedMsg').classList.add('hidden');
    document.getElementById('lock-intermediate').classList.remove('hidden');
    document.getElementById('lock-advanced').classList.remove('hidden');
  }
};

/* ═══════════════════════════════════════════════════════════
   PROGRESS TRACKING
═══════════════════════════════════════════════════════════ */
const LESSONS_PER_LEVEL = { beginner: 6, intermediate: 6, advanced: 6 };
const LESSON_LEVELS = {
  L01: 'beginner', L02: 'beginner', L03: 'beginner', L04: 'beginner', L05: 'beginner', L06: 'beginner',
  L07: 'intermediate', L08: 'intermediate', L09: 'intermediate', L10: 'intermediate', L11: 'intermediate', L12: 'intermediate',
  L13: 'advanced', L14: 'advanced', L15: 'advanced', L16: 'advanced', L17: 'advanced', L18: 'advanced',
};

function getProgress() {
  try { return JSON.parse(localStorage.getItem('cb_progress') || '{}'); } catch { return {}; }
}

function saveProgress(progress) {
  localStorage.setItem('cb_progress', JSON.stringify(progress));
}

function loadProgress() {
  const progress = getProgress();
  Object.keys(progress).forEach(lessonId => {
    if (progress[lessonId]) markLessonDone(lessonId, false);
  });
  updateAllProgressBars();
}

function markLessonDone(lessonId, persist = true) {
  const btn = document.querySelector(`.lesson-complete-btn[data-lesson="${lessonId}"]`);
  if (btn) { btn.textContent = '✅ COMPLETED'; btn.classList.add('done'); btn.disabled = true; }
  if (persist) {
    const progress = getProgress();
    progress[lessonId] = true;
    saveProgress(progress);
    updateAllProgressBars();
  }
}

window.toggleComplete = function(lessonId, btn) {
  const progress = getProgress();
  if (progress[lessonId]) return;
  markLessonDone(lessonId, true);
  showToast(`LESSON ${lessonId} MARKED COMPLETE ✅`);
};

function updateAllProgressBars() {
  const progress = getProgress();
  ['beginner', 'intermediate', 'advanced'].forEach(level => {
    const total   = LESSONS_PER_LEVEL[level];
    const done    = Object.entries(LESSON_LEVELS).filter(([id, lvl]) => lvl === level && progress[id]).length;
    const pct     = (done / total) * 100;
    const fill    = document.getElementById(`pfill-${level}`);
    const count   = document.getElementById(`pcount-${level}`);
    if (fill)  fill.style.width  = pct + '%';
    if (count) count.textContent = `${done} / ${total} lessons`;
  });
}

/* ═══════════════════════════════════════════════════════════
   QUIZ LEVEL GATE
═══════════════════════════════════════════════════════════ */
window.handleQuizLevelClick = function(level, btn) {
  if (!window._cbLoggedIn) {
    showToast('🔒 Sign up to unlock ' + level + ' quiz!');
    openAuth('signup');
    return;
  }
  startQuiz(level, btn);
};

/* ═══════════════════════════════════════════════════════════
   LEADERBOARD
═══════════════════════════════════════════════════════════ */
window.loadLeaderboard = async function(level, btn) {
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const list = document.getElementById('leaderboardList');
  list.innerHTML = '<div class="lb-loading">Loading...</div>';

  try {
    const res  = await fetch(`${window._cbApiBase || 'http://localhost:3001'}/api/scores/top/${level}`);
    const data = await res.json();
    const rows = data.leaderboard || [];

    if (!rows.length) { list.innerHTML = '<div class="lb-loading">No scores yet — be the first!</div>'; return; }

    const rankLabels = ['🥇', '🥈', '🥉'];
    const rankClasses = ['gold', 'silver', 'bronze'];
    list.innerHTML = rows.map((row, i) => `
      <div class="lb-row">
        <span class="lb-rank ${rankClasses[i] || ''}">${rankLabels[i] || (i + 1)}</span>
        <span class="lb-name">${row.users?.username || row.username || 'OPERATOR'}</span>
        <span class="lb-score">${row.score || row.best_score} pts</span>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<div class="lb-loading">Could not load leaderboard.</div>';
  }
};

/* ═══════════════════════════════════════════════════════════
   QUIZ ENGINE
═══════════════════════════════════════════════════════════ */
(function initQuiz() {

  const QUESTIONS = {
    beginner: [
      { q: 'What does CIA stand for in cybersecurity?', opts: ['Central Intelligence Agency', 'Confidentiality, Integrity, Availability', 'Cyber Intrusion Analysis', 'Circuit, Interface, Architecture'], ans: 1, cat: 'CYBER', hint: 'Think about the 3 core properties any secure system must maintain.', explain: 'The CIA Triad is the core model: Confidentiality (only authorized access), Integrity (data is unmodified), Availability (systems are accessible).' },
      { q: 'What is a firewall primarily used for?', opts: ['Speed up internet connection', 'Monitor and filter network traffic', 'Store encrypted passwords', 'Scan for viruses on disk'], ans: 1, cat: 'CYBER', hint: 'It acts like a security guard standing between your network and the outside world.', explain: 'A firewall monitors incoming and outgoing traffic and applies rules to block or allow packets based on security policy.' },
      { q: 'Which component on the Arduino Uno has a built-in LED?', opts: ['Pin A0', 'Pin 13', 'Pin 5V', 'The RESET button'], ans: 1, cat: 'ROBOTICS', hint: 'It\'s the digital pin number equal to 13, used in the classic Blink sketch.', explain: 'Digital Pin 13 on the Arduino Uno is connected to the onboard LED, making it the standard "blink" pin for beginners.' },
      { q: 'What does V = I × R represent?', opts: ["Newton's Second Law", "Ohm's Law", "Faraday's Law", "Kirchhoff's Voltage Law"], ans: 1, cat: 'CIRCUITS', hint: 'This is the most fundamental equation in all of electronics — named after a German physicist.', explain: "Ohm's Law: Voltage (V) equals Current (I) times Resistance (R). It's the fundamental equation governing all electrical circuits." },
      { q: 'What is phishing?', opts: ['A type of fishing sport', 'Malware that deletes files', 'A social engineering attack using fake messages to steal credentials', 'A firewall bypass technique'], ans: 2, cat: 'CYBER', hint: 'It involves sending deceptive emails or links pretending to be a trusted source.', explain: 'Phishing tricks users into revealing passwords or installing malware via emails or sites that impersonate legitimate services.' },
      { q: 'What does the pinMode() function do in Arduino?', opts: ['Reads a sensor value', 'Sets a pin as INPUT or OUTPUT', 'Turns on the onboard LED', 'Initializes serial communication'], ans: 1, cat: 'ROBOTICS', hint: 'You call this in setup() before using a pin — it configures its direction.', explain: 'pinMode(pin, mode) configures a specific pin to behave as an INPUT (read signals) or OUTPUT (send signals).' },
      { q: 'What is an IP address?', opts: ['A type of malware', 'A unique identifier for a device on a network', 'An encryption algorithm', 'A type of resistor'], ans: 1, cat: 'NETWORKS', hint: 'Think of it as a postal address — but for your device on the internet.', explain: 'An IP (Internet Protocol) address is a unique numerical label assigned to each device on a network, used for routing data.' },
      { q: 'Which leg of an LED should connect to the positive supply?', opts: ['The shorter leg (cathode)', 'The longer leg (anode)', 'Either leg works', 'The flat side'], ans: 1, cat: 'CIRCUITS', hint: 'The longer one is positive. A = Anode = longer.', explain: 'The longer leg is the anode (+). Current flows from anode to cathode. Connecting backwards prevents the LED from lighting up.' },
      { q: 'Why should you always use a resistor with an LED?', opts: ['To make it blink', 'To change the LED color', 'To limit current and prevent the LED from burning out', 'To store energy'], ans: 2, cat: 'CIRCUITS', hint: 'Without it, too much current destroys the component instantly.', explain: 'Without a resistor, too much current flows through the LED, burning it out instantly. A 220Ω resistor limits current to a safe ~20mA.' },
      { q: 'What does MFA stand for in cybersecurity?', opts: ['Machine Fault Analysis', 'Multi-Factor Authentication', 'Main Firewall Access', 'Malware Filtering Algorithm'], ans: 1, cat: 'CYBER', hint: 'It requires more than just a password — something you have, know, or are.', explain: 'Multi-Factor Authentication requires two or more verification factors — something you know (password), have (phone), or are (biometric).' },
    ],
    intermediate: [
      { q: 'What is the key difference between symmetric and asymmetric encryption?', opts: ['Symmetric is slower; asymmetric is faster', 'Symmetric uses one key for both encrypt/decrypt; asymmetric uses a key pair', 'Symmetric only works on text; asymmetric works on files', 'There is no difference'], ans: 1, cat: 'CRYPTO', hint: 'One type uses the same key to lock and unlock. The other uses two different keys.', explain: 'Symmetric (e.g. AES) uses one shared key. Asymmetric (e.g. RSA) uses a public key to encrypt and a private key to decrypt.' },
      { q: 'What does analogRead(A0) return on an Arduino Uno?', opts: ['A voltage in millivolts', 'A value from 0 to 255', 'A value from 0 to 1023', 'A boolean true/false'], ans: 2, cat: 'ROBOTICS', hint: 'Arduino has a 10-bit ADC — how many values can 10 bits represent?', explain: "Arduino's 10-bit ADC converts 0–5V into 0–1023. Use map() to convert to real-world units." },
      { q: 'Which defense prevents SQL injection attacks?', opts: ['Using a firewall', 'Parameterized queries / prepared statements', 'Encrypting the database', 'Disabling network access'], ans: 1, cat: 'CYBER', hint: 'The solution involves separating user data from the SQL command structure.', explain: 'Parameterized queries separate SQL code from user data, making it impossible for input to be interpreted as SQL commands.' },
      { q: 'What does PWM stand for, and what does it control?', opts: ['Power Wave Modulation — voltage', 'Pulse Width Modulation — average power/speed via duty cycle', 'Programmable Wire Module — I2C', 'Phase Width Management — AC frequency'], ans: 1, cat: 'ROBOTICS', hint: 'It rapidly switches a pin on and off — the % of time on is called the duty cycle.', explain: 'PWM rapidly switches a pin between HIGH and LOW. The duty cycle (% of time HIGH) controls average output — used for LED brightness and motor speed.' },
      { q: 'What is a Man-in-the-Middle (MITM) attack?', opts: ['An attack that physically destroys hardware', 'An attack where someone secretly intercepts communication between two parties', 'A brute-force attack on passwords', 'An attack that overloads a server with requests'], ans: 1, cat: 'CYBER', hint: 'The attacker secretly positions themselves between the sender and receiver.', explain: 'In a MITM attack, the attacker positions themselves between two communicating parties, reading or modifying data without either party knowing.' },
      { q: 'How many devices can be on one I2C bus?', opts: ['1 device only', 'Up to 10 devices', 'Up to 127 devices (7-bit addresses)', 'Unlimited devices'], ans: 2, cat: 'ROBOTICS', hint: 'I2C uses 7-bit addressing — calculate 2^7 minus 1 for the reserved address.', explain: 'I2C uses 7-bit addresses, allowing up to 127 unique devices on a 2-wire bus (SDA + SCL).' },
      { q: 'What is a DMZ in network security?', opts: ['A firewall rule blocking all traffic', 'A physical barrier around server rooms', 'An isolated subnetwork exposing public services while protecting the internal network', 'A type of DDoS mitigation'], ans: 2, cat: 'NETWORKS', hint: 'It\'s named after a military concept — a buffer zone between two opposing forces.', explain: 'A DMZ (Demilitarized Zone) sits between the public internet and the internal network, hosting web/email servers while limiting internal exposure.' },
      { q: 'What value does analogWrite(pin, 127) produce on a PWM pin?', opts: ['0V output', 'Approximately 2.5V average (50% duty cycle)', '5V output', '127mV output'], ans: 1, cat: 'ROBOTICS', hint: '127 out of 255 is approximately half — what does half duty cycle mean for voltage?', explain: 'analogWrite accepts 0–255. 127 ≈ 50% duty cycle, producing approximately 2.5V average on the pin.' },
      { q: 'What is XSS (Cross-Site Scripting)?', opts: ['A technique for compressing web data', 'Injecting malicious scripts into web pages viewed by other users to steal data or hijack sessions', 'A method for scanning open network ports', 'An encryption protocol for web forms'], ans: 1, cat: 'CYBER', hint: 'It involves injecting client-side code into a page that other users will visit.', explain: 'XSS injects client-side scripts into pages. Attackers steal cookies, redirect users, or deface sites. Prevented by output encoding.' },
      { q: 'What is AES-256 used for?', opts: ['Hashing passwords', 'Symmetric encryption of data with a 256-bit key', 'Asymmetric key exchange', 'Network packet routing'], ans: 1, cat: 'CRYPTO', hint: 'AES stands for Advanced Encryption Standard — it uses the same key to lock and unlock.', explain: 'AES-256 is the current gold standard for symmetric encryption — the same key encrypts and decrypts data.' },
    ],
    advanced: [
      { q: 'In a buffer overflow attack, what memory region is typically targeted to hijack execution?', opts: ['The heap segment', 'The BSS segment', 'The return address on the stack', 'The .text (code) segment'], ans: 2, cat: 'EXPLOIT', hint: 'When a function finishes, it reads an address to know where to jump next — attackers overwrite that.', explain: 'Overflowing a stack buffer can overwrite the saved return address. When the function returns, execution jumps to the attacker-controlled address.' },
      { q: 'What is the purpose of ASLR (Address Space Layout Randomization)?', opts: ['Speeds up memory allocation', 'Randomizes the memory locations of stack, heap, and libraries to make exploit addresses unpredictable', 'Encrypts memory contents', 'Prevents buffer overflow by checking array bounds'], ans: 1, cat: 'EXPLOIT', hint: 'Attackers need to know where code lives in memory — this mitigation prevents that.', explain: 'ASLR randomizes base addresses each run, making it hard for attackers to know where shellcode or gadgets reside in memory.' },
      { q: 'In PID control, what does the Integral (I) term correct?', opts: ['Instantaneous error — proportional response', 'Steady-state error by accumulating past errors over time', 'Predicted future error to dampen oscillation', 'The setpoint value in real time'], ans: 1, cat: 'ROBOTICS', hint: 'This term sums up errors over time — it corrects for persistent small offsets.', explain: 'The I term integrates (sums) past errors. If error persists, I grows, providing additional corrective force to eliminate steady-state offset.' },
      { q: 'What is a ROP (Return-Oriented Programming) chain used for?', opts: ['Routing network packets through a proxy', 'Stringing together existing code "gadgets" to execute arbitrary code bypassing NX/DEP', 'Reading memory without triggering ASLR', 'A reversible encryption scheme'], ans: 1, cat: 'EXPLOIT', hint: 'It reuses tiny existing code snippets already in memory — no new code injection needed.', explain: 'ROP reuses existing code snippets (gadgets) ending in RET instructions, chaining them to perform arbitrary operations without injecting new shellcode.' },
      { q: 'In FreeRTOS, what is the role of a semaphore?', opts: ['A hardware timer for PWM generation', 'A mechanism to synchronize tasks and prevent race conditions on shared resources', 'A function for reading analog sensors', 'A network socket abstraction'], ans: 1, cat: 'ROBOTICS', hint: 'Think of it as a signal flag — tasks check it before accessing a shared resource.', explain: 'Semaphores signal between tasks — a binary semaphore acts like a mutex to protect shared resources; a counting semaphore manages resource pools.' },
      { q: 'What is Diffie-Hellman key exchange used for?', opts: ['Hashing passwords with a salt', 'Allowing two parties to agree on a shared secret over a public channel without transmitting it', 'Signing digital certificates', 'Generating RSA key pairs'], ans: 1, cat: 'CRYPTO', hint: 'Two parties can derive the same secret without ever directly sending it — even over a public network.', explain: 'D-H allows secure key establishment: both parties exchange public values; combined with private values, they compute the same shared secret.' },
      { q: 'What does JTAG expose on an IoT device?', opts: ['Only Wi-Fi firmware updates', 'A debug interface allowing reading/writing memory, halting CPUs, and firmware extraction', 'Only the device\'s encryption keys', 'Only GPIO pin states'], ans: 1, cat: 'IOT', hint: 'It\'s a hardware debug port — originally for testing PCBs, but attackers with physical access can abuse it.', explain: 'JTAG (Joint Test Action Group) is a hardware debug port. Attackers with physical access can dump firmware, read RAM, or bypass secure boot.' },
      { q: 'What is passive reconnaissance in penetration testing?', opts: ['Actively scanning target ports with Nmap', 'Gathering information via OSINT, WHOIS, DNS without directly interacting with the target', 'Exploiting a vulnerable service', 'Extracting credentials from memory'], ans: 1, cat: 'PENTEST', hint: 'You gather information without sending a single packet to the target — it leaves no trace.', explain: 'Passive recon gathers info without touching the target — using public records, WHOIS, Shodan, LinkedIn, etc. Leaves no traces on target systems.' },
      { q: 'What does certificate pinning protect against?', opts: ['SQL injection attacks', 'Rogue or compromised Certificate Authority (CA) attacks by binding a specific cert/key to the app', 'Buffer overflow exploits', 'Cross-site scripting'], ans: 1, cat: 'CRYPTO', hint: 'It hardcodes an expected certificate so that even a valid CA-signed imposter gets rejected.', explain: 'Certificate pinning hardcodes the expected cert/public key. If a MITM presents a different cert (even a valid CA-signed one), the connection is rejected.' },
      { q: 'In a PID controller for a drone, which term prevents oscillation around the setpoint?', opts: ['Proportional (P) — scales with current error', 'Integral (I) — accumulates past error', 'Derivative (D) — reacts to rate of change of error', 'Feedforward (F) — bypasses feedback'], ans: 2, cat: 'ROBOTICS', hint: 'This term measures how fast the error is changing — it applies a "braking force".', explain: 'The D term calculates the rate of change of error. If error is decreasing rapidly, D applies a braking force to prevent overshoot and oscillation.' },
    ],
  };

  const state = {
    level: 'beginner', questions: [], current: 0,
    answered: false, hintUsed: false,
    totalScore: 0, totalCorrect: 0, streak: 0,
    roundCorrect: 0, roundPts: 0,
  };

  const PTS = { beginner: 10, intermediate: 20, advanced: 30 };
  const HINT_COST = 5;

  const elScore   = document.getElementById('score-total');
  const elCorrect = document.getElementById('score-correct');
  const elStreak  = document.getElementById('score-streak');
  const elLevel   = document.getElementById('score-level');

  function updateScoreboard() {
    bumpVal(elScore,   state.totalScore);
    bumpVal(elCorrect, state.totalCorrect);
    bumpVal(elStreak,  state.streak);
    elLevel.textContent = state.level.toUpperCase();
  }

  function bumpVal(el, val) {
    el.textContent = val;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 400);
  }

  window.startQuiz = function(level, btn) {
    document.querySelectorAll('.qlevel-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.level = level;
    elLevel.textContent = level.toUpperCase();
    showScreen('quiz-intro');
  };

  window.beginQuiz = function() {
    const pool = [...QUESTIONS[state.level]];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.questions    = pool.slice(0, 8);
    state.current      = 0;
    state.roundCorrect = 0;
    state.roundPts     = 0;
    renderQuestion();
    showScreen('quiz-question');
  };

  window.nextLevel = function() {
    const order = ['beginner', 'intermediate', 'advanced'];
    const idx   = order.indexOf(state.level);
    if (idx < order.length - 1) {
      if (!window._cbLoggedIn && idx >= 0) {
        showToast('🔒 Sign up to unlock ' + order[idx + 1] + ' quiz!');
        openAuth('signup');
        return;
      }
      const next = order[idx + 1];
      state.level = next;
      elLevel.textContent = next.toUpperCase();
      document.querySelectorAll('.qlevel-btn').forEach((b, i) => b.classList.toggle('active', i === idx + 1));
    }
    showScreen('quiz-intro');
  };

  function renderQuestion() {
    const q   = state.questions[state.current];
    const num = state.current + 1;
    const tot = state.questions.length;

    document.getElementById('qCategory').textContent   = q.cat;
    document.getElementById('qProgress').textContent   = `Q ${num} / ${tot}`;
    document.getElementById('qDifficulty').textContent = state.level.toUpperCase();
    document.getElementById('qText').textContent       = q.q;
    document.getElementById('qProgressFill').style.width = ((num - 1) / tot * 100) + '%';

    const fb = document.getElementById('qFeedback');
    fb.textContent = ''; fb.className = 'quiz-feedback';

    const hintBtn  = document.getElementById('quizHintBtn');
    const hintText = document.getElementById('quizHintText');
    if (hintBtn)  { hintBtn.disabled = false; hintBtn.textContent = `💡 USE HINT (-${HINT_COST} pts)`; }
    if (hintText) { hintText.textContent = ''; hintText.classList.add('hidden'); }
    state.hintUsed = false;

    const container = document.getElementById('qOptions');
    container.innerHTML = '';
    state.answered = false;

    ['A', 'B', 'C', 'D'].forEach((letter, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerHTML = `<span class="opt-letter">${letter}</span> ${q.opts[i]}`;
      btn.onclick = () => handleAnswer(i);
      container.appendChild(btn);
    });
  }

  window.showHint = function() {
    if (state.answered || state.hintUsed) return;
    const q        = state.questions[state.current];
    const hintBtn  = document.getElementById('quizHintBtn');
    const hintText = document.getElementById('quizHintText');
    state.hintUsed = true;
    state.totalScore = Math.max(0, state.totalScore - HINT_COST);
    updateScoreboard();
    hintText.textContent = '💡 ' + q.hint;
    hintText.classList.remove('hidden');
    hintBtn.disabled = true;
    hintBtn.textContent = '💡 HINT USED';
  };

  function handleAnswer(chosen) {
    if (state.answered) return;
    state.answered = true;

    const q       = state.questions[state.current];
    const correct = chosen === q.ans;
    const opts    = document.querySelectorAll('.quiz-option');
    const fb      = document.getElementById('qFeedback');

    opts.forEach(btn => btn.disabled = true);
    opts[q.ans].classList.add('correct');

    if (correct) {
      opts[chosen].classList.add('correct');
      const pts       = state.hintUsed ? Math.max(0, PTS[state.level] - HINT_COST) : PTS[state.level];
      state.totalScore   += pts;
      state.totalCorrect += 1;
      state.roundCorrect += 1;
      state.roundPts     += pts;
      state.streak       += 1;
      fb.textContent = `✅ CORRECT! +${pts} pts — ${q.explain}`;
      fb.className   = 'quiz-feedback show right';
    } else {
      opts[chosen].classList.add('wrong');
      state.streak = 0;
      fb.textContent = `❌ WRONG — Correct: ${q.opts[q.ans]}. ${q.explain}`;
      fb.className   = 'quiz-feedback show wrong';
    }

    updateScoreboard();

    setTimeout(() => {
      state.current++;
      if (state.current < state.questions.length) {
        renderQuestion();
      } else {
        showResults();
      }
    }, 2400);
  }

  function showResults() {
    const total = state.questions.length;
    const pct   = state.roundCorrect / total;

    let grade, title, msg;
    if (pct === 1)        { grade = 'S';  title = 'PERFECT SCORE';     msg = 'Flawless. You are the machine. Proceed to the next level.'; }
    else if (pct >= 0.87) { grade = 'A+'; title = 'ELITE PERFORMANCE'; msg = 'Outstanding. Nearly flawless. One more push for perfection.'; }
    else if (pct >= 0.75) { grade = 'A';  title = 'EXCELLENT WORK';    msg = 'Strong performance. A few gaps remain — review your mistakes.'; }
    else if (pct >= 0.62) { grade = 'B';  title = 'SOLID EFFORT';      msg = 'Good foundation, but some concepts need reinforcement. Review the lessons.'; }
    else if (pct >= 0.50) { grade = 'C';  title = 'PASSING GRADE';     msg = 'You know the basics. Revisit the material and retry to improve.'; }
    else                  { grade = 'F';  title = 'ACCESS DENIED';     msg = 'Return to the lessons and study before retrying. Every expert was once a beginner.'; }

    document.getElementById('resultGrade').textContent = grade;
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('r-correct').textContent   = state.roundCorrect;
    document.getElementById('r-total').textContent     = total;
    document.getElementById('r-pts').textContent       = state.roundPts;
    document.getElementById('resultMsg').textContent   = msg;

    const gradeEl = document.getElementById('resultGrade');
    if (pct >= 0.87)      gradeEl.style.color = 'var(--green)';
    else if (pct >= 0.62) gradeEl.style.color = 'var(--intermediate)';
    else                  gradeEl.style.color = 'var(--advanced)';

    const saveMsg = document.getElementById('resultSaveMsg');
    if (saveMsg) saveMsg.classList.add('hidden');

    if (window._cbLoggedIn && window._cbToken) {
      fetch(`${window._cbApiBase || 'http://localhost:3001'}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + window._cbToken },
        body: JSON.stringify({ level: state.level, score: state.roundPts, correct: state.roundCorrect, total }),
      }).then(() => {
        if (saveMsg) saveMsg.classList.remove('hidden');
        loadLeaderboard(state.level, null);
      }).catch(() => {});
    }

    showScreen('quiz-results');
  }

  function showScreen(id) {
    document.querySelectorAll('.quiz-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  updateScoreboard();
  applyGating(false);
})();
