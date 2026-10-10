import { useState, useEffect } from "react";
import { fetchMajorCoinsAnalysis } from "@/services/api";
import type { MajorCoinAnalysis } from "@/types";

const signalConfig: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: "Strong Buy", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  buy: { label: "Buy", color: "text-green-400", bg: "bg-green-500/15" },
  neutral: { label: "Neutral", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  sell: { label: "Sell", color: "text-orange-400", bg: "bg-orange-500/15" },
  strong_sell: { label: "Strong Sell", color: "text-red-400", bg: "bg-red-500/15" },
};

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

interface CoinCardProps {
  coin: MajorCoinAnalysis;
  onSelect: (coin: MajorCoinAnalysis) => void;
}

function CoinCard({ coin, onSelect }: CoinCardProps) {
  const sig = signalConfig[coin.signal];

  return (
    <div
      className="card cursor-pointer hover:border-blue-500/30 transition-colors"
      onClick={() => onSelect(coin)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">{coin.name}</h3>
          <span className="text-xs text-gray-500">{coin.symbol}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sig.bg} ${sig.color}`}>
          {sig.label}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-2xl font-bold">{formatPrice(coin.price)}</span>
        <span className={`text-sm font-medium ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
        </span>
      </div>

      {coin.consolidation.isConsolidating && (
        <div className="mb-3 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-cyan-400">Sideways movement</span>
            <span className="text-xs text-gray-500">{coin.consolidation.duration}</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{coin.consolidation.explanation}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">RSI(14)</div>
          <div className={`text-sm font-bold ${coin.indicators.rsi < 30 ? "text-emerald-400" : coin.indicators.rsi > 70 ? "text-red-400" : "text-gray-300"}`}>
            {coin.indicators.rsi.toFixed(1)}
          </div>
        </div>
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">MACD</div>
          <div className={`text-sm font-bold ${coin.indicators.macd.histogram > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {coin.indicators.macd.histogram > 0 ? "Bullish" : "Bearish"}
          </div>
        </div>
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">Trend</div>
          <div className={`text-sm font-bold ${coin.price > coin.indicators.ema200 ? "text-emerald-400" : "text-red-400"}`}>
            {coin.price > coin.indicators.ema200 ? "Bullish" : "Bearish"}
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-[10px] text-gray-500 uppercase mb-1">Prediction</div>
        <p className="text-xs text-gray-300 leading-relaxed">{coin.prediction}</p>
      </div>

      <div className="text-xs text-blue-400">Click for details & ATM simulation &rarr;</div>
    </div>
  );
}

interface MajorCoinsPanelProps {
  onCoinSelect?: (coin: MajorCoinAnalysis) => void;
}

export default function MajorCoinsPanel({ onCoinSelect }: MajorCoinsPanelProps) {
  const [coins, setCoins] = useState<MajorCoinAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMajorCoinsAnalysis()
      .then(setCoins)
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchMajorCoinsAnalysis().then(setCoins).catch(() => {});
    }, 300_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card animate-pulse h-48" />
        <div className="card animate-pulse h-48" />
      </div>
    );
  }

  if (coins.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Market Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coins.map((coin) => (
          <CoinCard
            key={coin.symbol}
            coin={coin}
            onSelect={(c) => onCoinSelect?.(c)}
          />
        ))}
      </div>
    </div>
  );
}
