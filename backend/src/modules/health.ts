import { Router } from "express";
import { asyncHandler } from "../shared/middleware/rateLimiter.js";
import prisma from "../shared/db/prisma.js";
import redis from "../shared/cache/redis.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const dbOk = await prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);
    const redisOk = await redis.ping().then(() => true).catch(() => false);

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk ? "connected" : "error",
        redis: redisOk ? "connected" : "error",
      },
    });
  }),
);

export default router;
