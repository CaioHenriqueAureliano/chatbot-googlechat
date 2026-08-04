require('dotenv').config();
const express = require('express');
const axios = require('axios');
const knowledge = require('./knowledge');

const app = express();
app.use(express.json());

// Armazenamento em memória
const sessions = new Map();

function getSession(email) {
    if (!sessions.has(email)) {
        sessions.set(email, { email: email, state: 'inicio' });
    }
    return sessions.get(email);
}

function setSession(email, data) {
    const session = getSession(email);
    sessions.set(email, { ...session, ...data });
}

async function logInteraction(email, msgText, logData) {
    if (!process.env.APP_SCRIPT_URL) return;
    try {
        await axios.post(process.env.APP_SCRIPT_URL, {
            dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            telefone: email,
            email: email,
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

async function handleMessage(from, msgText) {
    const session = getSession(from);
    const state = session.state;
    
    let logData = { categoria: 'Navegação', subcategoria: '-', problema: '-' };
    let responseText = '';

    if (state === 'encerrado') {
        setSession(from, { state: 'menu_principal' });
        logData = { categoria: 'Navegação', subcategoria: 'Reativação', problema: '-' };
        return { text: knowledge.menuPrincipal, logData };
    }

    if (state === 'inicio') {
        setSession(from, { state: 'menu_principal' });
        logData = { categoria: 'Onboarding', subcategoria: 'Acesso Google Chat', problema: '-' };
        return { text: knowledge.menuPrincipal, logData };
    }

    const triggerMenu = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'menu', 'inicio', 'início', 'start', 'ajuda', 'preciso de ajuda', 'suporte'];
    if (triggerMenu.includes(msgText)) {
        setSession(from, { state: 'menu_principal' });
        logData = { categoria: 'Navegação', subcategoria: 'Menu Principal', problema: '-' };
        return { text: knowledge.menuPrincipal, logData };
    }

    if (state === 'menu_principal') {
        switch (msgText) {
            case '1': logData = { categoria: 'Equipamentos', subcategoria: 'Lentidão/Travamento', problema: '-' };
                      setSession(from, { state: 'viewing_leaf', previous_state: state, lastLogData: logData });
                      responseText = knowledge.resp_1;
                      break;
            case '2': setSession(from, { state: 'menu_2' });
                      responseText = knowledge.menu2;
                      break;
            case '3': setSession(from, { state: 'menu_3' });
                      responseText = knowledge.menu3;
                      break;
            case '4': setSession(from, { state: 'menu_apple' });
                      responseText = knowledge.menuApple;
                      break;
            case '5': setSession(from, { state: 'menu_5' });
                      responseText = knowledge.menu5;
                      break;
            default:  logData = { categoria: 'Erro de Navegação', subcategoria: 'Opção Inválida', problema: '-' };
                      responseText = knowledge.naoEntendeu;
        }
        return { text: responseText, logData };
    }

    if (state === 'menu_2') {
        switch (msgText) {
            case '0':
                setSession(from, { state: 'menu_principal' });
                logData = { categoria: 'Navegação', subcategoria: 'Voltar', problema: '-' };
                responseText = knowledge.menuPrincipal;
                break;
            case '1': logData = { categoria: 'Patrimônio', subcategoria: 'Devolução', problema: 'Devolver Equipamento' };
                setSession(from, { state: 'viewing_leaf', previous_state: state, lastLogData: logData });
                responseText = knowledge.resp_2_1;
                break;
            case '2': logData = { categoria: 'Patrimônio', subcategoria: 'Segurança', problema: 'Extravio/Roubo' };
                setSession(from, { state: 'viewing_leaf', previous_state: state, lastLogData: logData });
                responseText = knowledge.resp_2_2;
                break;
            default:  logData = { categoria: 'Erro de Navegação', subcategoria: 'Opção Inválida', problema: '-' };       
                responseText = knowledge.naoEntendeu;
        }
        return { text: responseText, logData };
    }

    if (state === 'menu_3') {
        switch (msgText) {
            case '0':
                setSession(from, { state: 'menu_principal' });
                logData = { categoria: 'Navegação', subcategoria: 'Voltar', problema: '-' };
                responseText = knowledge.menuPrincipal;
                break;
            case '1': logData = { categoria: 'Solicitações', subcategoria: 'Equipamentos', problema: 'Novo Equipamento' };
                setSession(from, { state: 'viewing_leaf', previous_state: state, lastLogData: logData });
                responseText = knowledge.resp_3_1;
                break;
            case '2': logData = { categoria: 'Solicitações', subcategoria: 'Equipamentos', problema: 'Troca por Defeito' };
                setSession(from, { state: 'viewing_leaf', previous_state: state, lastLogData: logData });
                responseText = knowledge.resp_3_2;
                break;
            case '3': logData = { categoria: 'Solicitações', subcategoria: 'Acessórios', problema: 'Novo Acessório' };
                setSession(from, { state: 'viewing_leaf', previous_state: state, lastLogData: logData });
                responseText = knowledge.resp_3_3;
                break;
            default:  logData = { categoria: 'Erro de Navegação', subcategoria: 'Opção Inválida', problema: '-' };    
                responseText = knowledge.naoEntendeu;
        }
        return { text: responseText, logData };
    }

    if (state === 'menu_apple') {
        switch (msgText) {
            case '0':
                setSession(from, { state: 'menu_principal' });
                logData = { categoria: 'Navegação', subcategoria: 'Voltar', problema: '-' };
                responseText = knowledge.menuPrincipal;
                break;
            case '1':
                logData = { categoria: 'Suporte Apple', subcategoria: 'MacBook não liga', problema: 'Iniciada' };
                responseText = knowledge.resp_apple_1;
                break;
            case '2':
                logData = { categoria: 'Suporte Apple', subcategoria: 'Lentidão/Travamento', problema: 'Iniciada' };
                responseText = knowledge.resp_apple_2;
                break;
            case '3':
                logData = { categoria: 'Suporte Apple', subcategoria: 'Outros', problema: 'Iniciada' };
                responseText = knowledge.resp_apple_3;
                break;
            default:
                logData = { categoria: 'Erro de Navegação', subcategoria: 'Opção Inválida', problema: '-' };
                responseText = knowledge.naoEntendeu;
        }
        return { text: responseText, logData };
    }

    if (state === 'menu_5') {
        switch (msgText) {
            case '0':
                setSession(from, { state: 'menu_principal' });
                logData = { categoria: 'Navegação', subcategoria: 'Voltar', problema: '-' };
                responseText = knowledge.menuPrincipal;
                break;
            case '1':
                logData = { categoria: 'Acessos e Senhas', subcategoria: 'Reset/Troca de Senha', problema: 'Iniciada' };
                responseText = knowledge.resp_5_1;
                break;
            case '2':
                logData = { categoria: 'Acessos e Senhas', subcategoria: 'Grupos de E-mail', problema: 'Iniciada' };
                responseText = knowledge.resp_5_2;
                break;
            case '3':
                logData = { categoria: 'Acessos e Senhas', subcategoria: 'Outros', problema: 'Iniciada' };
                responseText = knowledge.resp_5_3;
                break;
            default:
                logData = { categoria: 'Erro de Navegação', subcategoria: 'Opção Inválida', problema: '-' };
                responseText = knowledge.naoEntendeu;
        }
        return { text: responseText, logData };
    }

    setSession(from, { state: 'menu_principal' });
    logData = { categoria: 'Erro de Navegação', subcategoria: 'Fallback', problema: '-' };
    return { text: knowledge.menuPrincipal, logData };
}

app.post('/google-chat', async (req, res) => {
    try {
        const event = req.body;
        
        let type = event.type;
        let from = 'anonimo@ipnet.cloud';
        let msgText = 'oi';

        // Verifica se é o formato novo (Google Workspace Add-ons)
        if (event.chat && event.chat.messagePayload && event.chat.messagePayload.message) {
            type = 'MESSAGE';
            from = event.chat.user?.email || from;
            msgText = event.chat.messagePayload.message.text || msgText;
        } else if (event.type === 'MESSAGE') {
            // Formato clássico
            from = event.user?.email || from;
            msgText = event.message?.text || msgText;
        } else if (event.chat && !event.chat.messagePayload) {
            // Pode ser ADDED_TO_SPACE no formato novo
            type = 'ADDED_TO_SPACE';
        }

        const buildResponse = (textResponse) => {
            return {
                hostAppDataAction: {
                    chatDataAction: {
                        createMessageAction: {
                            message: {
                                text: textResponse
                            }
                        }
                    }
                }
            };
        };

        if (type === 'ADDED_TO_SPACE') {
            console.log("Log: Bot adicionado ao espaço");
            return res.json(buildResponse("Olá! Sou o assistente de Suporte Interno IPNET. Envie 'oi' para começarmos."));
        }

        if (type === 'MESSAGE') {
            msgText = msgText.trim().toLowerCase();
            console.log(`📩 Nova mensagem de : ${from} - Texto: ${msgText}`);

            const result = await handleMessage(from, msgText);
            
            const currentSession = getSession(from);
            if (result.logData && !result.logData.categoria.includes('Navegação') && !result.logData.categoria.includes('Onboarding') && !result.logData.categoria.includes('Erro')) {
                if (currentSession.state !== 'aguardando_detalhes_chamado' && currentSession.state !== 'pos_chamado' && currentSession.state !== 'viewing_leaf') {
                    setSession(from, { state: 'viewing_leaf', previous_state: currentSession.state, lastLogData: result.logData });
                }
            }

            const categoriasIgnoradas = ['Navegação', 'Onboarding', 'Erro de Navegação'];
            if (result.logData && !categoriasIgnoradas.includes(result.logData.categoria)) {
                logInteraction(from, msgText, result.logData);
            }

            return res.json(buildResponse(result.text || "Desculpe, não entendi."));
        }

        // Se for qualquer outro evento não mapeado
        return res.json(buildResponse("Evento recebido."));
        
    } catch (error) {
        console.error("Erro interno no webhook:", error);
        return res.json({ text: "Ocorreu um erro interno. Tente novamente." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor do Google Chat rodando na porta ${PORT}`);
});
