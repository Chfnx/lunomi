import prisma from "../../shared/db/prisma.js";
import { cacheGet, cacheSet } from "../../shared/cache/redis.js";
import { getNewPairs, type DexScreenerPair } from "./dexscreener.js";
import { getNewPools, type GeckoTerminalPool } from "./geckoterminal.js";

const CACHE_KEY_NEW = "coins:new";
const CACHE_TTL = 30; // seconds

interface NewCoin {
  id: string;
  chain: string;
  pairAddress: string;
  baseToken: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  priceChange5m: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  txns24h: number | null;
  buyers24h: number | null;
  sellers24h: number | null;
  pairCreatedAt: Date | null;
  age: string;
  dexUrl: string | null;
  imageUrl: string | null;
  source: string;
}

function mapDexScreenerPair(pair: DexScreenerPair): Omit<NewCoin, "age"> {
  const txns24h = (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0);
  return {
    id: `${pair.chainId}-${pair.pairAddress}`,
    chain: pair.chainId,
    pairAddress: pair.pairAddress,
    baseToken: pair.baseToken.address,
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    priceUsd: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
    priceChange5m: pair.priceChange?.m5 ?? null,
    priceChange1h: pair.priceChange?.h1 ?? null,
    priceChange24h: pair.priceChange?.h24 ?? null,
    volume24h: pair.volume?.h24 ?? null,
    liquidity: pair.liquidity?.usd ?? null,
    marketCap: pair.marketCap ?? null,
    txns24h,
    buyers24h: pair.txns?.h24?.buys ?? null,
    sellers24h: pair.txns?.h24?.sells ?? null,
    pairCreatedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : null,
    dexUrl: pair.url ?? null,
    imageUrl: pair.info?.imageUrl ?? null,
    source: "dexscreener",
  };
}

function mapGeckoPool(pool: GeckoTerminalPool): Omit<NewCoin, "age"> {
  const attrs = pool.attributes;
  return {
    id: `gecko-${pool.id}`,
    chain: pool.id.split("_")[0],
    pairAddress: attrs.address,
    baseToken: pool.relationships.base_token.data.id,
    name: attrs.name.split("/")[0]?.trim() ?? attrs.name,
    symbol: attrs.name.split("/")[0]?.trim() ?? "???",
    priceUsd: attrs.base_token_price_usd ? parseFloat(attrs.base_token_price_usd) : null,
    priceChange5m: attrs.price_change_percentage?.m5
      ? parseFloat(attrs.price_change_percentage.m5)
      : null,
    priceChange1h: attrs.price_change_percentage?.h1
      ? parseFloat(attrs.price_change_percentage.h1)
      : null,
    priceChange24h: attrs.price_change_percentage?.h24
      ? parseFloat(attrs.price_change_percentage.h24)
      : null,
    volume24h: attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24) : null,
    liquidity: attrs.liquidity?.usd ? parseFloat(attrs.liquidity.usd) : null,
    marketCap: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
    txns24h: null,
    buyers24h: null,
    sellers24h: null,
    pairCreatedAt: attrs.pool_created_at ? new Date(attrs.pool_created_at) : null,
    dexUrl: null,
    imageUrl: null,
    source: "geckoterminal",
  };
}

function calcAge(createdAt: Date | null): string {
  if (!createdAt) return "unknown";
  const diffMs = Date.now() - createdAt.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function isNew(createdAt: Date | null, maxAgeHours = 3): boolean {
  if (!createdAt) return false;
  const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return diffHours <= maxAgeHours;
}

export async function fetchNewCoins(): Promise<NewCoin[]> {
  const cached = await cacheGet<NewCoin[]>(CACHE_KEY_NEW);
  if (cached) return cached;

  const [dexPairs, geckoPools] = await Promise.allSettled([
    getNewPairs(),
    getNewPools(),
  ]);

  const coins: NewCoin[] = [];

  if (dexPairs.status === "fulfilled") {
    for (const pair of dexPairs.value) {
      const mapped = mapDexScreenerPair(pair);
      coins.push({ ...mapped, age: calcAge(mapped.pairCreatedAt) });
    }
  }

  if (geckoPools.status === "fulfilled") {
    for (const pool of geckoPools.value) {
      const mapped = mapGeckoPool(pool);
      coins.push({ ...mapped, age: calcAge(mapped.pairCreatedAt) });
    }
  }

  await cacheSet(CACHE_KEY_NEW, coins, CACHE_TTL);
  return coins;
}

export async function getCoinsUnder3Hours(): Promise<NewCoin[]> {
  const all = await fetchNewCoins();
  return all.filter((c) => isNew(c.pairCreatedAt));
}

export async function upsertCoins(coins: NewCoin[]): Promise<void> {
  for (const coin of coins) {
    await prisma.coin.upsert({
      where: {
        chain_pairAddress: { chain: coin.chain, pairAddress: coin.pairAddress },
      },
      update: {
        priceUsd: coin.priceUsd,
        priceChange5m: coin.priceChange5m,
        priceChange1h: coin.priceChange1h,
        priceChange24h: coin.priceChange24h,
        volume24h: coin.volume24h,
        ...(coin.liquidity !== null && { liquidity: coin.liquidity }),
        ...(coin.marketCap !== null && { marketCap: coin.marketCap }),
        txns24h: coin.txns24h,
        buyers24h: coin.buyers24h,
        sellers24h: coin.sellers24h,
        updatedAt: new Date(),
      },
      create: {
        chain: coin.chain,
        pairAddress: coin.pairAddress,
        baseToken: coin.baseToken,
        quoteToken: "",
        name: coin.name,
        symbol: coin.symbol,
        priceUsd: coin.priceUsd,
        priceChange5m: coin.priceChange5m,
        priceChange1h: coin.priceChange1h,
        priceChange24h: coin.priceChange24h,
        volume24h: coin.volume24h,
        liquidity: coin.liquidity,
        marketCap: coin.marketCap,
        txns24h: coin.txns24h,
        buyers24h: coin.buyers24h,
        sellers24h: coin.sellers24h,
        pairCreatedAt: coin.pairCreatedAt,
        dexUrl: coin.dexUrl,
        imageUrl: coin.imageUrl,
        source: coin.source,
      },
    });
  }
}
