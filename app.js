/**
 * Inicializa a estrutura do banco de dados simulado no localStorage.
 */
function initDB() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('todos')) {
        localStorage.setItem('todos', JSON.stringify([]));
    }
}

/**
 * Elementos da interface mapeados.
 */
let elements = {};

function initializeElements() {
    elements = {
        views: {
            login: document.getElementById('login-view'),
            register: document.getElementById('register-view'),
            dashboard: document.getElementById('dashboard-view')
        },
        forms: {
            login: document.getElementById('login-form'),
            register: document.getElementById('register-form'),
            todo: document.getElementById('todo-form')
        },
        links: {
            goToRegister: document.getElementById('go-to-register'),
            goToLogin: document.getElementById('go-to-login')
        },
        buttons: {
            logout: document.getElementById('logout-btn')
        },
        texts: {
            welcomeMessage: document.getElementById('welcome-message')
        },
        containers: {
            todoList: document.getElementById('todo-list'),
            emptyState: document.getElementById('empty-state')
        }
    };
}

/**
 * Alterna a visualização ativa da aplicação.
 */
function showView(viewName) {
    Object.values(elements.views).forEach(view => {
        view.classList.add('hidden');
    });
    elements.views[viewName].classList.remove('hidden');
}

/**
 * Exibe uma mensagem de erro inline.
 */
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

/**
 * Oculta mensagens de erro de um formulário.
 */
function clearErrors(formType) {
    const errorElements = document.querySelectorAll(`[id^="${formType}-"][id$="-error"]`);
    errorElements.forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
}

/**
 * Utilitário para proteção contra XSS (Cross-Site Scripting).
 */
function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Renderiza a lista de tarefas do usuário logado.
 */
