import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BACKEND_PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DEXSCREENER_API: z.string().url().default("https://api.dexscreener.com"),
  GECKOTERMINAL_API: z.string().url().default("https://api.geckoterminal.com/api/v2"),
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  X_BEARER_TOKEN: z.string().optional(),
  BITGET_API_KEY: z.string().optional(),
  BITGET_API_SECRET: z.string().optional(),
  BITGET_PASSPHRASE: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
