# API do StudyXP (v1)

API REST em FastAPI usada pelo web e pelo app mobile. Todas as rotas usam JSON e ficam sob o prefixo `/api/v1`.

A documentação interativa completa (com todos os campos) é gerada automaticamente:

```txt
http://127.0.0.1:8000/docs
```

# Autenticação

- `POST /auth/login` devolve um **access token** (15 minutos) e um **refresh token** (30 dias).
- Rotas privadas exigem o header `Authorization: Bearer ACCESS_TOKEN`.
- Quando o access token vence (401), o cliente chama `POST /auth/refresh` e recebe um novo par. O refresh token antigo deixa de valer (rotação); reutilizá-lo derruba a sessão inteira.
- **Web:** o refresh token vai num cookie `HttpOnly` (o JavaScript não consegue ler).
- **Mobile:** enviar o header `X-Cliente: mobile`; o refresh token vem no corpo e o app guarda no SecureStore.

# Erros

Formato padrão:

```json
{ "detail": "Mensagem para o usuário.", "code": "codigo_do_erro" }
```

Erros de validação (422) trazem também a lista de campos:

```json
{ "detail": "Dados inválidos.", "code": "validacao", "erros": [{ "campo": "email", "mensagem": "..." }] }
```

| Código HTTP | Quando |
|---|---|
| 200 / 201 / 204 | Sucesso |
| 400 | Regra de negócio (ex.: senha atual incorreta) |
| 401 | Sem login ou sessão expirada |
| 403 | Sem permissão (ex.: humor sem consentimento) |
| 404 | Não encontrado (inclui recurso de outro usuário) |
| 409 | Conflito (ex.: e-mail já cadastrado, tarefa já concluída) |
| 422 | Dados inválidos |
| 429 | Muitas tentativas (limite de requisições) |

# Rotas

(A) = exige login.

| Módulo | Método e rota | Função |
|---|---|---|
| Auth | `POST /auth/cadastro` | Cria conta (`aceite_termos` e `maior_de_idade` obrigatórios) e já faz login |
| Auth | `POST /auth/login` | Login |
| Auth | `POST /auth/refresh` | Renova a sessão |
| Auth | `POST /auth/logout` | Encerra a sessão do dispositivo |
| Auth | `POST /auth/esqueci-senha` | Envia link de redefinição por e-mail (resposta igual exista ou não a conta) |
| Auth | `POST /auth/redefinir-senha` | Troca a senha com o token do link (30 min, uso único) |
| Conta | `GET /me` (A) | Dados do usuário |
| Conta | `PATCH /me` (A) | Edita nome, e-mail, bio, fuso horário |
| Conta | `PUT /me/senha` (A) | Troca a senha (desconecta outros dispositivos) |
| Conta | `DELETE /me` (A) | Exclui a conta e todos os dados (corpo: `{"senha": "..."}`) |
| Conta | `GET /me/exportar` (A) | Todos os dados do usuário em JSON (LGPD) |
| Conta | `GET` / `PUT /me/preferencias` (A) | Lembretes, som do pomodoro, resumo semanal |
| Conta | `GET` / `PUT /me/consentimentos` (A) | Autorização do registro de humor (revogar apaga os registros) |
| Conta | `POST` / `DELETE /me/dispositivos` (A) | Registra ou remove o token de push do celular |
| Tarefas | `GET /tarefas?status=&prazo=hoje\|atrasadas\|semana&page=&size=` (A) | Lista |
| Tarefas | `POST /tarefas` (A) | Cria (`titulo`, `descricao`, `prioridade`, `data_prazo`) |
| Tarefas | `GET` / `PATCH` / `DELETE /tarefas/{id}` (A) | Detalha, edita, exclui |
| Tarefas | `POST /tarefas/{id}/concluir` (A) | Conclui e concede XP |
| Tarefas | `POST /tarefas/{id}/reabrir` (A) | Reabre e estorna o XP |
| Foco | `POST /foco/sessoes` (A) | Inicia sessão (`tipo`, `duracao_planejada`) |
| Foco | `POST /foco/sessoes/{id}/finalizar` (A) | Encerra e concede XP pelos minutos reais |
| Foco | `POST /foco/sessoes/{id}/cancelar` (A) | Cancela |
| Foco | `GET /foco/sessoes`, `GET /foco/resumo-hoje` (A) | Histórico e minutos de hoje |
| Humor | `GET` / `POST /humor` (A) | Histórico e registro (`humor`, `observacao`) |
| Humor | `DELETE /humor/{id}`, `DELETE /humor` (A) | Apaga um ou todos |
| Painel | `GET /dashboard` (A) | Dados da tela inicial |
| Painel | `GET /progresso?periodo=semana\|mes` (A) | Totais e série por dia para os gráficos |
| Painel | `GET /gamificacao/status` (A) | XP, nível, faixa do nível, ofensiva |
| Painel | `GET /conquistas` (A) | Catálogo com bloqueadas e desbloqueadas |
| Sistema | `GET /health` | Verificação de funcionamento |
| Interno | `POST /interno/jobs/{lembretes\|resumo-semanal\|limpeza}` | Tarefas periódicas; exige o header `X-Cron-Token` (chamadas pelo agendador do GitHub) |

# Respostas que dão XP

Concluir tarefa, finalizar foco e registrar humor devolvem:

```json
{
  "xp_ganho": 80,
  "gamificacao": {
    "xp_total": 320, "nivel": 3, "xp_no_nivel": 20, "xp_para_proximo": 300,
    "percentual": 6.7, "ofensiva_atual": 4, "ofensiva_recorde": 7
  },
  "novas_conquistas": [{ "codigo": "tarefas_10", "nome": "10 tarefas", "...": "..." }],
  "tarefa": { "...": "..." }
}
```

# Limites

| Rota | Limite por IP |
|---|---|
| `POST /auth/login` | 5 por minuto |
| `POST /auth/cadastro` | 5 por hora |
| `POST /auth/refresh` | 30 por minuto |
| `POST /auth/esqueci-senha` | 3 por hora |
| `POST /auth/redefinir-senha` | 10 por hora |
