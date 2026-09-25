/* ==========================================================================
   AETHER // CORE ENGINE & APPLICATION CONTROLLER
   ========================================================================== */

// --- 1. Sound Synthesis Engine (Web Audio API) ---
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.ambientRunning = false;
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      // Audio fallback silent
    }
  }

  playChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.05, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    } catch (e) {}
  }

  toggleAmbient() {
    this.init();
    if (!this.ctx) return false;

    if (this.ambientRunning) {
      if (this.ambientGain) {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.ambientOsc) {
            this.ambientOsc.stop();
            this.ambientOsc.disconnect();
          }
        }, 500);
      }
      this.ambientRunning = false;
      return false;
    } else {
      this.ambientOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      this.ambientGain = this.ctx.createGain();

      this.ambientOsc.type = 'sawtooth';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.2);

      this.ambientOsc.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc.start();
      this.ambientRunning = true;
      return true;
    }
  }
}

const audio = new CyberAudioEngine();

// --- 2. Interactive Starfield Particle Canvas ---
class StarfieldCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 90;
    this.mouse = { x: -1000, y: -1000, radius: 140 };
    this.warpSpeed = 1;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.3
      });
    }

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  boost() {
    this.warpSpeed = 4.5;
    setTimeout(() => {
      this.warpSpeed = 1;
    }, 1200);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * this.warpSpeed;
      p.y += p.vy * this.warpSpeed;

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Mouse repulsion/interaction
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (1 - dist / this.mouse.radius) * 1.5;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 240, 255, ${p.baseAlpha})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Connect lines
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist2 < 110) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          const alpha = (1 - dist2 / 110) * 0.18;
          this.ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

// --- 3. Telemetry & FPS Counter ---
class TelemetryMonitor {
  constructor() {
    this.fpsElement = document.getElementById('stat-fps');
    this.latencyElement = document.getElementById('stat-latency');
    this.memoryElement = document.getElementById('stat-memory');
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.init();
  }

  init() {
    const loop = (now) => {
      this.frameCount++;
      if (now - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
        if (this.fpsElement) this.fpsElement.innerText = this.fps;
        this.frameCount = 0;
        this.lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Dynamic latency & memory simulation
    setInterval(() => {
      if (this.latencyElement) {
        const simulatedLatency = Math.floor(12 + Math.random() * 8);
        this.latencyElement.innerText = `${simulatedLatency}ms`;
      }
      if (this.memoryElement) {
        const mem = (1.42 + Math.random() * 0.08).toFixed(2);
        this.memoryElement.innerText = `${mem} GB`;
      }
    }, 2500);

    // Sparklines generator
    this.drawSparklines();
  }

  drawSparklines() {
    const canvases = document.querySelectorAll('.sparkline-canvas');
    canvases.forEach((c) => {
      const ctx = c.getContext('2d');
      const w = c.width;
      const h = c.height;
      const points = [];
      for (let i = 0; i <= 20; i++) {
        points.push(Math.random() * (h - 10) + 5);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      const step = w / (points.length - 1);
      points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(0, p);
        else ctx.lineTo(idx * step, p);
      });
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00f0ff';
      ctx.stroke();
    });
  }
}

// --- 4. Task Matrix (Kanban) Engine ---
class TaskMatrix {
  constructor() {
    this.storageKey = 'aether_kanban_tasks';
    this.tasks = this.loadTasks();
    this.init();
  }

