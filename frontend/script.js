// ===== CONFIGURAÇÕES GLOBAIS =====
// ===== CONFIGURAÇÕES GLOBAIS =====

// 1) Compatibilidade com chave antiga: se existir automarkt_api (com /generate),
//    converte para base e guarda em automarkt_api_base.
(() => {
  const legacy = localStorage.getItem('automarkt_api');
  if (legacy && /\/generate\/?$/.test(legacy)) {
    const base = legacy.replace(/\/generate\/?$/, '');
    localStorage.setItem('automarkt_api_base', base);
  }
})();

// 2) Define base de API preferindo o que estiver salvo; se estiver no GitHub Pages,
//    usa por padrão o Space do HF; localmente usa 127.0.0.1.
const DEFAULT_BASE = (() => {
  const saved = (localStorage.getItem('automarkt_api_base') || '').trim();
  if (saved) return saved;

  const onPages = location.hostname.endsWith('github.io');
  return onPages
    ? 'https://ViniciusKhan-automarkt-backend.hf.space'  // <- seu Space
    : 'http://127.0.0.1:8000';
})();

// 3) Normaliza e deriva endpoints.
const API_BASE   = DEFAULT_BASE.replace(/\/+$/, '');
const API_URL    = `${API_BASE}/generate`;
const HEALTH_URL = `${API_BASE}/health`;

// 4) Expõe config global.
const CONFIG = {
  API_BASE,
  API_URL,
  HEALTH_URL,
  SPLASH_DURATION: 4000,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 4000
};

// 5) (Opcional) atualiza rótulos na UI se existirem.
document.getElementById('backend-url')?.textContent = CONFIG.API_URL;
document.getElementById('api-state')?.replaceChildren?.(document.createTextNode('ok'));





// ===== ESTADO GLOBAL =====
let state = {
    isLoading: false,
    lastGeneratedContent: '',
    currentProvider: 'groq',
    currentModel: 'llama-3.3-70b-versatile',
    apiStatus: 'checking'
};

// ===== UTILITÁRIOS =====
const $  = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

// ===== SISTEMA DE TOAST =====
class ToastManager {
    constructor() {
        this.container = $('.toast-container');
        if (!this.container) {
            // cria o container se não existir no HTML
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toast-container';
            document.body.appendChild(this.container);
        }
        this.toasts = new Set();
    }

    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);
        this.toasts.add(toast);

        // Auto remove
        const timer = setTimeout(() => this.remove(toast), duration);

        // Click to remove
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            this.remove(toast);
        });

        return toast;
    }

    remove(toast) {
        if (this.toasts.has(toast)) {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => {
                toast?.parentNode?.removeChild(toast);
                this.toasts.delete(toast);
            }, 300);
        }
    }

    success(msg){ return this.show(msg, 'success'); }
    error(msg){ return this.show(msg, 'error'); }
    warning(msg){ return this.show(msg, 'warning'); }
    info(msg){ return this.show(msg, 'info'); }
}
const toast = new ToastManager();

// ===== ANIMAÇÃO DE SPLASH SCREEN =====
class SplashScreen {
    constructor() {
        this.element      = $('#splash-screen');
        this.progressFill = $('.progress-fill');
        this.progressText = $('.progress-text');
        this.logoImage    = $('.logo-image');
        this.splashTitle  = $('.splash-title');
        if (this.element) this.init();
    }

    init() {
        this.animateProgress();
        this.animateLogo();
        setTimeout(() => this.hide(), CONFIG.SPLASH_DURATION);
    }

