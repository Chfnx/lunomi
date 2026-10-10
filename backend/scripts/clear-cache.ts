import { cacheDel } from "../src/shared/cache/redis.js";

async function clearCache() {
  await cacheDel("trending:coins");
  await cacheDel("trending:scores");
  await cacheDel("coins:new");
  console.log("Cache cleared");
  process.exit(0);
}

clearCache().catch(console.error);
