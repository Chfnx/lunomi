import axios from "axios";
import { config } from "../../config/index.js";

export interface DexScreenerPair {
  chainId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: string | null;
  priceChange: { m5: number | null; h1: number | null; h24: number | null };
  volume: { h24: number | null };
  liquidity: { usd: number | null };
  marketCap: number | null;
  txns: {
    h24: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    m5: { buys: number; sells: number };
  };
  pairCreatedAt: number | null;
  url: string;
  info?: { imageUrl?: string };
}

const client = axios.create({
  baseURL: config.DEXSCREENER_API,
  timeout: 10_000,
});

export async function getNewPairs(): Promise<DexScreenerPair[]> {
  try {
    const { data } = await client.get<{ pairs: DexScreenerPair[] | null }>(
      "/latest/dex/search?q=new&sort=createdAt",
    );
    const pairs = data.pairs ?? [];
    return pairs.filter((p) => p.pairCreatedAt && Date.now() - p.pairCreatedAt < 3 * 60 * 60 * 1000);
  } catch {
    return [];
  }
}

export async function searchToken(query: string): Promise<DexScreenerPair[]> {
  const { data } = await client.get<{ pairs: DexScreenerPair[] | null }>(
    `/latest/dex/search?q=${encodeURIComponent(query)}`,
  );
  return data.pairs ?? [];
}

export async function getPairByAddress(
  chain: string,
  address: string,
): Promise<DexScreenerPair[]> {
  const { data } = await client.get<{ pairs: DexScreenerPair[] | null }>(
    `/latest/dex/pairs/${chain}/${address}`,
  );
  return data.pairs ?? [];
}
