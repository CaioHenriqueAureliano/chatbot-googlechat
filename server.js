require('dotenv').config();
const express = require('express');
const axios = require('axios');
const knowledge = require('./knowledge');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════
//  SESSÕES EM MEMÓRIA
// ═══════════════════════════════════════════════════
const sessions = new Map();

function getSession(email) {
    if (!sessions.has(email)) {
        sessions.set(email, { email, state: 'inicio' });
    }
    return sessions.get(email);
}

function setSession(email, data) {
    const session = getSession(email);
    sessions.set(email, { ...session, ...data });
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
            problema: logData.problema
        });
        console.log(`Log salvo: [${logData.categoria}]`);
    } catch (error) {
        console.error('Erro ao salvar log no sheets:', error.message);
    }
}

// ═══════════════════════════════════════════════════
//  ABRIR TICKET NO FRESHSERVICE
// ═══════════════════════════════════════════════════
async function openFreshserviceTicket(email, session) {
    try {
        const logData = session.lastLogData || {};
        const description = `Chamado aberto via Chatbot Google Chat.<br>
            <b>Categoria:</b> ${logData.categoria || '-'}<br>
            <b>Subcategoria:</b> ${logData.subcategoria || '-'}<br>
            <b>Problema:</b> ${logData.problema || '-'}`;

        const response = await axios.post(
            `${process.env.FRESHDESK_DOMAIN}/api/v2/tickets`,
            {
                email,
                subject: `[Chatbot] ${logData.subcategoria || 'Suporte Interno IPNET'}`,
                description,
                status: 2,   // open
                priority: 2, // medium
                source: 2    // portal
            },
            { auth: { username: process.env.FRESHSERVICE_API_KEY, password: 'X' } }
        );
        return response.data.ticket?.id || response.data.id;
    } catch (error) {
        console.error('Erro ao abrir ticket Freshservice:', error.message);
        return null;
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

    if (state === 'inicio' || triggerMenu.includes(msgText)) {
        return goToMenu(from, 'menu_principal');
    }

    // ── MENU PRINCIPAL ──────────────────────────────
    if (state === 'menu_principal') {
        switch (msgText) {
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

    // ── VIEWING LEAF: resposta final exibida ─────────
    if (state === 'viewing_leaf') {
        const prevState = session.previous_state || 'menu_principal';
        if (msgText === '0') {
            return goToMenu(from, prevState);
        }
        if (msgText === '9') {
            const ticketId = await openFreshserviceTicket(from, session);
            setSession(from, { state: 'menu_principal' });
            if (ticketId) {
                return {
                    text: knowledge.chamadoAbertoSucesso
                        .replace('{ticketId}', ticketId)
                        .replace('{ticketId}', ticketId),
                    logData: { categoria: 'Ticket', subcategoria: 'Abrir Chamado', problema: `#${ticketId}` }
                };
            } else {
                return {
                    text: `${knowledge.resp_atendente}\n\n_(Não foi possível abrir o ticket automaticamente. Nossa equipe receberá sua solicitação.)_`,
                    logData: { categoria: 'Ticket', subcategoria: 'Abrir Chamado', problema: 'Erro API' }
                };
            }
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

            const result = await handleMessage(from, msgText);

            // Loga apenas interações relevantes (não navegação pura)
            if (result.logData && result.logData.categoria !== 'Navegação' && result.logData.categoria !== 'Erro') {
                logInteraction(from, msgText, result.logData);
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
