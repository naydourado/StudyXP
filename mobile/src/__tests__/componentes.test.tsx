import { render, screen, userEvent } from '@testing-library/react-native';

import { NivelCard } from '@/components/nivel-card';
import { type Tarefa, TarefaItem } from '@/components/tarefa-item';

const TAREFA: Tarefa = {
  id: 1,
  titulo: 'Estudar Redes',
  prioridade: 'alta',
  status: 'pendente',
  data_prazo: null,
  xp_recompensa: 80,
  xp_concedido: 0,
};

describe('TarefaItem', () => {
  it('mostra título, prazo, prioridade e xp', async () => {
    await render(<TarefaItem tarefa={TAREFA} aoAlternar={jest.fn()} />);
    expect(screen.getByText('Estudar Redes')).toBeOnTheScreen();
    expect(screen.getByText('Sem prazo · Alta')).toBeOnTheScreen();
    expect(screen.getByText('+80xp')).toBeOnTheScreen();
  });

  it('marca como concluída e abre a edição', async () => {
    const usuario = userEvent.setup();
    const aoAlternar = jest.fn();
    const aoTocar = jest.fn();
    await render(<TarefaItem tarefa={TAREFA} aoAlternar={aoAlternar} aoTocar={aoTocar} />);

    await usuario.press(screen.getByRole('checkbox', { name: 'Concluir Estudar Redes' }));
    expect(aoAlternar).toHaveBeenCalledWith(TAREFA);

    await usuario.press(screen.getByText('Estudar Redes'));
    expect(aoTocar).toHaveBeenCalledWith(TAREFA);
  });

  it('mostra o xp que foi concedido quando concluída', async () => {
    await render(
      <TarefaItem tarefa={{ ...TAREFA, status: 'concluida', xp_concedido: 0 }} aoAlternar={jest.fn()} />,
    );
    expect(screen.getByText('+0xp')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Reabrir Estudar Redes' })).toBeChecked();
  });
});

describe('NivelCard', () => {
  it('mostra os números que vêm do servidor', async () => {
    await render(
      <NivelCard
        gamificacao={{
          xp_total: 320,
          nivel: 3,
          xp_no_nivel: 20,
          xp_para_proximo: 300,
          percentual: 6.7,
          ofensiva_atual: 2,
          ofensiva_recorde: 5,
        }}
      />,
    );
    expect(screen.getByText('Nível 3')).toBeOnTheScreen();
    expect(screen.getByText('20 / 300 XP')).toBeOnTheScreen();
  });
});
