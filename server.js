require('dotenv').config();
const express = require('express');
const axios = require('axios');
const knowledge = require('./knowledge');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Servir o dashboard

// ═══════════════════════════════════════════════════
//  ROTAS DO DASHBOARD E TICKETS (API)
// ═══════════════════════════════════════════════════
app.get('/api/dashboard', async (req, res) => {
    try {
        const response = await axios.get(process.env.APP_SCRIPT_URL);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error.message);
        res.status(500).json({ error: 'Erro ao buscar dados do Google Sheets' });
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const apiKey = process.env.FRESHSERVICE_API_KEY || process.env.FRESHDESK_API_KEY;
        const authHeader = 'Basic ' + Buffer.from(apiKey + ':X').toString('base64');
        const domain = 'https://ipnetcloud.freshservice.com';

        const response = await axios.get(`${domain}/api/v2/tickets?per_page=30&order_by=created_at&order_type=desc`, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });
        res.json({ status: 'ok', tickets: response.data });
    } catch (error) {
        console.error('Erro ao buscar tickets do Freshservice:', error.message);
        res.status(500).json({ error: 'Erro ao buscar tickets' });
    }
});

app.get('/api/tickets/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const apiKey = process.env.FRESHSERVICE_API_KEY || process.env.FRESHDESK_API_KEY;
        const authHeader = 'Basic ' + Buffer.from(apiKey + ':X').toString('base64');
        const domain = 'https://ipnetcloud.freshservice.com';

        const ticketResponse = await axios.get(`${domain}/api/v2/tickets/${ticketId}`, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });

        const convResponse = await axios.get(`${domain}/api/v2/tickets/${ticketId}/conversations`, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });
        
        res.json({ 
            status: 'ok', 
            ticket: ticketResponse.data.ticket, 
            conversations: convResponse.data.conversations 
        });
    } catch (error) {
        console.error(`Erro ao buscar detalhes do ticket ${req.params.id}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar detalhes do ticket' });
    }
});

// ═══════════════════════════════════════════════════
//  SESSÕES EM MEMÓRIA
// ═══════════════════════════════════════════════════
const sessions = new Map();

function getSession(from) {
    if (!sessions.has(from)) {
        sessions.set(from, { from, email: null, state: 'inicio' });
    }
    return sessions.get(from);
}

function setSession(from, data) {
    const session = getSession(from);
    sessions.set(from, { ...session, ...data });
}

// ═══════════════════════════════════════════════════
//  LOG NO GOOGLE SHEETS
// ═══════════════════════════════════════════════════
async function logInteraction(email, msgText, logData) {
    if (!process.env.APP_SCRIPT_URL) return;
    try {
        await axios.post(process.env.APP_SCRIPT_URL, {
            dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            email,
            recebido: msgText,
            categoria: logData.categoria,
            subcategoria: logData.subcategoria,
            problema: logData.problema,
            ticketId: logData.ticketId || ""
        });
        console.log(`Log salvo: [${logData.categoria}]`);
    } catch (error) {
        console.error('Erro ao salvar log no sheets:', error.message);
    }
}

async function flushPendingLog(from) {
    const session = getSession(from);
    if (session.pendingLog) {
        const { email, msgText, logData } = session.pendingLog;
        await logInteraction(email, msgText, logData);
        session.pendingLog = null;
    }
}

// ═══════════════════════════════════════════════════
//  ABRIR TICKET NO FRESHSERVICE
// ═══════════════════════════════════════════════════
async function openFreshserviceTicket(email, session, descricaoUsuario, ccEmail) {
    const apiKey = process.env.FRESHSERVICE_API_KEY || process.env.FRESHDESK_API_KEY;
    if (!apiKey) {
        throw new Error("As variáveis de ambiente FRESHSERVICE_API_KEY ou FRESHDESK_API_KEY não foram encontradas no Render.");
    }

    const authHeader = 'Basic ' + Buffer.from(apiKey + ':X').toString('base64');
    const logData = session.lastLogData || {};
    const description = descricaoUsuario || `Chamado aberto via Chatbot Google Chat.<br><b>Problema:</b> ${logData.problema || '-'}`;

    try {
        const payload = {
            description,
            subject: `[Chatbot GChat] ${logData.subcategoria || 'Suporte Interno IPNET'}`,
            email,
            priority: 1,
            status: 2,
            source: 3,
            workspace_id: 2,
            department_id: 17000222357,
            group_id: 17000371025,
            category: 'Suporte Interno',
            custom_fields: {
                classificao_g: 'Requisição',
                utilizou_ia_para_a_resoluo_desse_ticket: 'Não'
            }
        };

        if (ccEmail) {
            payload.cc_emails = [ccEmail];
        }

        const response = await axios.post(
            `https://ipnetcloud.freshservice.com/api/v2/tickets`,
            payload,
            { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
        );
        return { ticketId: response.data.ticket?.id || response.data.id, error: null };
    } catch (e) {
        return { ticketId: null, error: e.response?.data ? JSON.stringify(e.response.data) : e.message };
    }
}

