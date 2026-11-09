import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Cores, Fontes } from '@/constants/tema';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { aoTocarNotificacao, configurarNotificacoes } from '@/services/notificacoes';

SplashScreen.preventAutoHideAsync();

// telas empilhadas por cima das abas (abertas a partir do perfil)
const CABECALHO = {
  headerShown: true,
  headerTintColor: Cores.primaria,
  headerStyle: { backgroundColor: Cores.fundo },
  headerTitleStyle: { fontFamily: Fontes.seminegrito },
  headerShadowVisible: false,
} as const;

function Navegacao() {
  const { usuario, carregando } = useAuth();
  const [fontesProntas] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    configurarNotificacoes();
    // toque num lembrete de prazo abre a aba de tarefas
    return aoTocarNotificacao((tela) => {
      if (tela === 'tarefas') router.navigate('/tarefas');
    });
  }, []);

  // a splash fica na tela ate a sessao salva ser verificada e as fontes carregarem
  if (carregando || !fontesProntas) return null;
  SplashScreen.hide();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="progresso" options={{ ...CABECALHO, title: 'Progresso' }} />
        <Stack.Screen name="configuracoes" options={{ ...CABECALHO, title: 'Configurações' }} />
        <Stack.Screen name="editar-perfil" options={{ ...CABECALHO, title: 'Editar perfil' }} />
      </Stack.Protected>

      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="esqueci-senha" />
      </Stack.Protected>

      {/* textos legais: abertos com ou sem login */}
      <Stack.Screen name="privacidade" options={{ ...CABECALHO, title: 'Política de Privacidade' }} />
      <Stack.Screen name="termos" options={{ ...CABECALHO, title: 'Termos de Uso' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Navegacao />
    </AuthProvider>
  );
}
