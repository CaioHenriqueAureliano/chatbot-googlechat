// ============================================================
// Dashboard — IPNET by VIVO | Chatbot Suporte
// ============================================================

Chart.defaults.color = '#8b9ab2';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;

let volumeChartInstance = null;
let deptChartInstance = null;

// Patrimônio Globais
let globalPatrimonioData = [];
let patrimonioStatusChartInstance = null;
let patrimonioModelosChartInstance = null;

// ── Inicialização ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initNavigation();
    initModal();
    fetchDashboardData();
});

// ── Modal do Ticket ───────────────────────────────────────────
function initModal() {
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.getElementById('closeTicketModalBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTicketModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeTicketModal();
        });
    }
}

function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    if (modal) modal.classList.remove('active');
}

// ── Tema Claro / Escuro ───────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);

    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const isLight = document.documentElement.classList.contains('light');
            applyTheme(isLight ? 'dark' : 'light');
        });
    }
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
}

// ── Navegação (Tabs) ──────────────────────────────────────────
function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove classe active de todos os menus e páginas
            menuItems.forEach(m => m.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            // Adiciona classe active ao clicado e à página alvo
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                const targetPage = document.getElementById(targetId);
                if (targetPage) targetPage.classList.add('active');
            }

            // Fecha menu no mobile após clicar
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const hamburger = document.getElementById('hamburgerBtn');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                hamburger.setAttribute('aria-expanded', false);
            }
        });
    });
}

// ── Menu Mobile (Hamburger) ───────────────────────────────────
function initMobileMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');

    if (!hamburger || !sidebar || !overlay) return;

    hamburger.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');
        overlay.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
    });
}

// ── Busca de dados ────────────────────────────────────────────
async function fetchDashboardData() {
    setConnectionStatus(false);

    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        // Busca tickets do Freshservice
        let freshTickets = [];
        try {
            const responseTickets = await fetch('/api/tickets');
            if (responseTickets.ok) {
                const resultTickets = await responseTickets.json();
                if (resultTickets.status === 'ok') {
                    // A API do Freshservice retorna um objeto { tickets: [...] } dentro de response.data
                    // Então verificamos se existe um array aninhado, caso contrário usamos direto
                    freshTickets = (resultTickets.tickets && resultTickets.tickets.tickets) 
                                   ? resultTickets.tickets.tickets 
                                   : (resultTickets.tickets || []);
                }
            }
        } catch (e) {
            console.warn('Aviso: Não foi possível carregar os tickets do Freshservice', e);
        }

        if (result.status === 'ok') {
            setConnectionStatus(true);
            processData(result.logs || [], result.patrimonio || [], freshTickets);
        } else {
            throw new Error(result.message || 'Resposta inválida');
        }
    } catch (error) {
        console.error('[Dashboard] Erro ao carregar dados:', error.message);
        setConnectionStatus(false);
        showTableError('Não foi possível carregar os dados. Verifique a conexão com a planilha.');
    }
}

function setConnectionStatus(connected) {
    const dot  = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');
    if (!dot || !text) return;

    if (connected) {
        dot.style.background  = '#22c55e';
        dot.style.boxShadow   = '0 0 0 2px rgba(34, 197, 94, 0.12)';
        text.textContent      = 'Conectado';
    } else {
        dot.style.background  = '#ef4444';
        dot.style.boxShadow   = '0 0 0 2px rgba(239, 68, 68, 0.12)';
        text.textContent      = 'Sem conexão';
    }
}