  loadTasks() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: '1', title: 'Initialize Quantum Neural Shards', status: 'done', priority: 'high', date: 'Today' },
      { id: '2', title: 'Synthesize Audio Subsystem & FX', status: 'done', priority: 'med', date: 'Today' },
      { id: '3', title: 'Refactor Vector Token Memory Index', status: 'progress', priority: 'high', date: 'In Flight' },
      { id: '4', title: 'Train Agent Diagnostic Auto-Healer', status: 'review', priority: 'med', date: 'Pending' },
      { id: '5', title: 'Deploy Holographic Command Gateway', status: 'todo', priority: 'low', date: 'Next' }
    ];
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    this.render();
  }

  init() {
    this.render();

    // New task modal trigger
    const addTaskBtn = document.getElementById('btn-add-task');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => this.promptNewTask());
    }
  }

  promptNewTask() {
    audio.playClick();
    const title = prompt('Enter Task Title for Agent Matrix:');
    if (!title || !title.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      status: 'todo',
      priority: 'high',
      date: 'Just now'
    };
    this.tasks.push(newTask);
    this.save();
    showToast(`Task "${title}" synchronized into Matrix!`);
  }

  deleteTask(id) {
    audio.playClick();
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
    showToast('Task removed from board.');
  }

  cycleStatus(id) {
    audio.playClick();
    const statuses = ['todo', 'progress', 'review', 'done'];
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      const nextIdx = (statuses.indexOf(task.status) + 1) % statuses.length;
      task.status = statuses[nextIdx];
      this.save();
      if (task.status === 'done') audio.playChime();
    }
  }

  render() {
    const cols = {
      todo: document.getElementById('list-todo'),
      progress: document.getElementById('list-progress'),
      review: document.getElementById('list-review'),
      done: document.getElementById('list-done')
    };

    // Clear lists
    Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });

    const counts = { todo: 0, progress: 0, review: 0, done: 0 };

    this.tasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      const targetCol = cols[task.status];
      if (!targetCol) return;

      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="task-priority priority-${task.priority}">${task.priority}</span>
          <button style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:14px;" title="Delete Task" onclick="window.appTaskMatrix.deleteTask('${task.id}')">✕</button>
        </div>
        <div class="task-title">${escapeHTML(task.title)}</div>
        <div class="task-footer">
          <span>📅 ${task.date}</span>
          <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.7rem; border-radius: 4px;" onclick="window.appTaskMatrix.cycleStatus('${task.id}')">Advance ➔</button>
        </div>
      `;
      targetCol.appendChild(card);
    });

    // Update counts
    for (const [key, count] of Object.entries(counts)) {
      const el = document.getElementById(`count-${key}`);
      if (el) el.innerText = count;
    }
  }
}

// --- 5. Cyber Code Playground ---
class CodePlayground {
  constructor() {
    this.textarea = document.getElementById('code-input');
    this.iframe = document.getElementById('preview-frame');
    this.runBtn = document.getElementById('btn-run-code');
    this.resetBtn = document.getElementById('btn-reset-code');
    this.init();
  }

  init() {
    if (!this.textarea || !this.iframe) return;

    this.defaultCode = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 30px;
      font-family: 'Outfit', sans-serif, system-ui;
      background: #070b19;
      color: #00f0ff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 80vh;
      text-align: center;
    }
    .orb {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #00f0ff, #8b5cf6);
      box-shadow: 0 0 40px rgba(0, 240, 255, 0.7);
      animation: pulse 2.5s infinite alternate ease-in-out;
      margin-bottom: 24px;
    }
    @keyframes pulse {
      0% { transform: scale(0.9) rotate(0deg); }
      100% { transform: scale(1.15) rotate(180deg); }
    }
    h2 { margin: 0 0 8px 0; color: #fff; letter-spacing: 1px; }
    p { color: #94a3b8; font-size: 14px; max-width: 320px; line-height: 1.5; }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(0,240,255,0.1);
      border: 1px solid rgba(0,240,255,0.4);
      border-radius: 20px;
      font-size: 12px;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="orb"></div>
  <h2>AETHER CYBER MODULE</h2>
  <p>Live sandbox executing safely inside virtual runtime environment.</p>
  <div class="badge">SYS-STATUS: OPTIMAL</div>
</body>
</html>`;

    this.textarea.value = this.defaultCode;
    this.updatePreview();

    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => {
        audio.playChime();
        this.updatePreview();
        showToast('Sandbox code compiled & rendered!');
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        audio.playClick();
        this.textarea.value = this.defaultCode;
        this.updatePreview();
        showToast('Code sandbox reset to default template.');
      });
    }

    this.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.updatePreview();
        audio.playChime();
        showToast('Live preview updated!');
      }
    });
  }

  updatePreview() {
    const code = this.textarea.value;
    this.iframe.srcdoc = code;
  }
}

// --- 6. Neural Prompt Lab ---
class PromptLab {
  constructor() {
    this.promptInput = document.getElementById('prompt-input');
    this.tokenDisplay = document.getElementById('token-count');
    this.presetSelect = document.getElementById('prompt-preset');
    this.enhanceBtn = document.getElementById('btn-enhance-prompt');
    this.init();
  }

