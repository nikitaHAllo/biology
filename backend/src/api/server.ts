import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error";
import { bot } from "../bot/index";
import { webhookCallback } from "grammy";
import { apiRouter } from "./routes";

dotenv.config();

const app = express();

// CORS — разрешаем все devtunnels + localhost, либо FRONTEND_URL из .env
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl / postman / server-to-server
      const envUrl = process.env.FRONTEND_URL;
      const isDevTunnel =
        /^https:\/\/[a-z0-9]+-5173\.euw\.devtunnels\.ms$/.test(origin);
      const isLocalhost = origin.startsWith("http://localhost");
      if (isDevTunnel || isLocalhost || origin === envUrl) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin not allowed — ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Telegram-Id"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health checks
app.get("/api/health", (_req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() }),
);

app.get("/api/health/db", async (_req, res) => {
  try {
    const { sequelize } = await import("../models/index.js");
    await sequelize.authenticate();
    res.json({ db: "ok", timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res
      .status(503)
      .json({ db: "down", error: msg, timestamp: new Date().toISOString() });
  }
});

// API Routes
app.use("/api", apiRouter);

// Webhook маршрут бота (только если BOT_MODE=webhook)
if (process.env.BOT_MODE === "webhook") {
  const botUrl = process.env.BOT_WEBHOOK_URL;
  if (!botUrl) throw new Error("BOT_WEBHOOK_URL is required in webhook mode");
  const secretPath = process.env.BOT_SECRET_PATH || "bot";
  app.use(`/${secretPath}`, webhookCallback(bot, "express"));
}

// Error handler
app.use(errorHandler);

export { app };
