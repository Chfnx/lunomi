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

export interface MajorCoinAnalysis {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  indicators: {
    rsi: number;
    ema20: number;
    ema50: number;
    ema200: number;
    macd: { value: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number; width: number };
    support: number[];
    resistance: number[];
    currentPrice: number;
  };
  consolidation: {
    isConsolidating: boolean;
    rangeLow: number;
    rangeHigh: number;
    rangeWidth: number;
    duration: string;
    explanation: string;
  };
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  signalScore: number;
  prediction: string;
  analysis: string[];
  chartLines: { label: string; value: number; color: string }[];
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  count?: number;
}
