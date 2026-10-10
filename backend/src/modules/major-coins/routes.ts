import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/rateLimiter.js";
import { getMajorCoinsAnalysis } from "./service.js";

const router = Router();

router.get(
  "/analysis",
  asyncHandler(async (_req, res) => {
    const results = await getMajorCoinsAnalysis();
    res.json({ data: results });
  }),
);

export default router;
