# Roteiro de Testes Manuais

O que os testes automatizados **não** cobrem e precisa ser conferido por uma pessoa. Marque cada item com a data, o aparelho ou navegador e quem testou. Abra uma issue para cada falha.

Situação dos testes automatizados em 27/10/2026:

| Parte | Testes | Comando |
|---|---|---|
| API | 67 (cobertura 95%) | `cd backend && pytest` |
| Web — unidade | 29 | `cd frontend && npm test` |
| Web — ponta a ponta e acessibilidade (desktop e celular) | 46 | `cd frontend && npm run test:e2e` |
| Mobile | 17 | `cd mobile && npm test` |

## 1. App no celular (Android, de preferência 2 aparelhos)

Instalar o APK gerado pelo EAS Build (o push só funciona no APK, não no Expo Go).

| # | Teste | Resultado esperado | OK? |
|---|---|---|---|
| M1 | Cadastrar, fechar o app por completo e abrir de novo | Continua logado | |
| M2 | Criar tarefa com prazo pelo calendário | Data escolhida aparece na tarefa | |
| M3 | Tocar numa tarefa, editar título e prioridade | Alterações salvas | |
| M4 | Concluir tarefa | Celular vibra, XP sobe; aviso de conquista quando houver | |
| M5 | Reabrir e excluir tarefa | XP volta; tarefa some | |
| M6 | Pomodoro: iniciar, bloquear a tela e esperar terminar (testar com "Pausa curta", 5 min) | Notificação chega na hora certa; ao abrir o app, a sessão é registrada | |
| M7 | Pomodoro: pausar e continuar | Tempo para e continua de onde parou; notificação reagendada | |
| M8 | Humor: autorizar, registrar com nota, apagar um registro | Funciona; nota aparece só para o próprio usuário | |
| M9 | Configurações → revogar o humor | Pede confirmação e apaga os registros | |
| M10 | Lembrete de prazo: criar tarefa para amanhã e esperar as 18h (agendador ligado) | Push "Tarefas para amanhã"; tocar abre a aba Tarefas | |
| M11 | Configurações → desligar lembretes | Não recebe mais o push | |
| M12 | Progresso | Gráficos com os dados da semana | |
| M13 | Exportar meus dados | Abre o menu de compartilhar com o JSON | |
| M14 | Esqueci minha senha | E-mail chega; o link abre a página de nova senha no site | |
| M15 | Trocar senha e excluir conta | Funciona; após excluir, volta para o login | |
| M16 | Modo avião em qualquer tela | Mensagem "Sem conexão"; volta a funcionar ao reconectar | |
| M17 | Sair da conta | Volta para o login e para de receber push | |
| M18 | Abrir Política e Termos (cadastro, configurações e humor) | Abrem dentro do app, sem internet do site; tabelas legíveis | |
| M19 | TalkBack ligado: navegar por login, tarefas e humor | Botões e opções são lidos com nome e estado | |
| M20 | Fonte do sistema no tamanho máximo | Telas legíveis, nada cortado | |
| M21 | Mudar `TERMOS_VERSAO` na API e abrir o app logado | Aparece a tela de novo aceite; após aceitar, o app volta ao normal; "Sair" também funciona | |
| M22 | Configurações do Android → Apps → StudyXP → Permissões | Só notificações (sem câmera, microfone, localização, contatos ou arquivos) | |

## 2. Site

| # | Teste | Resultado esperado | OK? |
|---|---|---|---|
| W1 | Chrome, Firefox, Edge (e Safari, se houver) | Layout e fluxos iguais | |
| W2 | Site num celular real (não só o tamanho simulado) | Barra de navegação no rodapé, sem rolagem lateral | |
| W3 | Pomodoro completo de 25 minutos | Som no fim, +25 XP, ofensiva e "Hoje" atualizados | |
| W4 | Pomodoro encerrado no meio ("Encerrar") | Conta só os minutos reais | |
| W5 | Pomodoro com a aba em segundo plano | O tempo continua certo | |
| W6 | Duas abas abertas, esperar 15 minutos e usar as duas | A sessão não cai | |
| W7 | Esqueci minha senha com e-mail real (Resend em produção) | E-mail chega, link funciona uma vez só, vence em 30 minutos | |
| W8 | Exportar dados e conferir o JSON | Tem tarefas, humor (com as notas legíveis), foco e consentimentos; sem senha | |
| W9 | Navegar só pelo teclado (Tab, Enter, Espaço) | Todas as ações acessíveis, foco visível | |
| W10 | Leitor de tela (NVDA) em login, tarefas e humor | Campos, botões e mensagens lidos corretamente | |
| W11 | Lighthouse (Chrome DevTools) nas páginas principais | Acessibilidade ≥ 90 | |
| W12 | Zoom do navegador em 200% | Conteúdo legível, sem sobreposição | |
| W13 | Aba anônima: abrir o site | Aviso de cookies aparece; "Saiba mais" leva à seção de cookies; "Entendi" some e não volta | |
| W14 | DevTools → Application → Cookies, depois de logar | Só `studyxp_refresh` (HttpOnly); nenhum cookie de terceiros | |
| W15 | DevTools → Network com o site publicado | Nenhuma requisição para Google, Facebook ou outros domínios | |
| W16 | Mudar `TERMOS_VERSAO` na API e recarregar logado | Tela de novo aceite antes do Dashboard | |
| W17 | Política e Termos no celular | Tabelas rolam na horizontal sem quebrar a página | |

## 3. Ambiente publicado

| # | Teste | Resultado esperado | OK? |
|---|---|---|---|
| P1 | Acessar a API depois de 30 minutos parada (Render gratuito) | Responde em até ~1 minuto e depois fica rápida | |
| P2 | Login no site publicado e recarregar a página | Sessão mantida (cookie pelo proxy da Vercel) | |
| P3 | Cabeçalhos de segurança (securityheaders.com no site) | CSP, HSTS, X-Frame-Options presentes | |
| P4 | `/docs` na API de produção | Não existe (404) | |
| P5 | Agendador: Actions → Agendador → Run workflow | Os 3 passos ficam verdes | |
| P6 | Resumo semanal num domingo após as 18h (com o resumo ligado) | E-mail chega uma vez | |
| P7 | Backup: Actions → Backup do banco → Run workflow | Artefato criptografado gerado | |
| P8 | Restaurar o backup num MySQL de teste | Dados voltam (ver comando no `backup.yml`) | |
| P9 | Scan de segurança: Actions → Seguranca → Run workflow | Relatório sem alertas altos | |
| P10 | `docker compose up --build` numa máquina com Docker | MySQL, API e Adminer sobem; API responde | |
| P11 | Conexão com a Aiven usando `DATABASE_SSL_CA` | API conecta; sem o certificado, a conexão é recusada | |
