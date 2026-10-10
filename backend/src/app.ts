import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { config } from "./config/index.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { apiLimiter } from "./shared/middleware/rateLimiter.js";
import { setupWebSocket } from "./shared/websocket/index.js";
import coinsRouter from "./modules/coins/routes.js";
import trendingRouter from "./modules/trending/routes.js";
import majorCoinsRouter from "./modules/major-coins/routes.js";
import healthRouter from "./modules/health.js";

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(apiLimiter);

app.use("/api/health", healthRouter);
app.use("/api/coins", coinsRouter);
app.use("/api/trending", trendingRouter);
app.use("/api/major-coins", majorCoinsRouter);

app.use(errorHandler);

setupWebSocket(server);

server.listen(config.BACKEND_PORT, () => {
  console.log(`[Server] Running on port ${config.BACKEND_PORT} (${config.NODE_ENV})`);
});

export default app;
