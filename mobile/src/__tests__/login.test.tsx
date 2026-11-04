import { render, screen, userEvent } from '@testing-library/react-native';

import Login from '@/app/login';
import { useAuth } from '@/contexts/auth';
import { ErroApi } from '@/services/api';

jest.mock('@/contexts/auth', () => ({ useAuth: jest.fn() }));
// o Link real renderiza um Text; o mock faz o mesmo sem precisar do roteador
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return { Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> };
});

describe('tela de login', () => {
  const entrar = jest.fn();

  beforeEach(() => {
    entrar.mockReset().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ entrar });
  });

  it('pede e-mail e senha antes de enviar', async () => {
    const usuario = userEvent.setup();
    await render(<Login />);
    await usuario.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Preencha e-mail e senha.')).toBeOnTheScreen();
    expect(entrar).not.toHaveBeenCalled();
  });

  it('entra com o e-mail sem espaços', async () => {
    const usuario = userEvent.setup();
    await render(<Login />);
    await usuario.type(screen.getByLabelText('E-mail'), '  aluno@email.com ');
    await usuario.type(screen.getByLabelText('Senha'), 'senha-forte-123');
    await usuario.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(entrar).toHaveBeenCalledWith('aluno@email.com', 'senha-forte-123');
  });

  it('mostra o erro devolvido pela api', async () => {
    entrar.mockRejectedValue(new ErroApi('E-mail ou senha inválidos.', 401, 'credenciais_invalidas'));
    const usuario = userEvent.setup();
    await render(<Login />);
    await usuario.type(screen.getByLabelText('E-mail'), 'aluno@email.com');
    await usuario.type(screen.getByLabelText('Senha'), 'errada');
    await usuario.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeOnTheScreen();
  });
});
