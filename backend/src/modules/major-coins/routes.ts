import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/rateLimiter.js";
import { getMajorCoinsAnalysis, getCoinOHLCV } from "./service.js";

const router = Router();

router.get(
  "/analysis",
  asyncHandler(async (_req, res) => {
    const results = await getMajorCoinsAnalysis();
    res.json({ data: results });
  }),
);

router.get(
  "/ohlcv/:symbol",
  asyncHandler(async (req, res) => {
    const symbol = req.params.symbol as string;
    const daysParam = req.query.days;
    const daysInput = typeof daysParam === "string" ? parseInt(daysParam) || 90 : 90;
    const validDays = [1, 7, 14, 30, 90, 180, 365];
    const days = validDays.includes(daysInput) ? daysInput : 90;
    const data = await getCoinOHLCV(symbol, days);
    res.json({ data });
  }),
);

export default router;
