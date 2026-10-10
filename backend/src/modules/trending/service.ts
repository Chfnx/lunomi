import prisma from "../../shared/db/prisma.js";
import { cacheGet, cacheSet } from "../../shared/cache/redis.js";
import { getTrendingPools, type GeckoTerminalPool } from "../coins/geckoterminal.js";
import { calculateSignalMetrics } from "./signals.js";
import type { Coin } from "@prisma/client";

const CACHE_KEY_TRENDING = "trending:coins";
const CACHE_KEY_SCORES = "trending:scores";
const CACHE_TTL = 60;

interface TrendingCoin {
  chain: string;
  pairAddress: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  priceChange5m: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
  socialMetrics: SocialMetrics;
  exchangeListings: ExchangeListings;
  trendScore: number;
  scoreBreakdown: ScoreBreakdown;
}

interface SocialMetrics {
  mentions: number;
  likes: number;
  retweets: number;
  sentiment: number;
}

interface ExchangeListings {
  kucoin: boolean;
  bitget: boolean;
}

interface ScoreBreakdown {
  socialScore: number;
  volumeScore: number;
  liquidityScore: number;
  marketCapScore: number;
  ageScore: number;
  exchangeScore: number;
  reversalScore: number;
  whaleScore: number;
  holderScore: number;
  velocityScore: number;
  developerScore: number;
  smartMoneyScore: number;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function calcReversalScore(coin: {
  priceChange5m: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
  liquidity: number | null;
}): number {
  const { priceChange5m, priceChange1h, priceChange24h, volume24h, liquidity } = coin;

  if (priceChange5m === null || priceChange1h === null) return 0;

  let score = 0;

  if (priceChange24h !== null && priceChange24h < -5 && priceChange1h < -2 && priceChange5m > 0) {
    score += 40;
  } else if (priceChange1h < -2 && priceChange5m > 0) {
    score += 30;
  } else if (priceChange1h < 0 && priceChange5m > 0.5) {
    score += 20;
  }

  if (priceChange5m > 1) score += 15;
  else if (priceChange5m > 0.5) score += 10;

  if (volume24h && volume24h > 1_000_000) score += 10;
  else if (volume24h && volume24h > 500_000) score += 5;

  if (liquidity && liquidity > 500_000) score += 10;
  else if (liquidity && liquidity > 100_000) score += 5;

  return Math.min(100, score);
}

function calcTrendScore(coin: {
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  priceChange5m: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
  socialMetrics: SocialMetrics;
  exchangeListings: ExchangeListings;
  pairCreatedAt: Date | null;
  whaleScore?: number;
  holderScore?: number;
  velocityScore?: number;
  developerScore?: number;
  smartMoneyScore?: number;
}): { total: number; breakdown: ScoreBreakdown } {
  const { volume24h, liquidity, marketCap, priceChange5m, priceChange1h, priceChange24h, socialMetrics, exchangeListings, pairCreatedAt } = coin;

  const volumeScore = Math.round(normalize(volume24h ?? 0, 0, 10_000_000));
  const liquidityScore = Math.round(normalize(liquidity ?? 0, 0, 5_000_000));
  const marketCapScore = Math.round(normalize(marketCap ?? 0, 0, 50_000_000));

  const socialRaw =
    socialMetrics.mentions * 2 +
    socialMetrics.likes * 0.5 +
    socialMetrics.retweets * 1.5 +
    socialMetrics.sentiment * 20;
  const socialScore = Math.round(normalize(socialRaw, 0, 500));

  let ageScore = 0;
  if (pairCreatedAt) {
    const ageHours = (Date.now() - pairCreatedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) ageScore = 100;
    else if (ageHours < 3) ageScore = 80;
    else if (ageHours < 6) ageScore = 60;
    else if (ageHours < 12) ageScore = 40;
    else if (ageHours < 24) ageScore = 20;
    else ageScore = 10;
  }

  let exchangeScore = 0;
  if (exchangeListings.kucoin) exchangeScore += 50;
  if (exchangeListings.bitget) exchangeScore += 50;

  const reversalScore = calcReversalScore({ priceChange5m, priceChange1h, priceChange24h, volume24h, liquidity });

  const whaleScore = coin.whaleScore ?? 0;
  const holderScore = coin.holderScore ?? 0;
  const velocityScore = coin.velocityScore ?? 0;
  const developerScore = coin.developerScore ?? 0;
  const smartMoneyScore = coin.smartMoneyScore ?? 0;

  const total = Math.round(
    socialScore * 0.13 +
      volumeScore * 0.13 +
      liquidityScore * 0.10 +
      marketCapScore * 0.10 +
      ageScore * 0.06 +
      exchangeScore * 0.13 +
      reversalScore * 0.08 +
      whaleScore * 0.10 +
      holderScore * 0.07 +
      velocityScore * 0.05 +
      developerScore * 0.03 +
      smartMoneyScore * 0.02,
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      socialScore,
      volumeScore,
      liquidityScore,
      marketCapScore,
      ageScore,
      exchangeScore,
      reversalScore,
      whaleScore,
      holderScore,
      velocityScore,
      developerScore,
      smartMoneyScore,
    },
  };
}

