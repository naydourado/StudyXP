// guarda o refresh token no armazenamento seguro do aparelho (keychain / keystore)
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHAVE_REFRESH = 'studyxp_refresh';

// o secure store nao existe no navegador; no web (so para testes de layout)
// o token fica apenas em memoria e some ao recarregar
let tokenWeb: string | null = null;

export async function lerRefresh(): Promise<string | null> {
  if (Platform.OS === 'web') return tokenWeb;
  return SecureStore.getItemAsync(CHAVE_REFRESH);
}

export async function salvarRefresh(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    tokenWeb = token;
    return;
  }
  await SecureStore.setItemAsync(CHAVE_REFRESH, token);
}

export async function apagarRefresh(): Promise<void> {
  if (Platform.OS === 'web') {
    tokenWeb = null;
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE_REFRESH);
}