// ── Processamento principal ───────────────────────────────────
function processData(logs, patrimonio, freshTickets = []) {
    updateLastUpdated();

    // Sincroniza os dados do Freshservice com os logs antes de gerar gráficos e tabelas
    logs.forEach(log => {
        const ticketId = log['Ticket Freshdesk'];
        if (ticketId && ticketId !== '-') {
            const numericId = String(ticketId).replace(/\D/g, '');
            const realTicket = freshTickets.find(t => String(t.id) === numericId);
            
            if (realTicket) {
                // Se o analista mudou a categoria no Fresh para algo diferente do padrão, atualiza no gráfico
                if (realTicket.category && realTicket.category !== 'Suporte Interno') {
                    log['Categoria Principal'] = realTicket.category;
                }
                // Se houver subcategoria no Fresh, podemos adicionar ao problema
                if (realTicket.sub_category) {
                    log['Problema Reportado'] = `${realTicket.subject} (${realTicket.sub_category})`;
                } else if (realTicket.subject) {
                    log['Problema Reportado'] = realTicket.subject;
                }
            }
        }
    });

    // 1. Métricas
    const totalAtendimentos = logs.length;
    const totalTickets      = logs.filter(l => l['Ticket Freshdesk'] && l['Ticket Freshdesk'] !== '-').length;
    const semTicket         = totalAtendimentos - totalTickets;
    const taxaBot           = totalAtendimentos > 0
        ? Math.round((semTicket / totalAtendimentos) * 100)
        : 0;

    const usuariosUnicos = new Set(
        logs.map(l => l['E-mail'] || l['Telefone']).filter(Boolean)
    ).size;

    setText('totalAtendimentos', totalAtendimentos.toLocaleString('pt-BR'));
    setText('totalTickets',      totalTickets.toLocaleString('pt-BR'));
    setText('taxaResolucao',     taxaBot + '%');
    setText('usuariosUnicos',    usuariosUnicos.toLocaleString('pt-BR'));

    setText('trendTotal',    `${totalAtendimentos} registro(s) na planilha`);
    setText('trendTickets',  `${totalTickets} ticket(s) criado(s) no Freshservice`);
    setText('trendResolucao', `Resolvidos sem escalonar para humano`);
    setText('trendUsuarios', `${usuariosUnicos} usuário(s) identificado(s)`);

    // 2. Gráficos
    const volumeData = processVolumeData(logs);
    renderVolumeChart(volumeData.labels, volumeData.data);

    const deptData = processDeptData(logs);
    renderDeptChart(deptData.labels, deptData.data);

    // 3. Tabelas e Dashboard Patrimônio
    const recentes = [...logs].slice(-20).reverse(); // Copia e pega os 20 últimos
    setText('tableCount', `${recentes.length} mais recentes`);
    populateTable(recentes); // Dashboard
    populateFullTicketsTable(logs, freshTickets); // Aba Atendimentos
    
    // Patrimônio
    globalPatrimonioData = patrimonio || [];
    initPatrimonioDashboard();
}

// ── Processamento de dados ────────────────────────────────────
function processVolumeData(logs) {
    const countsByDate = {};

    logs.forEach(log => {
        const raw = String(log['Data/Hora'] || '');
        // Formato "DD/MM/YYYY HH:MM:SS" ou ISO
        const datePart = raw.split(' ')[0].split('T')[0];
        if (datePart) {
            countsByDate[datePart] = (countsByDate[datePart] || 0) + 1;
        }
    });

    const allKeys = Object.keys(countsByDate);
    const last7   = allKeys.slice(-7);

    return {
        labels: last7.length ? last7 : ['Sem dados'],
        data:   last7.length ? last7.map(k => countsByDate[k]) : [0]
    };
}

function processDeptData(logs) {
    const counts = {};
    const ignorar = ['Navegação', 'Erro de Navegação', 'Onboarding'];

    logs.forEach(log => {
        const cat = log['Categoria Principal'] || 'Sem Categoria';
        if (!ignorar.includes(cat)) {
            counts[cat] = (counts[cat] || 0) + 1;
        }
    });

    return {
        labels: Object.keys(counts),
        data:   Object.values(counts)
    };
}

