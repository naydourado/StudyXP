# Documentação Técnica do Backend — StudyXP

## 1. Visão Geral

O backend do StudyXP foi desenvolvido utilizando FastAPI, com o objetivo de fornecer uma API REST para comunicação com o front-end em React.

A API é responsável por gerenciar usuários, autenticação, tarefas, XP, sessões de foco, registros de humor e dados do dashboard.

## 2. Tecnologias Utilizadas

- Python
- FastAPI
- Uvicorn
- MySQL
- SQLAlchemy
- PyMySQL
- Pydantic
- JWT
- Passlib
- Python-dotenv

## 3. Arquitetura

O projeto utiliza uma arquitetura modular, separando as responsabilidades por funcionalidade.

```txt
app/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── security.py
└── routes/
    ├── usuarios.py
    ├── tarefas.py
    ├── dashboard.py
    ├── humor.py
    └── foco.py