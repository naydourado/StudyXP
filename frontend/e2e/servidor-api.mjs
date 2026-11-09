// sobe a api para os testes e2e: banco sqlite novo, e-mail/push em modo console, sem rate limit
// usa o python do ambiente virtual do backend se existir (local), senao o python do sistema (ci)
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const backend = resolve(aqui, "../../backend");
const pastaDados = join(aqui, ".dados");
const banco = join(pastaDados, "e2e.db");

const candidatos = [join(backend, ".venv/Scripts/python.exe"), join(backend, ".venv/bin/python")];
const python = candidatos.find((caminho) => existsSync(caminho)) ?? "python";

mkdirSync(pastaDados, { recursive: true });
rmSync(banco, { force: true });

const env = {
  ...process.env,
  AMBIENTE: "desenvolvimento",
  DATABASE_URL: `sqlite:///${banco.replaceAll("\\", "/")}`,
  SECRET_KEY: "chave-dos-testes-e2e-com-mais-de-32-caracteres",
  HUMOR_ENC_KEY: "ZTJlLWUyZS1lMmUtZTJlLWUyZS1lMmUtZTJlLWUyZS0=",
  RATE_LIMIT_ATIVO: "false",
  EMAIL_PROVEDOR: "console",
  PUSH_PROVEDOR: "console",
  CORS_ORIGINS: '["http://localhost:5174"]',
};

const migracao = spawnSync(python, ["-m", "alembic", "upgrade", "head"], { cwd: backend, env, stdio: "inherit" });
if (migracao.status !== 0) process.exit(migracao.status ?? 1);

const api = spawn(python, ["-m", "uvicorn", "app.main:app", "--port", "8001"], { cwd: backend, env, stdio: "inherit" });
const encerrar = () => api.kill();
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
api.on("exit", (codigo) => process.exit(codigo ?? 0));