function renderTodos() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const allTodos = JSON.parse(localStorage.getItem('todos')) || [];
    const userTodos = allTodos.filter(t => t.userId === currentUser.email);
    
    const listEl = elements.containers.todoList;
    const emptyEl = elements.containers.emptyState;
    
    listEl.innerHTML = '';
    
    if (userTodos.length === 0) {
        emptyEl.classList.remove('hidden');
        emptyEl.classList.add('flex');
        return;
    }
    
    emptyEl.classList.add('hidden');
    emptyEl.classList.remove('flex');
    
    // Ordenar: tarefas pendentes primeiro, concluídas no final.
    // Dentre o mesmo status, as mais recentes primeiro.
    userTodos.sort((a, b) => {
        if (a.done === b.done) {
            return b.id - a.id;
        }
        return a.done ? 1 : -1;
    });
    
    userTodos.forEach(todo => {
        const badgeColors = {
            'Trabalho': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Pessoal': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Estudos': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        
        const badgeClass = badgeColors[todo.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        
        const cardOpacityClass = todo.done ? 'opacity-50' : 'opacity-100';
        const titleTextClass = todo.done ? 'line-through text-slate-500' : 'text-slate-200';
        const descTextClass = todo.done ? 'line-through text-slate-600' : 'text-slate-400';
        
        const card = document.createElement('div');
        card.className = `bg-[#0f172a]/40 border border-slate-700/50 rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-5 items-start sm:items-center hover:bg-[#0f172a]/60 transition-all duration-300 ${cardOpacityClass}`;
        
        const descHtml = todo.description 
            ? `<p class="text-sm mt-2 font-light leading-relaxed ${descTextClass}">${escapeHtml(todo.description).replace(/\n/g, '<br>')}</p>` 
            : '';
            
        const actionButton = todo.done 
            ? `<button disabled class="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Concluída
               </button>`
            : `<button onclick="completeTodo(${todo.id})" class="px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all duration-200 flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-emerald-500">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Concluir
               </button>`;

        card.innerHTML = `
            <div class="flex-grow w-full sm:w-auto">
                <div class="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 class="text-lg font-medium ${titleTextClass}">${escapeHtml(todo.title)}</h3>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide ${badgeClass}">${escapeHtml(todo.type)}</span>
                </div>
                ${descHtml}
            </div>
            <div class="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                ${actionButton}
            </div>
        `;
        
        listEl.appendChild(card);
    });
}

/**
 * Criação de uma nova tarefa a partir do formulário.
 */
function handleAddTodo(e) {
    e.preventDefault();
    clearErrors('todo');
    
    const title = document.getElementById('todo-title').value.trim();
    const type = document.getElementById('todo-type').value;
    const description = document.getElementById('todo-desc').value.trim();
    
    if (!title) {
        showError('todo-title-error', 'O título da tarefa é obrigatório.');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const allTodos = JSON.parse(localStorage.getItem('todos')) || [];
    
    const newTodo = {
        id: Date.now(),
        userId: currentUser.email,
        title,
        type,
        description,
        done: false
    };
    
    allTodos.push(newTodo);
    localStorage.setItem('todos', JSON.stringify(allTodos));
    
    e.target.reset();
    renderTodos();
}

/**
 * Marca uma tarefa específica como concluída.
 * Inserida no window para estar acessível através de inline onclick.
 */
window.completeTodo = function(id) {
    const allTodos = JSON.parse(localStorage.getItem('todos')) || [];
    const todoIndex = allTodos.findIndex(t => t.id === id);
    
    if (todoIndex !== -1) {
        allTodos[todoIndex].done = true;
        localStorage.setItem('todos', JSON.stringify(allTodos));
        renderTodos();
    }
}

/**
 * Login handler
 */
function handleLogin(e) {
    e.preventDefault();
    clearErrors('login');
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    let hasError = false;
    
    if (!email) {
        showError('login-email-error', 'O e-mail é obrigatório.');
        hasError = true;
    }
    if (!password) {
        showError('login-password-error', 'A senha é obrigatória.');
        hasError = true;
    }
    
    if (hasError) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showError('login-general-error', 'E-mail não cadastrado.');
        return;
    }
    
    if (user.password !== password) {
        showError('login-general-error', 'Senha incorreta.');
        return;
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    e.target.reset();
    checkAuthState();
}

/**
 * Register handler
 */
function handleRegister(e) {
    e.preventDefault();
    clearErrors('register');
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    let hasError = false;
    
    if (!name) {
        showError('register-name-error', 'O nome é obrigatório.');
        hasError = true;
    }
    if (!email) {
        showError('register-email-error', 'O e-mail é obrigatório.');
        hasError = true;
    }
    if (!password) {
        showError('register-password-error', 'A senha é obrigatória.');
        hasError = true;
    }
    
    if (hasError) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users.some(u => u.email === email)) {
        showError('register-general-error', 'Este e-mail já está em uso.');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    e.target.reset();
    checkAuthState();
}

/**
 * Logout handler
 */
function handleLogout() {
    localStorage.removeItem('currentUser');
    checkAuthState();
}

/**
 * Verifica estado de autenticação
 */
function checkAuthState() {
    try {
        const currentUserText = localStorage.getItem('currentUser');
        
        if (currentUserText && currentUserText !== 'undefined' && currentUserText !== 'null') {
            const currentUser = JSON.parse(currentUserText);
            if (currentUser && currentUser.email) {
                elements.texts.welcomeMessage.textContent = `Olá, ${currentUser.name || 'Usuário'}`;
                showView('dashboard');
                renderTodos();
                return;
            }
        }
    } catch (e) {
        console.error("Erro na autenticação:", e);
    }
    
    // Limpa estado se falhar e mostra login
    localStorage.removeItem('currentUser');
    showView('login');
}

/**
 * Event listeners
 */
function setupEventListeners() {
    elements.forms.login.addEventListener('submit', handleLogin);
    elements.forms.register.addEventListener('submit', handleRegister);
    elements.forms.todo.addEventListener('submit', handleAddTodo);
    
    const forgotPasswordBtn = document.getElementById('forgot-password');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            if (!email) {
                showError('login-email-error', 'Digite seu e-mail para recuperar a senha.');
                return;
            }
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email);
            if (user) {
                alert(`Recuperação de senha\n\nSua senha é: ${user.password}\n\n(Em um sistema real, um link de redefinição seria enviado para o seu e-mail)`);
            } else {
                showError('login-general-error', 'E-mail não encontrado no sistema.');
            }
        });
    }

    elements.links.goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        clearErrors('login');
        elements.forms.login.reset();
        showView('register');
    });
    
    elements.links.goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        clearErrors('register');
        elements.forms.register.reset();
        showView('login');
    });
    
    elements.buttons.logout.addEventListener('click', handleLogout);
}

/**
 * Init
 */
function initApp() {
    initializeElements();
    initDB();
    setupEventListeners();
    checkAuthState();
}

document.addEventListener('DOMContentLoaded', initApp);
