// mocks de modulos nativos que nao existem no ambiente de testes (node)
jest.mock('expo-secure-store', () => {
  const dados = {};
  return {
    getItemAsync: jest.fn(async (chave) => dados[chave] ?? null),
    setItemAsync: jest.fn(async (chave, valor) => {
      dados[chave] = valor;
    }),
    deleteItemAsync: jest.fn(async (chave) => {
      delete dados[chave];
    }),
  };
});

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success' },
}));
