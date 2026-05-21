# Documentação Técnica do Backend — StudyXP

## 1. Visão Geral

O backend do StudyXP foi desenvolvido utilizando FastAPI, com o objetivo de fornecer uma API REST responsável pela comunicação entre o front-end e o banco de dados.

A API gerencia autenticação, usuários, tarefas, progresso acadêmico, sessões de foco e registros de humor, permitindo que o sistema ofereça uma experiência gamificada de organização dos estudos.

---

## 2. Tecnologias Utilizadas

O backend utiliza as seguintes tecnologias:

- Python
- FastAPI
- Uvicorn
- MySQL
- SQLAlchemy
- PyMySQL
- Pydantic
- JWT (python-jose)
- Passlib
- Python-dotenv

### Finalidade das principais tecnologias

### FastAPI
Framework responsável pela construção da API REST.

### Uvicorn
Servidor ASGI utilizado para executar o FastAPI localmente.

### SQLAlchemy
ORM responsável pelo mapeamento entre objetos Python e tabelas do banco de dados.

### Pydantic
Biblioteca utilizada para criação e validação dos schemas da API.

### PyMySQL
Driver responsável pela comunicação entre SQLAlchemy e MySQL.

### JWT
Utilizado para autenticação baseada em token.

### Passlib
Responsável pela criptografia (hash) das senhas dos usuários.

### Python-dotenv
Responsável pela leitura de variáveis de ambiente armazenadas no arquivo `.env`.

---

## 3. Arquitetura

O projeto utiliza arquitetura modular, separando responsabilidades por funcionalidades do sistema.

Essa abordagem facilita manutenção, organização do código, divisão de tarefas entre integrantes e escalabilidade do projeto.

Estrutura atual:

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
```

### Responsabilidade dos arquivos principais

### main.py
Responsável por inicializar o FastAPI e registrar as rotas.

### database.py
Responsável pela conexão com o MySQL e gerenciamento das sessões do banco.

### models.py
Define as entidades e tabelas do banco de dados utilizando SQLAlchemy.

### schemas.py
Define e valida os dados que entram e saem da API utilizando Pydantic.

### security.py
Responsável por hash de senha, JWT e autenticação do usuário logado.

### routes/
Pasta responsável por separar endpoints por módulos.

---

## 4. Módulos do Sistema

O backend foi dividido em módulos de responsabilidade.

### Usuários e Autenticação

Responsável por cadastro, login, geração de token JWT e identificação do usuário autenticado.

Endpoints:

```txt
POST /usuarios
POST /login
GET /me
```

---

### Tarefas

Responsável pelo gerenciamento das tarefas do estudante.

Funcionalidades:

- Criar tarefa
- Listar tarefas
- Editar tarefa
- Concluir tarefa
- Excluir tarefa
- Conceder XP

Endpoints:

```txt
POST /tarefas
GET /tarefas
PUT /tarefas/{tarefa_id}
PUT /tarefas/{tarefa_id}/concluir
DELETE /tarefas/{tarefa_id}
```

---

### Dashboard

Responsável por retornar informações de progresso acadêmico do usuário.

Endpoints:

```txt
GET /dashboard
```

O dashboard exibe:

- XP
- Nível
- Progresso das tarefas
- Tempo total de foco
- Último humor registrado

---

### Humor

Responsável pelo registro e listagem de estados emocionais.

Endpoints:

```txt
POST /humor
GET /humor
```

---

### Foco

Responsável pelo armazenamento das sessões de estudo e foco.

Endpoints:

```txt
POST /foco
GET /foco
```

---

## 5. Regras de Negócio

O backend segue as seguintes regras:

### Cadastro

- O email deve ser único.
- O usuário não pode ser criado com email duplicado.

### Segurança

- Senhas não são armazenadas em texto puro.
- O sistema utiliza hash bcrypt através do Passlib.
- O login retorna token JWT.
- Apenas usuários autenticados podem acessar rotas protegidas.

### Tarefas

- Cada tarefa pertence exclusivamente ao usuário autenticado.
- O usuário só pode editar ou excluir suas próprias tarefas.
- Ao concluir uma tarefa, o sistema adiciona XP automaticamente.
- O nível é calculado pela regra atual:

```txt
100 XP = +1 nível
```

### Dashboard

- O progresso é calculado com base na proporção de tarefas concluídas.
- O dashboard exibe XP, nível, progresso, tempo de foco e último humor registrado.

### Humor e Foco

- Os registros pertencem apenas ao usuário autenticado.
- O usuário pode visualizar apenas seus próprios registros.

---

## 6. Autenticação JWT

O sistema utiliza autenticação baseada em JWT.

Fluxo:

```txt
usuario realiza login
↓
backend valida email e senha
↓
gera token JWT
↓
front-end armazena token
↓
token e enviado no header Authorization
↓
rotas protegidas identificam usuario autenticado
```

Formato utilizado:

```txt
Authorization: Bearer TOKEN
```

As rotas protegidas utilizam:

```python
Depends(get_usuario_logado)
```

para identificar o usuário autenticado.

---

## 7. Considerações Técnicas

O backend foi estruturado priorizando modularização, segurança e reutilização de código.

A utilização conjunta de FastAPI, SQLAlchemy, Pydantic e JWT permitiu a construção de uma API organizada, validada e preparada para integração com o front-end React.

A arquitetura modular adotada facilita manutenção futura e permite expansão do sistema para funcionalidades adicionais, como conquistas, metas, ranking acadêmico e notificações.