// Configuration
const CONFIG = {
    SUPABASE_URL: 'https://lfmxicfmvobpsjnmglcq.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXhpY2Ztdm9icHNqbm1nbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTAxODAsImV4cCI6MjA4MDI4NjE4MH0.ev5d9mzqW_WoOM5MCKKdfteUzyJCaahmIftNEe6WYsY',
    PROJECT_ID: 'lfmxicfmvobpsjnmglcq',
    API_BASE_URL: 'https://lfmxicfmvobpsjnmglcq.supabase.co/functions/v1/make-server-7882d816'
};
function fixBackendOffset(dateString, timeString) {
  if (!dateString) return '-';

  const [yyyy, mm, dd] = dateString.split('-').map(Number);

  // hora que veio do back
  let [h, m] = (timeString || '00:00').split(':').map(Number);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;

  // cria data local usando a hora "bugada"
  const d = new Date(yyyy, mm - 1, dd, h, m);

  // remove 3 horas (ajuste Brasil UTC-3)
  d.setHours(d.getHours() - 3);

  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}





// Utilities
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// API
const api = {
    async call(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = storage.get('accessToken');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                ...options.headers
            },
            ...options
        };
        try {
            const response = await fetch(url, config);
            
            // Verificar se a resposta é JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Se não for JSON, pegar como texto
                const text = await response.text();
                console.error('Resposta não-JSON recebida:', text);
                data = { error: text || 'Resposta inválida do servidor' };
            }
            
            if (!response.ok) {
                throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    async signup(email, password, name, initialAssessment) {
        return this.call('/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, role: 'client', initialAssessment })
        });
    },
    async login(email, password) {
        return this.call('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    async getUser() {
        return this.call('/user');
    },
    async getPackages() {
        return this.call('/packages');
    },
    async createPackage(packageData) {
        return this.call('/packages', {
            method: 'POST',
            body: JSON.stringify(packageData)
        });
    },
    async updatePackage(packageId, packageData) {
        return this.call(`/packages/${packageId}`, {
            method: 'PUT',
            body: JSON.stringify(packageData)
        });
    },
    async deletePackage(packageId) {
        return this.call(`/packages/${packageId}`, {
            method: 'DELETE'
        });
    },
    async getSubscription() {
        return this.call('/subscription');
    },
    async purchasePackage(packageId) {
        return this.call('/subscription/purchase', {
            method: 'POST',
            body: JSON.stringify({ packageId })
        });
    },
    async getAllSubscriptions() {
        return this.call('/admin/subscriptions');
    },
    async updateSubscriptionStatus(subscriptionId, status) {
        return this.call(`/admin/subscriptions/${subscriptionId}`, {
            method: 'PUT',
            body: JSON.stringify({ paymentStatus: status })
        });
    },
    async getContent() {
        return this.call('/content');
    },
    async createContent(contentData) {
        return this.call('/content', {
            method: 'POST',
            body: JSON.stringify(contentData)
        });
    },
    async deleteContent(contentId) {
        return this.call(`/content/${contentId}`, {
            method: 'DELETE'
        });
    },
    async getActivities() {
        return this.call('/activities');
    },
    async registerActivity(contentId, notes) {
        return this.call('/activities', {
            method: 'POST',
            body: JSON.stringify({ contentId, notes })
        });
    },
    async getAllClients() {
        return this.call('/admin/clients');
    },
    async getAdminContent() {
        return this.call('/admin/content');
    },
    // API para criar conteúdo exclusivo para um cliente
    async createExclusiveContent(userId, contentData) {
        return this.call('/content', {
            method: 'POST',
            body: JSON.stringify({ 
                userId: userId,
                type: contentData.type,
                title: contentData.title,
                description: contentData.description,
                content: contentData.content || '',
                week: contentData.week || null,
                fileUrl: contentData.fileUrl || null,
                isExclusive: true
            })
        });
    }
};

