// ============================================================
// KNOWLEDGE BASE — IPNET by VIVO | Suporte Interno
// ============================================================
// Edite as respostas aqui sem precisar mexer no server.js
// Formato: 'chave': 'resposta completa'
// ============================================================

const knowledge = {

    // ── COLETA DE E-MAIL (Automática pelo Google Chat) ───────
    saudacaoAutomatica: `Olá! 👋 Sou o assistente de *Suporte Interno da IPNET by VIVO*.

Autenticação realizada com sucesso para o e-mail: *{email}*.

💡 *Dica rápida:* Navegue pelas opções abaixo para encontrar orientações de autoatendimento. Caso o passo a passo não resolva, você poderá abrir um chamado no final. 😉`,

    acessoNegado: `⚠️ *Acesso Negado*

Este assistente é exclusivo para colaboradores da IPNET. Identificamos que o e-mail em uso (*{email}*) não pertence ao domínio corporativo (@ipnet.cloud).

Se você acredita que isto é um erro, por favor, entre em contato com a equipe de TI.`,

    emailConfirmado: `✅ E-mail *{email}* registrado com sucesso!

💡 *Dica rápida:* Navegue pelas opções abaixo para encontrar orientações de autoatendimento. Caso o passo a passo não resolva, você poderá abrir um chamado no final. 😉`,

    emailInvalido: `⚠️ Não reconheci esse formato de e-mail.

Por favor, digite seu *e-mail corporativo* no formato correto.
_(Ex: nome@ipnet.cloud)_`,

    emailDominioInvalido: `⚠️ O e-mail informado parece ser válido, mas não pertence ao nosso domínio.

Por favor, lembre-se de usar exclusivamente o seu e-mail corporativo terminando em *@ipnet.cloud*.`,

    // ── VALIDAÇÃO DE PIN ─────────────────────────────────────
    // (Funcionalidade reservada para versões futuras)

    // ── ABERTURA DE CHAMADO (FRESHDESK) ─────────────────────
    pedirDescricaoChamado: `Entendido! Para que eu possa abrir um chamado para a equipe técnica, por favor, *descreva brevemente o problema*.

_(Digite *0* a qualquer momento para cancelar e voltar ao menu)_`,

    chamadoAbertoSucesso: `✅ Seu chamado foi aberto com sucesso! 

🎟️ **O número do seu ticket é o #{ticketId}**
🔗 Você pode acompanhar o ticket por aqui: https://ipnetcloud.freshservice.com/support/tickets/{ticketId}

A nossa equipe técnica assumirá a tratativa a partir de agora e você receberá as atualizações por e-mail.

👉 Digite *menu* se precisar de mais alguma coisa, ou *0* para encerrar nosso papo por aqui.`,

    encerramento: `Atendimento encerrado! Quando precisar de algo, é só mandar um oi. 👋`,

    agradecimentoEncerramento: `De nada! Fico feliz em ajudar. Seu atendimento foi encerrado. Qualquer coisa, é só me chamar novamente! 👋`,

    menuPrincipal: `Olá! 👋 Sou o assistente de *Suporte Interno da IPNET by VIVO*.

Como posso te ajudar hoje?

*1.* Problemas com Equipamentos
*2.* Devoluções
*3.* Solicitações
*4.* Suporte Apple (MacBook)
*5.* Acessos, Senhas e E-mails`,

    // ── MENU 1: EQUIPAMENTOS ────────────────────────────────
    menu_1: `⚙️ *Problemas com Equipamentos*

Qual equipamento está com problema?

*1.* Notebook
*2.* Headset
*3.* Mouse / Teclado
*4.* Monitor
*5.* Outros Periféricos
*0.* ← Voltar ao menu anterior
*menu* ← Voltar ao Menu Principal`,

    // ── MENU 1.1: NOTEBOOK ──────────────────────────────────
    menu_1_1: `💻 *Notebook*

Qual é o problema?

*1.* Não liga
*2.* Lentidão / Travando
*3.* Tela com defeito
*4.* Teclado ou touchpad com problema
*5.* Problema de rede (Wi-Fi / VPN)
*6.* Câmera / Webcam (Fundo preto, travando, Meet)
*0.* ← Voltar / Outros problemas`,

    resp_1_1_1: `💡 *Notebook não liga*

Tente os seguintes passos:

1. Verifique se o carregador está conectado e o LED aceso
2. Pressione e segure o botão Power por *20 segundos* para um reset
3. Conecte a outro cabo ou tomada diferente
4. Se mesmo assim não ligar, *o equipamento precisará de análise técnica.*

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_1_2: `💡 *Notebook com Lentidão / Travando*

Tente os seguintes passos:

1. Reinicie o computador (não apenas hiberne)
2. Verifique se há atualizações pendentes do Windows
3. Feche programas desnecessários na barra de tarefas
4. Limpar os cookies do navegador
5. Aguarde 10 minutos após reiniciar antes de trabalhar

⚠️ Se persistir após reiniciar, nossa equipe pode fazer uma *análise remota*.
👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_1_3: `💡 *Tela com defeito*

Se a tela apresenta listras, pontos ou está preta:

1. Tente conectar um monitor externo via HDMI para confirmar se o problema é na tela
2. Verifique se o cabo de alimentação está firme
3. *Não tente abrir ou pressionar a tela* para evitar piorar o defeito

⚠️ Esse tipo de problema geralmente exige troca do equipamento.
👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_1_4: `💡 *Teclado ou Touchpad com problema*

Tente os seguintes passos:

1. Reinicie o notebook
2. Conecte um mouse USB externo para verificar se o touchpad é o problema
3. Verifique se há sujeira ou líquido entre as teclas
4. Em Configurações → Dispositivos, verifique se o touchpad está habilitado
5. Dica: Verifique o atalho de bloqueio do touchpad (ex: Fn+F6 ou Fn+F7)

⚠️ Se o problema for físico (tecla quebrada, líquido), informe ao suporte.
👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_1_5: `💡 *Problema de Rede (Wi-Fi / VPN)*

1. Verifique se outros dispositivos conseguem se conectar ao mesmo Wi-Fi
2. Desligue e religue o Wi-Fi pelo ícone na barra de tarefas
3. Para a VPN: feche e reabra o aplicativo
4. Reinicie o notebook e tente novamente

🔐 *Para problemas de acesso à VPN corporativa*, entre em contato com o suporte.
👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_1_6: `💡 *Câmera / Webcam (Fundo preto, travando, Meet)*

Tente os seguintes passos:

1. Verifique se há uma *trava física* cobrindo a lente da câmera (comum em notebooks Lenovo)
2. Acesse Configurações → Privacidade → Câmera e verifique as permissões do Windows
3. Em notebooks Acer com bug no Google Meet, desative a "Aceleração de Hardware" nas configurações do Google Chrome
4. Reinicie o notebook e tente novamente

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    // ── MENU 1.2: FONE / HEADSET ────────────────────────────
    menu_1_2: `🎧 *Fone de Ouvido / Headset*

Qual é o problema?

*1.* Sem áudio / não reconhecido
*2.* Microfone não funciona
*3.* Defeito físico (quebrado, fio partido)
*0.* ← Voltar`,

    resp_1_2_1: `💡 *Fone sem áudio / não reconhecido*

1. Desconecte e reconecte o fone (aguarde 5 segundos)
2. Se for fone Bluetooth, verifique se está pareado, ligado e com bateria
3. Clique com o botão direito no ícone de som → *Abrir configurações de som*
4. Verifique se o fone está selecionado como dispositivo de saída
5. Tente em outra porta USB ou entrada P2
6. Teste em outro computador para confirmar se o problema é no fone

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_2_2: `💡 *Microfone não funciona*

1. Pressione F4 para ativar / desativar o microfone
2. Vá em Configurações → *Privacidade → Microfone* e verifique se está ativado
3. Em Configurações de Som, verifique se o fone está como *dispositivo de entrada*
4. No Teams/Meet: verifique nas configurações do aplicativo se o microfone correto está selecionado
5. Teste em outro computador

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_2_3: `⚠️ *Defeito físico no Fone*

Equipamentos com danos físicos precisam ser avaliados presencialmente.

Para solicitar a troca:
1. Guarde o equipamento com defeito
2. Nossa equipe irá registrar a ocorrência e verificar disponibilidade de reposição

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    // ── MENU 1.3: MOUSE / TECLADO ───────────────────────────
    menu_1_3: `🖱️ *Mouse / Teclado*

Qual é o problema?

*1.* Mouse não responde / cursor travando
*2.* Teclas do teclado não funcionam
*3.* Defeito físico (quebrado)
*0.* ← Voltar`,

    resp_1_3_1: `💡 *Mouse não responde*

1. Desconecte e reconecte o mouse
2. Limpe o sensor óptico do mouse (luz vermelha embaixo)
3. Tente em outra porta USB
4. Verifique se a superfície é adequada (evite vidro ou reflexivas)
5. Para mouse sem fio: verifique as pilhas/bateria ou conexão Bluetooth
6. Teste em outro computador

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_3_2: `💡 *Teclas do teclado não funcionam*

1. Reinicie o computador
2. Verifique se o *Num Lock* ou *Fn* está ativado indevidamente
3. Tente em outra porta USB
4. Para teclado sem fio: verifique as pilhas/bateria ou conexão Bluetooth
5. Teste em outro computador

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_3_3: `⚠️ *Defeito físico no Mouse ou Teclado*

Solicite a substituição pelo canal de suporte.
Nossa equipe irá verificar a disponibilidade do equipamento em estoque.

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    // ── MENU 1.4: MONITOR ───────────────────────────────────
    menu_1_4: `🖥️ *Monitor*

Qual é o problema?

*1.* Sem imagem / tela preta
*2.* Imagem com defeito (listras, cores erradas)
*3.* Monitor não é reconhecido
*4.* Defeito físico
*0.* ← Voltar`,

    resp_1_4_1: `💡 *Monitor sem imagem / tela preta*

1. Verifique se o cabo HDMI/DisplayPort está bem conectado nos dois lados
2. Teste com outro cabo
3. Reinicie o computador

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_4_2: `💡 *Imagem com defeito*

Se há listras, cores erradas ou pixelamento:

1. Troque o cabo HDMI/DisplayPort e teste
2. Conecte o monitor em outro computador para identificar se o problema é no monitor ou no notebook
3. Ajuste a resolução: Configurações → Vídeo → Resolução recomendada

⚠️ Se o problema persistir com outro computador, o monitor tem defeito de hardware.
👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_4_3: `💡 *Monitor não reconhecido*

1. Desconecte e reconecte o cabo
2. Clique com o botão direito na área de trabalho → *Configurações de vídeo* → *Detectar*
3. Reinicie com o monitor já conectado
4. Verifique se o driver de vídeo está atualizado

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_1_4_4: `⚠️ *Defeito físico no Monitor*

Monitores com tela quebrada ou danos físicos precisam de avaliação presencial.
Registre a ocorrência com nossa equipe para iniciar o processo de troca.

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    // ── MENU 1.5: OUTROS ────────────────────────────────────
    resp_1_5: `🔌 *Outros Periféricos*

Para outros periféricos (hub USB, suporte, cabo, webcam, etc.), você pode solicitar diretamente ao nosso time.

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    // ── MENU APPLE (MacBook) ────────────────────────────────
    menu_apple: `🍎 *Suporte Apple (MacBook)*

Qual destas opções descreve melhor o seu problema?

*1.* MacBook não liga
*2.* Lentidão ou travamento
*3.* Outros problemas

*0.* ← Voltar ao menu anterior
*menu* ← Voltar ao Menu Principal`,

    resp_apple_1: `🍎 *MacBook não liga*\n\n1. Verifique se o carregador está bem conectado e se há luz indicativa.\n2. Segure o botão de energia por 10 segundos e solte.\n\nSe não resolver, *o equipamento precisará de análise técnica.*\n\n👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,
    resp_apple_2: `🍎 *Lentidão ou Travamento*\n\n1. Verifique se o macOS está atualizado.\n2. Feche aplicativos pesados em segundo plano.\n\nSe continuar travando, *será necessária análise técnica.*\n\n👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,
    resp_apple_3: `🍎 *Outros problemas (Apple)*\n\nNossa equipe técnica analisará seu caso.\n\n👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    // ── MENU 2: PATRIMÔNIO ──────────────────────────────────
    menu_2: `📋 *Devoluções*

O que você precisa?

*1.* Devolução de equipamento
*2.* Equipamento extraviado ou roubado
*0.* ← Voltar ao menu anterior
*menu* ← Voltar ao Menu Principal`,

    resp_2_1: `📋 *Devolução de Equipamento*

Para devolver um equipamento (desligamento, mudança de função, etc.):

1. O equipamento deve ser entregue em bom estado (Notebook, Fonte, Mouse, Headset, Adaptadores)
2. Será feita uma vistoria e baixa no sistema de patrimônio. ⚠️ Lembre-se de fazer backup dos seus arquivos!
3. *Não repasse o equipamento diretamente para outro colaborador sem passar pelo suporte*

👉 Para agendar devolução, digite *9* para abrir um chamado, ou *0* para voltar.`,

    resp_2_2: `🚨 *Equipamento Extraviado ou Roubado*

Em caso de roubo ou furto, siga os passos:

1. *Em caso de roubo:* Registre um Boletim de Ocorrência (B.O.) na delegacia
2. Informe imediatamente o suporte interno com o número do B.O.
3. Nossa equipe irá registrar o incidente no sistema e iniciar o processo de baixa do patrimônio
4. Aperte *9* para abrir um chamado com a nossa equipe, ou *0* para voltar.`,

    // ── MENU 3: SOLICITAÇÕES ────────────────────────────────
    menu_3: `📦 *Solicitações*

O que você deseja solicitar?

*1.* Novo equipamento
*2.* Troca de equipamento com defeito
*3.* Acessório (suporte, hub USB, cabo...)
*0.* ← Voltar ao menu anterior
*menu* ← Voltar ao Menu Principal`,

    resp_3_1: `📦 *Solicitação de Novo Equipamento*

Para solicitar um novo equipamento (notebook, headset, mouse, etc.):

1. A solicitação deve ser aprovada pela *liderança imediata* antes de ser aberta
2. Com a aprovação, nós abriremos a solicitação
3. Informaremos a disponibilidade em estoque e o prazo estimado

👉 Digite *9* para abrir a solicitação no Freshservice, ou *0* para voltar.`,

    resp_3_2: `📦 *Troca de Equipamento com Defeito*

Para solicitar a troca por defeito:

1. O equipamento com defeito deve ser entregue ao suporte para avaliação
2. Se confirmado o defeito, verificaremos estoque para reposição
3. Em alguns casos, o equipamento pode ser enviado para conserto

👉 Digite *9* para abrir a solicitação no Freshservice, ou *0* para voltar.`,

    resp_3_3: `📦 *Solicitação de Acessório*

Para solicitar acessórios (suporte de notebook, hub USB, cabo HDMI, etc.):

1. Verificaremos disponibilidade em estoque
2. Acessórios são sujeitos à aprovação conforme política interna

👉 Digite *9* para abrir a solicitação no Freshservice, ou *0* para voltar.`,

    // ── MENU 5: ACESSOS, SENHAS E E-MAILS ───────────────────
    menu_5: `🔐 *Acessos, Senhas e E-mails*

Selecione a opção desejada:

*1.* Reset/Troca de senha
*2.* Alteração em Grupos de e-mail
*3.* Outros

*0.* ← Voltar ao menu anterior
*menu* ← Voltar ao Menu Principal`,

    resp_5_1: `🔑 *Reset/Troca de Senha*

*Aplicativos Vivo:* A alteração de senha não é realizada por este canal. Por favor, contate o Administrativo IPNET.
*Google Workspace:* Para redefinição de senha, abra um chamado informando os detalhes da solicitação.

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_5_2: `📧 *Alteração em Grupos de E-mail*

Para solicitar inclusão, remoção ou alteração em grupos de e-mail, precisamos registrar a solicitação formalmente.

👉 Digite *9* para abrir um chamado no Freshservice, ou *0* para voltar.`,

    resp_5_3: `⚙️ *Outros Problemas de Acesso*

Para outros problemas relacionados a acessos, senhas ou e-mails, a equipe técnica analisará o caso.

👉 Digite *9* para detalhar o problema e abrir um chamado, ou *0* para voltar.`,



    // ── HORÁRIO E CONTATO (mensagem de fallback de erro de ticket) ───
    resp_atendente: `⚠️ Não foi possível abrir o chamado automaticamente.

Por favor, entre em contato diretamente com o suporte:
📧 suporte@ipnet.cloud
⏱️ *Horário de atendimento:* Segunda a Sexta, 08h às 18h.`,

    // ── RESPOSTAS GENÉRICAS ─────────────────────────────────
    naoEntendeu: `Não entendi sua mensagem. 😅

Por favor, escolha uma das opções enviando o *número correspondente*, ou envie *"menu"* para ver as opções novamente.`,
};

module.exports = knowledge;
