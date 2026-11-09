import { AceiteTermos } from '@/components/aceite-termos';
import Abas from '@/components/abas';
import { useAuth } from '@/contexts/auth';

export default function AppLayout() {
  const { usuario } = useAuth();

  // termos ou politica mudaram desde o ultimo aceite: confirma antes de usar o app
  if (usuario?.termos_pendentes) return <AceiteTermos />;

  return <Abas />;
}