// ═══════════════════════════════════════════════════
//  HELPERS DE NAVEGAÇÃO
// ═══════════════════════════════════════════════════
const MENU_TEXT = {
    'menu_principal': () => knowledge.menuPrincipal,
    'menu_1':         () => knowledge.menu_1,
    'menu_1_1':       () => knowledge.menu_1_1,
    'menu_1_2':       () => knowledge.menu_1_2,
    'menu_1_3':       () => knowledge.menu_1_3,
    'menu_1_4':       () => knowledge.menu_1_4,
    'menu_apple':     () => knowledge.menu_apple,
    'menu_2':         () => knowledge.menu_2,
    'menu_3':         () => knowledge.menu_3,
    'menu_5':         () => knowledge.menu_5,
};

function goToMenu(from, menuState) {
    setSession(from, { state: menuState });
    return {
        text: MENU_TEXT[menuState](),
        logData: { categoria: 'Navegação', subcategoria: menuState, problema: '-' }
    };
}

function showLeaf(from, text, previousState, logData) {
    setSession(from, { state: 'viewing_leaf', previous_state: previousState, lastLogData: logData });
    return { text, logData };
}

// ═══════════════════════════════════════════════════
//  LÓGICA PRINCIPAL DO CHATBOT
// ═══════════════════════════════════════════════════
async function handleMessage(from, msgText) {
    const session = getSession(from);
    const state = session.state;

    // Palavras que sempre voltam ao menu principal
    const triggerMenu = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
                         'menu', 'inicio', 'início', 'start', 'ajuda', 'suporte'];

    // ── ETAPA 1: VALIDAR E-MAIL (Automático pelo Google Chat) ───────
    if (state === 'inicio' || (triggerMenu.includes(msgText) && !session.email)) {
        // Verifica se "from" (que contém o email do Google Chat) é um email @ipnet.cloud
        const isEmailValid = /^[^\s@]+@ipnet\.cloud$/i.test(from);

        if (isEmailValid) {
            setSession(from, { email: from, state: 'menu_principal' });
            return {
                text: `${knowledge.saudacaoAutomatica.replace('{email}', from)}\n\n${knowledge.menuPrincipal}`,
                logData: { categoria: 'Onboarding', subcategoria: 'Acesso Automático', problema: '-' }
            };
        } else {
            setSession(from, { state: 'bloqueado' });
            return {
                text: knowledge.acessoNegado.replace('{email}', from),
                logData: { categoria: 'Onboarding', subcategoria: 'Acesso Negado', problema: 'Domínio Incorreto' }
            };
        }
    }

    // Se o usuário tentar voltar pro menu principal mas JÁ tem email
    if (triggerMenu.includes(msgText)) {
        return goToMenu(from, 'menu_principal');
    }

    // ── GATILHO GLOBAL: Encerramento / Agradecimento ───
    const triggerEncerramento = ['encerrar', 'fim', 'tchau', 'obrigado', 'obrigada', 'valeu', 'vlw', 'fechar', 'cancelar'];
    if (triggerEncerramento.includes(msgText)) {
        setSession(from, { state: 'menu_principal' });
        return {
            text: knowledge.agradecimentoEncerramento,
            logData: { categoria: 'Navegação', subcategoria: 'Encerramento', problema: '-' }
        };
    }

    // ── MENU PRINCIPAL ──────────────────────────────
    if (state === 'menu_principal') {
        switch (msgText) {
            case '0': 
                return {
                    text: knowledge.agradecimentoEncerramento,
                    logData: { categoria: 'Navegação', subcategoria: 'Encerramento', problema: '-' }
                };
            case '1': return goToMenu(from, 'menu_1');
            case '2': return goToMenu(from, 'menu_2');
            case '3': return goToMenu(from, 'menu_3');
            case '4': return goToMenu(from, 'menu_apple');
            case '5': return goToMenu(from, 'menu_5');
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 1: EQUIPAMENTOS ─────────────────────────
    if (state === 'menu_1') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_principal');
            case '1': return goToMenu(from, 'menu_1_1');
            case '2': return goToMenu(from, 'menu_1_2');
            case '3': return goToMenu(from, 'menu_1_3');
            case '4': return goToMenu(from, 'menu_1_4');
            case '5': return showLeaf(from, knowledge.resp_1_5, 'menu_1',
                        { categoria: 'Equipamentos', subcategoria: 'Outros Periféricos', problema: '-' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 1.1: NOTEBOOK ───────────────────────────
    if (state === 'menu_1_1') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_1');
            case '1': return showLeaf(from, knowledge.resp_1_1_1, 'menu_1_1', { categoria: 'Equipamentos', subcategoria: 'Notebook', problema: 'Não liga' });
            case '2': return showLeaf(from, knowledge.resp_1_1_2, 'menu_1_1', { categoria: 'Equipamentos', subcategoria: 'Notebook', problema: 'Lentidão' });
            case '3': return showLeaf(from, knowledge.resp_1_1_3, 'menu_1_1', { categoria: 'Equipamentos', subcategoria: 'Notebook', problema: 'Tela com defeito' });
            case '4': return showLeaf(from, knowledge.resp_1_1_4, 'menu_1_1', { categoria: 'Equipamentos', subcategoria: 'Notebook', problema: 'Teclado/Touchpad' });
            case '5': return showLeaf(from, knowledge.resp_1_1_5, 'menu_1_1', { categoria: 'Equipamentos', subcategoria: 'Notebook', problema: 'Rede/VPN' });
            case '6': return showLeaf(from, knowledge.resp_1_1_6, 'menu_1_1', { categoria: 'Equipamentos', subcategoria: 'Notebook', problema: 'Câmera/Webcam' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 1.2: HEADSET ────────────────────────────
    if (state === 'menu_1_2') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_1');
            case '1': return showLeaf(from, knowledge.resp_1_2_1, 'menu_1_2', { categoria: 'Equipamentos', subcategoria: 'Headset', problema: 'Sem áudio' });
            case '2': return showLeaf(from, knowledge.resp_1_2_2, 'menu_1_2', { categoria: 'Equipamentos', subcategoria: 'Headset', problema: 'Microfone' });
            case '3': return showLeaf(from, knowledge.resp_1_2_3, 'menu_1_2', { categoria: 'Equipamentos', subcategoria: 'Headset', problema: 'Defeito físico' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 1.3: MOUSE / TECLADO ────────────────────
    if (state === 'menu_1_3') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_1');
            case '1': return showLeaf(from, knowledge.resp_1_3_1, 'menu_1_3', { categoria: 'Equipamentos', subcategoria: 'Mouse/Teclado', problema: 'Mouse não responde' });
            case '2': return showLeaf(from, knowledge.resp_1_3_2, 'menu_1_3', { categoria: 'Equipamentos', subcategoria: 'Mouse/Teclado', problema: 'Teclas não funcionam' });
            case '3': return showLeaf(from, knowledge.resp_1_3_3, 'menu_1_3', { categoria: 'Equipamentos', subcategoria: 'Mouse/Teclado', problema: 'Defeito físico' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 1.4: MONITOR ────────────────────────────
    if (state === 'menu_1_4') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_1');
            case '1': return showLeaf(from, knowledge.resp_1_4_1, 'menu_1_4', { categoria: 'Equipamentos', subcategoria: 'Monitor', problema: 'Sem imagem' });
            case '2': return showLeaf(from, knowledge.resp_1_4_2, 'menu_1_4', { categoria: 'Equipamentos', subcategoria: 'Monitor', problema: 'Imagem com defeito' });
            case '3': return showLeaf(from, knowledge.resp_1_4_3, 'menu_1_4', { categoria: 'Equipamentos', subcategoria: 'Monitor', problema: 'Não reconhecido' });
            case '4': return showLeaf(from, knowledge.resp_1_4_4, 'menu_1_4', { categoria: 'Equipamentos', subcategoria: 'Monitor', problema: 'Defeito físico' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU APPLE ───────────────────────────────────
    if (state === 'menu_apple') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_principal');
            case '1': return showLeaf(from, knowledge.resp_apple_1, 'menu_apple', { categoria: 'Suporte Apple', subcategoria: 'MacBook não liga', problema: 'Iniciada' });
            case '2': return showLeaf(from, knowledge.resp_apple_2, 'menu_apple', { categoria: 'Suporte Apple', subcategoria: 'Lentidão/Travamento', problema: 'Iniciada' });
            case '3': return showLeaf(from, knowledge.resp_apple_3, 'menu_apple', { categoria: 'Suporte Apple', subcategoria: 'Outros', problema: 'Iniciada' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 2: DEVOLUÇÕES ───────────────────────────
    if (state === 'menu_2') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_principal');
            case '1': return showLeaf(from, knowledge.resp_2_1, 'menu_2', { categoria: 'Patrimônio', subcategoria: 'Devolução', problema: 'Devolver Equipamento' });
            case '2': return showLeaf(from, knowledge.resp_2_2, 'menu_2', { categoria: 'Patrimônio', subcategoria: 'Segurança', problema: 'Extravio/Roubo' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 3: SOLICITAÇÕES ─────────────────────────
    if (state === 'menu_3') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_principal');
            case '1': return showLeaf(from, knowledge.resp_3_1, 'menu_3', { categoria: 'Solicitações', subcategoria: 'Equipamentos', problema: 'Novo Equipamento' });
            case '2': return showLeaf(from, knowledge.resp_3_2, 'menu_3', { categoria: 'Solicitações', subcategoria: 'Equipamentos', problema: 'Troca por Defeito' });
            case '3': return showLeaf(from, knowledge.resp_3_3, 'menu_3', { categoria: 'Solicitações', subcategoria: 'Acessórios', problema: 'Novo Acessório' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── MENU 5: ACESSOS E SENHAS ─────────────────────
    if (state === 'menu_5') {
        switch (msgText) {
            case '0': return goToMenu(from, 'menu_principal');
            case '1': return showLeaf(from, knowledge.resp_5_1, 'menu_5', { categoria: 'Acessos e Senhas', subcategoria: 'Reset/Troca de Senha', problema: 'Iniciada' });
            case '2': return showLeaf(from, knowledge.resp_5_2, 'menu_5', { categoria: 'Acessos e Senhas', subcategoria: 'Grupos de E-mail', problema: 'Iniciada' });
            case '3': return showLeaf(from, knowledge.resp_5_3, 'menu_5', { categoria: 'Acessos e Senhas', subcategoria: 'Outros', problema: 'Iniciada' });
            default:  return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
        }
    }

    // ── GATILHO GLOBAL: Opção 9 abre chamado ─────────
    if (msgText === '9' && state !== 'aguardando_detalhes_chamado') {
        setSession(from, { state: 'aguardando_detalhes_chamado' });
        return {
            text: knowledge.pedirDescricaoChamado,
            logData: { categoria: 'Navegação', subcategoria: 'Abertura de Chamado', problema: 'Iniciada' }
        };
    }


    // ── AGUARDANDO DESCRIÇÃO DO CHAMADO ──────────────
    if (state === 'aguardando_detalhes_chamado') {
        if (msgText === '0') {
            return goToMenu(from, 'menu_principal');
        }
        
        // Salva a descrição do problema na sessão
        setSession(from, { descricaoChamado: msgText, state: 'aguardando_email_gestor' });
        
        return {
            text: knowledge.pedirEmailGestor,
            logData: { categoria: 'Ticket', subcategoria: 'Aprovação', problema: 'Aguardando Gestor' }
        };
    }

    // ── AGUARDANDO E-MAIL DO GESTOR ──────────────────
    if (state === 'aguardando_email_gestor') {
        if (msgText === '0') {
            return goToMenu(from, 'menu_principal');
        }

        let ccEmail = null;

        // Se o usuário não pulou a etapa, valida o e-mail
        const lowerMsg = msgText.toLowerCase();
        if (lowerMsg !== 'não' && lowerMsg !== 'nao') {
            const isEmailValid = /^[^\s@]+@ipnet\.cloud$/i.test(msgText);
            if (!isEmailValid) {
                return {
                    text: knowledge.emailGestorInvalido,
                    logData: { categoria: 'Ticket', subcategoria: 'Aprovação', problema: 'E-mail Inválido' }
                };
            }
            ccEmail = msgText;
        }

        let ticketId = null;
        let errorMsg = null;
        try {
            const result = await openFreshserviceTicket(session.email, session, session.descricaoChamado, ccEmail);
            ticketId = result.ticketId;
            errorMsg = result.error;
            if (ticketId) console.log(`✅ Chamado #${ticketId} criado no Freshservice para ${session.email} (CC: ${ccEmail || 'Nenhum'})`);
            else console.error('❌ Erro ao criar ticket:', errorMsg);
        } catch (e) {
            console.error('❌ Erro inesperado ao criar ticket:', e.message);
            errorMsg = e.message;
        }
        setSession(from, { state: 'menu_principal', descricaoChamado: null });
        if (ticketId) {
            return {
                text: knowledge.chamadoAbertoSucesso.replace(/{ticketId}/g, ticketId),
                logData: { 
                    categoria: 'Ticket', 
                    subcategoria: 'Abrir Chamado', 
                    problema: session.lastLogData ? session.lastLogData.problema : 'Abertura Direta',
                    ticketId: `#${ticketId}`
                }
            };
        } else {
            return {
                text: `${knowledge.resp_atendente}\n\n_(Não foi possível abrir o ticket automaticamente. Erro: ${errorMsg})_`,
                logData: { categoria: 'Ticket', subcategoria: 'Abrir Chamado', problema: 'Erro API' }
            };
        }
    }

    // ── VIEWING LEAF: resposta final exibida ─────────
    if (state === 'viewing_leaf') {
        const prevState = session.previous_state || 'menu_principal';
        if (msgText === '0') {
            return goToMenu(from, prevState);
        }
        return { text: knowledge.naoEntendeu, logData: { categoria: 'Erro', subcategoria: 'Opção Inválida', problema: '-' } };
    }

    // Fallback seguro
    return goToMenu(from, 'menu_principal');
}


// ═══════════════════════════════════════════════════
//  ROTA PRINCIPAL — GOOGLE CHAT (WORKSPACE ADD-ON)
// ═══════════════════════════════════════════════════
app.post('/google-chat', async (req, res) => {
    try {
        const event = req.body;

        let type = event.type;
        let from = 'anonimo@ipnet.cloud';
        let msgText = 'oi';

        // Formato Google Workspace Add-ons
        if (event.chat && event.chat.messagePayload && event.chat.messagePayload.message) {
            type = 'MESSAGE';
            from = event.chat.user?.email || from;
            msgText = event.chat.messagePayload.message.text || msgText;
        } else if (event.chat && !event.chat.messagePayload) {
            type = 'ADDED_TO_SPACE';
        } else if (event.type === 'MESSAGE') {
            // Formato clássico (fallback)
            from = event.user?.email || from;
            msgText = event.message?.text || msgText;
        }

        const buildResponse = (text) => ({
            hostAppDataAction: {
                chatDataAction: {
                    createMessageAction: {
                        message: { text }
                    }
                }
            }
        });

        if (type === 'ADDED_TO_SPACE') {
            return res.json(buildResponse("Olá! 👋 Sou o assistente de Suporte Interno IPNET. Envie 'oi' para começarmos."));
        }

        if (type === 'MESSAGE') {
            msgText = msgText.trim().toLowerCase();
            console.log(`📩 Nova mensagem de: ${from} — "${msgText}"`);

            // Limpa/grava o log pendente anterior se o usuário enviar comandos de início ou encerramento
            const triggerMenu = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
                                 'menu', 'inicio', 'início', 'start', 'ajuda', 'suporte'];
            const triggerEncerramento = ['encerrar', 'fim', 'tchau', 'obrigado', 'obrigada', 'valeu', 'vlw', 'fechar', 'cancelar'];

            if (triggerMenu.includes(msgText) || triggerEncerramento.includes(msgText)) {
                await flushPendingLog(from);
            }

            const result = await handleMessage(from, msgText);

            // Loga todas as interações relevantes (exceto onboarding, navegação pura e erros)
            if (
                result.logData && 
                result.logData.categoria !== 'Onboarding' && 
                result.logData.categoria !== 'Navegação' && 
                result.logData.categoria !== 'Erro'
            ) {
                const finalEmail = getSession(from).email || from;

                // Se abriu ticket, cancela o log pendente da folha (evita duplicar) e grava só o ticket
                if (result.logData.categoria === 'Ticket' && result.logData.subcategoria === 'Abrir Chamado') {
                    const session = getSession(from);
                    session.pendingLog = null; // Cancela o log anterior
                    await logInteraction(finalEmail, msgText, result.logData);
                } else {
                    // Se caiu em uma folha de FAQ, grava a anterior (se houver) e agenda esta
                    await flushPendingLog(from);
                    const session = getSession(from);
                    session.pendingLog = {
                        email: finalEmail,
                        msgText: msgText,
                        logData: result.logData
                    };
                }
            }

            return res.json(buildResponse(result.text || 'Desculpe, ocorreu um erro.'));
        }

        return res.json({});

    } catch (error) {
        console.error('Erro interno no webhook:', error);
        return res.json({
            hostAppDataAction: {
                chatDataAction: {
                    createMessageAction: {
                        message: { text: 'Ocorreu um erro interno. Tente novamente.' }
                    }
                }
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor do Google Chat rodando na porta ${PORT}`);
});
