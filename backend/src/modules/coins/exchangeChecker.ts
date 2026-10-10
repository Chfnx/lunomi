import axios from "axios";

const CHECK_TIMEOUT = 3000;

export interface ExchangeListingStatus {
  listedOnKucoin: boolean;
  listedOnBitget: boolean;
}

async function checkKucoinListing(symbol: string): Promise<boolean> {
  const url = `https://www.kucoin.com/price/?keyword=${symbol}`;
  try {
    const response = await axios.head(url, { timeout: CHECK_TIMEOUT });
    const success = response.status >= 200 && response.status < 400;
    console.log(`[ExchangeChecker] KuCoin check for ${symbol}: ${response.status} -> ${success}`);
    return success;
  } catch (error) {
    console.log(`[ExchangeChecker] KuCoin check for ${symbol}: FAILED - ${error.message}`);
    return false;
  }
}

async function checkBitgetListing(symbol: string): Promise<boolean> {
  const url = `https://www.bitget.com/price/${symbol}`;
  try {
    const response = await axios.head(url, { timeout: CHECK_TIMEOUT });
    const success = response.status >= 200 && response.status < 400;
    console.log(`[ExchangeChecker] Bitget check for ${symbol}: ${response.status} -> ${success}`);
    return success;
  } catch (error) {
    console.log(`[ExchangeChecker] Bitget check for ${symbol}: FAILED - ${error.message}`);
    return false;
  }
}

export async function checkExchangeListings(
  symbol: string,
): Promise<ExchangeListingStatus> {
  const [listedOnKucoin, listedOnBitget] = await Promise.all([
    checkKucoinListing(symbol),
    checkBitgetListing(symbol),
  ]);

  return { listedOnKucoin, listedOnBitget };
}

export async function updateCoinExchangeListings(
  coinId: string,
  status: ExchangeListingStatus,
): Promise<void> {
  const { default: prisma } = await import("../../shared/db/prisma.js");
  await prisma.coin.update({
    where: { id: coinId },
    data: {
      listedOnKucoin: status.listedOnKucoin,
      listedOnBitget: status.listedOnBitget,
    },
  });
}
