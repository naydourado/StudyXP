# Modelagem do Banco de Dados — StudyXP

## 1. Visão Geral

O banco de dados do StudyXP foi desenvolvido utilizando MySQL e modelado através do SQLAlchemy.

A estrutura foi organizada para armazenar usuários, tarefas, registros emocionais e sessões de foco, permitindo suporte às funcionalidades acadêmicas e gamificadas do sistema.

O modelo segue relacionamentos do tipo 1:N (um para muitos), permitindo que um usuário possua múltiplos registros associados.

---

## 2. Entidades do Sistema

Atualmente o banco possui quatro entidades principais:

- usuarios
- tarefas
- registros_humor
- sessoes_foco

Cada entidade representa uma área funcional do sistema.

---

## 3. Tabela: usuarios

Responsável pelo armazenamento das informações do usuário e progresso geral.

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador do usuário |
| nome | String | Nome do usuário |
| email | String | Email único |
| senha | String | Senha criptografada |
| xp | Integer | Experiência acumulada |
| nivel | Integer | Nível do usuário |
| data_criacao | DateTime | Data de cadastro |

### Regras

- Email deve ser único.
- Senha é armazenada utilizando hash bcrypt.
- XP inicia em 0.
- Nível inicia em 1.
- Data de criação é registrada automaticamente.

---

## 4. Tabela: tarefas

Responsável pelo gerenciamento das tarefas acadêmicas.

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador da tarefa |
| titulo | String | Título da tarefa |
| descricao | String | Descrição opcional |
| prioridade | String | Prioridade da tarefa |
| status | String | Situação da tarefa |
| xp_recompensa | Integer | XP obtido ao concluir |
| data_criacao | DateTime | Data da criação |
| usuario_id | FK | Usuário dono da tarefa |

### Regras

- Cada tarefa pertence a um usuário.
- Apenas o dono pode editar ou excluir.
- Status inicial:

```txt
pendente
```

- Ao concluir:

```txt
status = concluida
+ xp
```

Valores comuns de prioridade:

```txt
baixa
media
alta
```

Valores de status:

```txt
pendente
concluida
```

---

## 5. Tabela: registros_humor

Responsável pelo registro emocional do estudante.

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| humor | String | Estado emocional |
| observacao | String | Comentário opcional |
| data_registro | DateTime | Data do registro |
| usuario_id | FK | Dono do registro |

### Regras

- Cada registro pertence a um usuário.
- Apenas o próprio usuário visualiza seus registros.
- O registro é armazenado com data automática.

Exemplos de humor:

```txt
feliz
motivado
cansado
ansioso
estressado
```

---

## 6. Tabela: sessoes_foco

Responsável pelo armazenamento das sessões de estudo.

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| tempo_minutos | Integer | Tempo estudado |
| data_sessao | DateTime | Data da sessão |
| usuario_id | FK | Dono da sessão |

### Regras

- Cada sessão pertence a um usuário.
- O tempo é armazenado em minutos.
- Os registros alimentam o dashboard.
- O usuário acessa apenas suas próprias sessões.

---

## 7. Relacionamentos

O modelo atual utiliza relacionamentos 1:N.

### Usuario → Tarefas

Um usuário pode possuir várias tarefas.

```txt
1 usuario
↓
N tarefas
```

---

### Usuario → Humor

Um usuário pode possuir vários registros emocionais.

```txt
1 usuario
↓
N registros_humor
```

---

### Usuario → Foco

Um usuário pode possuir várias sessões de foco.

```txt
1 usuario
↓
N sessoes_foco
```

---

## 8. Chaves Primárias e Estrangeiras

### Primary Keys (PK)

Identificadores únicos de cada tabela.

```txt
usuarios.id
tarefas.id
registros_humor.id
sessoes_foco.id
```

---

### Foreign Keys (FK)

Responsáveis pelos relacionamentos entre tabelas.

```txt
tarefas.usuario_id
→ usuarios.id

registros_humor.usuario_id
→ usuarios.id

sessoes_foco.usuario_id
→ usuarios.id
```

As FKs garantem integridade referencial e impedem registros órfãos.

---

## 9. DER Conceitual Atual

Representação simplificada do modelo:

```txt
USUARIOS
│
├── TAREFAS
├── REGISTROS_HUMOR
└── SESSOES_FOCO
```

Modelo relacional:

```txt
usuarios (1)
        |
        |----< tarefas (N)

usuarios (1)
        |
        |----< registros_humor (N)

usuarios (1)
        |
        |----< sessoes_foco (N)
```

---

## 10. Considerações Técnicas

O banco foi estruturado priorizando:

- normalização
- integridade relacional
- segurança dos dados
- facilidade de manutenção
- expansão futura

A estrutura atual permite inclusão posterior de novas entidades, como:

- conquistas
- ranking
- metas
- calendário
- notificações

Essa modelagem busca equilíbrio entre simplicidade inicial e escalabilidade futura do sistema.