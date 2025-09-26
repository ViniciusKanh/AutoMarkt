// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
    API_URL: localStorage.getItem('automarkt_api') || 'http://127.0.0.1:8000/generate',
    HEALTH_URL: localStorage.getItem('automarkt_api') ? localStorage.getItem('automarkt_api').replace('/generate', '/health') : 'http://127.0.0.1:8000/health',
    SPLASH_DURATION: 4000,
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 4000
};

// ===== ESTADO GLOBAL =====
let state = {
    isLoading: false,
    lastGeneratedContent: '',
    currentProvider: 'groq',
    currentModel: 'llama-3.3-70b-versatile',
    apiStatus: 'checking'
};

// ===== UTILITÁRIOS =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

// ===== SISTEMA DE TOAST =====
class ToastManager {
    constructor() {
        this.container = $('.toast-container');
        this.toasts = new Set();
    }

    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.container.appendChild(toast);
        this.toasts.add(toast);

        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Click to remove
        toast.addEventListener('click', () => {
            this.remove(toast);
        });

        return toast;
    }

    remove(toast) {
        if (this.toasts.has(toast)) {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts.delete(toast);
            }, 300);
        }
    }

    success(message) {
        return this.show(message, 'success');
    }

    error(message) {
        return this.show(message, 'error');
    }

    warning(message) {
        return this.show(message, 'warning');
    }

    info(message) {
        return this.show(message, 'info');
    }
}

const toast = new ToastManager();

// ===== ANIMAÇÃO DE SPLASH SCREEN =====
class SplashScreen {
    constructor() {
        this.element = $('#splash-screen');
        this.progressFill = $('.progress-fill');
        this.progressText = $('.progress-text');
        this.logoImage = $('.logo-image');
        this.splashTitle = $('.splash-title');
        
        this.init();
    }

    init() {
        this.animateProgress();
        this.animateLogo();
        
        setTimeout(() => {
            this.hide();
        }, CONFIG.SPLASH_DURATION);
    }

    animateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 12 + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `${Math.floor(progress)}%`;
        }, 150);
    }

    animateLogo() {
        // Animação do logo usando GSAP se disponível
        if (typeof gsap !== 'undefined') {
            gsap.from(this.logoImage, {
                duration: 1,
                scale: 0,
                rotation: 180,
                ease: "back.out(1.7)"
            });

            gsap.from(this.splashTitle, {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: "power2.out",
                delay: 0.5
            });
        }
    }

    hide() {
        if (typeof gsap !== 'undefined') {
            gsap.to(this.element, {
                duration: 1,
                opacity: 0,
                scale: 1.1,
                ease: "power2.inOut",
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
        // Animar entrada dos elementos principais
        if (typeof gsap !== 'undefined') {
            gsap.from('.main-header', {
                duration: 0.8,
                y: -50,
                opacity: 0,
                ease: "power2.out"
            });

            gsap.from('.control-panel', {
                duration: 0.8,
                x: -50,
                opacity: 0,
                ease: "power2.out",
                delay: 0.2
            });

            gsap.from('.output-panel', {
                duration: 0.8,
                x: 50,
                opacity: 0,
                ease: "power2.out",
                delay: 0.4
            });
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const particleCount = Math.min(80, window.innerWidth / 15);
        
        for (let i = 0; i < particleCount; i++) {
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
        window.addEventListener('resize', () => {
            this.resize();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, index) => {
            // Atualizar posição
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.pulse += 0.02;

            // Interação com mouse
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                const force = (120 - distance) / 120;
                particle.vx += dx * force * 0.002;
                particle.vy += dy * force * 0.002;
            }

            // Limites da tela com wrap-around
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Aplicar atrito
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Desenhar partícula com efeito de pulso
            const pulseSize = particle.size + Math.sin(particle.pulse) * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            // Conectar partículas próximas
            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (100 - distance) / 100 * 0.3;
                    this.ctx.strokeStyle = particle.color;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(other.x, other.y);
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

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
        this.setupValidation();
        this.setupToggles();
    }

    bindEvents() {
        // Auto-save
        Object.values(this.elements).forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(() => {
                    this.saveData();
                }, 500));
            }
        });

        // Temperature slider
        if (this.elements.temperature) {
            this.elements.temperature.addEventListener('input', (e) => {
                $('.slider-value').textContent = e.target.value;
            });
        }

        // Provider change
        if (this.elements.provider) {
            this.elements.provider.addEventListener('change', (e) => {
                this.updateModelOptions(e.target.value);
            });
        }

        // Form submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            window.app.generate();
        });
    }

    setupToggles() {
        $('#advanced-toggle').addEventListener('click', () => {
            this.toggleSection('advanced-content', 'advanced-toggle');
        });

        $('#ai-toggle').addEventListener('click', () => {
            this.toggleSection('ai-content', 'ai-toggle');
        });
    }

    toggleSection(contentId, toggleId) {
        const content = $(`#${contentId}`);
        const toggle = $(`#${toggleId}`);
        
        content.classList.toggle('expanded');
        toggle.classList.toggle('active');
    }

    updateModelOptions(provider) {
        const modelInput = this.elements.model;
        const models = {
            groq: 'llama-3.3-70b-versatile',
            openai: 'gpt-4o-mini',
            hf: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
        };

        if (modelInput) {
            modelInput.placeholder = models[provider] || 'Modelo padrão';
        }

        state.currentProvider = provider;
        state.currentModel = models[provider];
    }

    setupValidation() {
        // Validação em tempo real do tema
        this.elements.tema.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            const wrapper = e.target.closest('.input-wrapper');
            
            if (value.length < 3) {
                wrapper.classList.add('error');
            } else {
                wrapper.classList.remove('error');
            }
        });

        // Validação de tokens
        this.elements.maxTokens.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 50 || value > 2048) {
                e.target.setCustomValidity('Tokens deve estar entre 50 e 2048');
            } else {
                e.target.setCustomValidity('');
            }
        });
    }

    saveData() {
        const data = {};
        Object.keys(this.elements).forEach(key => {
            const input = this.elements[key];
            if (input) {
                data[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        
        localStorage.setItem('automarkt_form_data', JSON.stringify(data));
    }

    loadSavedData() {
        const saved = localStorage.getItem('automarkt_form_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.keys(data).forEach(key => {
                    const input = this.elements[key];
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = data[key];
                        } else {
                            input.value = data[key];
                        }
                    }
                });
                
                // Atualizar slider value
                if (this.elements.temperature) {
                    $('.slider-value').textContent = this.elements.temperature.value;
                }
            } catch (e) {
                console.warn('Erro ao carregar dados salvos:', e);
            }
        }
    }

    getData() {
        const data = {};
        Object.keys(this.elements).forEach(key => {
            const input = this.elements[key];
            if (input) {
                data[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        return data;
    }

    reset() {
        Object.values(this.elements).forEach(input => {
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            }
        });
        
        // Valores padrão
        this.elements.objetivo.value = 'conversao';
        this.elements.cta.checked = true;
        this.elements.hashtags.checked = true;
        this.elements.provider.value = 'groq';
        this.elements.maxTokens.value = '512';
        this.elements.temperature.value = '0.7';
        this.elements.publico.value = 'decisores B2B';
        this.elements.comprimento_texto.value = 'médio';
        $('.slider-value').textContent = '0.7';
        
        localStorage.removeItem('automarkt_form_data');
        toast.info('Formulário resetado com sucesso');
    }
}

// ===== GERENCIADOR DE API =====
class APIManager {
    constructor() {
        this.baseURL = CONFIG.API_URL;
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
            max_tokens: parseInt(data.maxTokens) || 512,
            temperature: parseFloat(data.temperature) || 0.7
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(this.healthURL, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                return {
                    online: true,
                    providerReady: data.provider_ready || false
                };
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
        this.placeholder = $('#output-placeholder');
        this.result = $('#output-result');
        this.content = $('#result-content');
        this.generationTime = $('#generation-time');
        this.tokenCount = $('#token-count');
        this.modelUsed = $('#model-used');
    }

    showPlaceholder() {
        this.placeholder.style.display = 'block';
        this.result.style.display = 'none';
    }

    showResult(data, metadata = {}) {
        this.placeholder.style.display = 'none';
        this.result.style.display = 'block';

        // Atualizar metadados
        this.generationTime.textContent = metadata.time || new Date().toLocaleTimeString();
        this.tokenCount.textContent = metadata.tokens || '--';
        this.modelUsed.textContent = metadata.model || state.currentModel;

        // Renderizar conteúdo
        if (typeof marked !== 'undefined') {
            this.content.innerHTML = marked.parse(data);
        } else {
            this.content.innerHTML = data.replace(/\n/g, '<br>');
        }

        // Animar entrada
        if (typeof gsap !== 'undefined') {
            gsap.from(this.result, {
                duration: 0.5,
                y: 20,
                opacity: 0,
                ease: "power2.out"
            });
        }

        state.lastGeneratedContent = data;
    }

    clear() {
        this.showPlaceholder();
        state.lastGeneratedContent = '';
    }
}

// ===== SISTEMA DE STATUS =====
class StatusManager {
    constructor() {
        this.apiStatus = $('#api-status');
        this.apiLabel = $('#api-label');
        this.gpuStatus = $('#gpu-status');
        this.gpuLabel = $('#gpu-label');
        
        this.init();
    }

    init() {
        this.checkGPU();
        this.checkAPI();
        
        // Verificar API periodicamente
        setInterval(() => {
            this.checkAPI();
        }, 30000); // A cada 30 segundos
    }

    checkGPU() {
        const hasWebGPU = !!navigator.gpu;
        const hasWebGL = !!document.createElement('canvas').getContext('webgl');
        
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

    async checkAPI() {
        this.apiLabel.textContent = 'Verificando API...';
        this.apiStatus.className = 'status-dot status-warning';
        
        const api = new APIManager();
        const status = await api.testConnection();
        
        if (status.online && status.providerReady) {
            this.apiStatus.className = 'status-dot status-online';
            this.apiLabel.textContent = 'API Online';
            state.apiStatus = 'online';
        } else if (status.online) {
            this.apiStatus.className = 'status-dot status-warning';
            this.apiLabel.textContent = 'API sem provedor';
            state.apiStatus = 'no-provider';
        } else {
            this.apiStatus.className = 'status-dot status-error';
            this.apiLabel.textContent = 'API Offline';
            state.apiStatus = 'offline';
        }
    }
}

// ===== GERENCIADOR PRINCIPAL =====
class App {
    constructor() {
        this.formManager = new FormManager();
        this.apiManager = new APIManager();
        this.outputManager = new OutputManager();
        this.statusManager = new StatusManager();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupKeyboardShortcuts();
        
        // Inicializar efeitos após splash
        setTimeout(() => {
            new BackgroundEffects();
        }, CONFIG.SPLASH_DURATION + 1000);
    }

    bindEvents() {
        // Botões de ação
        $('#copy-md-btn').addEventListener('click', () => {
            this.copyToClipboard(state.lastGeneratedContent, 'Markdown copiado para a área de transferência!');
        });

        $('#copy-html-btn').addEventListener('click', () => {
            const html = marked ? marked.parse(state.lastGeneratedContent) : state.lastGeneratedContent;
            this.copyToClipboard(html, 'HTML copiado para a área de transferência!');
        });

        $('#download-btn').addEventListener('click', () => {
            this.downloadContent();
        });

        $('#clear-btn').addEventListener('click', () => {
            this.clear();
        });

        $('#reset-btn').addEventListener('click', () => {
            this.formManager.reset();
        });

        $('#fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        $('#save-preset-btn').addEventListener('click', () => {
            this.savePreset();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter para gerar
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.generate();
            }
            
            // Escape para limpar ou sair do fullscreen
            if (e.key === 'Escape') {
                const outputPanel = $('.output-panel');
                if (outputPanel.classList.contains('fullscreen')) {
                    this.toggleFullscreen();
                } else {
                    this.clear();
                }
            }
            
            // Ctrl/Cmd + R para resetar
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.formManager.reset();
            }
        });
    }

    async generate() {
        if (state.isLoading) return;

        const formData = this.formManager.getData();
        
        // Validação
        if (!formData.tema || formData.tema.trim().length < 3) {
            toast.error('Por favor, insira um tema válido (mínimo 3 caracteres)');
            $('#tema').focus();
            return;
        }

        // Verificar status da API
        if (state.apiStatus === 'offline') {
            toast.error('API está offline. Verifique a conexão e tente novamente.');
            return;
        }

        if (state.apiStatus === 'no-provider') {
            toast.warning('API online mas sem provedor configurado. Verifique as chaves de API.');
        }

        state.isLoading = true;
        this.showLoading();

        try {
            const startTime = Date.now();
            const result = await this.apiManager.generate(formData);
            const endTime = Date.now();
            
            const metadata = {
                time: `${((endTime - startTime) / 1000).toFixed(1)}s`,
                tokens: result.tokens || this.estimateTokens(result.text),
                model: formData.model || state.currentModel
            };

            this.outputManager.showResult(result.text, metadata);
            toast.success('Conteúdo gerado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao gerar conteúdo:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            state.isLoading = false;
            this.hideLoading();
        }
    }

    estimateTokens(text) {
        // Estimativa simples de tokens (aproximadamente 4 caracteres por token)
        return Math.ceil(text.length / 4);
    }

    showLoading() {
        const loadingSection = $('#loading-section');
        const generateBtn = $('#generate-btn');
        
        loadingSection.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
        
        if (typeof gsap !== 'undefined') {
            gsap.from(loadingSection, {
                duration: 0.3,
                y: 10,
                opacity: 0,
                ease: "power2.out"
            });
        }
    }

    hideLoading() {
        const loadingSection = $('#loading-section');
        const generateBtn = $('#generate-btn');
        
        if (typeof gsap !== 'undefined') {
            gsap.to(loadingSection, {
                duration: 0.3,
                y: -10,
                opacity: 0,
                ease: "power2.in",
                onComplete: () => {
                    loadingSection.style.display = 'none';
                }
            });
        } else {
            loadingSection.style.display = 'none';
        }
        
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
    }

    async copyToClipboard(text, successMessage) {
        if (!text) {
            toast.warning('Nenhum conteúdo para copiar');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            toast.success(successMessage);
        } catch (error) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast.success(successMessage);
        }
    }

    downloadContent() {
        if (!state.lastGeneratedContent) {
            toast.warning('Nenhum conteúdo para baixar');
            return;
        }

        const blob = new Blob([state.lastGeneratedContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
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
        outputPanel.classList.toggle('fullscreen');
        
        if (outputPanel.classList.contains('fullscreen')) {
            toast.info('Modo tela cheia ativado (ESC para sair)');
        } else {
            toast.info('Modo tela cheia desativado');
        }
    }

    savePreset() {
        const formData = this.formManager.getData();
        const presetName = prompt('Nome do preset:');
        
        if (presetName) {
            const presets = JSON.parse(localStorage.getItem('automarkt_presets') || '{}');
            presets[presetName] = formData;
            localStorage.setItem('automarkt_presets', JSON.stringify(presets));
            toast.success(`Preset "${presetName}" salvo com sucesso!`);
        }
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar splash screen
    new SplashScreen();
    
    // Inicializar aplicação principal
    window.app = new App();
    
    // Debug mode
    if (localStorage.getItem('automarkt_debug') === 'true') {
        window.debug = {
            state,
            CONFIG,
            toast,
            app: window.app
        };
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
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                
                if (loadTime > 3000) {
                    console.warn(`Carregamento lento detectado: ${loadTime}ms`);
                }
                
                if (localStorage.getItem('automarkt_debug') === 'true') {
                    console.log(`Tempo de carregamento: ${loadTime}ms`);
                }
            }
        }, 0);
    });
}

