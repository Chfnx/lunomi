import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/rateLimiter.js";
import { AppError } from "../../shared/middleware/errorHandler.js";
import { fetchNewCoins, getCoinsUnder3Hours, upsertCoins } from "./service.js";

const router = Router();

router.get(
  "/new",
  asyncHandler(async (_req, res) => {
    const coins = await fetchNewCoins();
    res.json({ data: coins, count: coins.length });
  }),
);

router.get(
  "/fresh",
  asyncHandler(async (_req, res) => {
    const coins = await getCoinsUnder3Hours();
    res.json({ data: coins, count: coins.length });
  }),
);

router.post(
  "/sync",
  asyncHandler(async (_req, res) => {
    const coins = await fetchNewCoins();
    await upsertCoins(coins);
    res.json({ synced: coins.length });
  }),
);

router.get(
  "/:chain/:address",
  asyncHandler(async (req, res) => {
    const chain = req.params.chain as string;
    const address = req.params.address as string;
    const coins = await fetchNewCoins();
    const coin = coins.find(
      (c) => c.chain === chain && c.pairAddress.toLowerCase() === address.toLowerCase(),
    );
    if (!coin) throw new AppError(404, "Coin not found");
    res.json({ data: coin });
  }),
);

export default router;
