# Documentação Técnica do Backend — StudyXP

## 1. Visão Geral

O backend é uma API REST em FastAPI que atende o site (React) e o app (React Native). Ele concentra **todas** as regras de negócio: autenticação, tarefas, foco, humor e gamificação. Os clientes apenas exibem o que a API devolve — assim os números de XP, nível e ofensiva são os mesmos no web e no celular e não podem ser manipulados pelo cliente.

## 2. Tecnologias

| Tecnologia | Uso |
|---|---|
| FastAPI + Uvicorn | API REST e servidor ASGI |
| SQLAlchemy 2 | ORM (mapeamento das tabelas) |
| Alembic | Migrações versionadas do banco |
| PyMySQL | Driver do MySQL |
| Pydantic + pydantic-settings | Validação de dados e das variáveis de ambiente |
| PyJWT | Tokens de acesso (JWT) |
| pwdlib (Argon2) | Hash de senhas |
| cryptography (Fernet) | Criptografia das notas de humor |
| SlowAPI | Limite de requisições (força bruta) |
| pytest + httpx | Testes automatizados |
| Ruff | Padrão de código |

## 3. Arquitetura

```txt
app/
├── main.py            cria a aplicação, CORS, cabeçalhos de segurança, rotas
├── core/
│   ├── config.py      variáveis de ambiente (falha se faltar SECRET_KEY)
│   ├── database.py    conexão e sessão do banco
│   ├── seguranca.py   hash de senha, JWT, refresh tokens com rotação
│   ├── deps.py        dependência get_usuario_atual
│   ├── cripto.py      criptografia das notas de humor
│   ├── erros.py       formato padrão de erro {detail, code}
│   ├── rate_limit.py  limite de requisições
│   └── tempo.py       datas em UTC e "dia" no fuso do usuário
├── models/            tabelas (usuario, atividades, conta, enums)
├── schemas/           entrada e saída validadas
├── routers/           auth, conta (/me), tarefas, foco, humor, painel
└── services/          gamificacao, ofensiva, conquistas, consentimentos
```

As rotas são finas: validam a entrada e chamam os `services/`, onde ficam as regras testadas sem HTTP.

## 4. Regras de Negócio

### Cadastro e sessão

- E-mail único (sem diferenciar maiúsculas). Senha com no mínimo 8 caracteres.
- Cadastro exige aceite dos Termos/Política e declaração de maioridade; o aceite fica registrado (`consentimentos`).
- Access token de 15 minutos + refresh token de 30 dias com rotação. Reutilizar um refresh token já trocado revoga toda a sessão (sinal de roubo), com tolerância de 10 s para duas abas renovando juntas.
- Trocar a senha desconecta os outros dispositivos.

### XP e nível

| Ação | XP | Limite |
|---|---|---|
| Concluir tarefa baixa / média / alta | 20 / 50 / 80 | 15 tarefas pontuando por dia |
| Minuto de sessão de foco | 1 | 240 XP de foco por dia |
| Primeiro registro de humor do dia | 5 | 1 por dia |

- Reabrir uma tarefa estorna o XP que ela deu.
- Para ir do nível *n* ao *n+1* são necessários 100 × *n* XP (XP total para o nível N = 50·N·(N−1)).
- Todo ganho ou estorno fica no extrato `eventos_xp`.

### Ofensiva

- Dia ativo = concluiu ao menos uma tarefa ou uma sessão de foco completa, contado no **fuso do usuário** (padrão America/Sao_Paulo).
- Login sozinho não conta.

### Foco

- O servidor marca o início da sessão. Ao finalizar, confere o tempo decorrido: sessão completa conta para a ofensiva; encerrada antes conta só os minutos reais.
- Pausas não dão XP. Iniciar uma sessão nova cancela a anterior que ficou aberta.

### Humor

- Exige consentimento específico (LGPD art. 11). Revogar apaga todos os registros.
- A observação é guardada criptografada.

### Acesso aos dados

- Toda consulta filtra pelo usuário do token; recurso de outra pessoa responde 404.

### Tarefas periódicas

O agendador do GitHub Actions chama `POST /api/v1/interno/jobs/...` de hora em hora (protegido por `X-Cron-Token`):

| Job | O que faz |
|---|---|
| `lembretes` | Push na véspera do prazo (a partir das 18h) e no dia (a partir das 8h), no fuso do usuário, sem repetir |
| `resumo-semanal` | E-mail aos domingos a partir das 18h para quem ligou o resumo (opt-in), uma vez por semana |
| `limpeza` | Apaga logs de acesso com mais de 6 meses, tokens vencidos e cancela sessões de foco esquecidas |

E-mail (Resend) e push (Expo) têm o modo `console`, que só escreve no log — usado em desenvolvimento e nos testes.

## 5. Segurança

- Senhas com Argon2; nada de senha ou token em log.
- Rate limit em login, cadastro e refresh.
- CORS restrito aos endereços configurados; cabeçalhos `nosniff`, `X-Frame-Options`, HSTS em produção.
- Erro inesperado devolve mensagem genérica (sem stack trace). Swagger desligado em produção.
- Dependências auditadas no CI (`pip-audit`).

## 6. Testes

```bash
pytest
```

Os testes usam SQLite em memória e um relógio simulado (`tempo.agora`) para testar virada de dia, ofensiva e limites diários. No CI as migrações também são aplicadas num MySQL 8 real.