// Main Application
const app = {
    currentAdminTab: "clients",
    currentPage: 'home',
    currentUser: null,
    currentToken: null,
    signupData: {},
    signupStep: 1,
    selectedPackageId: null,
    packages: [],

    async init() {
        const loadingScreen = document.getElementById('loading-screen');
        const savedToken = storage.get('accessToken');
        
        if (savedToken) {
            try {
                const data = await api.getUser();
                this.currentUser = data.user;
                this.currentToken = savedToken;
                
                if (data.user.role === 'admin') {
                    this.navigate('admin');
                } else {
                    this.navigate('client');
                }
            } catch (error) {
                console.error('❌ Sessão inválida ou expirada:', error);
                console.log('🧹 Limpando sessão...');
                storage.remove('accessToken');
                this.currentUser = null;
                this.currentToken = null;
                this.navigate('home');
            }
        } else {
            this.navigate('home');
        }

        loadingScreen.classList.add('hidden');
        
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('profile-dropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    },

    navigate(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = page;
            
            if (page === 'packages') {
                this.loadPackages();
            } else if (page === 'client') {
                this.loadClientDashboard();
            } else if (page === 'admin') {
                this.loadAdminDashboard();
            } else if (page === 'home') {
                this.loadHomePage();
            } else if (page === 'login') {
                this.resetLoginForm();
            } else if (page === 'payment') {
                this.loadPaymentPage();
            }
        }
    },

    resetLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        
        if (loginForm) {
            loginForm.reset();
        }
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>ENTRAR';
        }
    },

    loadHomePage() {
        const headerButtons = document.getElementById('home-header-buttons');
        const actionButtons = document.getElementById('home-action-buttons');
        
        if (this.currentUser) {
            const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            headerButtons.innerHTML = `
                <div class="profile-dropdown" id="profile-dropdown">
                    <button class="profile-btn" onclick="app.toggleProfileMenu()">
                        ${initials}
                    </button>
                    <div class="profile-menu">
                        <div class="profile-menu-header">
                            <strong>${this.currentUser.name}</strong>
                            <p>${this.currentUser.email}</p>
                        </div>
                        <button class="profile-menu-item" onclick="app.navigate('${this.currentUser.role === 'admin' ? 'admin' : 'client'}'); app.closeProfileMenu();">
                            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            Meu Painel
                        </button>
                        <button class="profile-menu-item danger" onclick="app.handleLogout()">
                            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            Sair
                        </button>
                    </div>
                </div>
            `;
            
            actionButtons.innerHTML = `
                <button class="btn btn-primary btn-lg btn-full" onclick="app.navigate('${this.currentUser.role === 'admin' ? 'admin' : 'client'}')">
                    <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    ACESSAR MEU PAINEL
                </button>
                <button class="btn btn-secondary btn-lg btn-full" onclick="app.navigate('packages')">
                    <svg viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    VER OFERTA EXCLUSIVA
                </button>
            `;
        } else {
            headerButtons.innerHTML = `
                <button class="btn btn-outline" onclick="app.navigate('login')">Login</button>
            `;
            
            actionButtons.innerHTML = `
                <button class="btn btn-primary btn-lg btn-full" onclick="app.navigate('signup')">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    COMEÇAR AGORA
                </button>
                <button class="btn btn-secondary btn-lg btn-full" onclick="app.navigate('packages')">
                    <svg viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    VER OFERTA EXCLUSIVA
                </button>
                <button class="btn btn-accent btn-lg btn-full" onclick="app.navigate('login')">
                    <svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                    JÁ SOU CLIENTE
                </button>
            `;
        }
    },

    toggleProfileMenu() {
        const dropdown = document.getElementById('profile-dropdown');
        dropdown.classList.toggle('active');
    },

    closeProfileMenu() {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    },

    handleLogout() {
        this.currentUser = null;
        this.currentToken = null;
        storage.remove('accessToken');
        this.navigate('home');
        showToast('Logout realizado com sucesso', 'success');
    },

    showClientTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="app.showClientTab('${tab}')"]`).classList.add('active');

    document.getElementById("tab-aulas").classList.add("hidden");
    document.getElementById("tab-treinos").classList.add("hidden");
    document.getElementById("tab-dietas").classList.add("hidden");

    document.getElementById(`tab-${tab}`).classList.remove("hidden");
},

    handleSignupBack() {
        if (this.signupStep > 1) {
            this.signupStep--;
            if (this.signupStep === 1) {
                document.getElementById('step-2-content').classList.add('hidden');
                document.getElementById('step-1-content').classList.remove('hidden');
            }
            this.updateSignupProgress();
        } else {
            this.signupStep = 1;
            this.navigate('home');
        }
    },

    updateSignupProgress() {
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');
        const progressLine = document.getElementById('progress-line');
        
        if (!step1) return;
        
        [step1, step2, step3].forEach(s => {
            s.style.background = 'rgba(255, 255, 255, 0.1)';
            s.style.color = 'var(--muted-foreground)';
        });
        
        if (this.signupStep >= 1) {
            step1.style.background = 'var(--primary)';
            step1.style.color = 'white';
            progressLine.style.width = '0%';
        }
        if (this.signupStep >= 2) {
            step2.style.background = 'var(--primary)';
            step2.style.color = 'white';
            progressLine.style.width = '50%';
        }
        if (this.signupStep >= 3) {
            step3.style.background = 'var(--secondary)';
            step3.style.color = 'white';
            progressLine.style.width = '100%';
        }
    },

    async loadPackages() {
        try {
            const data = await api.getPackages();
            const packages = data.packages || [];
            this.packages = packages;
            const container = document.getElementById('packages-list');
            
            if (packages.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem 0;">
                        <p style="margin-top: 1rem; color: var(--muted-foreground);">
                            Nenhum pacote disponível no momento.
                        </p>
                    </div>
                `;
                return;
            }

            container.innerHTML = packages.map(pkg => `
                <div class="card-gradient" style="background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${pkg.name || pkg.title || ''}</h3>
                        <p style="opacity: 0.9;">${pkg.description || ''}</p>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">R$ ${pkg.price}</div>
                        <p style="opacity: 0.9; font-size: 0.875rem;">
                            ${pkg.classCount || pkg.class_count || 0} aulas incluídas
                        </p>
                    </div>

                    ${pkg.benefits && pkg.benefits.length > 0 ? `
                        <div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                            ${pkg.benefits.map(benefit => `
                                <div style="display: flex; align-items: start; gap: 0.5rem;">
                                    <svg viewBox="0 0 24 24" style="width: 1.25rem; height: 1.25rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span style="opacity: 0.9; font-size: 0.875rem;">${benefit}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <button 
                        class="btn btn-white btn-lg btn-full" 
                        onclick="app.handlePurchase('${pkg.id}')"
                        ${!this.currentUser ? 'disabled' : ''}
                    >
                        ${!this.currentUser ? 'FAÇA LOGIN PARA COMPRAR' : 'COMPRAR AGORA'}
                    </button>
                </div>
            `).join('');
        } catch (error) {
            showToast('Erro ao carregar oferta', 'error');
        }
    },

    async handlePurchase(packageId) {
        if (!this.currentUser) {
            showToast('Você precisa estar logado para comprar um pacote', 'error');
            this.navigate('login');
            return;
        } 

        this.selectedPackageId = packageId;
        this.navigate('payment');
    },

    async loadPaymentPage() {
        try {
            const data = await api.getPackages();
            const packages = data.packages || [];
            const selectedPackage = packages.find(pkg => pkg.id === this.selectedPackageId);
            
            if (!selectedPackage) {
                showToast('Pacote não encontrado', 'error');
                this.navigate('packages');
                return;
            }

            const summaryDiv = document.getElementById('payment-package-summary');
            summaryDiv.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${selectedPackage.name || selectedPackage.title || ''}</h3>
                    <p style="opacity: 0.9;">${selectedPackage.description || ''}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                    <span style="font-size: 1.125rem;">Total a pagar:</span>
                    <span style="font-size: 2rem;">R$ ${selectedPackage.price}</span>
                </div>
            `;

            const pixCode = `00020126580014BR.GOV.BCB.PIX0136b5fef22b-0f29-4f1f-9752-afa8e4aa64df5204000053039865406149.905802BR5925Viviane Jessica da Silvei6009SAO PAULO62140510XeB6oxMV60630469D1`;
            document.getElementById('pix-code').value = pixCode;

        } catch (error) {
            showToast('Erro ao carregar informações de pagamento', 'error');
            this.navigate('packages');
        }
    },

    selectPaymentMethod(method) {
        const buttons = document.querySelectorAll('.payment-method-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-method') === method) {
                btn.classList.add('active');
            }
        });

        if (method === 'pix') {
            document.getElementById('payment-pix').classList.remove('hidden');
        }
    },

    copyPixCode() {
        const pixCodeInput = document.getElementById('pix-code');
        pixCodeInput.select();
        pixCodeInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            showToast('Código PIX copiado!', 'success');
        } catch (err) {
            navigator.clipboard.writeText(pixCodeInput.value).then(() => {
                showToast('Código PIX copiado!', 'success');
            }).catch(() => {
                showToast('Erro ao copiar código', 'error');
            });
        }
    },

    async confirmPixPayment() {
    const btn = document.getElementById('confirmPixBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loader" style="width: 1.5rem; height: 1.5rem; border-width: 2px;"></div>Processando...';

    try {
        await api.purchasePackage(this.selectedPackageId);

        showToast('Pagamento registrado! Aguarde a aprovação.', 'success');
        
        setTimeout(() => {
            if (this.currentUser.role === 'admin') {
                this.navigate('admin');
            } else {
                this.navigate('client');
            }
        }, 2000);

    } catch (error) {
        showToast(error.message || 'Erro ao processar pagamento', 'error');
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>JÁ FIZ O PAGAMENTO';
    }
},


    async loadClientDashboard() {
        try {
            const [subscriptionData, contentsData, activitiesData] = await Promise.all([
                api.getSubscription(),
                api.getContent(),
                api.getActivities()
            ]);

            const subscription = subscriptionData.subscription;
            const contents = contentsData.contents || [];
            const activities = activitiesData.activities || [];
            window.activities = activities;


            document.getElementById('client-name').textContent = this.currentUser.name;

            const isLocked = subscription?.paymentStatus !== 'approved';
            const alertDiv = document.getElementById('client-alert');
alertDiv.innerHTML = "";

// Caso 1: usuário ainda não escolheu nenhum pacote
if (!subscription?.packageId) {
    alertDiv.innerHTML = `
        <div class="card" style="background: rgba(0,0,0,0.05); margin-bottom:1.5rem;">
            <p>Faça o pagamento para desbloquear seu conteúdo.</p>
            <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-top: 0.5rem;" onclick="app.navigate('packages')">
                VER OFERTA EXCLUSIVA
            </button>

        </div>
    `;
    return;
}

// Caso 2: escolheu o pacote mas NÃO clicou em "Já fiz o pagamento"
if (subscription.userSentPayment === false) {
    alertDiv.innerHTML = `
        <div class="card" style="background: rgba(233, 30, 99, 0.1); margin-bottom:1.5rem;">
            <p>Finalize o pagamento para desbloquear seu conteúdo.</p>
            <button class="btn btn-primary btn-sm" onclick="app.navigate('payment')">
                JÁ FIZ O PAGAMENTO
            </button>
        </div>
    `;
    return;
}

// Caso 3: usuário clicou em "Já fiz o pagamento" → aguardando aprovação
if (subscription.paymentStatus === 'pending' && subscription.userSentPayment === true) {
    alertDiv.innerHTML = `
        <div class="card" style="background: rgba(255, 193, 7, 0.15); margin-bottom:1.5rem;">
            <p>Pagamento enviado! Aguarde a aprovação.</p>
        </div>
    `;
    return;
}

// Caso 4: pagamento aprovado → libera tudo
if (subscription.paymentStatus === 'approved') {
    alertDiv.innerHTML = '';
}


                // 🔥 Mostrar o grupo do WhatsApp SOMENTE para assinaturas aprovadas
            const whatsSection = document.querySelector(".whatsapp-section");

            if (subscription?.paymentStatus === "approved") {
                whatsSection.style.display = "block";
            } else {
                whatsSection.style.display = "none";
            }

            const workouts = contents.filter(c => c.type === 'workout');
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekActivities = activities.filter(a => {
                const activityDate = new Date(a.completedAt);
                return activityDate >= weekStart;
            });

            document.getElementById('client-stats').innerHTML = `
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(233, 30, 99, 0.2); color: var(--primary);">
                        <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    </div>
                    <div class="stat-value">${weekActivities.length}</div>
                    <div class="stat-label">Esta semana</div>
                </div>

                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(124, 77, 255, 0.2); color: var(--accent);">
                        <svg viewBox="0 0 24 24"><path d="M14.4 14.4 9.6 9.6"></path><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.828l-1.768 1.768a2 2 0 1 1 2.828 2.829z"></path><path d="m21.5 21.5-1.4-1.4"></path><path d="M3.9 3.9 2.5 2.5"></path><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"></path></svg>
                    </div>
                    <div class="stat-value">${workouts.length}</div>
                    <div class="stat-label">Treinos</div>
                </div>

                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(0, 191, 165, 0.2); color: var(--secondary);">
                        <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div class="stat-value">${activities.length}</div>
                    <div class="stat-label">Total</div>
                </div>
            `;

            if (isLocked) {
    document.getElementById("tab-aulas").innerHTML = `
        <div style="text-align: center; padding: 3rem 0;">
            <p style="color: var(--muted-foreground);">Conteúdo bloqueado. Aguardando aprovação do pagamento.</p>
        </div>
    `;
    document.getElementById("tab-treinos").innerHTML = "";
    document.getElementById("tab-dietas").innerHTML = "";
} else {

    const aulas = contents.filter(c => c.type === "class");
const treinos = contents.filter(c => c.type === "workout");
const dietas = contents.filter(c => c.type === "diet");

// ---- SISTEMA DE DESBLOQUEIO PROGRESSIVO ----
aulas.sort((a, b) => (a.order || 0) - (b.order || 0));

for (let i = 0; i < aulas.length; i++) {
    aulas[i].previousId = i === 0 ? null : aulas[i - 1].id;
}
// --------------------------------------------


    document.getElementById("tab-aulas").innerHTML =
        aulas.length
            ? aulas.map((c, i) => app.renderContentCard(c, i)).join("")
            : `<p style="text-align:center;opacity:.7">Nenhuma aula disponível.</p>`;

    document.getElementById("tab-treinos").innerHTML =
        treinos.length
            ? treinos.map((c, i) => app.renderContentCard(c, i)).join("")
            : `<p style="text-align:center;opacity:.7">Nenhum treino disponível.</p>`;

    document.getElementById("tab-dietas").innerHTML =
        dietas.length
            ? dietas.map((c, i) => app.renderContentCard(c, i)).join("")
            : `<p style="text-align:center;opacity:.7">Nenhuma dieta disponível.</p>`;
}


        } catch (error) {
            showToast('Erro ao carregar dados', 'error');
            console.error('Error:', error);
        }
    },

    async registerActivity(contentId, notes, button) {
    try {
        await api.registerActivity(contentId, notes);

        // 1 — Atualiza imediatamente a lista local de atividades
        if (!window.activities) window.activities = [];
        window.activities.push({
            contentId: contentId,
            completedAt: new Date().toISOString()
        });

        // 2 — Desativa o botão atual
        if (button) {
            button.disabled = true;
            button.innerHTML = "CONCLUÍDO";
        }

        // 3 — Re-renderiza SOMENTE a parte das aulas
        this.loadClientDashboard(false); // ← não recarrega tudo

        showToast('Atividade registrada!', 'success');

    } catch (error) {
        showToast('Erro ao registrar atividade', 'error');
        console.error('Error:', error);
    }
},

    async loadAdminDashboard() {
        try {
            const [packagesData, clientsData, subscriptionsData, contentsData] = await Promise.all([
                api.getPackages(),
                api.getAllClients(),
                api.getAllSubscriptions(),
                api.getAdminContent()
            ]);

            const packages = packagesData.packages || [];
            const clients = clientsData.clients || [];
            const subscriptions = subscriptionsData.subscriptions || [];
            const contents = contentsData.contents || [];

            this.packages = packages;

            document.getElementById('admin-name').textContent = this.currentUser.name;

            document.getElementById('admin-stats').innerHTML = `
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 3rem;">
                    <div class="card stat-card">
                        <div class="stat-icon" style="background: rgba(233, 30, 99, 0.2); color: var(--primary);">
                            <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        </div>
                        <div class="stat-value">${clients.length}</div>
                        <div class="stat-label">Clientes</div>
                    </div>

                    <div class="card stat-card">
                        <div class="stat-icon" style="background: rgba(124, 77, 255, 0.2); color: var(--accent);">
                            <svg viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        </div>
                        <div class="stat-value">${packages.length}</div>
                        <div class="stat-label">Ofertas</div>
                    </div>

                    <div class="card stat-card">
                        <div class="stat-icon" style="background: rgba(0, 191, 165, 0.2); color: var(--secondary);">
                            <svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        </div>
                        <div class="stat-value">${contents.length}</div>
                        <div class="stat-label">Conteúdos</div>
                    </div>
                </div>
            `;

            this.setupAdminTabs(clients, subscriptions, packages, contents);
            this.loadAdminTab(this.currentAdminTab, { clients, subscriptions, packages, contents });

        } catch (error) {
            showToast('Erro ao carregar dados administrativos', 'error');
            console.error('Error:', error);
        }
    },

    setupAdminTabs(clients, subscriptions, packages, contents) {
        const tabs = document.querySelectorAll('.tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabName = tab.getAttribute('data-tab');
                this.currentAdminTab = tabName;

                this.loadAdminTab(tabName, { clients, subscriptions, packages, contents });
            });
        });
    },

    loadAdminTab(tabName, data) {
        const container = document.getElementById('admin-tab-content');
        
        if (tabName === 'clients') {
            this.renderClientsTab(container, data.clients, data.subscriptions);
        } else if (tabName === 'packages') {
            this.renderPackagesTab(container, data.packages);
        } else if (tabName === 'content') {
            this.renderContentTab(container, data.contents);
        }
    },

    renderClientsTab(container, clients, subscriptions) {
        if (clients.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <div style="text-align: center; padding: 3rem 0;">
                        <p style="color: var(--muted-foreground);">Nenhum cliente cadastrado ainda.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="card">
                <h2 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Gestão de Clientes</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Fichas</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(client => {
                                const subscription = subscriptions.find(s => s.userId === client.id);
                                const statusMap = {
                                    'pending': { label: 'Pendente', class: 'badge-warning' },
                                    'approved': { label: 'Ativo', class: 'badge-success' },
                                    'rejected': { label: 'Rejeitado', class: 'badge-error' }
                                };
                                const status = statusMap[subscription?.paymentStatus] || { label: 'Sem pacote', class: 'badge-warning' };
                                
                                return `
                                    <tr id="client-${client.id}">
                                        <td>${client.name}</td>
                                        
                                        <td>
                                            ${subscription?.paymentStatus === 'approved'
                                                ? `<button class="btn btn-outline btn-sm" onclick="app.showClientAssessment('${client.id}')">
                                                        📋 Ver ficha
                                                    </button>`
                                                : `<span style="opacity:.4;">Indisponível</span>`
                                            }
                                        </td>

                                        <td>
                                            <span class="badge ${status.class}">
                                                ${status.label}
                                            </span>
                                        </td>

                                    <td>
${subscription?.paymentStatus === 'pending' ? `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm"
                onclick="app.approveSubscription('subscription:${subscription.userId}')">
                ✓ Aprovar
            </button>

            <button class="btn btn-outline btn-sm"
                style="border-color: var(--error); color: #f44336;"
                onclick="app.rejectSubscription('subscription:${subscription.userId}')">
                ✗ Recusar
            </button>
        </div>
    ` : ''}
    ${subscription?.paymentStatus === 'approved' ? `
        <div style="display:flex; gap:.5rem; align-items:center;">

            <button class="btn btn-primary btn-sm"
                style="padding: 15px 2px; font-size: 0.9rem;"
                onclick="app.openExclusiveContentModal('${client.id}', '${client.name}')">
                + Enviar Conteúdo
            </button>
        </div>
    ` : ''}
    ${subscription?.paymentStatus === 'approved' ? `
        <button
            class="btn btn-outline btn-sm"
            style="padding: 6px 10px; font-size: 0.8rem;"
            onclick="app.openClientActivitiesModal('${client.id}', '${client.name}')">
            
            📊 Ver Progresso
        </button>
        ${subscription?.paymentStatus === 'approved' ? `
            
` : ''}


    ` : ''}

    <span style="color:#ff4d4d; cursor:pointer; display:inline-block; margin-top:5px;"
        onclick="app.deleteClient('${client.id}', '${client.name}')">
        🗑 Excluir Conta
    </span>
</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ---- START: modal para enviar conteúdo individual (renomeado para combinar com o código 2) ----
openExclusiveContentModal(userId, clientName) {

    // Nome seguro igual ao código 2
    const safeName = (clientName || 'aluno')
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

    // Remove modal anterior (se houver)
    const existing = document.getElementById('exclusive-content-modal');
    if (existing) existing.remove();

    // Cria overlay + modal
    const modal = document.createElement('div');
    modal.id = 'exclusive-content-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Enviar conteúdo para ${safeName}</h2>
                <button class="modal-close" type="button" onclick="document.getElementById('exclusive-content-modal')?.remove()">×</button>
            </div>

            <form id="exclusiveContentForm" style="display:grid; gap:0.75rem; margin-top:1rem;">
                <input type="hidden" name="targetUserId" value="${userId || ''}" />

                <div class="form-group">
                    <label class="form-label">Tipo</label>
                    <select name="type" class="form-select" required>
                        <option value="class">📚Aula</option>
                        <option value="workout">💪Treino</option>
                        <option value="diet">🥗Dieta</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Título</label>
                    <input name="title" class="form-input" placeholder="Ex: Aula 01 - Mobilidade" required />
                </div>

                <div class="form-group">
                    <label class="form-label">Descrição</label>
                    <textarea name="description" class="form-textarea" placeholder="Breve descrição (opcional)"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Link (YouTube / Drive / URL)</label>
                    <input type="url" name="fileUrl" class="form-input" placeholder="https://..." />
                </div>

                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('exclusive-content-modal')?.remove()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Enviar para o aluno</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Handler do submit
    document.getElementById('exclusiveContentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const payload = {
            type: form.type.value,
            title: form.title.value,
            description: form.description.value || null,
            fileUrl: form.fileUrl.value || null,
            targetUserId: (form.targetUserId && form.targetUserId.value) || userId || null
        };

        try {
            await api.createContent(payload);

            showToast(`Conteúdo enviado para ${safeName}!`, 'success');
            document.getElementById('exclusive-content-modal')?.remove();

            // Recarrega admin se existir
            if (this && this.loadAdminDashboard) {
                try { this.loadAdminDashboard(); } catch(e) {}
            }
        } catch (err) {
            console.error('Erro ao enviar conteúdo individual:', err);
            showToast('Erro ao enviar conteúdo. Veja console.', 'error');
        }
    });
}, 
// ---- END ----

    renderPackagesTab(container, packages) {
        container.innerHTML = `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.25rem;">Gestão de Ofertas</h2>
                    <button class="btn btn-primary" onclick="app.showCreatePackageModal()">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Novo Pacote
                    </button>
                </div>
                
                ${packages.length === 0 ? `
                    <div style="text-align: center; padding: 3rem 0;">
                        <p style="color: var(--muted-foreground);">Nenhum pacote criado ainda.</p>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${packages.map(pkg => `
                            <div class="card-gradient card-primary">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${pkg.name || pkg.title || ''}</h3>
                                        <p style="opacity: 0.9; margin-bottom: 0.5rem;">${pkg.description || ''}</p>
                                        <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">R$ ${pkg.price}</p>
                                        <p style="opacity: 0.8; font-size: 0.875rem;">${pkg.classCount || pkg.class_count || 0} aulas incluídas</p>
                                    </div>

                                    <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                                        <button class="btn btn-secondary btn-sm" onclick="app.showEditPackageModal('${pkg.id}')">
                                            <svg viewBox="0 0 24 24" style="width: 1rem; height:1rem;">
                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-outline btn-sm" onclick="app.deletePackage('${pkg.id}')">
                                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    },

    showEditPackageModal(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);

        if (!pkg) {
            api.getPackages().then(data => {
                const pkgs = data.packages || [];
                const found = pkgs.find(p => p.id === packageId);
                if (found) this._openEditModalWithData(found);
                else showToast('Pacote não encontrado', 'error');
            }).catch(err => {
                console.error(err);
                showToast('Erro ao buscar pacotes', 'error');
            });
            return;
        }

        this._openEditModalWithData(pkg);
    },

    async showClientAssessment(userId) {
    try {
        // Busca todas infos do cliente (precisa existir no back /admin/clients/:id)
        const response = await api.call(`/admin/clients/${userId}`);
        const client = response.client;

        const data = client.initialAssessment || {};

        // Remove modal antigo se existir
        const old = document.getElementById('assessment-modal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'assessment-modal';
        modal.className = 'modal-overlay';

        modal.innerHTML = `
            <div class="modal" style="max-width:520px">
                <div class="modal-header">
                    <h2 class="modal-title">Ficha do Cliente</h2>
                </div>

                <div style="margin-top:1rem;line-height:2.5">
                    <p><strong>👤 Nome:</strong> ${client.name}</p>
                    <p><strong>📧 Email:</strong> ${client.email}</p>
                    <p><strong>⚖️ Peso:</strong> ${data.weight || '-'} kg</p>
                    <p><strong>📏 Altura:</strong> ${data.height || '-'} cm</p>
                    <p><strong>🎂 Idade:</strong> ${data.age || '-'}</p>

                    <hr style="border:1px solid rgba(255,255,255,.1);margin:1rem 0">

                    <p><strong>🎯 Objetivos:</strong><br> ${data.goals || '-'}</p>
                    <p><strong>🚫 Restrições:</strong><br> ${data.restrictions || 'Nenhuma'}</p>
                    <p><strong>🏥 Histórico médico:</strong><br> ${data.medicalHistory || 'Nenhum'}</p>
                </div>

                <div style="margin-top:1.5rem;text-align:right">
                    <button 
                        class="btn btn-secondary"
                        onclick="document.getElementById('assessment-modal').remove()"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error(error);
        showToast('Erro ao buscar informações do cliente', 'error');
    }
},

    _openEditModalWithData(pkg) {
        const existing = document.getElementById('edit-package-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'edit-package-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">Editar Pacote</h2>
                    <button class="modal-close" type="button" onclick="document.getElementById('edit-package-modal').remove()" style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: white; cursor: pointer; font-size: 1.5rem;">×</button>
                </div>
                <form id="editPackageForm" style="display: grid; gap: 0.75rem; margin-top: 1rem;">
                    <input type="hidden" id="edit-package-id" value="${pkg.id}" />
                    <div class="form-group">
                        <label class="form-label">Nome</label>
                        <input id="edit-package-name" class="form-input" value="${(pkg.name||pkg.title||'').replace(/"/g,'&quot;')}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea id="edit-package-description" class="form-textarea">${(pkg.description||'').replace(/</g,'<')}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Preço (R$)</label>
                        <input id="edit-package-price" type="number" step="0.01" class="form-input" value="${pkg.price || 0}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Número de aulas</label>
                        <input id="edit-package-classCount" type="number" class="form-input" value="${pkg.classCount || pkg.class_count || 0}" />
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-outline btn-full" onclick="document.getElementById('edit-package-modal').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary btn-full">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('editPackageForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('edit-package-id').value;
            const updated = {
                name: document.getElementById('edit-package-name').value,
                description: document.getElementById('edit-package-description').value,
                price: parseFloat(document.getElementById('edit-package-price').value) || 0,
                classCount: parseInt(document.getElementById('edit-package-classCount').value) || 0
            };

            try {
                await api.updatePackage(id, updated);
                showToast('Pacote atualizado com sucesso!', 'success');
                document.getElementById('edit-package-modal').remove();
                this.loadAdminDashboard();
            } catch (err) {
                console.error(err);
                showToast('Erro ao atualizar pacote', 'error');
            }
        });
    },

    renderContentTab(container, contents) {
        container.innerHTML = `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.25rem;">Gestão de Conteúdo</h2>
                    <button class="btn btn-primary" onclick="app.showCreateContentModal()">
                        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Novo Conteúdo
                    </button>
                </div>
                
                ${contents.length === 0 ? `
                    <div style="text-align: center; padding: 3rem 0;">
                        <p style="color: var(--muted-foreground);">Nenhum conteúdo criado ainda.</p>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${contents.map(content => {
                            const typeMap = {
                                'workout': '💪 Treino',
                                'diet': '🥗 Dieta',
                                'class': '📚 Aula'
                            };
                            const type = typeMap[content.type] || content.type;
                            
                            return `
                                <div class="card">
                                    <div style="display: flex; justify-content: space-between; align-items: start;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                                <span class="badge badge-success">${type}</span>
                                                ${content.week ? `<span class="badge badge-warning">Semana ${content.week}</span>` : ''}
                                            </div>
                                            <h3 style="font-size: 1.125rem; margin-bottom: 0.5rem;">${content.title}</h3>
                                            <p style="color: var(--muted-foreground); font-size: 0.875rem;">${content.description || ''}</p>
                                        </div>
                                        <button class="btn btn-outline btn-sm" onclick="app.deleteContent('${content.id}')">
                                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderContentCard(item, index) {

    const alreadyDone = (window.activities || []).some(a => a.contentId === item.id);

    // verifica se a aula anterior já foi concluída
    const previousId = item.previousId;  
    const previousCompleted = !previousId || (window.activities || []).some(a => a.contentId === previousId);

    return `
        <div style="margin-bottom: 2rem;">
            <p style="font-size: 0.875rem; margin-bottom: 0.75rem; opacity:.8;">
                ${item.type === "class" 
                    ? "AULA" 
                    : item.type === "workout" 
                    ? "TREINO" 
                    : "DIETA"} ${index + 1}
            </p>

            <div class="card-gradient card-primary" style="margin-bottom: 1rem;">
                <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${item.title}</h3>
                <p style="opacity: 0.9; margin-bottom: 1rem;">${item.description || ''}</p>

                ${item.content ? `
                    <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 0.5rem;">
                        <pre style="white-space: pre-wrap; font-family: inherit;">${item.content}</pre>
                    </div>
                ` : ""}
            </div>

            ${
                !previousCompleted
                ?
                `
                    <!-- BLOQUEADO -->
                    <div style="padding:1rem; opacity:.7; text-align:center;">
                        <p style="color:var(--muted-foreground); margin-bottom:.5rem;">
                            Conclua a aula anterior para desbloquear esta.
                        </p>
                        <button class="btn btn-primary btn-full" disabled>Bloqueado</button>
                    </div>
                `
                :
                `
                    ${
                        item.fileUrl
                        ?
                        `
                            <!-- Botão de assistir aula -->
                            <button 
                                class="btn btn-primary btn-lg btn-full"
                                style="margin-bottom: 0.75rem;"
                                onclick="window.open('${item.fileUrl}', '_blank')"
                            >
                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                ASSISTIR A AULA
                            </button>

                            <!-- Botão de concluir -->
                            <button 
                                class="btn btn-secondary btn-lg btn-full"
                                onclick="app.registerActivity('${item.id}', 'Aula assistida', this)"
                                ${alreadyDone ? "disabled" : ""}
                            >
                                <svg viewBox='0 0 24 24'>
                                    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                                    <polyline points='22 4 12 14.01 9 11.01'></polyline>
                                </svg>
                                ${alreadyDone ? "CONCLUÍDO" : "MARCAR COMO CONCLUÍDA"}
                            </button>
                        `
                        :
                        `
                            <!-- Caso não tenha vídeo -->
                            <button 
                                class="btn btn-primary btn-lg btn-full"
                                onclick="app.registerActivity('${item.id}', 'Aula assistida', this)"
                                ${alreadyDone ? "disabled" : ""}
                            >
                                <svg viewBox='0 0 24 24'>
                                    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
                                    <polyline points='22 4 12 14.01 9 11.01'></polyline>
                                </svg>
                                ${alreadyDone ? "CONCLUÍDO" : "MARCAR COMO CONCLUÍDA"}
                            </button>
                        `
                    }
                `
            }
        </div>
    `;
},

    async approveSubscription(subscriptionId) {
        try {
            await api.updateSubscriptionStatus(subscriptionId, 'approved');
            showToast('Pagamento aprovado!', 'success');
            this.loadAdminDashboard();
        } catch (error) {
            showToast('Erro ao aprovar pagamento', 'error');
        }
    },

    async rejectSubscription(subscriptionId) {
        try {
            await api.updateSubscriptionStatus(subscriptionId, 'rejected');
            showToast('Pagamento recusado', 'success');
            this.loadAdminDashboard();
        } catch (error) {
            showToast('Erro ao recusar pagamento', 'error');
        }
    },

    async deleteClient(userId, name) {
    const confirmDelete = confirm(
        `Tem certeza que deseja excluir o cliente:\n\n${name}\n\nEssa ação NÃO poderá ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
        const res = await api.call(`/admin/clients/${userId}`, {
            method: 'DELETE'
        });

        if (res?.error) {
            throw new Error(res.error);
        }

        // ✅ Remove da tabela SEM atualizar a página
        const row = document.getElementById(`client-${userId}`);
        if (row) row.remove();

        showToast('Cliente deletado com sucesso', 'success');

    } catch (err) {
        console.error(err);
        showToast('Erro ao deletar cliente', 'error');
    }
},

    showCreatePackageModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">Criar Novo Pacote</h2>
                    <button class="modal-close" type="button" onclick="this.closest('.modal-overlay').remove()" style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: white; cursor: pointer; font-size: 1.5rem;">×</button>
                </div>
                <form id="createPackageForm">
                    <div class="form-group">
                        <label class="form-label">Nome do Pacote</label>
                        <input type="text" name="name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea name="description" class="form-textarea" required></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Preço (R$)</label>
                        <input type="number" name="price" class="form-input" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Número de Aulas</label>
                        <input type="number" name="classCount" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Benefícios (separados por vírgula)</label>
                        <textarea name="benefits" class="form-textarea" placeholder="Benefício 1, Benefício 2, Benefício 3"></textarea>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" class="btn btn-outline btn-full" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary btn-full">
                            Criar Pacote
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('createPackageForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const benefits = form.benefits.value.split(',').map(b => b.trim()).filter(b => b);
            
            try {
                await api.createPackage({
                    name: form.name.value,
                    description: form.description.value,
                    price: form.price.value,
                    classCount: parseInt(form.classCount.value),
                    benefits: benefits
                });
                showToast('Pacote criado com sucesso!', 'success');
                modal.remove();
                this.loadAdminDashboard();
            } catch (error) {
                showToast('Erro ao criar pacote', 'error');
            }
        });
    },

    async deletePackage(packageId) {
        if (!confirm('Tem certeza que deseja excluir este pacote?')) return;
        
        try {
            await api.deletePackage(packageId);
            showToast('Pacote excluído com sucesso!', 'success');
            this.loadAdminDashboard();
        } catch (error) {
            showToast('Erro ao excluir pacote', 'error');
        }
    },

    showCreateContentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">Criar Novo Conteúdo</h2>
                    <button class="modal-close" type="button" onclick="this.closest('.modal-overlay').remove()" style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: white; cursor: pointer; font-size: 1.5rem;">×</button>
                </div>
                <form id="createContentForm">
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <select name="type" class="form-select" required>
                            <option value="workout">💪 Treino</option>
                            <option value="diet">🥗 Dieta</option>
                            <option value="class">📚 Aula</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Título</label>
                        <input type="text" name="title" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea name="description" class="form-textarea"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Conteúdo</label>
                        <textarea name="content" class="form-textarea" rows="6"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Semana (opcional)</label>
                        <input type="number" name="week" class="form-input" min="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">URL do Arquivo/Vídeo (opcional)</label>
                        <input type="url" name="fileUrl" class="form-input" placeholder="https://youtube.com/watch?v=..." />
                        <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.5rem;">
                            💡 Cole o link do YouTube, Google Drive, Vimeo ou qualquer URL pública
                        </p>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" class="btn btn-outline btn-full" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary btn-full">
                            Criar Conteúdo
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('createContentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            
            try {
                await api.createContent({
                    type: form.type.value,
                    title: form.title.value,
                    description: form.description.value,
                    content: form.content.value,
                    week: form.week.value ? parseInt(form.week.value) : null,
                    fileUrl: form.fileUrl.value || null
                });
                showToast('Conteúdo criado com sucesso!', 'success');
                modal.remove();
                this.loadAdminDashboard();
            } catch (error) {
                showToast('Erro ao criar conteúdo', 'error');
            }
        });
    },

    async deleteContent(contentId) {
        if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return;
        
        try {
            await api.deleteContent(contentId);
            showToast('Conteúdo excluído com sucesso!', 'success');
            this.loadAdminDashboard();
        } catch (error) {
            showToast('Erro ao excluir conteúdo', 'error');
        }
    },
    
