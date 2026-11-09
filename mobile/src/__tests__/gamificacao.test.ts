import {
  dataDaqui,
  deDataIso,
  formatarMinutos,
  formatarRelogio,
  nomePrioridade,
  paraDataIso,
  textoPrazo,
} from '@/constants/gamificacao';

describe('datas', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 22, 10, 0)); // 22/10/2026
  });
  afterEach(() => jest.useRealTimers());

  it('mostra hoje, amanhã, ontem e dia/mês', () => {
    expect(textoPrazo('2026-10-22')).toBe('Hoje');
    expect(textoPrazo('2026-10-23')).toBe('Amanhã');
    expect(textoPrazo('2026-10-21')).toBe('Ontem');
    expect(textoPrazo('2026-11-30')).toBe('30/11');
    expect(textoPrazo(null)).toBe('Sem prazo');
  });

  it('converte entre Date local e o formato da api sem erro de fuso', () => {
    expect(paraDataIso(new Date(2026, 0, 5))).toBe('2026-01-05');
    const data = deDataIso('2026-12-31');
    expect([data.getFullYear(), data.getMonth(), data.getDate()]).toEqual([2026, 11, 31]);
  });

  it('calcula datas relativas para os atalhos de prazo', () => {
    expect(dataDaqui(0)).toBe('2026-10-22');
    expect(dataDaqui(1)).toBe('2026-10-23');
    expect(dataDaqui(10)).toBe('2026-11-01');
    expect(dataDaqui(null)).toBeNull();
  });
});

describe('formatação', () => {
  it('formata o relógio do pomodoro', () => {
    expect(formatarRelogio(25 * 60000)).toBe('25:00');
    expect(formatarRelogio(61000)).toBe('01:01');
    expect(formatarRelogio(500)).toBe('00:01'); // arredonda para cima
    expect(formatarRelogio(-10)).toBe('00:00');
  });

  it('formata minutos e prioridade', () => {
    expect(formatarMinutos(150)).toBe('2h 30min');
    expect(formatarMinutos(60)).toBe('1h');
    expect(formatarMinutos(5)).toBe('5min');
    expect(nomePrioridade('alta')).toBe('Alta');
  });
});
