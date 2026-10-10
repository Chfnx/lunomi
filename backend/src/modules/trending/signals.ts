import prisma from "../../shared/db/prisma.js";

interface SignalMetrics {
  whaleAccumulation: number;
  holderGrowth: number;
  socialVelocity: number;
  developerActivity: number;
  smartMoneyScore: number;
}

export async function calculateSignalMetrics(
  coinId: string,
  symbol: string,
  chain: string,
  pairAddress: string,
): Promise<SignalMetrics> {
  const [whaleAccumulation, holderGrowth, socialVelocity, developerActivity, smartMoneyScore] =
    await Promise.all([
      calculateWhaleAccumulation(coinId),
      calculateHolderGrowth(coinId),
      calculateSocialVelocity(coinId),
      calculateDeveloperActivity(symbol),
      calculateSmartMoneyScore(coinId),
    ]);

  return {
    whaleAccumulation,
    holderGrowth,
    socialVelocity,
    developerActivity,
    smartMoneyScore,
  };
}

async function calculateWhaleAccumulation(coinId: string): number {
  const coin = await prisma.coin.findUnique({ where: { id: coinId } });
  if (!coin) return 0;

  const txns24h = coin.txns24h ?? 0;
  const volume24h = coin.volume24h ?? 0;

  if (txns24h === 0 || volume24h === 0) return 0;

  const avgTxSize = volume24h / txns24h;
  const whaleThreshold = 50000;

  if (avgTxSize > whaleThreshold) return 100;
  if (avgTxSize > whaleThreshold * 0.5) return 75;
  if (avgTxSize > whaleThreshold * 0.25) return 50;
  if (avgTxSize > whaleThreshold * 0.1) return 25;

  return Math.min(100, Math.round((avgTxSize / whaleThreshold) * 100));
}

async function calculateHolderGrowth(coinId: string): number {
  const coin = await prisma.coin.findUnique({ where: { id: coinId } });
  if (!coin) return 0;

  const buyers24h = coin.buyers24h ?? 0;
  const sellers24h = coin.sellers24h ?? 0;

  if (buyers24h === 0 && sellers24h === 0) return 0;

  const netGrowth = buyers24h - sellers24h;
  const totalTxns = buyers24h + sellers24h;

  if (totalTxns === 0) return 0;

  const growthRate = netGrowth / totalTxns;

  if (growthRate > 0.3) return 100;
  if (growthRate > 0.2) return 80;
  if (growthRate > 0.1) return 60;
  if (growthRate > 0) return 40;
  if (growthRate > -0.1) return 20;

  return 0;
}

async function calculateSocialVelocity(coinId: string): number {
  const recentScores = await prisma.trendScore.findMany({
    where: { coinId },
    orderBy: { calculatedAt: "desc" },
    take: 10,
  });

  if (recentScores.length < 2) return 0;

  const latestMentions = recentScores[0].mentions;
  const previousMentions = recentScores[1].mentions;

  if (previousMentions === 0) return latestMentions > 0 ? 50 : 0;

  const velocity = ((latestMentions - previousMentions) / previousMentions) * 100;

  if (velocity > 100) return 100;
  if (velocity > 50) return 80;
  if (velocity > 25) return 60;
  if (velocity > 0) return 40;
  if (velocity > -25) return 20;

  return 0;
}

async function calculateDeveloperActivity(symbol: string): number {
  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${symbol}+crypto+blockchain&sort=updated&order=desc&per_page=1`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
      },
    );

    if (!response.ok) return 0;

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const repo = data.items[0];
      const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate < 7) return 100;
      if (daysSinceUpdate < 30) return 75;
      if (daysSinceUpdate < 90) return 50;
      if (daysSinceUpdate < 180) return 25;
    }

    return 0;
  } catch {
    return 0;
  }
}

async function calculateSmartMoneyScore(coinId: string): number {
  const coin = await prisma.coin.findUnique({ where: { id: coinId } });
  if (!coin) return 0;

  const buyers24h = coin.buyers24h ?? 0;
  const volume24h = coin.volume24h ?? 0;
  const liquidity = coin.liquidity ?? 0;

  if (buyers24h === 0 || volume24h === 0 || liquidity === 0) return 0;

  const volumeToLiquidityRatio = volume24h / liquidity;
  const buyerConcentration = buyers24h / 100;

  let score = 0;

  if (volumeToLiquidityRatio > 0.5) score += 40;
  else if (volumeToLiquidityRatio > 0.25) score += 30;
  else if (volumeToLiquidityRatio > 0.1) score += 20;

  if (buyerConcentration > 0.5) score += 30;
  else if (buyerConcentration > 0.3) score += 20;
  else if (buyerConcentration > 0.1) score += 10;

  if (volume24h > 1_000_000) score += 30;
  else if (volume24h > 500_000) score += 20;
  else if (volume24h > 100_000) score += 10;

  return Math.min(100, score);
}

export function normalizeSignalScore(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