function mapPool(
  pool: GeckoTerminalPool,
  exchangeListings: ExchangeListings = { kucoin: false, bitget: false },
  signalScores?: {
    whaleScore: number;
    holderScore: number;
    velocityScore: number;
    developerScore: number;
    smartMoneyScore: number;
  },
): TrendingCoin {
  const attrs = pool.attributes;
  const socialMetrics: SocialMetrics = {
    mentions: 0,
    likes: 0,
    retweets: 0,
    sentiment: 0.5,
  };

  const coin = {
    chain: pool.id.split("_")[0],
    pairAddress: attrs.address,
    name: attrs.name.split("/")[0]?.trim() ?? attrs.name,
    symbol: attrs.name.split("/")[0]?.trim() ?? "???",
    priceUsd: attrs.base_token_price_usd ? parseFloat(attrs.base_token_price_usd) : null,
    volume24h: attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24) : null,
    liquidity: attrs.liquidity?.usd ? parseFloat(attrs.liquidity.usd) : null,
    marketCap: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
    priceChange5m: attrs.price_change_percentage?.m5 ? parseFloat(attrs.price_change_percentage.m5) : null,
    priceChange1h: attrs.price_change_percentage?.h1 ? parseFloat(attrs.price_change_percentage.h1) : null,
    priceChange24h: attrs.price_change_percentage?.h24
      ? parseFloat(attrs.price_change_percentage.h24)
      : null,
    socialMetrics,
    exchangeListings,
    pairCreatedAt: attrs.pool_created_at ? new Date(attrs.pool_created_at) : null,
    whaleScore: signalScores?.whaleScore ?? 0,
    holderScore: signalScores?.holderScore ?? 0,
    velocityScore: signalScores?.velocityScore ?? 0,
    developerScore: signalScores?.developerScore ?? 0,
    smartMoneyScore: signalScores?.smartMoneyScore ?? 0,
  };

  const { total, breakdown } = calcTrendScore(coin);

  return {
    ...coin,
    trendScore: total,
    scoreBreakdown: breakdown,
  };
}

