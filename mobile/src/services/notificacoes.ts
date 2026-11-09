// notificacoes do app:
// - local: aviso de fim do pomodoro, agendado no proprio celular (funciona no expo go)
// - push: lembretes de prazo enviados pelo servidor (precisa de development build / apk)
import Constants from 'expo-constants';
import type * as ModuloNotificacoes from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api } from './api';

const CANAL = 'studyxp';
const CHAVE_TOKEN_PUSH = 'studyxp_push_token';

// carregado so quando usado: em versoes do expo go sem os modulos nativos do expo-notifications
// o import quebrava o app inteiro na abertura; assim o app abre e as notificacoes ficam desligadas
let modulo: typeof ModuloNotificacoes | null | undefined;
function notificacoes(): typeof ModuloNotificacoes | null {
  if (modulo === undefined) {
    if (Platform.OS === 'web') {
      modulo = null;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- import sob demanda, para poder capturar a falha
        modulo = require('expo-notifications') as typeof ModuloNotificacoes;
      } catch (erro) {
        console.warn('Notificacoes indisponiveis neste app (use o APK):', erro);
        modulo = null;
      }
    }
  }
  return modulo;
}

// chamado uma vez ao abrir o app
export async function configurarNotificacoes() {
  const Notifications = notificacoes();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // no android 13+ o pedido de permissao so aparece depois de existir um canal
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Avisos do StudyXP',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function temPermissao(pedirSeNecessario = true): Promise<boolean> {
  const Notifications = notificacoes();
  if (!Notifications) return false;
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  if (!pedirSeNecessario || !atual.canAskAgain) return false;
  const pedido = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return pedido.granted;
}

// agenda o aviso de fim do pomodoro; devolve o id para poder cancelar ao pausar/resetar
export async function agendarAviso(segundos: number, titulo: string, corpo: string): Promise<string | null> {
  const Notifications = notificacoes();
  if (!Notifications || !(await temPermissao())) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(segundos)),
      channelId: CANAL,
    },
  });
}

export async function cancelarAviso(id: string | null) {
  const Notifications = notificacoes();
  if (!Notifications || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

function idDoProjeto(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

// registra o celular para receber lembretes de prazo; sem projeto eas (ex.: expo go) apenas ignora
export async function registrarPush(): Promise<boolean> {
  const Notifications = notificacoes();
  if (!Notifications) return false;
  const projectId = idDoProjeto();
  if (!projectId) return false;

  try {
    if (!(await temPermissao())) return false;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api('/me/dispositivos', {
      metodo: 'POST',
      corpo: { token, plataforma: Platform.OS === 'ios' ? 'ios' : 'android' },
    });
    await SecureStore.setItemAsync(CHAVE_TOKEN_PUSH, token);
    return true;
  } catch {
    // sem internet ou sem permissao: tenta de novo no proximo login
    return false;
  }
}

// ao sair da conta o celular para de receber os lembretes dela
export async function removerPush() {
  if (!notificacoes()) return;
  const token = await SecureStore.getItemAsync(CHAVE_TOKEN_PUSH);
  if (!token) return;
  await api('/me/dispositivos', { metodo: 'DELETE', corpo: { token } }).catch(() => {});
  await SecureStore.deleteItemAsync(CHAVE_TOKEN_PUSH);
}

// toque numa notificacao: devolve a tela indicada pelo servidor (ex.: "tarefas")
export function aoTocarNotificacao(callback: (tela: string) => void) {
  const Notifications = notificacoes();
  if (!Notifications) return () => {};
  const assinatura = Notifications.addNotificationResponseReceivedListener((resposta) => {
    const tela = resposta.notification.request.content.data?.tela;
    if (typeof tela === 'string') callback(tela);
  });
  return () => assinatura.remove();
}
