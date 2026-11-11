// sem usuario logado mostra o Login; logado mostra as Tarefas
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { guardarToken } from './src/api';
import { Cores } from './src/cores';
import LoginTela from './src/LoginTela';
import TarefasTela from './src/TarefasTela';

export default function App() {
  // nome de quem entrou; null = ninguem logado
  const [nome, setNome] = useState<string | null>(null);

  function sair() {
    guardarToken(null);
    setNome(null);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Cores.fundo }}>
        <StatusBar style="dark" />
        {nome ? <TarefasTela nome={nome} aoSair={sair} /> : <LoginTela aoEntrar={setNome} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
