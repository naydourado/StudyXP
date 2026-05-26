# Arquitetura do Sistema

O StudyXP foi desenvolvido seguindo uma arquitetura cliente-servidor, separando frontend e backend em aplicações independentes que se comunicam por meio de API REST.

Essa separação facilita manutenção, escalabilidade e organização do código.

# Visão Geral

O sistema é composto por três principais camadas:

```txt
Frontend (React)
↓
API REST (FastAPI)
↓
Banco de Dados (MySQL)
```

O frontend é responsável pela interface e experiência do usuário.

O backend concentra regras de negócio, autenticação, validações e comunicação com o banco de dados.

O MySQL armazena os dados persistentes do sistema.

# Frontend

O frontend foi desenvolvido utilizando React com Vite.

Sua principal função é fornecer uma interface dinâmica e responsiva para o usuário.

Principais responsabilidades:

- Renderização das telas
- Navegação entre páginas
- Consumo da API
- Controle de sessão
- Atualização dinâmica da interface
- Experiência do usuário

Tecnologias utilizadas:

- React
- Vite
- React Router DOM
- Axios
- React Icons
- CSS

# Backend

O backend foi desenvolvido com FastAPI.

Sua função é centralizar a lógica da aplicação e disponibilizar serviços através de endpoints.

Principais responsabilidades:

- Autenticação JWT
- Regras de negócio
- Processamento de dados
- Controle de permissões
- CRUD das funcionalidades
- Comunicação com banco de dados

Tecnologias utilizadas:

- FastAPI
- SQLAlchemy
- PyMySQL
- Passlib
- JWT

# Banco de Dados

O StudyXP utiliza MySQL como sistema gerenciador de banco de dados.

O banco armazena informações relacionadas a:

- Usuários
- Tarefas
- Sessões de foco
- Registro de humor
- Histórico de acessos

O acesso é realizado pelo SQLAlchemy utilizando ORM.

Isso permite trabalhar com objetos Python em vez de comandos SQL diretos na maior parte do sistema.

# Comunicação entre Frontend e Backend

A comunicação ocorre por meio de API REST utilizando JSON.

Fluxo simplificado:

```txt
Usuário
↓
Frontend React
↓
Axios
↓
FastAPI
↓
SQLAlchemy
↓
MySQL
```

Exemplo:

O usuário cria uma tarefa.

O React envia uma requisição POST para o backend.

O FastAPI valida os dados, salva no banco e retorna uma resposta JSON.

O frontend atualiza a interface automaticamente.

# Autenticação

O sistema utiliza autenticação baseada em JWT (JSON Web Token).

Fluxo:

1. Usuário realiza login
2. Backend valida credenciais
3. Token JWT é gerado
4. Token é armazenado no navegador
5. Requisições autenticadas enviam Authorization Bearer Token

Esse mecanismo protege rotas privadas e garante controle de acesso.

# Organização do Projeto

## Backend

```txt
backend/
│
├── app/
│   ├── routes/
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── security.py
```

### routes/

Contém as rotas da API organizadas por funcionalidade.

Exemplo:

- usuarios
- tarefas
- humor
- foco
- dashboard

### models.py

Define as entidades e tabelas do banco.

### schemas.py

Define validações e modelos Pydantic.

### security.py

Centraliza autenticação, hash e JWT.

### database.py

Configuração da conexão com banco.

### main.py

Inicialização da aplicação FastAPI.

## Frontend

```txt
frontend/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── main.jsx
```

### assets/

Imagens e arquivos visuais.

### components/

Componentes reutilizáveis.

Exemplo:

- Layout
- Sidebar
- Cards
- Modais

### pages/

Telas do sistema.

Exemplo:

- Login
- Dashboard
- Tarefas
- Perfil
- Configurações

### services/

Integração com API.

Exemplo:

- api.js
- autenticação
- chamadas Axios

# Considerações Arquiteturais

O projeto foi estruturado buscando:

- Separação de responsabilidades
- Organização do código
- Reutilização de componentes
- Facilidade de manutenção
- Escalabilidade
- Clareza da lógica de desenvolvimento

Essa arquitetura permite evolução futura do StudyXP com novas funcionalidades e integrações.