  init() {
    if (!this.promptInput) return;

    this.promptInput.addEventListener('input', () => {
      const text = this.promptInput.value;
      const tokens = Math.ceil(text.length / 3.8);
      if (this.tokenDisplay) this.tokenDisplay.innerText = `${tokens} Tokens (est)`;
    });

    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        audio.playClick();
        const presets = {
          architect: "Act as a Principal Software Architect. Design a modular, high-scale microservices architecture for a real-time event streaming pipeline, incorporating fault tolerance and edge caching.",
          debugger: "You are an elite systems engineer. Thoroughly profile this code snippet for memory leaks, async race conditions, and asymptotic complexity bottlenecks.",
          refactor: "Refactor this component to follow clean architecture principles, modern ECMAScript idioms, strict type consistency, and zero redundant re-renders.",
          creative: "Generate a state-of-the-art sci-fi cyberpunk user interface layout with high-impact color contrast, micro-interactions, and glassmorphic aesthetic."
        };
        const val = e.target.value;
        if (presets[val]) {
          this.promptInput.value = presets[val];
          this.promptInput.dispatchEvent(new Event('input'));
        }
      });
    }

    if (this.enhanceBtn) {
      this.enhanceBtn.addEventListener('click', () => {
        audio.playChime();
        const current = this.promptInput.value;
        if (!current.trim()) {
          showToast('Enter a prompt first before neural enhancement!');
          return;
        }
        this.promptInput.value = `[OPTIMIZED FOR AGENT REASONING]\n\nContext & Objective:\n${current}\n\nConstraints:\n- Deliver production-ready code with complete error handling.\n- Implement modern aesthetic standards and modular isolation.\n- Provide concise architectural commentary without fluff.`;
        this.promptInput.dispatchEvent(new Event('input'));
        showToast('Prompt enhanced with Agent Reasoning parameters!');
      });
    }
  }
}

// --- 7. Focus Chrono (Pomodoro) ---
class FocusChrono {
  constructor() {
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = this.totalSeconds;
    this.timer = null;
    this.isRunning = false;

    this.display = document.getElementById('chrono-display');
    this.circle = document.getElementById('chrono-progress');
    this.startBtn = document.getElementById('chrono-start');
    this.resetBtn = document.getElementById('chrono-reset');

    this.init();
  }

  init() {
    if (!this.display || !this.circle) return;

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.toggle());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.reset());
    }

    this.updateUI();
  }

  toggle() {
    audio.playClick();
    if (this.isRunning) {
      clearInterval(this.timer);
      this.isRunning = false;
      this.startBtn.innerText = 'Resume Focus';
      showToast('Focus session paused.');
    } else {
      this.isRunning = true;
      this.startBtn.innerText = 'Pause Session';
      showToast('Neural focus session active. Deep work engaged.');
      this.timer = setInterval(() => {
        this.remainingSeconds--;
        if (this.remainingSeconds <= 0) {
          clearInterval(this.timer);
          this.isRunning = false;
          this.startBtn.innerText = 'Start Focus';
          audio.playChime();
          showToast('🎉 Focus Chrono Cycle Completed! Take a breather.');
        }
        this.updateUI();
      }, 1000);
    }
  }

  reset() {
    audio.playClick();
    clearInterval(this.timer);
    this.isRunning = false;
    this.remainingSeconds = this.totalSeconds;
    if (this.startBtn) this.startBtn.innerText = 'Start Focus';
    this.updateUI();
    showToast('Focus Chrono reset to 25:00.');
  }

  updateUI() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.display.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const totalCircumference = 754;
    const offset = totalCircumference - (this.remainingSeconds / this.totalSeconds) * totalCircumference;
    this.circle.style.strokeDashoffset = offset;
  }
}

