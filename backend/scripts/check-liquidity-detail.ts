import prisma from "../src/shared/db/prisma.js";

async function check() {
  const withLiq = await prisma.coin.findMany({
    where: { liquidity: { not: null } },
    select: { symbol: true, liquidity: true, marketCap: true },
    take: 30,
  });
  console.log("Coins WITH liquidity:");
  console.log(JSON.stringify(withLiq.map(c => ({
    symbol: c.symbol,
    liquidity: c.liquidity?.toNumber?.() ?? c.liquidity ?? null,
    marketCap: c.marketCap?.toNumber?.() ?? c.marketCap ?? null,
  })), null, 2));

  const withoutLiq = await prisma.coin.findMany({
    where: { liquidity: null },
    select: { symbol: true, liquidity: true, marketCap: true },
    take: 20,
  });
  console.log("\nCoins WITHOUT liquidity:");
  console.log(JSON.stringify(withoutLiq.map(c => ({
    symbol: c.symbol,
    liquidity: c.liquidity?.toNumber?.() ?? c.liquidity ?? null,
    marketCap: c.marketCap?.toNumber?.() ?? c.marketCap ?? null,
  })), null, 2));
  process.exit(0);
}
check().catch(console.error);
