// registro de humor - dado sensivel: pede autorizacao antes do primeiro uso (lgpd art. 11)
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Ajuda, Botao, Campo, Card, MensagemErro, Tela, Texto } from '@/components/ui';
import { HUMORES, type HumorValor } from '@/constants/gamificacao';
import { Cores, Fontes, Raio } from '@/constants/tema';
import { api, mensagemDeErro } from '@/services/api';
import { comemorar } from '@/services/feedback';

type Registro = { id: number; humor: HumorValor; observacao: string | null; criado_em: string };

// o servidor devolve utc sem fuso; o "Z" converte para o horario do celular
function dataRelativa(iso: string): string {
  const data = new Date(`${iso}Z`);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return 'Hoje';
  if (data.toDateString() === ontem.toDateString()) return 'Ontem';
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function Consentimento({ aoAutorizar, enviando }: { aoAutorizar: () => void; enviando: boolean }) {
  return (
    <Card>
      <Texto variante="secao">Antes de começar</Texto>
      <Texto>
        O registro de humor guarda como você se sente e, se quiser, uma nota curta. É um dado pessoal sensível, então só
        vamos guardá-lo com a sua autorização.
      </Texto>
      <Texto variante="pequeno">• Serve apenas para você acompanhar a relação entre humor e estudos.</Texto>
      <Texto variante="pequeno">• As notas ficam criptografadas e ninguém além de você as vê.</Texto>
      <Texto variante="pequeno">• Não compartilhamos esses dados com terceiros.</Texto>
      <Texto variante="pequeno">
        • Você pode revogar quando quiser em Configurações — os registros são apagados na hora.
      </Texto>
      <View style={estilos.aviso}>
        <Texto variante="pequeno">
          O StudyXP não substitui acompanhamento profissional. Se precisar conversar, o CVV atende 24h pelo 188.
        </Texto>
      </View>
      <Botao titulo="Autorizo o uso dos meus dados de humor" onPress={aoAutorizar} carregando={enviando} />
      <Botao titulo="Agora não" variante="secundario" onPress={() => router.navigate('/')} />
      <Texto variante="pequeno" style={estilos.link} onPress={() => router.push('/privacidade')}>
        Ler a Política de Privacidade
      </Texto>
    </Card>
  );
}

export default function Humor() {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [selecionado, setSelecionado] = useState<HumorValor | null>(null);
  const [nota, setNota] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [versao, setVersao] = useState(0);
  const [atualizando, setAtualizando] = useState(false);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true;
    api<{ humor: boolean }>('/me/consentimentos')
      .then(async (consentimentos) => {
        if (!ativo) return;
        setAutorizado(consentimentos.humor);
        if (consentimentos.humor) {
          const lista = await api<Registro[]>('/humor');
          if (ativo) setRegistros(lista);
        }
      })
      .catch((error) => ativo && setErro(mensagemDeErro(error)))
      .finally(() => ativo && setAtualizando(false));
    return () => {
      ativo = false;
    };
  }, [versao]);

  async function autorizar() {
    setEnviando(true);
    try {
      await api('/me/consentimentos', { metodo: 'PUT', corpo: { humor: true } });
      recarregar();
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  async function salvar() {
    setMensagem('');
    if (!selecionado) {
      setMensagem('Selecione como você está.');
      return;
    }
    setEnviando(true);
    try {
      const resultado = await api<{ xp_ganho: number; novas_conquistas: { codigo: string; nome: string }[] }>(
        '/humor',
        { metodo: 'POST', corpo: { humor: selecionado, observacao: nota.trim() || null } },
      );
      comemorar(resultado);
      setSelecionado(null);
      setNota('');
      setMensagem(resultado.xp_ganho > 0 ? `Registro salvo! +${resultado.xp_ganho} XP` : 'Registro salvo!');
      recarregar();
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao registrar humor.'));
    } finally {
      setEnviando(false);
    }
  }

  function apagar(registro: Registro) {
    Alert.alert('Apagar este registro?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/humor/${registro.id}`, { metodo: 'DELETE' });
            setRegistros((atuais) => atuais.filter((r) => r.id !== registro.id));
          } catch (error) {
            setErro(mensagemDeErro(error));
          }
        },
      },
    ]);
  }

  return (
    <Tela
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => {
            setAtualizando(true);
            recarregar();
          }}
        />
      }>
      <View>
        <Texto variante="titulo">Humor</Texto>
        <Texto variante="subtitulo">Acompanhe como você se sente ao estudar.</Texto>
      </View>

      <MensagemErro>{erro}</MensagemErro>
      {autorizado === null && !erro && <Texto variante="subtitulo">Carregando...</Texto>}
      {autorizado === false && <Consentimento aoAutorizar={autorizar} enviando={enviando} />}

      {autorizado && (
        <>
          <Card>
            <Texto variante="secao">Como você está hoje?</Texto>
            <View style={estilos.humores} accessibilityRole="radiogroup">
              {HUMORES.map((humor) => {
                const ativo = selecionado === humor.valor;
                return (
                  <Pressable
                    key={humor.valor}
                    accessibilityRole="radio"
                    accessibilityLabel={humor.nome}
                    aria-checked={ativo}
                    onPress={() => setSelecionado(humor.valor)}
                    style={[estilos.humor, ativo && estilos.humorAtivo]}>
                    <Texto style={{ fontSize: 26 }}>{humor.emoji}</Texto>
                    <Texto style={[estilos.humorNome, ativo && { color: '#fff' }]}>{humor.nome}</Texto>
                  </Pressable>
                );
              })}
            </View>
            <Campo
              rotulo="Nota sobre o seu dia (opcional)"
              placeholder="Escreva algo sobre seu dia de estudos..."
              value={nota}
              onChangeText={setNota}
              maxLength={500}
              multiline
              style={{ minHeight: 80, paddingTop: 10, textAlignVertical: 'top' }}
            />
            <Ajuda>A nota fica criptografada e só você vê. Evite escrever dados de outras pessoas.</Ajuda>
            {mensagem ? <Texto style={estilos.mensagem}>{mensagem}</Texto> : null}
            <Botao titulo="Salvar Registro" onPress={salvar} carregando={enviando} />
          </Card>

          <Card>
            <Texto variante="secao">Histórico</Texto>
            {registros.length === 0 && <Texto variante="pequeno">Nenhum registro ainda.</Texto>}
            {registros.map((registro) => {
              const humor = HUMORES.find((h) => h.valor === registro.humor);
              return (
                <View key={registro.id} style={estilos.item}>
                  <Texto style={{ fontSize: 24 }}>{humor?.emoji}</Texto>
                  <View style={{ flex: 1 }}>
                    <Texto style={estilos.itemTitulo}>
                      {dataRelativa(registro.criado_em)} · {humor?.nome}
                    </Texto>
                    <Texto variante="pequeno">{registro.observacao || 'Sem nota.'}</Texto>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Apagar registro"
                    hitSlop={10}
                    onPress={() => apagar(registro)}>
                    <Texto style={estilos.apagar}>Apagar</Texto>
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  aviso: { padding: 12, borderRadius: Raio.md, backgroundColor: '#F4F7FF' },
  link: { color: Cores.primaria, fontFamily: Fontes.seminegrito, textAlign: 'center' },
  humores: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  humor: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Raio.md,
    backgroundColor: Cores.badge,
  },
  humorAtivo: { backgroundColor: Cores.primaria },
  humorNome: { fontSize: 11, fontFamily: Fontes.media },
  mensagem: { color: Cores.primaria, fontFamily: Fontes.seminegrito },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Raio.md,
    backgroundColor: '#F6F8FF',
  },
  itemTitulo: { fontFamily: Fontes.seminegrito, fontSize: 14 },
  apagar: { color: Cores.erro, fontSize: 13, fontFamily: Fontes.seminegrito },
});
