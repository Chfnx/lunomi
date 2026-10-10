import prisma from "../src/shared/db/prisma.js";
import axios from "axios";

const dexscreener = axios.create({
  baseURL: "https://api.dexscreener.com/latest",
  timeout: 10000,
  headers: { Accept: "application/json" },
});

const CHAIN_MAP: Record<string, string> = {
  eth: "ethereum",
  solana: "solana",
  base: "base",
  bsc: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
};

async function updateLiquidityAndMarketCap() {
  console.log("Starting liquidity and market cap update...");

  const coins = await prisma.coin.findMany({
    where: {
      OR: [{ liquidity: null }, { marketCap: null }],
    },
    select: {
      id: true,
      symbol: true,
      chain: true,
      pairAddress: true,
      baseToken: true,
      liquidity: true,
      marketCap: true,
    },
  });

  console.log(`Found ${coins.length} coins with missing data`);

  let updated = 0;
  for (const coin of coins) {
    try {
      console.log(`Searching for ${coin.symbol} (${coin.chain})...`);

      const { data } = await dexscreener.get(`/dex/search`, {
        params: { q: coin.symbol },
      });

      const pairs = data?.pairs ?? [];
      const dexscreenerChain = CHAIN_MAP[coin.chain] ?? coin.chain;

      const match = pairs.find(
        (p: any) =>
          p.chainId === dexscreenerChain &&
          p.baseToken?.symbol?.toLowerCase() === coin.symbol.toLowerCase(),
      ) ?? pairs.find(
        (p: any) =>
          p.baseToken?.symbol?.toLowerCase() === coin.symbol.toLowerCase(),
      );

      if (match) {
        const liquidity = match.liquidity?.usd ?? null;
        const marketCap = match.marketCap ?? null;
        const priceUsd = match.priceUsd ? parseFloat(match.priceUsd) : null;
        const volume24h = match.volume?.h24 ?? null;
        const priceChange5m = match.priceChange?.m5 ?? null;
        const priceChange1h = match.priceChange?.h1 ?? null;
        const priceChange24h = match.priceChange?.h24 ?? null;
        const txns24h = (match.txns?.h24?.buys ?? 0) + (match.txns?.h24?.sells ?? 0);

        await prisma.coin.update({
          where: { id: coin.id },
          data: {
            ...(liquidity !== null && { liquidity }),
            ...(marketCap !== null && { marketCap }),
            ...(priceUsd !== null && { priceUsd }),
            ...(volume24h !== null && { volume24h }),
            ...(priceChange5m !== null && { priceChange5m }),
            ...(priceChange1h !== null && { priceChange1h }),
            ...(priceChange24h !== null && { priceChange24h }),
            ...(txns24h > 0 && { txns24h }),
          },
        });
        console.log(
          `  ✓ Updated: liquidity=$${liquidity?.toLocaleString() ?? "null"}, mcap=$${marketCap?.toLocaleString() ?? "null"}`,
        );
        updated++;
      } else {
        console.log(`  ✗ No match found on DexScreener`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ✗ Error fetching ${coin.symbol}:`, error.message);
    }
  }

  console.log(`\nCompleted! Updated ${updated} out of ${coins.length} coins`);
}

updateLiquidityAndMarketCap().catch(console.error);
