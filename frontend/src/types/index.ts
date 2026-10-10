export interface NewCoin {
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
  pairCreatedAt: string | null;
  age: string;
  dexUrl: string | null;
  imageUrl: string | null;
  source: string;
}

export interface TrendingCoin {
  chain: string;
  pairAddress: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  priceChange5m: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
  socialMetrics: {
    mentions: number;
    likes: number;
    retweets: number;
    sentiment: number;
  };
  exchangeListings: {
    kucoin: boolean;
    bitget: boolean;
  };
  trendScore: number;
  scoreBreakdown: {
    socialScore: number;
    volumeScore: number;
    liquidityScore: number;
    marketCapScore: number;
    ageScore: number;
    exchangeScore: number;
    reversalScore: number;
    whaleScore: number;
    holderScore: number;
    velocityScore: number;
    developerScore: number;
    smartMoneyScore: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  count?: number;
}
