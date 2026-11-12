// sem usuario logado mostra o Login; logado mostra o app (cabecalho, paginas e navbar)
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { guardarToken } from './src/api';
import AppLogado from './src/AppLogado';
import { Cores } from './src/cores';
import LoginTela from './src/LoginTela';

export default function App() {
  // nome de quem entrou; null = ninguem logado
  const [nome, setNome] = useState<string | null>(null);
  // fonte do tema; se falhar, o app segue com a fonte do sistema
  const [fontesProntas, erroFontes] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  function sair() {
    guardarToken(null);
    setNome(null);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Cores.fundo }}>
        <StatusBar style="dark" />
        {!fontesProntas && !erroFontes ? (
          <ActivityIndicator color={Cores.primaria} style={{ flex: 1 }} />
        ) : nome ? (
          <AppLogado nome={nome} aoSair={sair} />
        ) : (
          <LoginTela aoEntrar={setNome} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
