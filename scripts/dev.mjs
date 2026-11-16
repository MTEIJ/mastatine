// One command for the whole local suite: `bun run dev`.
// Starts the Docker-free dev database (unless something already listens on its port), waits until it is migrated and
// ready, then starts the Next dev server (on Node, see README). Ctrl+C stops both.
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { createRequire } from "node:module";

const PORT = Number(process.env.DEV_DB_PORT ?? 5432);
const READY_MARKER = "Dev database ready";
const children = [];

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  });
}

function startDatabase() {
  return new Promise((resolve, reject) => {
    const db = spawn(process.execPath, ["scripts/dev-db.mjs"], { stdio: ["ignore", "pipe", "inherit"] });
    children.push(db);
    let ready = false;
    db.stdout.on("data", (chunk) => {
      process.stdout.write(`[db] ${chunk}`);
      if (!ready && chunk.toString().includes(READY_MARKER)) { ready = true; resolve(); }
    });
    db.once("exit", (code) => {
      if (!ready) reject(new Error(`Dev database exited with code ${code} before it was ready.`));
      else shutdown(code ?? 0);
    });
  });
}

function startNext() {
  const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
  const next = spawn("node", [nextBin, "dev"], { stdio: "inherit" });
  children.push(next);
  next.once("exit", (code) => shutdown(code ?? 0));
}

let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill("SIGINT");
  setTimeout(() => process.exit(code), 1500).unref();
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  if (await portOpen(PORT)) console.log(`[db] Something is already listening on 127.0.0.1:${PORT}; using it.`);
  else await startDatabase();
  startNext();
} catch (error) {
  console.error(error.message);
  shutdown(1);
}
