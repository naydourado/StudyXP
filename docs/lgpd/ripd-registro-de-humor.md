# Relatório de Impacto à Proteção de Dados (RIPD) — Registro de Humor

**Projeto:** StudyXP · **Versão:** 1.0 (22/10/2026) · **Situação:** rascunho para revisão
**Controlador:** equipe do Projeto Integrador StudyXP (UNASP-HT) · **Encarregado / canal:** [e-mail a definir]
**Elaborado por:** [nome] · **Revisado por:** [professor orientador]

Este relatório segue o roteiro da ANPD para RIPD (art. 5º, XVII e art. 38 da LGPD), simplificado para um projeto acadêmico de pequeno porte.

## 1. Descrição do tratamento

| Item | Descrição |
|---|---|
| Funcionalidade | Registro de humor: o estudante escolhe como se sente (ótimo, bom, neutro, ansioso, cansado) e pode escrever uma nota curta (até 500 caracteres) |
| Titulares | Estudantes maiores de 18 anos com conta no StudyXP |
| Dados | Humor escolhido, nota opcional, data e hora do registro |
| Natureza | Dado pessoal **sensível** — pode revelar informação sobre saúde mental (art. 5º, II) |
| Finalidade | Permitir que o próprio estudante acompanhe a relação entre humor e rotina de estudos |
| Base legal | Consentimento específico e destacado (art. 11, I) |
| Quem acessa | Apenas o próprio titular, pela API autenticada. A equipe não tem tela administrativa para ver os registros |
| Compartilhamento | Nenhum. Só os operadores de infraestrutura (servidor e banco de dados) processam os dados, sem acesso ao conteúdo das notas, que fica criptografado |
| Retenção | Até o titular apagar o registro, revogar o consentimento ou excluir a conta |

## 2. Ciclo de vida do dado

1. **Coleta:** só depois que o titular toca em "Autorizo o uso dos meus dados de humor". O aceite fica registrado (tabela `consentimentos`, com versão e data).
2. **Armazenamento:** humor em texto; nota criptografada com Fernet (AES-128 + HMAC), chave `HUMOR_ENC_KEY` separada do banco.
3. **Uso:** histórico na tela de Humor e último humor no Dashboard, só para o titular.
4. **Exportação:** o titular pode baixar todos os seus dados (Configurações → Exportar).
5. **Eliminação:** apagar um registro, apagar todos, revogar o consentimento (apaga todos na hora) ou excluir a conta (apaga em cascata).

## 3. Necessidade e proporcionalidade

- A funcionalidade é **opcional**: o restante da plataforma funciona sem ela.
- Coletamos o mínimo: cinco opções fixas e uma nota opcional. Não há perguntas sobre diagnóstico, medicação ou terceiros.
- Não há uso para publicidade, perfilamento, venda ou decisão automatizada.
- O XP dado pelo registro é simbólico (5 XP, uma vez por dia) para não pressionar o uso.

## 4. Riscos identificados

Escala: probabilidade (P) e impacto (I) de 1 (baixo) a 3 (alto); risco = P × I.

| ID | Risco | P | I | Risco | Medidas | Risco residual |
|---|---|---|---|---|---|---|
| H1 | Acesso indevido por outra pessoa (falha de autorização) | 1 | 3 | 3 | Toda consulta filtra pelo usuário do token; teste automatizado garante 404 para recurso alheio | Baixo |
| H2 | Vazamento do banco de dados | 1 | 3 | 3 | Notas criptografadas com chave fora do banco; conexão TLS; banco sem acesso público; backups criptografados | Baixo |
| H3 | Roubo de sessão (token) | 2 | 3 | 6 | Access token de 15 min em memória; refresh token em cookie HttpOnly (web) ou SecureStore (celular); rotação com detecção de reuso | Baixo |
| H4 | Força bruta na senha | 2 | 3 | 6 | Argon2; limite de 5 logins por minuto; mensagem igual para e-mail inexistente | Baixo |
| H5 | Titular não entender o uso do dado | 2 | 2 | 4 | Termo de consentimento em linguagem simples antes do primeiro uso; link para a Política | Baixo |
| H6 | Dificuldade de revogar ou apagar | 1 | 2 | 2 | Revogação em um toque, com apagamento imediato; exclusão de conta | Baixo |
| H7 | Exposição em logs | 1 | 3 | 3 | Logs não registram corpo das requisições, notas, senhas nem tokens | Baixo |
| H8 | Titular em sofrimento sem orientação | 2 | 3 | 6 | Aviso de que o app não substitui acompanhamento profissional, com o contato do CVV (188) | Médio — limite da ferramenta |
| H9 | Perda da chave de criptografia | 1 | 2 | 2 | Chave guardada só nas variáveis de ambiente do servidor; procedimento de troca documentado | Baixo |
| H10 | Transferência internacional | 3 | 1 | 3 | Informada na Política; operadores com termos de proteção de dados | Baixo |

## 5. Medidas técnicas e administrativas

- Criptografia em trânsito (HTTPS/TLS) e das notas em repouso.
- Controle de acesso por token, com testes automatizados de isolamento entre usuários.
- Registro de consentimento com versão e data; revogação equivale a apagamento.
- Retenção de logs de acesso por 6 meses, com limpeza automática diária.
- Análise de dependências vulneráveis no CI (`pip-audit`, `npm audit`) e scan OWASP ZAP antes da homologação.
- Plano de resposta a incidentes ([plano-resposta-incidentes.md](plano-resposta-incidentes.md)).

## 6. Conclusão

Com as medidas acima, o risco residual do tratamento é **baixo**, exceto o H8, que é inerente a uma ferramenta de bem-estar e é mitigado com informação e encaminhamento ao CVV. O tratamento é considerado adequado para a finalidade, desde que as medidas sejam mantidas.

## 7. Revisão

Revisar este relatório quando houver mudança na funcionalidade de humor, nos operadores de infraestrutura ou após qualquer incidente.

| Data | Versão | Responsável | Mudança |
|---|---|---|---|
| 22/10/2026 | 1.0 | [nome] | Versão inicial |
