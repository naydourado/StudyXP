# Instalação do StudyXP

Este documento apresenta o processo de instalação e execução do projeto StudyXP em ambiente local.

# Pré-requisitos

Antes da instalação, é necessário possuir:

Frontend:

- Node.js
- npm

Backend:

- Python 3.10+
- pip
- Ambiente virtual (venv)

Banco:

- MySQL
- XAMPP ou outro gerenciador MySQL

# Clonando o Projeto

Clone o repositório:

```bash
git clone https://github.com/naydourado/StudyXP.git
```

Entre na pasta:

```bash
cd StudyXP
```

# Configuração do Backend

Entre na pasta backend:

```bash
cd backend
```

Crie o ambiente virtual:

Windows:

```bash
python -m venv env
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

# Arquivo .env

Na pasta backend, crie um arquivo `.env`.

Exemplo:

```env
DATABASE_URL=mysql+pymysql://root:senha@localhost/studyxp

SECRET_KEY=sua_chave_secreta

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Descrição:

| Variável | Função |
|---|---|
| DATABASE_URL | Conexão MySQL |
| SECRET_KEY | Chave JWT |
| ALGORITHM | Algoritmo do token |
| ACCESS_TOKEN_EXPIRE_MINUTES | Tempo de sessão |

# Configuração do Banco

Abra o MySQL.

Crie o banco:

```sql
CREATE DATABASE studyxp;
```

Após configurar a conexão, execute o backend para criação das tabelas.

# Executando o Backend

Ainda dentro de backend:

```bash
uvicorn app.main:app --reload
```

Servidor:

```txt
http://127.0.0.1:8000
```

Swagger:

```txt
http://127.0.0.1:8000/docs
```

O parâmetro:

```txt
--reload
```

permite atualização automática durante o desenvolvimento.

# Configuração do Frontend

Abra outro terminal.

Entre na pasta frontend:

```bash
cd frontend
```

Instale dependências:

```bash
npm install
```

# Variáveis do Frontend

Crie um arquivo `.env`.

Exemplo:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Essa variável define a URL da API utilizada pelo frontend.

# Executando o Frontend

Execute:

```bash
npm run dev
```

Servidor:

```txt
http://localhost:5173
```

O Vite iniciará automaticamente o ambiente de desenvolvimento.

# Dependências Utilizadas

## Frontend

Principais bibliotecas:

```txt
react
react-router-dom
axios
react-icons
vite
```

Instalação manual:

```bash
npm install
```

## Backend

Principais dependências:

```txt
fastapi
uvicorn
sqlalchemy
pymysql
python-jose
passlib
python-dotenv
bcrypt
```

Instalação:

```bash
pip install -r requirements.txt
```

# Verificando a Instalação

O sistema estará funcionando corretamente quando:

Backend:

```txt
http://127.0.0.1:8000/docs
```

abrir normalmente.

Frontend:

```txt
http://localhost:5173
```

exibir a tela de login.

# Problemas Comuns

## Porta ocupada

Erro:

```txt
Address already in use
```

Solução:

Finalizar processos anteriores ou alterar porta.

Backend:

```bash
uvicorn app.main:app --reload --port 8001
```

Frontend:

```bash
npm run dev -- --port 5174
```

## Erro de conexão MySQL

Verificar:

- XAMPP iniciado
- Banco criado
- DATABASE_URL correta
- Usuário e senha válidos

## Dependência não encontrada

Exemplo:

```txt
ModuleNotFoundError
```

Solução:

Reinstalar:

```bash
pip install -r requirements.txt
```

ou:

```bash
npm install
```

# Considerações

O projeto foi estruturado para desenvolvimento local utilizando FastAPI, React e MySQL.

Após instalação, novas funcionalidades podem ser desenvolvidas mantendo a mesma estrutura do sistema.