// ── Gráficos ──────────────────────────────────────────────────
const PALETTE = ['#4f76f6', '#818cf8', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

function renderVolumeChart(labels, data) {
    const canvas = document.getElementById('volumeChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (volumeChartInstance) volumeChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0,   'rgba(79, 118, 246, 0.4)');
    gradient.addColorStop(1,   'rgba(79, 118, 246, 0.0)');

    volumeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Interações',
                data,
                borderColor:          '#4f76f6',
                backgroundColor:      gradient,
                borderWidth:          2,
                pointBackgroundColor: '#4f76f6',
                pointBorderColor:     '#0b1120',
                pointBorderWidth:     2,
                pointRadius:          4,
                pointHoverRadius:     6,
                fill:                 true,
                tension:              0.4
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(11, 17, 32, 0.95)',
                    borderColor:     'rgba(255, 255, 255, 0.1)',
                    borderWidth:     1,
                    titleColor:      '#f1f5f9',
                    bodyColor:       '#8b9ab2',
                    padding:         12,
                    displayColors:   false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid:   { color: 'rgba(255, 255, 255, 0.04)' },
                    border: { display: false },
                    ticks:  { stepSize: 1 }
                },
                x: {
                    grid:   { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

function renderDeptChart(labels, data) {
    const canvas = document.getElementById('deptChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (deptChartInstance) deptChartInstance.destroy();

    if (!labels.length) {
        labels = ['Sem dados'];
        data   = [1];
    }

    deptChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: PALETTE.slice(0, labels.length),
                borderWidth:     0,
                hoverOffset:     6
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            cutout:              '72%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding:        18,
                        usePointStyle:  true,
                        pointStyle:     'circle',
                        font:           { size: 11 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 17, 32, 0.95)',
                    borderColor:     'rgba(255, 255, 255, 0.1)',
                    borderWidth:     1,
                    titleColor:      '#f1f5f9',
                    bodyColor:       '#8b9ab2',
                    padding:         12
                }
            }
        }
    });
}

// ── Tabela ────────────────────────────────────────────────────
function populateTable(logs) {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-loading">Nenhum registro encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    logs.forEach(row => {
        const ticketId  = row['Ticket Freshdesk'];
        const hasTicket = ticketId && ticketId !== '-';
        const status    = hasTicket ? 'Ticket aberto' : 'Sem ticket';
        const badgeClass = hasTicket ? 'badge-success' : 'badge-neutral';

        const usuario    = row['E-mail'] || row['Telefone'] || '—';
        const categoria  = row['Categoria Principal'] || '—';
        const problema   = row['Problema Reportado'] || '—';
        const dataHora   = String(row['Data/Hora'] || '—');

        const tr = document.createElement('tr');
        
        if (hasTicket) {
            tr.classList.add('clickable-row');
            const numericId = String(ticketId).replace(/\D/g, '');
            tr.onclick = () => openTicketModal(numericId);
        }

        tr.innerHTML = `
            <td class="muted">${escapeHtml(usuario)}</td>
            <td>${escapeHtml(categoria)}</td>
            <td class="muted">${escapeHtml(problema)}</td>
            <td><span class="badge ${badgeClass}">${status}</span></td>
            <td class="muted">${escapeHtml(dataHora)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getFreshStatus(statusId) {
    switch(statusId) {
        case 2: return { text: 'Aberto', class: 'badge-warning' };
        case 3: return { text: 'Pendente', class: 'badge-neutral' };
        case 4: return { text: 'Resolvido', class: 'badge-success' };
        case 5: return { text: 'Encerrado', class: 'badge-success' };
        default: return { text: `Status ${statusId}`, class: 'badge-neutral' };
    }
}

function populateFullTicketsTable(logs, freshTickets = []) {
    const tbody = document.getElementById('fullTicketsTableBody');
    if (!tbody) return;

    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-loading">Nenhum atendimento registrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    // Clona o array para não alterar o original
    const allLogs = [...logs].reverse();
    
    allLogs.forEach(row => {
        const ticketId = row['Ticket Freshdesk'] && row['Ticket Freshdesk'] !== '-' ? row['Ticket Freshdesk'] : '-';
        // Assumimos WhatsApp como padrão temporário se não houver coluna "Origem"
        const origem = row['Origem'] || 'WhatsApp'; 
        
        let badgeClass = 'badge-neutral';
        let statusText = 'Resolvido pelo Bot';

        if (ticketId !== '-') {
            // Remove prefixos como "SR-" ou "#" deixando só os números para garantir o match
            const numericSpreadsheetId = String(ticketId).replace(/\D/g, '');
            // Tenta achar o ticket no array do Freshservice
            const realTicket = freshTickets.find(t => String(t.id) === numericSpreadsheetId);
            
            if (realTicket) {
                const freshInfo = getFreshStatus(realTicket.status);
                statusText = freshInfo.text;
                badgeClass = freshInfo.class;
            } else {
                // Se não achar na listagem recente, exibe como histórico
                statusText = 'Histórico';
                badgeClass = 'badge-neutral';
            }
        } else {
            badgeClass = 'badge-success';
        }

        const tr = document.createElement('tr');
        
        if (ticketId !== '-') {
            tr.classList.add('clickable-row');
            const numericId = String(ticketId).replace(/\D/g, '');
            tr.onclick = () => openTicketModal(numericId);
        }

        tr.innerHTML = `
            <td><strong>${ticketId !== '-' ? '#' + escapeHtml(ticketId) : '-'}</strong></td>
            <td><span class="badge badge-neutral">${escapeHtml(origem)}</span></td>
            <td class="muted">${escapeHtml(row['E-mail'] || row['Telefone'] || '—')}</td>
            <td>${escapeHtml(row['Problema Reportado'] || '—')}</td>
            <td><span class="badge ${badgeClass}">${statusText}</span></td>
            <td class="muted">${escapeHtml(String(row['Data/Hora'] || '—'))}</td>
        `;
        tbody.appendChild(tr);
    });
}

function populatePatrimonioTable(patrimonio) {
    const tbody = document.getElementById('patrimonioTableBody');
    if (!tbody) return;

    if (!patrimonio || !patrimonio.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-loading">Nenhum equipamento cadastrado. (Crie uma aba "Patrimônio" na planilha)</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    
    patrimonio.forEach(row => {
        const serial = row['Serial'] || row['TAG'] || row['ID'] || row['Numero de serie'] || '—';
        const marca = row['Marca'] || '—';
        const equipamento = row['Equipamento'] || row['Tipo'] || row['Modelo'] || '—';
        const colaborador = row['Colaborador'] || row['Usuário'] || row['Nome'] || '—';
        const statusOriginal = row['Status'] || row['Estado '] || row['Estado'] || row['Condição'] || 'Estoque';
        const group = getStatusGroup(statusOriginal);
        
        let badgeClass = 'badge-neutral';
        if (group === 'uso') badgeClass = 'badge-success';
        else if (group === 'manuten') badgeClass = 'badge-danger';
        else if (group === 'estoque') badgeClass = 'badge-warning';

        const dataMod = row['Última Atualização'] || row['Data'] || '—';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(serial)}</strong></td>
            <td>${escapeHtml(marca)}</td>
            <td>${escapeHtml(equipamento)}</td>
            <td class="muted">${escapeHtml(colaborador)}</td>
            <td><span class="badge ${badgeClass}">${escapeHtml(statusOriginal)}</span></td>
            <td class="muted">${escapeHtml(String(dataMod))}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showTableError(message) {
    const tbody = document.getElementById('activityTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-loading">${escapeHtml(message)}</td></tr>`;
    }
}