    animateProgress() {
        if (!this.progressFill || !this.progressText) return;
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 12 + 3;
            if (progress >= 100) { progress = 100; clearInterval(interval); }
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `${Math.floor(progress)}%`;
        }, 150);
    }

    animateLogo() {
        if (typeof gsap === 'undefined') return;
        if (this.logoImage) {
            gsap.from(this.logoImage, {
                duration: 1, scale: 0, rotation: 180, ease: "back.out(1.7)"
            });
        }
        if (this.splashTitle) {
            gsap.from(this.splashTitle, {
                duration: 1, y: 50, opacity: 0, ease: "power2.out", delay: 0.5
            });
        }
    }

    hide() {
        if (!this.element) return;
        if (typeof gsap !== 'undefined') {
            gsap.to(this.element, {
                duration: 1, opacity: 0, scale: 1.1, ease: "power2.inOut",
                onComplete: () => {
                    this.element.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    this.onComplete();
                }
            });
        } else {
            this.element.style.transition = 'opacity 1s ease';
            this.element.style.opacity = '0';
            setTimeout(() => {
                this.element.style.display = 'none';
                document.body.style.overflow = 'auto';
                this.onComplete();
            }, 1000);
        }
    }

    onComplete() {
        if (typeof gsap !== 'undefined') {
            gsap.from('.main-header',   { duration: 0.8, y: -50, opacity: 0, ease: "power2.out" });
            gsap.from('.control-panel', { duration: 0.8, x: -50, opacity: 0, ease: "power2.out", delay: 0.2 });
            gsap.from('.output-panel',  { duration: 0.8, x:  50, opacity: 0, ease: "power2.out", delay: 0.4 });
        }
        toast.success('Sistema AutoMarkt AI inicializado com sucesso!');
    }
}

// ===== EFEITOS DE FUNDO COM CANVAS =====
class BackgroundEffects {
    constructor() {
        this.canvas = $('#bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const count = Math.min(80, window.innerWidth / 15);
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.6 + 0.2,
                color: Math.random() > 0.5 ? '#00d4ff' : '#8b5cf6',
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX; this.mouse.y = e.clientY;
        });
    }

    animate() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.pulse += 0.02;

            // Interação mouse
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                p.vx += dx * force * 0.002;
                p.vy += dy * force * 0.002;
            }

            // Wrap
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // Atrito
            p.vx *= 0.99; p.vy *= 0.99;

            // Desenho
            const s = p.size + Math.sin(p.pulse) * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            // Linhas
            for (let j = i + 1; j < this.particles.length; j++) {
                const o = this.particles[j];
                const ddx = p.x - o.x;
                const ddy = p.y - o.y;
                const d = Math.hypot(ddx, ddy);
                if (d < 100) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (100 - d) / 100 * 0.3;
                    this.ctx.strokeStyle = p.color;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(o.x, o.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ===== GERENCIADOR DE FORMULÁRIO =====
class FormManager {
    constructor() {
        this.form = $('#content-form');
        this.elements = {
            tema: $('#tema'),
            tipo: $('#tipo'),
            idioma: $('#idioma'),
            tom: $('#tom'),
            objetivo: $('#objetivo'),
            plataforma: $('#plataforma'),
            publico: $('#publico'),
            comprimento_texto: $('#comprimento_texto'),
            keywords: $('#keywords'),
            cta: $('#cta'),
            hashtags: $('#hashtags'),
            emojis: $('#emojis'),
            provider: $('#provider'),
            model: $('#model'),
            maxTokens: $('#max-tokens'),
            temperature: $('#temperature')
        };
        if (this.form) this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
        this.setupValidation();
        this.setupToggles();
    }

    bindEvents() {
        Object.values(this.elements).forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(() => this.saveData(), 500));
            }
        });

        if (this.elements.temperature) {
            this.elements.temperature.addEventListener('input', (e) => {
                const out = $('.slider-value'); if (out) out.textContent = e.target.value;
            });
        }

        if (this.elements.provider) {
            this.elements.provider.addEventListener('change', (e) => this.updateModelOptions(e.target.value));
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            window.app?.generate();
        });
    }

    setupToggles() {
        $('#advanced-toggle')?.addEventListener('click', () => this.toggleSection('advanced-content', 'advanced-toggle'));
        $('#ai-toggle')?.addEventListener('click', () => this.toggleSection('ai-content', 'ai-toggle'));
    }

    toggleSection(contentId, toggleId) {
        const content = $(`#${contentId}`);
        const toggle  = $(`#${toggleId}`);
        content?.classList.toggle('expanded');
        toggle?.classList.toggle('active');
    }

    updateModelOptions(provider) {
        const modelInput = this.elements.model;
        const models = {
            groq: 'llama-3.3-70b-versatile',
            openai: 'gpt-4o-mini',
            hf: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
        };
        if (modelInput) modelInput.placeholder = models[provider] || 'Modelo padrão';
        state.currentProvider = provider;
        state.currentModel = models[provider];
    }

    setupValidation() {
        this.elements.tema?.addEventListener('input', (e) => {
            const v = e.target.value.trim();
            const wrap = e.target.closest('.input-wrapper');
            if (!wrap) return;
            if (v.length < 3) wrap.classList.add('error'); else wrap.classList.remove('error');
        });

        this.elements.maxTokens?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            if (v < 50 || v > 2048) e.target.setCustomValidity('Tokens deve estar entre 50 e 2048');
            else e.target.setCustomValidity('');
        });
    }

    saveData() {
        const data = {};
        Object.keys(this.elements).forEach(k => {
            const input = this.elements[k];
            if (input) data[k] = input.type === 'checkbox' ? input.checked : input.value;
        });
        localStorage.setItem('automarkt_form_data', JSON.stringify(data));
    }

    loadSavedData() {
        const saved = localStorage.getItem('automarkt_form_data');
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(k => {
                const input = this.elements[k];
                if (!input) return;
                if (input.type === 'checkbox') input.checked = data[k]; else input.value = data[k];
            });
            if (this.elements.temperature) {
                const v = this.elements.temperature.value;
                const out = $('.slider-value'); if (out) out.textContent = v;
            }
        } catch (e) {
            console.warn('Erro ao carregar dados salvos:', e);
        }
    }

    getData() {
        const data = {};
        Object.keys(this.elements).forEach(k => {
            const input = this.elements[k];
            if (input) data[k] = input.type === 'checkbox' ? input.checked : input.value;
        });
        return data;
    }

    reset() {
        Object.values(this.elements).forEach(input => {
            if (!input) return;
            if (input.type === 'checkbox') input.checked = false; else input.value = '';
        });
        this.elements.objetivo.value = 'conversao';
        this.elements.cta.checked = true;
        this.elements.hashtags.checked = true;
        this.elements.provider.value = 'groq';
        this.elements.maxTokens.value = '512';
        this.elements.temperature.value = '0.7';
        this.elements.publico.value = 'decisores B2B';
        this.elements.comprimento_texto.value = 'médio';
        const out = $('.slider-value'); if (out) out.textContent = '0.7';

        localStorage.removeItem('automarkt_form_data');
        toast.info('Formulário resetado com sucesso');
    }
}

