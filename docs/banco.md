# Banco de Dados

O StudyXP utiliza MySQL como sistema gerenciador de banco de dados.

O acesso é realizado através do SQLAlchemy ORM, permitindo manipulação dos dados por objetos Python e reduzindo a necessidade de comandos SQL diretos.

# Visão Geral

O banco foi estruturado para armazenar informações relacionadas à conta do usuário e suas atividades dentro da plataforma.

Principais entidades:

- Usuarios
- Tarefas
- Registro de Humor
- Sessao de Foco
- Historico de Acessos

# Modelo Conceitual

Relacionamentos principais:

```txt
Usuario
│
├── Tarefas
├── Registros de Humor
├── Sessões de Foco
└── Histórico de Acessos
```

Cada usuário possui seus próprios dados e registros.

# Tabela: usuarios

Armazena informações básicas da conta e progresso do estudante.

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| nome | String | Nome do usuário |
| email | String | Email único |
| senha | String | Senha criptografada |
| xp | Integer | XP acumulado |
| nivel | Integer | Nível atual |
| ultimo_acesso | DateTime | Último login |
| sequencia_dias | Integer | Dias consecutivos |
| data_criacao | DateTime | Data de cadastro |

Exemplo:

```txt
1 | Nayra | nayra@email.com | XP 50 | Nivel 1
```

# Tabela: tarefas

Responsável pelo gerenciamento das tarefas do usuário.

Relacionamento:

```txt
Muitos para Um
tarefas → usuarios
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| titulo | String | Nome da tarefa |
| descricao | String | Descrição |
| prioridade | String | Baixa, média ou alta |
| status | String | Pendente ou concluída |
| xp_recompensa | Integer | XP gerado |
| usuario_id | Integer | FK usuário |

Exemplo:

```txt
Estudar Redes | Alta | Pendente | 30 XP
```

# Tabela: registro_humor

Armazena emoções e observações relacionadas ao estudo.

Relacionamento:

```txt
Muitos para Um
registro_humor → usuarios
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| humor | String | Emoção |
| observacao | Text | Comentário |
| data_registro | DateTime | Data |
| usuario_id | Integer | FK usuário |

Exemplo:

```txt
feliz | "Dia produtivo"
```

# Tabela: sessao_foco

Responsável pelo histórico Pomodoro.

Relacionamento:

```txt
Muitos para Um
sessao_foco → usuarios
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| tempo_minutos | Integer | Tempo estudado |
| data_registro | DateTime | Registro |
| usuario_id | Integer | FK usuário |

Exemplo:

```txt
25 minutos
```

# Tabela: historico_acessos

Controla acessos e sequência de estudos.

Relacionamento:

```txt
Muitos para Um
historico_acessos → usuarios
```

Campos:

| Campo | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador |
| data_acesso | DateTime | Momento do acesso |
| usuario_id | Integer | FK usuário |

Essa tabela é utilizada para cálculo da sequência diária.

# Integridade e Relacionamentos

O banco utiliza chaves estrangeiras para garantir integridade referencial.

Exemplo:

Uma tarefa não pode existir sem estar vinculada a um usuário.

Relacionamentos:

```txt
usuarios 1:N tarefas
usuarios 1:N registro_humor
usuarios 1:N sessao_foco
usuarios 1:N historico_acessos
```

# SQLAlchemy ORM

O projeto utiliza ORM para:

- Criar entidades
- Relacionar tabelas
- Executar consultas
- Inserir registros
- Atualizar dados
- Remover informações

Exemplo:

```python
usuario.tarefas
```

Esse mecanismo melhora organização e manutenção do código.

# Considerações

A estrutura do banco foi planejada para:

- Separação clara dos dados
- Escalabilidade
- Facilidade de manutenção
- Segurança
- Integração com FastAPI e SQLAlchemy

O modelo permite expansão futura com novas funcionalidades e módulos.