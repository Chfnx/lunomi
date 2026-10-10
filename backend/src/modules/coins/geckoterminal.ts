import axios from "axios";
import { config } from "../../config/index.js";

export interface GeckoTerminalPool {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    base_token_price_usd: string | null;
    quote_token_price_usd: string | null;
    volume_usd: { h24: string | null };
    price_change_percentage: { m5: string | null; h1: string | null; h24: string | null };
    market_cap_usd: string | null;
    liquidity: { usd: string | null };
    reserve_in_usd: string | null;
    pool_created_at: string | null;
  };
  relationships: {
    base_token: { data: { id: string; type: string } };
    quote_token: { data: { id: string; type: string } };
    dex: { data: { id: string; type: string } };
  };
}

export interface GeckoTerminalResponse {
  data: GeckoTerminalPool[];
}

const client = axios.create({
  baseURL: config.GECKOTERMINAL_API,
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

const NETWORKS = ["sol", "eth", "base"];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getNewPools(): Promise<GeckoTerminalPool[]> {
  const pools: GeckoTerminalPool[] = [];

  for (const network of NETWORKS) {
    try {
      const { data } = await client.get<GeckoTerminalResponse>(
        `/networks/${network}/new_pools?page=1`,
      );
      if (data?.data) {
        pools.push(...data.data);
      }
      await delay(1500);
    } catch {
      // skip failed network
    }
  }

  return pools;
}

export async function getTrendingPools(): Promise<GeckoTerminalPool[]> {
  const pools: GeckoTerminalPool[] = [];

  for (const network of NETWORKS) {
    try {
      const { data } = await client.get<GeckoTerminalResponse>(
        `/networks/${network}/trending_pools`,
      );
      if (data?.data) {
        pools.push(...data.data);
      }
      await delay(1500);
    } catch {
      // skip failed network
    }
  }

  return pools;
}