// ===== GERENCIADOR DE API =====
class APIManager {
    constructor() {
        this.baseURL  = CONFIG.API_URL;
        this.healthURL = CONFIG.HEALTH_URL;
    }

    async generate(data) {
        const payload = {
            provider: data.provider || 'groq',
            model: data.model || null,
            tema: data.tema,
            tipo: data.tipo,
            idioma: data.idioma,
            tom: data.tom,
            objetivo: data.objetivo,
            plataforma: data.plataforma,
            publico: data.publico || 'geral',
            comprimento_texto: data.comprimento_texto || 'médio',
            incluir_cta: data.cta,
            incluir_hashtags: data.hashtags,
            incluir_emojis: data.emojis,
            keywords: data.keywords,
            max_tokens: parseInt(data.maxTokens, 10) || 512,
            temperature: parseFloat(data.temperature) || 0.7
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const dataRaw = await response.json().catch(() => ({}));
            if (!response.ok) {
                const msg = dataRaw.detail || dataRaw.error || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(msg);
            }

            const norm = {};
            norm.text =
                dataRaw.text ??
                dataRaw.content ??
                dataRaw.message ??
                dataRaw.result ??
                (Array.isArray(dataRaw.choices) && dataRaw.choices[0]?.message?.content) ??
                (Array.isArray(dataRaw.choices) && dataRaw.choices[0]?.text) ??
                '';

            norm.tokens =
                dataRaw.tokens ??
                dataRaw.usage?.total_tokens ??
                dataRaw.usage?.output_tokens ??
                dataRaw.usage?.completion_tokens ??
                null;

            return norm;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(this.healthURL, { method: 'GET', signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                return { online: true, providerReady: !!data.provider_ready };
            }
            return { online: false, providerReady: false };
        } catch (error) {
            console.warn('Erro ao testar conexão:', error);
            return { online: false, providerReady: false };
        }
    }
}

// ===== GERENCIADOR DE OUTPUT =====
class OutputManager {
    constructor() {
        this.placeholder    = $('#output-placeholder');
        this.result         = $('#output-result');
        this.content        = $('#result-content');
        this.generationTime = $('#generation-time');
        this.tokenCount     = $('#token-count');
        this.modelUsed      = $('#model-used');
    }

