import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/rateLimiter.js";
import { fetchTrendingCoins, getTrendingScores, saveTrendScoresToDb } from "./service.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const coins = await fetchTrendingCoins();
    res.json({ data: coins, count: coins.length });
  }),
);

router.get(
  "/scores",
  asyncHandler(async (_req, res) => {
    const scores = await getTrendingScores();
    res.json({ data: scores });
  }),
);

router.post(
  "/sync",
  asyncHandler(async (_req, res) => {
    const coins = await fetchTrendingCoins();
    await saveTrendScoresToDb(coins);
    res.json({ synced: coins.length });
  }),
);

export default router;