export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const cached = await cacheGet<TrendingCoin[]>(CACHE_KEY_TRENDING);
  if (cached) return cached;

  let pools = await getTrendingPools();

  // Fallback to database coins if API returns empty (rate limit or error)
  if (pools.length === 0) {
    console.log("[Trending] GeckoTerminal returned 0 pools, using database coins as fallback");
    const dbCoins = await prisma.coin.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    pools = dbCoins.map((coin: Coin) => ({
      id: `${coin.chain}_${coin.pairAddress}`,
      type: "pool",
      attributes: {
        address: coin.pairAddress,
        name: `${coin.symbol}/${coin.quoteToken || "ETH"}`,
        base_token_price_usd: coin.priceUsd?.toString() ?? null,
        quote_token_price_usd: null,
        volume_usd: { h24: coin.volume24h?.toString() ?? null },
        price_change_percentage: {
          m5: coin.priceChange5m?.toString() ?? null,
          h1: coin.priceChange1h?.toString() ?? null,
          h24: coin.priceChange24h?.toString() ?? null,
        },
        market_cap_usd: coin.marketCap?.toString() ?? null,
        liquidity: { usd: coin.liquidity?.toString() ?? null },
        reserve_in_usd: null,
        pool_created_at: coin.pairCreatedAt?.toISOString() ?? null,
      },
      relationships: {
        base_token: { data: { id: coin.baseToken, type: "token" } },
        quote_token: { data: { id: "", type: "token" } },
        dex: { data: { id: "", type: "dex" } },
      },
    }));
  }

  // Upsert trending coins into database first
  const { upsertCoins } = await import("../coins/service.js");
  const coinsToUpsert = pools.map((pool) => {
    const attrs = pool.attributes;
    return {
      id: `gecko-${pool.id}`,
      chain: pool.id.split("_")[0],
      pairAddress: attrs.address,
      baseToken: pool.relationships.base_token.data.id,
      name: attrs.name.split("/")[0]?.trim() ?? attrs.name,
      symbol: attrs.name.split("/")[0]?.trim() ?? "???",
      priceUsd: attrs.base_token_price_usd ? parseFloat(attrs.base_token_price_usd) : null,
      priceChange5m: attrs.price_change_percentage?.m5 ? parseFloat(attrs.price_change_percentage.m5) : null,
      priceChange1h: attrs.price_change_percentage?.h1 ? parseFloat(attrs.price_change_percentage.h1) : null,
      priceChange24h: attrs.price_change_percentage?.h24 ? parseFloat(attrs.price_change_percentage.h24) : null,
      volume24h: attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24) : null,
      liquidity: attrs.liquidity?.usd ? parseFloat(attrs.liquidity.usd) : null,
      marketCap: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
      txns24h: null,
      buyers24h: null,
      sellers24h: null,
      pairCreatedAt: attrs.pool_created_at ? new Date(attrs.pool_created_at) : null,
      age: "unknown",
      dexUrl: null,
      imageUrl: null,
      source: "geckoterminal",
    };
  });
  await upsertCoins(coinsToUpsert);

  const coinsWithListings = await Promise.all(
    pools.map(async (pool) => {
      const attrs = pool.attributes;

      const dbCoin = await prisma.coin.findUnique({
        where: {
          chain_pairAddress: {
            chain: pool.id.split("_")[0],
            pairAddress: attrs.address,
          },
        },
      });

      const exchangeListings: ExchangeListings = {
        kucoin: dbCoin?.listedOnKucoin ?? false,
        bitget: dbCoin?.listedOnBitget ?? false,
      };

      let signalScores;
      if (dbCoin) {
        try {
          const metrics = await calculateSignalMetrics(dbCoin.id, dbCoin.symbol, dbCoin.chain, dbCoin.pairAddress);
          signalScores = {
            whaleScore: Math.round(metrics.whaleAccumulation),
            holderScore: Math.round(metrics.holderGrowth),
            velocityScore: Math.round(metrics.socialVelocity),
            developerScore: Math.round(metrics.developerActivity),
            smartMoneyScore: Math.round(metrics.smartMoneyScore),
          };

          await prisma.coin.update({
            where: { id: dbCoin.id },
            data: {
              whaleAccumulation: metrics.whaleAccumulation,
              holderGrowth: metrics.holderGrowth,
              socialVelocity: metrics.socialVelocity,
              developerActivity: metrics.developerActivity,
              smartMoneyScore: metrics.smartMoneyScore,
            },
          });
        } catch (error) {
          console.error(`Failed to calculate signals for ${dbCoin.symbol}:`, error);
        }
      }

      if (dbCoin) {
        const enrichedPool: GeckoTerminalPool = {
          ...pool,
          attributes: {
            ...attrs,
            liquidity: { usd: dbCoin.liquidity?.toString() ?? attrs.liquidity?.usd ?? null },
            market_cap_usd: dbCoin.marketCap?.toString() ?? attrs.market_cap_usd ?? null,
          },
        };
        return mapPool(enrichedPool, exchangeListings, signalScores);
      }

      return mapPool(pool, exchangeListings, signalScores);
    }),
  );

  const coins = coinsWithListings.sort((a, b) => b.trendScore - a.trendScore);

  const seen = new Set<string>();
  const uniqueCoins = coins.filter((coin) => {
    if (seen.has(coin.symbol.toLowerCase())) return false;
    seen.add(coin.symbol.toLowerCase());
    return true;
  });

  await cacheSet(CACHE_KEY_TRENDING, uniqueCoins, CACHE_TTL);

  updateExchangeListingsAsync(pools);

  return uniqueCoins;
}

