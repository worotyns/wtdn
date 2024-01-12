import { load } from "dotenv";
import { createApiApplication } from "./application/api/api_application.ts";
import { ProcessManager } from "./application/process_manager.ts";
import { createLogger } from "./application/logger.ts";
import { createFs } from "atoms";
import { Board } from "./domain/board.ts";

const logger = createLogger();
await load({ export: true, allowEmptyValues: true });

const entrypoint: string = Deno.env.get("ATOMS_ENTRYPOINT") || "board_prod";
const path: string = Deno.env.get("ATOMS_PATH")!;

logger.info(`Entrypoint is: ${entrypoint}, path: ${path}`);

const { persist, restore } = createFs(path);

let board: Board;

try {
  board = await restore(entrypoint, Board);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    board = Board.createWithIdentity(entrypoint);
    logger.info("File not found, start fresh instance: " + entrypoint);
  } else {
    logger.error(error);
    Deno.exit(1);
  }
}

const app = createApiApplication(board, () => {
  return ["Hello!", true];
});

const persistInterval = ~~(Deno.env.get("ATOMS_PERSIST_INTERVAL") || "300_000");

setInterval(async () => {
  await persist(board);
}, persistInterval);

const abortController = new AbortController();

const serverPromise = app.listen({
  hostname: Deno.env.get("API_SERVER_BIND_ADDR") || "0.0.0.0",
  port: ~~(Deno.env.get("API_SERVER_PORT") || "8000"),
  signal: abortController.signal,
});

ProcessManager.create(
  [
    async () => {
      logger.log("Stopping server");
      await serverPromise;
    },
    async () => {
      logger.log("Persisting data");
      await persist(board);
    },
  ],
  abortController,
  logger,
);