// ── Utilitários ───────────────────────────────────────────────
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function updateLastUpdated() {
    const now = new Date().toLocaleString('pt-BR', {
        day:    '2-digit',
        month:  '2-digit',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit'
    });
    setText('lastUpdated', `Atualizado em ${now}`);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Lógica do Espelho do Ticket ───────────────────────────────
async function openTicketModal(ticketId) {
    const modal = document.getElementById('ticketModal');
    const title = document.getElementById('modalTicketId');
    const subtitle = document.getElementById('modalTicketSubject');
    const body = document.getElementById('modalTicketBody');

    if (!modal) return;

    title.textContent = `#${ticketId}`;
    subtitle.textContent = 'Buscando histórico no Freshservice...';
    body.innerHTML = '<div class="modal-loading">Buscando histórico e interações...</div>';
    
    modal.classList.add('active');

    try {
        const res = await fetch(`/api/tickets/${ticketId}`);
        if (!res.ok) throw new Error('Falha ao buscar detalhes');
        const data = await res.json();
        
        if (data.status === 'ok') {
            subtitle.textContent = data.ticket.subject || 'Ticket sem assunto';
            renderTicketTimeline(data.ticket, data.conversations);
        } else {
            throw new Error('Erro na resposta');
        }
    } catch (e) {
        console.error(e);
        body.innerHTML = `<div class="modal-loading" style="color: var(--danger);">Não foi possível carregar o histórico deste ticket.</div>`;
        subtitle.textContent = 'Erro ao carregar';
    }
}

function renderTicketTimeline(ticket, conversations) {
    const body = document.getElementById('modalTicketBody');
    let html = '<div class="timeline">';

    // 1. Mensagem original (Requester)
    const createdAt = new Date(ticket.created_at).toLocaleString('pt-BR');
    html += `
        <div class="chat-bubble chat-requester">
            <div class="chat-meta">
                <span><strong>Solicitante</strong></span>
                <span>${createdAt}</span>
            </div>
            <div class="chat-content">
                ${ticket.description}
            </div>
        </div>
    `;

    // 2. Interações (Respostas e Notas)
    if (conversations && conversations.length > 0) {
        conversations.forEach(conv => {
            const date = new Date(conv.created_at).toLocaleString('pt-BR');
            let bubbleClass = '';
            let senderName = '';

            // Notas públicas ou respostas do agente
            if (conv.incoming === false) {
                bubbleClass = 'chat-agent';
                senderName = 'Suporte IPNET (Analista)';
            } else {
                bubbleClass = 'chat-requester';
                senderName = 'Solicitante (Resposta)';
            }

            // Nota Privada
            if (conv.private) {
                bubbleClass = 'chat-note';
                senderName = 'Nota Interna (Invisível ao usuário)';
            }

            html += `
                <div class="chat-bubble ${bubbleClass}">
                    <div class="chat-meta">
                        <span><strong>${senderName}</strong></span>
                        <span>${date}</span>
                    </div>
                    <div class="chat-content">
                        ${conv.body}
                    </div>
                </div>
            `;
        });
    } else {
        html += `<div class="chat-note">Nenhuma interação registrada após a abertura.</div>`;
    }

    html += '</div>';
    body.innerHTML = html;
}

// ── Lógica do Dashboard de Patrimônio ─────────────────────────
function initPatrimonioDashboard() {
    // 1. Calcula KPIs
    calculatePatrimonioKPIs(globalPatrimonioData);
    
    // 2. Renderiza Gráficos
    renderPatrimonioCharts(globalPatrimonioData);
    
    // 3. Popula a tabela
    populatePatrimonioTable(globalPatrimonioData);
    
    // 4. Preenche o filtro de equipamentos com valores únicos
    const equipamentoFilter = document.getElementById('filterPatrimonioEquipamento');
    if (equipamentoFilter && !equipamentoFilter.hasAttribute('data-populated')) {
        const uniqueEquips = new Set();
        globalPatrimonioData.forEach(row => {
            const eq = String(row['Equipamento'] || row['Tipo'] || row['Modelo'] || '').trim();
            if (eq) uniqueEquips.add(eq);
        });
        
        const sortedEquips = Array.from(uniqueEquips).sort();
        sortedEquips.forEach(eq => {
            const option = document.createElement('option');
            option.value = eq.toLowerCase();
            option.textContent = eq;
            equipamentoFilter.appendChild(option);
        });
        equipamentoFilter.setAttribute('data-populated', 'true');
    }

    // 5. Configura Event Listeners dos Filtros (só adiciona uma vez)
    const statusFilter = document.getElementById('filterPatrimonioStatus');
    const searchFilter = document.getElementById('filterPatrimonioSearch');
    
    if (equipamentoFilter && !equipamentoFilter.hasAttribute('data-bound')) {
        equipamentoFilter.addEventListener('change', filterPatrimonioData);
        equipamentoFilter.setAttribute('data-bound', 'true');
    }

    if (statusFilter && !statusFilter.hasAttribute('data-bound')) {
        statusFilter.addEventListener('change', filterPatrimonioData);
        statusFilter.setAttribute('data-bound', 'true');
    }
    
    if (searchFilter && !searchFilter.hasAttribute('data-bound')) {
        searchFilter.addEventListener('input', filterPatrimonioData);
        searchFilter.setAttribute('data-bound', 'true');
    }
}

function filterPatrimonioData() {
    const equipVal = document.getElementById('filterPatrimonioEquipamento')?.value.toLowerCase() || '';
    const statusVal = document.getElementById('filterPatrimonioStatus')?.value.toLowerCase() || '';
    const searchVal = document.getElementById('filterPatrimonioSearch')?.value.toLowerCase() || '';
    
    const filtered = globalPatrimonioData.filter(row => {
        const serial = String(row['Serial'] || row['TAG'] || row['ID'] || row['Numero de serie'] || '').toLowerCase();
        const colaborador = String(row['Colaborador'] || row['Usuário'] || row['Nome'] || '').toLowerCase();
        const equip = String(row['Equipamento'] || row['Tipo'] || row['Modelo'] || '').toLowerCase();
        const rawStatus = row['Status'] || row['Estado '] || row['Estado'] || row['Condição'] || 'Estoque';
        const group = getStatusGroup(rawStatus);
        
        let matchEquip = true;
        if (equipVal) matchEquip = equip === equipVal;

        let matchStatus = true;
        if (statusVal) matchStatus = group === statusVal;
        
        let matchSearch = true;
        if (searchVal) matchSearch = serial.includes(searchVal) || colaborador.includes(searchVal);
        
        return matchEquip && matchStatus && matchSearch;
    });
    
    populatePatrimonioTable(filtered);
    calculatePatrimonioKPIs(filtered);
    renderPatrimonioCharts(filtered);
}

function getStatusGroup(rawStatus) {
    const s = String(rawStatus || '').toLowerCase();
    if (s.includes('uso') || s.includes('usad') || s.includes('alocado') || s.includes('ativo')) return 'uso';
    if (s.includes('manuten') || s.includes('defeito') || s.includes('quebrad')) return 'manuten';
    return 'estoque'; // Default se não identificar
}

function getStatusColor(rawStatus) {
    const group = getStatusGroup(rawStatus);
    if (group === 'uso') return '#22c55e'; // Verde
    if (group === 'manuten') return '#ef4444'; // Vermelho
    return '#f59e0b'; // Amarelo (Estoque)
}

function calculatePatrimonioKPIs(data) {
    let total = data.length;
    let emUso = 0;
    let estoque = 0;
    let manutencao = 0;

    data.forEach(row => {
        const rawStatus = row['Status'] || row['Estado '] || row['Estado'] || row['Condição'] || 'Estoque';
        const group = getStatusGroup(rawStatus);
        
        if (group === 'uso') emUso++;
        else if (group === 'manuten') manutencao++;
        else estoque++;
    });

    setText('patrimonioTotal', total);
    setText('patrimonioUso', emUso);
    setText('patrimonioEstoque', estoque);
    setText('patrimonioManutencao', manutencao);
}

function renderPatrimonioCharts(data) {
    // 1. Gráfico de Status (Rosca)
    const statusCounts = {};
    const modelCounts = {};

    data.forEach(row => {
        const rawStatus = row['Status'] || row['Estado '] || row['Estado'] || row['Condição'] || 'Estoque';
        const s = String(rawStatus).trim();
        statusCounts[s] = (statusCounts[s] || 0) + 1;
        
        const m = String(row['Modelo'] || row['Equipamento'] || 'Não Informado').trim();
        if (m) {
            modelCounts[m] = (modelCounts[m] || 0) + 1;
        }
    });

    const statusCtx = document.getElementById('patrimonioStatusChart');
    if (statusCtx) {
        if (patrimonioStatusChartInstance) patrimonioStatusChartInstance.destroy();
        
        const labels = Object.keys(statusCounts);
        const vals = Object.values(statusCounts);
        const bgColors = labels.map(lbl => getStatusColor(lbl));
        
        patrimonioStatusChartInstance = new Chart(statusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Sem dados'],
                datasets: [{
                    data: vals.length ? vals : [1],
                    backgroundColor: bgColors.length ? bgColors : ['#8b9ab2'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#8b9ab2', font: { size: 11 }, usePointStyle: true, padding: 15 }
                    }
                }
            }
        });
    }

    // 2. Gráfico de Modelos (Barras Horizontais)
    const modelCtx = document.getElementById('patrimonioModelosChart');
    if (modelCtx) {
        if (patrimonioModelosChartInstance) patrimonioModelosChartInstance.destroy();
        
        // Ordena para pegar os top 5 modelos
        const sortedModels = Object.entries(modelCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
            
        const labels = sortedModels.map(item => item[0]);
        const vals = sortedModels.map(item => item[1]);

        patrimonioModelosChartInstance = new Chart(modelCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sem dados'],
                datasets: [{
                    label: 'Quantidade',
                    data: vals.length ? vals : [0],
                    backgroundColor: '#4f76f6',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // Barras horizontais
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: { stepSize: 1 }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
}
