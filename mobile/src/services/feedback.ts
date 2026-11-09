import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';

type ResultadoXP = {
  xp_ganho: number;
  novas_conquistas: { codigo: string; nome: string }[];
};

// vibracao curta e aviso de conquista apos ganhar xp
export function comemorar(resultado: ResultadoXP) {
  if (Platform.OS !== 'web' && resultado.xp_ganho > 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
  if (resultado.novas_conquistas.length > 0) {
    Alert.alert('Conquista desbloqueada!', resultado.novas_conquistas.map((c) => c.nome).join('\n'));
  }
}
