// escolha do prazo: atalhos (sem prazo, hoje, amanha) + calendario nativo
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui';
import { dataDaqui, deDataIso, paraDataIso, textoPrazo } from '@/constants/gamificacao';
import { Cores, Fontes, Raio } from '@/constants/tema';

type Props = { valor: string | null; aoMudar: (valor: string | null) => void };

const ATALHOS = [
  { nome: 'Sem prazo', dias: null },
  { nome: 'Hoje', dias: 0 },
  { nome: 'Amanhã', dias: 1 },
] as const;

export function SeletorData({ valor, aoMudar }: Props) {
  const [calendarioIos, setCalendarioIos] = useState(false);
  const atual = valor ? deDataIso(valor) : new Date();

  function abrirCalendario() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: atual,
        mode: 'date',
        minimumDate: new Date(),
        onValueChange: (_evento, data) => data && aoMudar(paraDataIso(data)),
      });
    } else {
      setCalendarioIos(!calendarioIos);
    }
  }

  const atalhoAtivo = ATALHOS.find((a) => dataDaqui(a.dias) === valor);
  // o calendario nativo nao existe no navegador (versao web usada so para testar layout)
  const temCalendario = Platform.OS !== 'web';

  return (
    <View style={{ gap: 8 }}>
      <View style={estilos.linha} accessibilityRole="radiogroup">
        {ATALHOS.map((a) => {
          const ativo = atalhoAtivo?.nome === a.nome;
          return (
            <Pressable
              key={a.nome}
              accessibilityRole="radio"
              aria-checked={ativo}
              onPress={() => aoMudar(dataDaqui(a.dias))}
              style={[estilos.opcao, ativo && estilos.ativa]}>
              <Texto style={[estilos.texto, ativo && { color: '#fff' }]}>{a.nome}</Texto>
            </Pressable>
          );
        })}
        {temCalendario && (
          <Pressable
            accessibilityRole="button"
            onPress={abrirCalendario}
            style={[estilos.opcao, valor && !atalhoAtivo && estilos.ativa]}>
            <Texto style={[estilos.texto, valor && !atalhoAtivo && { color: '#fff' }]}>
              {valor && !atalhoAtivo ? textoPrazo(valor) : 'Escolher data'}
            </Texto>
          </Pressable>
        )}
      </View>

      {calendarioIos && Platform.OS === 'ios' && (
        <DateTimePicker
          value={atual}
          mode="date"
          display="inline"
          minimumDate={new Date()}
          onValueChange={(_evento, data) => {
            if (data) aoMudar(paraDataIso(data));
            setCalendarioIos(false);
          }}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Raio.sm, backgroundColor: Cores.campo },
  ativa: { backgroundColor: Cores.primaria },
  texto: { fontSize: 13, fontFamily: Fontes.seminegrito, color: Cores.texto },
});
