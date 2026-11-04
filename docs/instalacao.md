# Instalação do StudyXP

Passo a passo para rodar API, web e mobile em ambiente local.

# Pré-requisitos

- Python 3.12 ou superior
- Node.js 22 ou superior
- MySQL 8 (XAMPP, MySQL Workbench ou Docker)
- Celular com o app **Expo Go** (ou emulador Android)

# 1. Clonar

```bash
git clone https://github.com/naydourado/StudyXP.git
cd StudyXP
```

# 2. API (backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements-dev.txt
```

## Arquivo .env

Copie o modelo e preencha:

```bash
copy .env.example .env
python scripts/gerar_chaves.py   # gera SECRET_KEY e HUMOR_ENC_KEY novas
```

| Variável | Função |
|---|---|
| `DATABASE_URL` | Conexão MySQL: `mysql+pymysql://USUARIO:SENHA@localhost:3306/studyxp` |
| `SECRET_KEY` | Chave dos tokens JWT (mínimo 32 caracteres, nunca compartilhar) |
| `HUMOR_ENC_KEY` | Chave de criptografia das notas de humor |
| `CORS_ORIGINS` | Endereços do site autorizados, ex.: `["http://localhost:5173"]` |
| `COOKIE_SECURE` | `true` em produção (HTTPS) |

> O `.env` **nunca** vai para o Git. Cada integrante tem o seu.

## Banco de dados

Crie o banco vazio e aplique as migrações:

```sql
CREATE DATABASE studyxp CHARACTER SET utf8mb4;
```

```bash
alembic upgrade head
```

> Quem tinha o banco da versão anterior: apague e recrie o banco `studyxp` antes do `alembic upgrade head` (as tabelas mudaram).

## Executar

```bash
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000/api/v1/health
- Swagger: http://127.0.0.1:8000/docs

Para o celular acessar a API pela rede, use `--host 0.0.0.0`.

## Alternativa com Docker

Com o Docker instalado, na raiz do projeto:

```bash
docker compose up --build
```

Sobe MySQL, API (com migrações) e Adminer (http://localhost:8080).

# 3. Web (frontend)

```bash
cd frontend
npm install
npm run dev
```

Acesse http://localhost:5173. O Vite encaminha `/api` para a API local (porta 8000).

# 4. Mobile

```bash
cd mobile
npm install
copy .env.example .env.local
```

Em `.env.local`, ajuste `EXPO_PUBLIC_API_URL`:

- celular físico: `http://IP-DO-COMPUTADOR:8000/api/v1` (mesma rede Wi-Fi)
- emulador Android: `http://10.0.2.2:8000/api/v1`

```bash
npm start
```

Leia o QR code com o Expo Go.

# 5. Testes

```bash
cd backend
pytest              # testes da API
ruff check .        # padrão de código
```

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd mobile
npm run typecheck
npm run lint
```
