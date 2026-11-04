# StudyXP Mobile

App React Native (Expo SDK 58 + Expo Router) que usa a mesma API do web.

## Rodando

```bash
cd mobile
npm install
cp .env.example .env.local   # ajuste EXPO_PUBLIC_API_URL
npm start
```

Abra no celular com o app **Expo Go** (QR code) ou pressione `a` para o emulador Android.

- **Celular físico:** `EXPO_PUBLIC_API_URL=http://IP-DO-SEU-PC:8000/api/v1` e rode a API com
  `uvicorn app.main:app --reload --host 0.0.0.0` (celular e PC na mesma rede Wi-Fi).
- **Emulador Android:** `http://10.0.2.2:8000/api/v1`.

## Telas

- **Login, Cadastro, Esqueci minha senha** (o link do e-mail abre a página de nova senha no site)
- **Abas:** Início (dashboard), Tarefas (criar, editar, prazo com calendário, concluir, excluir), Foco (Pomodoro), Humor (com autorização LGPD), Perfil
- **A partir do Perfil:** Editar perfil, Progresso (gráficos), Configurações (notificações, privacidade, exportar dados, senha, excluir conta)

## Notificações

- **Fim do Pomodoro:** notificação local agendada no próprio celular (funciona no Expo Go).
- **Lembretes de prazo (push):** enviados pelo servidor. Só funcionam num **APK / development build** com projeto EAS
  configurado (`extra.eas.projectId` no `app.json`, criado pelo `eas init`). No Expo Go o app simplesmente não registra o push.

## Estrutura

```
src/
  app/                 rotas (expo router) - cada arquivo e uma tela
    _layout.tsx        sessao + Stack.Protected (logado -> abas, senao -> login)
    login.tsx, cadastro.tsx
    (app)/             abas: index (Inicio), tarefas, foco, humor, perfil
  components/          ui.tsx (Botao, Campo, Card...), abas, nivel-card, tarefa-item
  contexts/auth.tsx    login, cadastro, sair, restauracao da sessao
  hooks/use-dados.ts   busca + recarrega ao focar a aba + puxar para atualizar
  services/api.ts      cliente http (envia X-Cliente: mobile, renova o token)
  services/notificacoes.ts  notificacao local do pomodoro e registro do push
  constants/           tema (cores do prototipo) e regras exibidas
```

## Segurança

- O refresh token fica no **SecureStore** (Keychain/Keystore); o access token só em memória.
- O header `X-Cliente: mobile` faz a API devolver o refresh token no corpo (no web ele vai em cookie).

## Verificação

```bash
npm test            # testes (jest + react native testing library)
npm run typecheck
npm run lint
```

## Gerar o APK (EAS Build)

1. Ajuste as URLs em `eas.json` (perfil `preview`).
2. `npx eas-cli@latest login` (conta Expo gratuita)
3. `npx eas-cli@latest build -p android --profile preview`
