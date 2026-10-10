import prisma from "../src/shared/db/prisma.js";

async function check() {
  const coins = await prisma.coin.findMany({
    select: { symbol: true, liquidity: true, marketCap: true },
    take: 15,
    orderBy: { marketCap: "desc" },
  });
  console.log(JSON.stringify(coins.map(c => ({
    symbol: c.symbol,
    liquidity: c.liquidity?.toNumber?.() ?? c.liquidity ?? null,
    marketCap: c.marketCap?.toNumber?.() ?? c.marketCap ?? null,
  })), null, 2));

  const total = await prisma.coin.count();
  const withLiq = await prisma.coin.count({ where: { liquidity: { not: null } } });
  const withMc = await prisma.coin.count({ where: { marketCap: { not: null } } });
  console.log(`\nTotal: ${total}, With liquidity: ${withLiq}, With marketCap: ${withMc}`);
  process.exit(0);
}
check().catch(console.error);