    showPlaceholder() {
        try {
            if (this.placeholder) this.placeholder.style.display = 'block';
            if (this.result) {
                this.result.style.display = 'none';
                this.result.classList.remove('visible', 'hidden', 'is-hidden', 'collapsed');
            }
            if (this.content) this.content.classList.remove('visible', 'hidden', 'is-hidden', 'collapsed');
        } catch (_) {}
        state.lastGeneratedContent = '';
    }

    showResult(data, metadata = {}) {
        const texto = (data ?? '').toString();

        // Alterna placeholder/result
        try {
            if (this.placeholder) this.placeholder.style.display = 'none';
            if (this.result) {
                this.result.style.display = 'block';
                this.result.classList.add('visible');
            }
        } catch (_) {}

        // Metadados
        try {
            if (this.generationTime) this.generationTime.textContent = metadata.time || new Date().toLocaleTimeString();
            if (this.tokenCount)     this.tokenCount.textContent     = metadata.tokens || '--';
            if (this.modelUsed)      this.modelUsed.textContent      = metadata.model || state.currentModel;
        } catch (_) {}

        // Renderização
        try {
            if (this.content) {
                if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                    this.content.innerHTML = marked.parse(texto);
                } else {
                    this.content.innerHTML = texto.replace(/\n/g, '<br>');
                }
            }
        } catch (e) {
            console.error('Falha ao renderizar o conteúdo:', e);
            if (this.content) this.content.textContent = texto;
        }

        // Forçar visibilidade
        try {
            if (this.result) {
                this.result.style.removeProperty('display');
                this.result.style.display    = 'block';
                this.result.style.opacity    = '1';
                this.result.style.visibility = 'visible';
                const panelContent = this.result.closest('.panel-content') || this.result.parentElement;
                if (panelContent) {
                    panelContent.style.removeProperty('height');
                    panelContent.style.removeProperty('max-height');
                    panelContent.style.overflow = 'auto';
                }
            }

            if (this.content) {
                this.content.style.removeProperty('height');
                this.content.style.removeProperty('max-height');
                this.content.style.overflow    = 'auto';
                this.content.style.whiteSpace  = 'normal';
                this.content.style.opacity     = '1';
                this.content.style.visibility  = 'visible';
                this.content.classList.remove('hidden', 'is-hidden', 'collapsed');
                this.content.classList.add('visible');
            }
        } catch (_) {}

        // Animação
        try {
            if (typeof gsap !== 'undefined' && this.result) {
                gsap.from(this.result, { duration: 0.5, y: 20, opacity: 0, ease: "power2.out" });
            }
        } catch (_) {}

        state.lastGeneratedContent = texto;

        if (localStorage.getItem('automarkt_debug') === 'true' && this.result) {
            console.log('[Output] ok | len=', texto.length, '| display=', getComputedStyle(this.result).display);
        }
    }

    clear() { this.showPlaceholder(); }
}

// ===== SISTEMA DE STATUS =====
class StatusManager {
    constructor() {
        this.apiStatus = $('#api-status');
        this.apiLabel  = $('#api-label');
        this.gpuStatus = $('#gpu-status');
        this.gpuLabel  = $('#gpu-label');
        this.init();
    }

    init() {
        this.checkGPU();
        this.checkAPI();
        setInterval(() => this.checkAPI(), 30000);
    }

    checkGPU() {
        const hasWebGPU = !!navigator.gpu;
        const hasWebGL  = !!document.createElement('canvas').getContext('webgl');

        if (this.gpuStatus && this.gpuLabel) {
            if (hasWebGPU) {
                this.gpuStatus.className = 'status-dot status-online';
                this.gpuLabel.textContent = 'WebGPU Disponível';
            } else if (hasWebGL) {
                this.gpuStatus.className = 'status-dot status-api';
                this.gpuLabel.textContent = 'WebGL Disponível';
            } else {
                this.gpuStatus.className = 'status-dot status-warning';
                this.gpuLabel.textContent = 'CPU Only';
            }
        }
    }