async openClientActivitiesModal(userId, name) {
  try {
    // 1) Busca atividades do cliente + conteúdos criados pelo admin
    const [activityData, contentData] = await Promise.all([
      api.call(`/activities/${userId}`),
      api.getAdminContent()
    ]);

    const activities = activityData.activities || [];
    const contents = contentData.contents || [];

    // 2) Mapa das atividades concluídas (id => info)
    const completedMap = {};
    activities.forEach(a => {
      const id = a.ContentID || a.contentId || a._id;
      completedMap[id] = {
        date: a.date,
        time: a.time,
        notes: a.notes
      };
    });

    // 3) Junta tudo: todas as aulas + status
    const rowsData = contents.map(c => {
      const id = c.id || c.contentId || c._id;

      return {
        title: c.title || c.name || 'Sem título',
        completed: completedMap[id] || null
      };
    });

    // 4) Ordenar: concluídas mais recentes primeiro, depois não assistidas
    rowsData.sort((a, b) => {
      if (a.completed && b.completed) {
        const dateA = new Date(`${a.completed.date} ${a.completed.time || ''}`);
        const dateB = new Date(`${b.completed.date} ${b.completed.time || ''}`);
        return dateB - dateA;
      }
      if (a.completed) return -1;
      if (b.completed) return 1;
      return 0;
    });

    // cria o modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="modal" style="max-width:700px;">
        <div class="modal-header">
          <h2 class="modal-title">📊 Progresso de ${name}</h2>
          <button class="modal-close" type="button"
            onclick="this.closest('.modal-overlay').remove()"
            style="position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; color: white; font-size:1.5rem; cursor:pointer;">
            ×
          </button>
        </div>

        <div style="margin-top:1rem; max-height: 400px; overflow-y:auto;">
          ${
            rowsData.length === 0
            ? `<p style="opacity:0.6;">Nenhuma aula cadastrada ainda.</p>`
            : `
              <table style="width:100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align:left; padding: 8px;">Conteúdo</th>
                    <th style="text-align:left; padding: 8px;">Data</th>
                    <th style="text-align:left; padding: 8px;">Status</th>
                    <th style="text-align:left; padding: 8px;">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    rowsData.map(item => `
                      <tr>
                        <td style="padding:6px;">${item.title}</td>

                         <td style="padding:6px;">
                          ${item.completed ? fixBackendOffset(item.completed.date, item.completed.time) : '-'}

                            </td>



                        <td style="padding:6px;">
                          ${
                            item.completed
                              ? '<span style="color:#22c55e;">✅ Concluída</span>'
                              : '<span style="opacity:.6;">⏳ Não assistida</span>'
                          }
                        </td>

                        <td style="padding:6px;">
                          ${
                            item.completed
                              ? (item.completed.notes || 'Concluída')
                              : '-'
                          }
                        </td>
                      </tr>
                    `).join('')
                  }
                </tbody>
              </table>
            `
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);

  } catch (error) {
    console.error(error);
    showToast('Erro ao buscar atividades do cliente', 'error');
  }
},

};

    

