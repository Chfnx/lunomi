import prisma from "../src/shared/db/prisma.js";

async function check() {
  const symbols = ["NOCK", "TIBBIR", "SOL", "KTA", "BNKR", "EDEL", "ZRO", "VVV", "LAPTOP"];
  
  for (const symbol of symbols) {
    const coins = await prisma.coin.findMany({
      where: { symbol },
      select: { symbol: true, chain: true, liquidity: true, marketCap: true },
    });
    console.log(`${symbol}:`);
    coins.forEach(c => {
      console.log(`  ${c.chain}: liq=${c.liquidity?.toNumber?.() ?? c.liquidity ?? 'null'}, mcap=${c.marketCap?.toNumber?.() ?? c.marketCap ?? 'null'}`);
    });
  }
  process.exit(0);
}
check().catch(console.error);