async function updateExchangeListingsAsync(pools: GeckoTerminalPool[]): Promise<void> {
  console.log(`[Trending] Starting async exchange listing update for ${pools.length} pools`);
  const { checkExchangeListings, updateCoinExchangeListings } = await import("../coins/exchangeChecker.js");

  for (const pool of pools) {
    const attrs = pool.attributes;
    const symbol = attrs.name.split("/")[0]?.trim() ?? "???";
    const chain = pool.id.split("_")[0];

    try {
      const dbCoin = await prisma.coin.findUnique({
        where: {
          chain_pairAddress: { chain, pairAddress: attrs.address },
        },
      });

      if (!dbCoin) {
        console.log(`[Trending] Coin not found in DB: ${symbol} on ${chain}`);
        continue;
      }

      console.log(`[Trending] Checking exchange listings for ${symbol}`);
      const listings = await checkExchangeListings(symbol);
      console.log(`[Trending] ${symbol} listings:`, listings);
      await updateCoinExchangeListings(dbCoin.id, listings);
      console.log(`[Trending] Updated ${symbol} in DB`);
    } catch (error) {
      console.error(`Failed to update exchange listings for ${symbol}:`, error);
    }
  }
  console.log(`[Trending] Completed async exchange listing update`);

  const { cacheDel } = await import("../../shared/cache/redis.js");
  await cacheDel(CACHE_KEY_TRENDING);
  await cacheDel(CACHE_KEY_SCORES);
  console.log(`[Trending] Cleared trending cache to pick up updated exchange listings`);
}

export async function getTrendingScores(): Promise<Record<string, number>> {
  const cached = await cacheGet<Record<string, number>>(CACHE_KEY_SCORES);
  if (cached) return cached;

  const trending = await fetchTrendingCoins();
  const scores: Record<string, number> = {};
  for (const coin of trending) {
    scores[`${coin.chain}:${coin.pairAddress}`] = coin.trendScore;
  }

  await cacheSet(CACHE_KEY_SCORES, scores, 120);
  return scores;
}

export async function saveTrendScoresToDb(coins: TrendingCoin[]): Promise<void> {
  for (const coin of coins) {
    const dbCoin = await prisma.coin.findUnique({
      where: {
        chain_pairAddress: { chain: coin.chain, pairAddress: coin.pairAddress },
      },
    });
    if (!dbCoin) continue;

    await prisma.trendScore.create({
      data: {
        coinId: dbCoin.id,
        score: coin.trendScore,
        socialScore: coin.scoreBreakdown.socialScore,
        volumeScore: coin.scoreBreakdown.volumeScore,
        liquidityScore: coin.scoreBreakdown.liquidityScore,
        marketCapScore: coin.scoreBreakdown.marketCapScore,
        ageScore: coin.scoreBreakdown.ageScore,
        exchangeScore: coin.scoreBreakdown.exchangeScore,
        reversalScore: coin.scoreBreakdown.reversalScore,
        whaleScore: coin.scoreBreakdown.whaleScore,
        holderScore: coin.scoreBreakdown.holderScore,
        velocityScore: coin.scoreBreakdown.velocityScore,
        developerScore: coin.scoreBreakdown.developerScore,
        smartMoneyScore: coin.scoreBreakdown.smartMoneyScore,
        mentions: coin.socialMetrics.mentions,
        likes: coin.socialMetrics.likes,
        retweets: coin.socialMetrics.retweets,
        sentiment: coin.socialMetrics.sentiment,
      },
    });
  }
}
