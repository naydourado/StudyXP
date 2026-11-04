# Banco de Dados

O StudyXP usa MySQL 8. O acesso é feito pelo SQLAlchemy (ORM) e a estrutura é versionada com **Alembic** (`backend/alembic/versions/`).

```bash
alembic upgrade head                              # cria/atualiza as tabelas
alembic revision --autogenerate -m "descricao"    # nova migração após mudar um model
```

# Modelo

Todas as tabelas de dados pertencem a um usuário (`usuario_id`) com `ON DELETE CASCADE`: excluir a conta apaga tudo (LGPD). Datas são guardadas em UTC.

```txt
usuarios
├── tarefas
├── sessoes_foco
├── registros_humor
├── eventos_xp
├── usuario_conquistas
├── preferencias (1:1)
├── refresh_tokens
├── consentimentos
└── historico_acessos
```

## usuarios

| Campo | Tipo | Descrição |
|---|---|---|
| id | int | Identificador |
| nome | varchar(100) | Nome |
| email | varchar(120) | Único |
| senha_hash | varchar(255) | Hash Argon2 |
| bio | varchar(280) | Opcional |
| fuso_horario | varchar(50) | Padrão America/Sao_Paulo |
| xp | int | XP total (o nível é calculado a partir dele) |
| ofensiva_atual / ofensiva_recorde | int | Dias seguidos |
| ultimo_dia_ativo | date | Último dia que contou para a ofensiva |
| termos_versao / termos_aceitos_em | varchar / datetime | Aceite dos termos |
| criado_em / atualizado_em | datetime | |

## tarefas

| Campo | Tipo | Descrição |
|---|---|---|
| titulo | varchar(150) | |
| descricao | varchar(1000) | Opcional |
| prioridade | baixa · media · alta | |
| status | pendente · concluida | |
| data_prazo | date | Opcional |
| xp_recompensa | int | Quanto vale (pela prioridade) |
| xp_concedido | int | Quanto foi dado na conclusão |
| data_conclusao | datetime | |
| lembrete_vespera_em / lembrete_dia_em | datetime | Quando o lembrete push foi enviado (zera se o prazo mudar) |

## sessoes_foco

| Campo | Tipo | Descrição |
|---|---|---|
| tipo | foco · pausa_curta · pausa_longa | |
| duracao_planejada | int | Minutos |
| status | em_andamento · concluida · interrompida · cancelada | |
| iniciada_em / finalizada_em | datetime | Marcados pelo servidor |
| minutos_validos | int | Minutos que contaram |
| xp_concedido | int | |

## registros_humor

| Campo | Tipo | Descrição |
|---|---|---|
| humor | otimo · bom · neutro · ansioso · cansado | |
| observacao_cifrada | text | Nota criptografada (Fernet) |
| criado_em | datetime | |

## eventos_xp

Extrato de XP: `origem` (tarefa · foco · humor), `origem_id`, `xp` (negativo = estorno), `criado_em`. Alimenta o gráfico "XP da semana".

## usuario_conquistas

`codigo` da conquista e `desbloqueada_em`. O catálogo (nomes e critérios) fica no código em `services/conquistas.py`.

## preferencias

`lembrete_tarefas`, `som_pomodoro`, `resumo_semanal` (os três interruptores de Configurações) e `resumo_enviado_em` (evita repetir o e-mail na mesma semana).

## refresh_tokens

`token_hash` (SHA-256 — o token em si nunca é salvo), `familia` (sessão de login), `expira_em`, `revogado_em`, `dispositivo`.

## consentimentos

Histórico de aceites e revogações: `tipo` (termos · humor), `versao`, `concedido`, `criado_em`. Vale o último registro de cada tipo.

## tokens_redefinicao_senha

Pedidos de "esqueci minha senha": `token_hash` (SHA-256), `expira_em` (30 minutos), `usado_em`. Um pedido novo invalida os anteriores.

## dispositivos_push

Celulares que recebem lembretes: `token` do Expo Push (único) e `plataforma`. Tokens de apps desinstalados são removidos automaticamente.

## historico_acessos

`ip` e data de cada login, para segurança. Retenção de 6 meses.