    async checkAPI() {
        try {
            if (this.apiLabel) this.apiLabel.textContent = 'Verificando API...';
            if (this.apiStatus) this.apiStatus.className  = 'status-dot status-warning';

            const api = new APIManager();
            const status = await api.testConnection();

            if (status.online && status.providerReady) {
                if (this.apiStatus) this.apiStatus.className = 'status-dot status-online';
                if (this.apiLabel)  this.apiLabel.textContent = 'API Online';
                state.apiStatus = 'online';
            } else if (status.online) {
                if (this.apiStatus) this.apiStatus.className = 'status-dot status-warning';
                if (this.apiLabel)  this.apiLabel.textContent = 'API sem provedor';
                state.apiStatus = 'no-provider';
            } else {
                if (this.apiStatus) this.apiStatus.className = 'status-dot status-error';
                if (this.apiLabel)  this.apiLabel.textContent = 'API Offline';
                state.apiStatus = 'offline';
            }
        } catch (e) {
            if (this.apiStatus) this.apiStatus.className = 'status-dot status-error';
            if (this.apiLabel)  this.apiLabel.textContent = 'API Offline';
            state.apiStatus = 'offline';
        }
    }
}

// ===== GERENCIADOR PRINCIPAL =====
class App {
    constructor() {
        this.formManager   = new FormManager();
        this.apiManager    = new APIManager();
        this.outputManager = new OutputManager();
        this.statusManager = new StatusManager();
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardShortcuts();
        setTimeout(() => new BackgroundEffects(), CONFIG.SPLASH_DURATION + 1000);
    }

    bindEvents() {
        $('#copy-md-btn')?.addEventListener('click', () => {
            this.copyToClipboard(state.lastGeneratedContent, 'Markdown copiado para a área de transferência!');
        });

        $('#copy-html-btn')?.addEventListener('click', () => {
            if (!state.lastGeneratedContent) {
                toast.warning('Nenhum conteúdo para copiar'); return;
            }
            let html;
            try {
                if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                    html = marked.parse(state.lastGeneratedContent);
                } else {
                    html = state.lastGeneratedContent.replace(/\n/g, '<br>');
                }
            } catch { html = state.lastGeneratedContent; }
            this.copyToClipboard(html, 'HTML copiado para a área de transferência!');
        });

