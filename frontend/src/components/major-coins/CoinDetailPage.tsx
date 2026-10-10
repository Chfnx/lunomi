import type { MajorCoinAnalysis } from "@/types";
import ATMSimulation from "./ATMSimulation";

interface CoinDetailPageProps {
  coin: MajorCoinAnalysis;
  onBack: () => void;
}

const signalConfig: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: "Strong Buy", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  buy: { label: "Buy", color: "text-green-400", bg: "bg-green-500/15" },
  neutral: { label: "Neutral", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  sell: { label: "Sell", color: "text-orange-400", bg: "bg-orange-500/15" },
  strong_sell: { label: "Strong Sell", color: "text-red-400", bg: "bg-red-500/15" },
};

function formatUsd(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

export default function CoinDetailPage({ coin, onBack }: CoinDetailPageProps) {
  const sig = signalConfig[coin.signal];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span>&larr;</span> Back to analysis
      </button>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{coin.name}</h1>
            <span className="text-sm text-gray-500">{coin.symbol}</span>
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${sig.bg} ${sig.color}`}>
            {sig.label}
          </span>
        </div>

        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-3xl font-bold font-mono">{formatUsd(coin.price)}</span>
          <span className={`text-lg font-semibold ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-500">24h</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-surface-700/50 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase">RSI(14)</div>
            <div className={`text-xl font-bold ${coin.indicators.rsi < 30 ? "text-emerald-400" : coin.indicators.rsi > 70 ? "text-red-400" : "text-gray-300"}`}>
              {coin.indicators.rsi.toFixed(1)}
            </div>
          </div>
          <div className="bg-surface-700/50 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase">MACD</div>
            <div className={`text-xl font-bold ${coin.indicators.macd.histogram > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {coin.indicators.macd.histogram > 0 ? "Bullish" : "Bearish"}
            </div>
          </div>
          <div className="bg-surface-700/50 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase">Signal Score</div>
            <div className={`text-xl font-bold ${coin.signalScore > 0 ? "text-emerald-400" : coin.signalScore < 0 ? "text-red-400" : "text-gray-300"}`}>
              {coin.signalScore > 0 ? "+" : ""}{coin.signalScore}
            </div>
          </div>
        </div>

        {coin.consolidation.isConsolidating && (
          <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-cyan-400">Sideways movement</span>
              <span className="text-xs text-gray-500">{coin.consolidation.duration}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{coin.consolidation.explanation}</p>
          </div>
        )}

        <div className="mb-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Prediction</div>
          <p className="text-sm text-gray-300 leading-relaxed">{coin.prediction}</p>
        </div>
      </div>

      <ATMSimulation coin={coin} />

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Technical Analysis</h3>
        <ul className="space-y-1.5">
          {coin.analysis.map((line, i) => (
            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-gray-600 mt-0.5">-</span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Key Levels</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-2">Support</div>
            <div className="space-y-1">
              {coin.indicators.support.length > 0 ? (
                coin.indicators.support.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-mono">{formatUsd(s)}</span>
                    <span className="text-gray-600">{((coin.price - s) / coin.price * 100).toFixed(1)}% below</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-600">No support levels detected</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-2">Resistance</div>
            <div className="space-y-1">
              {coin.indicators.resistance.length > 0 ? (
                coin.indicators.resistance.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-red-400 font-mono">{formatUsd(r)}</span>
                    <span className="text-gray-600">{((r - coin.price) / coin.price * 100).toFixed(1)}% above</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-600">No resistance levels detected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Chart Lines</h3>
        <div className="flex flex-wrap gap-2">
          {coin.chartLines.map((line, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded bg-surface-700 flex items-center gap-1.5"
            >
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: line.color }} />
              <span className="text-gray-400">{line.label}</span>
              <span className="text-gray-500 font-mono">{formatUsd(line.value)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 pb-4">
        Last updated: {new Date(coin.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
