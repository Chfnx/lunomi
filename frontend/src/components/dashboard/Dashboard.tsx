import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchNewCoins, fetchTrending, syncCoins, syncTrending } from "@/services/api";
import type { NewCoin, TrendingCoin } from "@/types";
import TrendingTable from "@/components/trending/TrendingTable";
import TradingViewChart from "@/components/charts/TradingViewChart";
import CoinProfile from "@/components/coin/CoinProfile";

function newCoinToTrending(coin: NewCoin): TrendingCoin {
  return {
    chain: coin.chain,
    pairAddress: coin.pairAddress,
    name: coin.name,
    symbol: coin.symbol,
    priceUsd: coin.priceUsd,
    volume24h: coin.volume24h,
    liquidity: coin.liquidity,
    marketCap: coin.marketCap,
    priceChange5m: coin.priceChange5m,
    priceChange1h: coin.priceChange1h,
    priceChange24h: coin.priceChange24h,
    socialMetrics: { mentions: 0, likes: 0, retweets: 0, sentiment: 0.5 },
    exchangeListings: { kucoin: false, bitget: false },
    trendScore: 0,
    scoreBreakdown: {
      socialScore: 0,
      volumeScore: 0,
      liquidityScore: 0,
      marketCapScore: 0,
      ageScore: 0,
      exchangeScore: 0,
      reversalScore: 0,
      whaleScore: 0,
      holderScore: 0,
      velocityScore: 0,
      developerScore: 0,
      smartMoneyScore: 0,
    },
  };
}

export default function Dashboard() {
  const [newCoins, setNewCoins] = useState<NewCoin[]>([]);
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<TrendingCoin | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [newData, trendingData] = await Promise.allSettled([
        fetchNewCoins(),
        fetchTrending(),
      ]);
      if (newData.status === "fulfilled") setNewCoins(newData.value.filter((c) => c.marketCap !== null));
      if (trendingData.status === "fulfilled") setTrendingCoins(trendingData.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const allCoins = useMemo(() => {
    const map = new Map<string, TrendingCoin>();
    for (const coin of trendingCoins) {
      map.set(`${coin.chain}:${coin.pairAddress}`, coin);
    }
    for (const coin of newCoins) {
      const key = `${coin.chain}:${coin.pairAddress}`;
      if (!map.has(key)) {
        map.set(key, newCoinToTrending(coin));
      }
    }
    return Array.from(map.values()).sort((a, b) => b.trendScore - a.trendScore);
  }, [newCoins, trendingCoins]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([syncCoins(), syncTrending()]);
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  const handleCoinSelect = (coin: TrendingCoin) => {
    setSelectedCoin(coin);
  };

  if (selectedCoin) {
    return (
      <CoinProfile
        coin={selectedCoin}
        onBack={() => setSelectedCoin(null)}
      />
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Coins</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{allCoins.length} coins</span>
          <button onClick={handleSync} disabled={syncing} className="btn-primary text-sm">
            {syncing ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2" style={{ height: "400px" }}>
          <TradingViewChart />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">New Coins</div>
              <div className="text-xl font-bold text-gray-200">{newCoins.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Trending</div>
              <div className="text-xl font-bold text-gray-200">{trendingCoins.length}</div>
            </div>
          </div>
        </div>
      </div>

      <TrendingTable coins={allCoins} loading={loading} onCoinSelect={handleCoinSelect} />
    </div>
  );
}
