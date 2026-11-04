// testes ponta a ponta: npm run test:e2e
// sobe a api (porta 8001, banco sqlite descartavel) e o site (porta 5174) so para os testes
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // o servidor de desenvolvimento local fica lento com a suite inteira: mais folga nas esperas
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
    // local sem download do chromium: PW_CANAL=msedge (ou chrome) usa o navegador instalado
    channel: process.env.PW_CANAL || undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: process.env.PW_CANAL || undefined } },
    { name: "celular", use: { ...devices["Pixel 7"], channel: process.env.PW_CANAL || undefined } },
  ],
  webServer: [
    {
      command: "node e2e/servidor-api.mjs",
      url: "http://127.0.0.1:8001/api/v1/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npx vite --port 5174 --strictPort",
      url: "http://localhost:5174",
      reuseExistingServer: false,
      env: { E2E_API: "http://127.0.0.1:8001" },
      timeout: 120_000,
    },
  ],
});
