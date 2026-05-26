# StudyXP
*Projeto Integrador - Unasp*

StudyXP é uma plataforma acadêmica voltada para organização dos estudos e produtividade.

O sistema permite que estudantes acompanhem tarefas, registrem humor, utilizem sessões de foco (Pomodoro) e acompanhem sua evolução por meio de um sistema de XP e níveis.

# Tecnologias Utilizadas

## Frontend

- React
- Vite
- React Router DOM
- Axios
- React Icons
- CSS

## Backend

- FastAPI
- SQLAlchemy
- JWT Authentication
- Passlib
- PyMySQL
- MySQL

# Funcionalidades

## Autenticação

O sistema possui autenticação baseada em JWT, permitindo:

- Cadastro de usuários
- Login seguro
- Controle de sessão
- Logout
- Alteração de senha
- Exclusão da conta

## Dashboard

O dashboard reúne as principais informações do usuário em uma única tela, incluindo:

- Saudação personalizada
- Tarefas do dia
- Sequência de estudos
- Sistema de XP e nível
- Sessão de foco
- Último registro de humor

## Sistema de Tarefas

O módulo de tarefas permite:

- Criar tarefas
- Editar informações
- Excluir tarefas
- Marcar como concluídas
- Retornar tarefas para pendente
- Ganhar XP de acordo com a prioridade
- Organizar atividades por status

## Progresso

A página de progresso apresenta indicadores da evolução do usuário, como:

- XP acumulado
- Quantidade de tarefas concluídas
- Sequência de estudos
- Tempo dedicado às sessões de foco
- Evolução geral do desempenho

## Sessão de Foco

O sistema utiliza o método Pomodoro para auxiliar nos estudos, oferecendo:

- Temporizador funcional
- Registro automático das sessões
- Controle do tempo estudado
- Integração com XP e progresso

## Registro de Humor

O usuário pode registrar seu humor e acompanhar padrões relacionados aos estudos por meio de:

- Seleção de emoções
- Observações diárias
- Histórico de registros
- Integração com o dashboard

## Perfil

A área de perfil permite visualizar e atualizar informações pessoais, além de acompanhar:

- Dados do usuário
- Progresso de XP
- Nível atual
- Sistema de conquistas

## Configurações

A página de configurações reúne opções relacionadas à conta e preferências do sistema, incluindo:

- Preferências do usuário
- Alteração de senha
- Exclusão de conta

# Estrutura do Projeto

```txt
StudyXP/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   │
│   ├── env/
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── main.jsx
│
├── docs/
│
└── README.md
```

# Instalação

## Backend

Entre na pasta:

```bash
cd backend
```

Ative o ambiente virtual.

Windows:

```bash
env\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Execute o servidor:

```bash
uvicorn app.main:app --reload
```

Backend disponível em:

```txt
http://127.0.0.1:8000
```

## Frontend

Entre na pasta:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
npm run dev
```

Frontend disponível em:

```txt
http://localhost:5173
```

# Banco de Dados

O projeto utiliza MySQL.

Configure o arquivo `.env` com suas credenciais:

```env
DB_HOST=localhost # onde o banco está rodando (local)
DB_USER=root # usuário do MySQL
DB_PASSWORD=root # senha do MySQL
DB_NAME=studyxp # nome do banco criado no MySQL
SECRET_KEY=studyxp_chave_secreta
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

# API

A documentação automática do FastAPI pode ser acessada em:

```txt
http://127.0.0.1:8000/docs
```

# Interface

O StudyXP possui interface baseada em cards e design focado em produtividade, incluindo:

- Dashboard
- Tarefas
- Progresso
- Sessão de Foco
- Registro de Humor
- Perfil
- Configurações
