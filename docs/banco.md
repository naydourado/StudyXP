# Modelagem Inicial do Banco de Dados — StudyXP

O banco de dados do StudyXP foi modelado utilizando MySQL e SQLAlchemy.

Inicialmente, o sistema possui a entidade Usuario, responsável pelo armazenamento das informações de autenticação e progresso do estudante.

## Tabela: usuarios

Campos:

- id (PK)
- nome
- email
- senha
- xp
- nivel
- data_criacao

## Regras

- Email deve ser único
- XP inicia em 0
- Nível inicia em 1
- Data de criação é registrada automaticamente