// Form Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = document.getElementById('loginBtn');
            
            btn.disabled = true;
            btn.innerHTML = '<div class="loader" style="width: 1.5rem; height: 1.5rem; border-width: 2px;"></div>Entrando...';
            
            try {
                const data = await api.login(form.email.value, form.password.value);
                
                app.currentUser = data.user;
                app.currentToken = data.accessToken;
                storage.set('accessToken', data.accessToken);
                
                showToast('Login realizado com sucesso!', 'success');
                
                if (data.user.role === 'admin') {
                    app.navigate('admin');
                } else {
                    app.navigate('client');
                }
            } catch (error) {
                showToast(error.message || 'Email ou senha incorretos', 'error');
                btn.disabled = false;
                btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>ENTRAR';
            }
        });
    }

    // Signup Form Step 1
    const signupForm1 = document.getElementById('signupForm1');
    if (signupForm1) {
        signupForm1.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            
            const password = form.password.value;
            const confirmPassword = form.confirmPassword.value;
            
            if (password !== confirmPassword) {
                showToast('As senhas não coincidem', 'error');
                return;
            }
            
            if (password.length < 6) {
                showToast('A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            app.signupData = {
                name: form.name.value,
                email: form.email.value,
                password: password
            };
            
            app.signupStep = 2;
            document.getElementById('step-1-content').classList.add('hidden');
            document.getElementById('step-2-content').classList.remove('hidden');
            app.updateSignupProgress();
        });
    }

    // Signup Form Step 2
    const signupForm2 = document.getElementById('signupForm2');
    if (signupForm2) {
        signupForm2.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = document.getElementById('signupBtn2');
            
            btn.disabled = true;
            btn.innerHTML = '<div class="loader" style="width: 1.5rem; height: 1.5rem; border-width: 2px;"></div>Criando conta...';
            
            const initialAssessment = {
                weight: form.weight.value,
                height: form.height.value,
                age: form.age.value,
                goals: form.goals.value,
                restrictions: form.restrictions.value || '',
                medicalHistory: form.medicalHistory.value || ''
            };
            
            try {
                await api.signup(
                    app.signupData.email,
                    app.signupData.password,
                    app.signupData.name,
                    initialAssessment
                );
                
                showToast('Conta criada com sucesso!', 'success');
                
                app.signupStep = 3;
                document.getElementById('step-2-content').classList.add('hidden');
                document.getElementById('step-3-content').classList.remove('hidden');
                app.updateSignupProgress();


            } catch (error) {
                showToast(error.message || 'Erro ao criar conta. Tente novamente.', 'error');
                btn.disabled = false;
                btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>FINALIZAR CADASTRO';
            }
        });
    }

    // ==========================
