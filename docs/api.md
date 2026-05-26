# API do StudyXP

A API do StudyXP foi desenvolvida utilizando FastAPI e segue o padrão REST.

As rotas utilizam JSON para envio e retorno de dados.

Grande parte dos endpoints exige autenticação JWT.

Base URL local:

```txt
http://127.0.0.1:8000
```

# Autenticação

As rotas privadas exigem envio do token JWT.

Formato:

```txt
Authorization: Bearer TOKEN
```

O token é obtido durante o login.

# Usuários

## Cadastro

### POST /usuarios

Cria um novo usuário.

Body:

```json
{
  "nome": "Nayra",
  "email": "nayra@email.com",
  "senha": "123456"
}
```

Retorno:

```json
{
  "id": 1,
  "nome": "Nayra",
  "email": "nayra@email.com"
}
```

---

## Login

### POST /login

Autentica o usuário e gera token JWT.

Body:

```json
{
  "email": "nayra@email.com",
  "senha": "123456"
}
```

Retorno:

```json
{
  "access_token": "TOKEN",
  "token_type": "bearer"
}
```

---

## Usuário Logado

### GET /me

Retorna informações do usuário autenticado.

Autenticação:

Sim.

Retorno:

```json
{
  "id": 1,
  "nome": "Nayra",
  "email": "nayra@email.com"
}
```

---

## Editar Perfil

### PUT /perfil

Atualiza informações do usuário.

Autenticação:

Sim.

Body:

```json
{
  "nome": "Novo Nome",
  "email": "novo@email.com"
}
```

Retorno:

```json
{
  "mensagem": "Perfil atualizado"
}
```

---

## Alterar Senha

### PUT /alterar-senha

Permite alterar a senha da conta.

Autenticação:

Sim.

Body:

```json
{
  "senha_atual": "123456",
  "nova_senha": "654321"
}
```

Retorno:

```json
{
  "mensagem": "Senha alterada com sucesso"
}
```

---

## Excluir Conta

### DELETE /perfil

Remove o usuário e seus dados associados.

Autenticação:

Sim.

Retorno:

```json
{
  "mensagem": "Conta excluida com sucesso"
}
```

# Dashboard

## Dados Gerais

### GET /dashboard

Retorna informações gerais do usuário.

Autenticação:

Sim.

Retorno:

```json
{
  "xp": 50,
  "nivel": 1,
  "sequencia_dias": 2,
  "tarefas_concluidas": 4,
  "tempo_total_foco": 25
}
```

# Tarefas

## Listar Tarefas

### GET /tarefas

Lista tarefas do usuário.

Autenticação:

Sim.

Retorno:

```json
[
  {
    "id": 1,
    "titulo": "Estudar Redes",
    "prioridade": "alta",
    "status": "pendente"
  }
]
```

---

## Criar Tarefa

### POST /tarefas

Cria uma tarefa.

Autenticação:

Sim.

Body:

```json
{
  "titulo": "Estudar",
  "descricao": "Capítulo 3",
  "prioridade": "alta"
}
```

Retorno:

```json
{
  "mensagem": "Tarefa criada"
}
```

---

## Editar Tarefa

### PUT /tarefas/{id}

Atualiza dados da tarefa.

Autenticação:

Sim.

Body:

```json
{
  "titulo": "Novo título",
  "status": "concluida"
}
```

Retorno:

```json
{
  "mensagem": "Tarefa atualizada"
}
```

---

## Excluir Tarefa

### DELETE /tarefas/{id}

Remove uma tarefa.

Autenticação:

Sim.

Retorno:

```json
{
  "mensagem": "Tarefa excluida"
}
```

# Registro de Humor

## Listar Humor

### GET /humor

Retorna histórico de humor.

Autenticação:

Sim.

Retorno:

```json
[
  {
    "humor": "feliz",
    "observacao": "Dia produtivo"
  }
]
```

---

## Registrar Humor

### POST /humor

Cria novo registro.

Autenticação:

Sim.

Body:

```json
{
  "humor": "feliz",
  "observacao": "Dia produtivo"
}
```

Retorno:

```json
{
  "mensagem": "Humor registrado"
}
```

# Sessões de Foco

## Listar Sessões

### GET /foco

Retorna sessões registradas.

Autenticação:

Sim.

Retorno:

```json
[
  {
    "tempo_minutos": 25
  }
]
```

---

## Registrar Sessão

### POST /foco

Salva uma sessão Pomodoro.

Autenticação:

Sim.

Body:

```json
{
  "tempo_minutos": 25
}
```

Retorno:

```json
{
  "mensagem": "Sessao registrada"
}
```

# Respostas HTTP

Principais códigos utilizados:

| Código | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 404 | Não encontrado |
| 500 | Erro interno |

# Swagger

A documentação automática pode ser acessada em:

```txt
http://127.0.0.1:8000/docs
```