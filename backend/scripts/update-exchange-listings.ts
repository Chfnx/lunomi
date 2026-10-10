import prisma from "../src/shared/db/prisma.js";
import { checkExchangeListings } from "../src/modules/coins/exchangeChecker.js";

async function updateAllExchangeListings() {
  console.log("Starting exchange listing update for all coins...");

  const coins = await prisma.coin.findMany({
    select: { id: true, symbol: true, chain: true, listedOnKucoin: true, listedOnBitget: true },
  });

  console.log(`Found ${coins.length} coins to check`);

  let updated = 0;
  for (const coin of coins) {
    try {
      console.log(`Checking ${coin.symbol} (${coin.chain})...`);
      const listings = await checkExchangeListings(coin.symbol);

      if (listings.listedOnKucoin !== coin.listedOnKucoin || listings.listedOnBitget !== coin.listedOnBitget) {
        await prisma.coin.update({
          where: { id: coin.id },
          data: {
            listedOnKucoin: listings.listedOnKucoin,
            listedOnBitget: listings.listedOnBitget,
          },
        });
        console.log(`  ✓ Updated: KuCoin=${listings.listedOnKucoin}, Bitget=${listings.listedOnBitget}`);
        updated++;
      } else {
        console.log(`  - No change`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ✗ Error checking ${coin.symbol}:`, error.message);
    }
  }

  console.log(`\nCompleted! Updated ${updated} coins`);

  // Show summary
  const summary = await prisma.coin.groupBy({
    by: ["listedOnKucoin", "listedOnBitget"],
    _count: true,
  });
  console.log("\nSummary:", JSON.stringify(summary, null, 2));
}

updateAllExchangeListings().catch(console.error);