        $('#download-btn')?.addEventListener('click', () => this.downloadContent());
        $('#clear-btn')?.addEventListener('click',   () => this.clear());
        $('#reset-btn')?.addEventListener('click',   () => this.formManager.reset());
        $('#fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());
        $('#save-preset-btn')?.addEventListener('click', () => this.savePreset());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault(); this.generate();
            }
            if (e.key === 'Escape') {
                const outputPanel = $('.output-panel');
                if (outputPanel?.classList.contains('fullscreen')) this.toggleFullscreen();
                else this.clear();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
                e.preventDefault(); this.formManager.reset();
            }
        });
    }

    async generate() {
        if (state.isLoading) return;

        const formData = this.formManager.getData();
        const tema = (formData?.tema || '').trim();
        if (tema.length < 3) {
            toast.error('Insira um tema válido (mín. 3 caracteres).');
            $('#tema')?.focus();
            return;
        }

        state.isLoading = true;
        this.showLoading();

        try {
            if (state.apiStatus === 'offline') {
                throw new Error('API offline. Verifique a URL e o backend.');
            }
            if (state.apiStatus === 'no-provider') {
                toast.warning('API online, mas sem provedor configurado.');
            }

            const t0 = Date.now();
            const { text, tokens } = await this.apiManager.generate(formData);
            const t1 = Date.now();

            const conteudo = (text ?? '').toString().trim();
            if (!conteudo) throw new Error('Resposta sem conteúdo (campo "text" vazio/nulo).');

            this.outputManager.showResult(conteudo, {
                time: `${((t1 - t0) / 1000).toFixed(1)}s`,
                tokens: tokens ?? this.estimateTokens(conteudo),
                model: formData.model || state.currentModel
            });

            toast.success('Conteúdo gerado com sucesso!');
        } catch (err) {
            console.error('[generate] erro:', err);
            const msg = String(err?.message || 'Falha desconhecida');

            if (/Failed to fetch|NetworkError|TypeError: Failed to fetch/i.test(msg)) {
                toast.error('Rede/CORS: verifique backend, URL (localStorage "automarkt_api") e CORS.');
            } else if (/CORS|Access-Control-Allow-Origin/i.test(msg)) {
                toast.error('CORS bloqueado: habilite CORSMiddleware no backend (origem do front).');
            } else if (/timeout|timed out|abort/i.test(msg)) {
                toast.error('Timeout: confirme se /generate responde em <= 10s.');
            } else if (/JSON|Unexpected token|parse/i.test(msg)) {
                toast.error('JSON inválido: backend deve responder JSON com campo "text".');
            } else {
                toast.error(`Erro: ${msg}`);
            }

            this.outputManager.clear();
        } finally {
            state.isLoading = false;
            this.hideLoading();
        }
    }

    estimateTokens(text) {
        // ~4 chars por token é uma aproximação razoável
        return Math.max(1, Math.ceil(text.length / 4));
    }

    showLoading() {
        const loadingSection = $('#loading-section');
        const generateBtn    = $('#generate-btn');
        if (loadingSection) loadingSection.style.display = 'block';
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.6';
        }
        if (typeof gsap !== 'undefined' && loadingSection) {
            gsap.from(loadingSection, { duration: 0.3, y: 10, opacity: 0, ease: "power2.out" });
        }
    }

    hideLoading() {
        const loadingSection = $('#loading-section');
        const generateBtn    = $('#generate-btn');

        if (typeof gsap !== 'undefined' && loadingSection) {
            gsap.to(loadingSection, {
                duration: 0.3, y: -10, opacity: 0, ease: "power2.in",
                onComplete: () => { loadingSection.style.display = 'none'; loadingSection.style.opacity = '1'; }
            });
        } else if (loadingSection) {
            loadingSection.style.display = 'none';
        }

        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        }
    }

    async copyToClipboard(text, successMessage) {
        if (!text) { toast.warning('Nenhum conteúdo para copiar'); return; }
        try {
            await navigator.clipboard.writeText(text);
            toast.success(successMessage);
        } catch (error) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy');
            document.body.removeChild(ta);
            toast.success(successMessage);
        }
    }

    downloadContent() {
        if (!state.lastGeneratedContent) { toast.warning('Nenhum conteúdo para baixar'); return; }
        const blob = new Blob([state.lastGeneratedContent], { type: 'text/markdown' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `automarkt-content-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download iniciado!');
    }

    clear() {
        this.outputManager.clear();
        toast.info('Resultado limpo');
    }

    toggleFullscreen() {
        const outputPanel = $('.output-panel');
        outputPanel?.classList.toggle('fullscreen');
        if (outputPanel?.classList.contains('fullscreen')) toast.info('Modo tela cheia ativado (ESC para sair)');
        else toast.info('Modo tela cheia desativado');
    }

    savePreset() {
        const formData = this.formManager.getData();
        const presetName = prompt('Nome do preset:');
        if (!presetName) return;
        const presets = JSON.parse(localStorage.getItem('automarkt_presets') || '{}');
        presets[presetName] = formData;
        localStorage.setItem('automarkt_presets', JSON.stringify(presets));
        toast.success(`Preset "${presetName}" salvo com sucesso!`);
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    // Splash
    new SplashScreen();

    // Fail-safe para splash
    setTimeout(() => {
        const sp = document.getElementById('splash-screen');
        if (sp && sp.style.display !== 'none') {
            sp.style.display = 'none';
            document.body.style.overflow = 'auto';
            if (localStorage.getItem('automarkt_debug') === 'true') {
                console.warn('[Splash] Fail-safe applied (forçou hide)');
            }
        }
    }, CONFIG.SPLASH_DURATION + 2000);

    // App
    window.app = new App();

    // Debug
    if (localStorage.getItem('automarkt_debug') === 'true') {
        window.debug = { state, CONFIG, toast, app: window.app };
        console.log('🚀 AutoMarkt AI Debug Mode Ativado');
        console.log('Use window.debug para acessar objetos internos');
    }
});

// ===== TRATAMENTO DE ERROS GLOBAIS =====
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
    toast.error('Ocorreu um erro inesperado. Verifique o console para mais detalhes.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
    toast.error('Erro de conexão ou processamento. Tente novamente.');
});

// ===== PERFORMANCE MONITORING =====
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                const loadTime = nav.loadEventEnd - nav.loadEventStart;
                if (loadTime > 3000) console.warn(`Carregamento lento detectado: ${loadTime}ms`);
                if (localStorage.getItem('automarkt_debug') === 'true') {
                    console.log(`Tempo de carregamento: ${loadTime}ms`);
                }
            }
        }, 0);
    });
}