// --- 8. Command Palette & Navigation Controller ---
function initAppNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('view-title');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      audio.playClick();
      const target = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      panes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `view-${target}`);
      });

      const titleMap = {
        'deck': '⚡ Mission Control & Command Deck',
        'tasks': '📋 Neural Task Matrix',
        'code': '💻 Cyber Code Sandbox',
        'prompt': '🧠 Neural Prompt Lab',
        'chrono': '⏱️ Cyber-Chrono Focus Station',
        'telemetry': '📊 System Telemetry & Quantum Core'
      };

      if (pageTitle && titleMap[target]) {
        pageTitle.innerText = titleMap[target];
      }
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      audio.enabled = !audio.enabled;
      soundBtn.classList.toggle('active', audio.enabled);
      soundBtn.title = audio.enabled ? 'Sound FX: ON' : 'Sound FX: OFF';
      audio.playClick();
      showToast(audio.enabled ? 'Audio Feedback Enabled' : 'Audio Feedback Muted');
    });
  }

  // Ambient Drone Toggle
  const ambientBtn = document.getElementById('btn-ambient-toggle');
  if (ambientBtn) {
    ambientBtn.addEventListener('click', () => {
      const active = audio.toggleAmbient();
      ambientBtn.classList.toggle('active', active);
      showToast(active ? 'Deep Space Ambient Drone: ENGAGED' : 'Ambient Drone: OFF');
    });
  }

  // Warp Speed Boost on logo click
  const logoWrapper = document.getElementById('brand-logo-btn');
  if (logoWrapper && window.starfield) {
    logoWrapper.addEventListener('click', () => {
      audio.playChime();
      window.starfield.boost();
      showToast('🚀 WARP SPEED ACCELERATION ENGAGED!');
    });
  }

  // Theme Switcher Cycle
  const themeBtn = document.getElementById('btn-theme-toggle');
  const themes = ['cyberpunk', 'emerald', 'solar', 'amethyst'];
  let currentThemeIdx = 0;
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      audio.playClick();
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      const theme = themes[currentThemeIdx];
      document.documentElement.setAttribute('data-theme', theme);
      showToast(`Interface Theme switched to: ${theme.toUpperCase()}`);
    });
  }

  // Command Palette
  const paletteModal = document.getElementById('command-palette-modal');
  const paletteInput = document.getElementById('palette-input');
  const searchTriggers = document.querySelectorAll('.search-trigger');

  function openPalette() {
    audio.playClick();
    paletteModal.classList.add('active');
    paletteInput.value = '';
    paletteInput.focus();
  }

  function closePalette() {
    paletteModal.classList.remove('active');
  }

  searchTriggers.forEach(btn => btn.addEventListener('click', openPalette));

  paletteModal.addEventListener('click', (e) => {
    if (e.target === paletteModal) closePalette();
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (paletteModal.classList.contains('active')) closePalette();
      else openPalette();
    }
    if (e.key === 'Escape' && paletteModal.classList.contains('active')) {
      closePalette();
    }
  });

  // Palette Actions
  const paletteItems = document.querySelectorAll('.palette-item');
  paletteItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      audio.playClick();
      closePalette();
      executePaletteAction(action);
    });
  });
}

function executePaletteAction(action) {
  if (action.startsWith('tab:')) {
    const tabName = action.split(':')[1];
    const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navBtn) navBtn.click();
  } else if (action === 'theme:cycle') {
    document.getElementById('btn-theme-toggle')?.click();
  } else if (action === 'task:new') {
    window.appTaskMatrix?.promptNewTask();
  } else if (action === 'starfield:boost') {
    window.starfield?.boost();
    audio.playChime();
    showToast('🚀 Quantum Jump Initialized!');
  } else if (action === 'system:diagnostics') {
    audio.playChime();
    showToast('✅ All subsystems operational. 0 faults detected.');
  }
}

// Utility: HTML Escaper
function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

// Toast System
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Live Simulated System Terminal Logs
function initTerminalStream() {
  const logBox = document.getElementById('cyber-terminal-logs');
  if (!logBox) return;

  const logMessages = [
    { type: 'info', msg: 'Kernel synced with cluster quantum state.' },
    { type: 'success', msg: 'Autonomous agent heartbeat acknowledged [200 OK].' },
    { type: 'ai', msg: 'Neural inference model weights loaded into VRAM cache.' },
    { type: 'warn', msg: 'Subtle anomaly detected in sector 7G — auto-corrected.' },
    { type: 'info', msg: 'Local workspace indexing complete: webs 1 active.' },
    { type: 'success', msg: 'Aether telemetry daemon running on ultra-low latency link.' }
  ];

  let idx = 0;
  setInterval(() => {
    const item = logMessages[idx % logMessages.length];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `
      <span class="terminal-time">[${timeStr}]</span>
      <span class="terminal-msg ${item.type}">➜ ${item.msg}</span>
    `;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
    idx++;
  }, 4200);
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.starfield = new StarfieldCanvas('starfield-canvas');
  window.appTelemetry = new TelemetryMonitor();
  window.appTaskMatrix = new TaskMatrix();
  window.appCodePlayground = new CodePlayground();
  window.appPromptLab = new PromptLab();
  window.appFocusChrono = new FocusChrono();

  initAppNavigation();
  initTerminalStream();

  console.log('AETHER // Cyber Command Deck initialized.');
});