// TOGGLE MOSTRAR/OCULTAR SENHA - LOGIN
// ==========================

// Função global para funcionar no onclick do HTML
window.toggleLoginPassword = function () {
    const input = document.getElementById("login-password");
    const btn = document.querySelector(".toggle-password");

    if (!input || !btn) return;

    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "👁";
    } else {
        input.type = "password";
        btn.textContent = "👁";
    }
};

// Garante que o botão funcione mesmo quando a tela de login for reaberta
function attachPasswordToggle() {
    const toggleBtn = document.querySelector(".toggle-password");
    const input = document.getElementById("login-password");

    if (!toggleBtn || !input) return;

    // Remove possíveis listeners duplicados
    const newBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

    newBtn.addEventListener("click", function () {
        if (input.type === "password") {
            input.type = "text";
            newBtn.textContent = "👁";
        } else {
            input.type = "password";
            newBtn.textContent = "👁";
        }
    });
}

// Tenta ativar o botão quando a página carrega
document.addEventListener("DOMContentLoaded", attachPasswordToggle);

// E tenta de novo quando a tela de login for exibida
const loginTab = document.getElementById("login-tab");
if (loginTab) {
    loginTab.addEventListener("click", () => {
        setTimeout(attachPasswordToggle, 100);
    });
    
}


    // Initialize app
    app.init();
});
