# StudyXP
*Projeto Integrador - Unasp*

StudyXP é uma plataforma acadêmica voltada para organização dos estudos e produtividade.

O sistema permite que estudantes acompanhem tarefas, registrem humor, utilizem sessões de foco (Pomodoro) e acompanhem sua evolução por meio de um sistema de XP, níveis, ofensiva e conquistas.

Disponível em versão **web** (React) e **mobile** (React Native / Expo), as duas consumindo a mesma **API** (FastAPI).

# Tecnologias

| Camada | Tecnologias |
|---|---|
| API (`backend/`) | Python, FastAPI, SQLAlchemy 2, Alembic, PyJWT, Argon2 (pwdlib), SlowAPI, PostgreSQL 18 |
| Web (`frontend/`) | React 19, Vite, React Router, Axios, Recharts, React Icons |
| Mobile (`mobile/`) | React Native, Expo SDK 58, Expo Router, Expo SecureStore |
| Qualidade | pytest, Ruff, ESLint, TypeScript, GitHub Actions, Dependabot |
| Infra | Docker, Render (API), Aiven (PostgreSQL), Vercel (web), EAS Build (APK) |

# Funcionalidades

- **Conta:** cadastro (com aceite dos Termos e confirmação de 18+), login, sessão com renovação automática, esqueci minha senha (link por e-mail), alteração de senha, exclusão de conta.
- **Tarefas:** criar, editar, excluir, prazo, prioridade, concluir e reabrir. O XP é definido pelo servidor (baixa 20, média 50, alta 80).
- **Foco (Pomodoro):** predefinições 25/5/15/50 min, sessão registrada no servidor, 1 XP por minuto de foco.
- **Humor:** registro com consentimento (dado sensível), nota criptografada, histórico.
- **Gamificação:** XP, níveis com curva crescente, ofensiva (dias seguidos) e conquistas.
- **Progresso:** XP da semana e tarefas por dia em gráficos.
- **Notificações:** aviso de fim do Pomodoro, lembretes push de prazo (véspera e dia) e resumo semanal por e-mail.
- **LGPD:** exportar meus dados, revogar consentimento, excluir conta, limpeza automática de logs antigos, Política de Privacidade e Termos de Uso.

# Estrutura do Projeto

```txt
StudyXP/
├── backend/            API FastAPI
│   ├── app/
│   │   ├── core/       configuração, banco, segurança, erros
│   │   ├── models/     tabelas (SQLAlchemy)
│   │   ├── schemas/    validação (Pydantic)
│   │   ├── routers/    rotas da API v1
│   │   ├── services/   regras de negócio (XP, ofensiva, conquistas)
│   │   └── main.py
│   ├── alembic/        migrações do banco
│   ├── tests/          testes automatizados (pytest)
│   └── Dockerfile
├── frontend/           site React (Vite)
├── mobile/             app React Native (Expo)
├── docs/               documentação
├── docker-compose.yml  ambiente local completo (PostgreSQL + API)
└── .github/            CI (testes, lint, build) e Dependabot
```

# Como rodar

O passo a passo completo está em [docs/instalacao.md](docs/instalacao.md). Resumo:

```bash
# API
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env      # preencha (veja docs/instalacao.md)
alembic upgrade head
uvicorn app.main:app --reload

# Web (outro terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173

# Mobile (outro terminal)
cd mobile
npm install
npm start                   # abra com o Expo Go
```

Documentação da API (Swagger): http://127.0.0.1:8000/docs

# Testes

| Parte | Testes | Comando |
|---|---|---|
| API | 67 testes, 95% de cobertura | `cd backend && pytest --cov=app` |
| Web — unidade | 29 testes | `cd frontend && npm test` |
| Web — ponta a ponta e acessibilidade (desktop e celular) | 46 testes | `cd frontend && npm run test:e2e` |
| Mobile | 17 testes | `cd mobile && npm test` |

Os testes ponta a ponta sobem uma API e um site próprios (portas 8001 e 5174). Sem o Chromium do Playwright, use o
navegador instalado: `PW_CANAL=msedge npm run test:e2e` (ou `chrome`).

O CI (GitHub Actions) roda tudo isso a cada pull request. Os testes que precisam de uma pessoa estão em
[docs/testes/testes-manuais.md](docs/testes/testes-manuais.md).

# Documentação

| Documento | Conteúdo |
|---|---|
| [docs/instalacao.md](docs/instalacao.md) | Como rodar tudo localmente |
| [docs/api.md](docs/api.md) | Rotas da API v1 |
| [docs/backend.md](docs/backend.md) | Arquitetura e regras de negócio |
| [docs/banco.md](docs/banco.md) | Tabelas e migrações |
| [docs/legal/](docs/legal/) | Política de Privacidade e Termos de Uso. Edite só `conteudo.json` e rode `node scripts/sincronizar-legal.mjs` (atualiza site, app e .md) |
| [docs/lgpd/ripd-registro-de-humor.md](docs/lgpd/ripd-registro-de-humor.md) | Relatório de impacto do dado sensível |
| [docs/lgpd/plano-resposta-incidentes.md](docs/lgpd/plano-resposta-incidentes.md) | O que fazer em caso de incidente |
| [docs/lgpd/riscos-juridicos.md](docs/lgpd/riscos-juridicos.md) | Riscos jurídicos e o que falta decidir |
| [docs/testes/testes-manuais.md](docs/testes/testes-manuais.md) | Roteiro de testes manuais |
| [docs/testes/roteiro-uat-sus.md](docs/testes/roteiro-uat-sus.md) | Teste com usuários e questionário SUS |

# Equipe

Brunno Denadai · Emily Modro · Gabriel Rossik · Isabela Rosa · Nayra Dourado (gerente do projeto)
