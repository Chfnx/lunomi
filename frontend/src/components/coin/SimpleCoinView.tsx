import { formatUsd, formatPercent, getPercentColor, detectReversalPattern } from "@/utils/format";
import TrendScoreBadge from "@/components/common/TrendScoreBadge";
import type { TrendingCoin } from "@/types";

interface SimpleCoinViewProps {
  coin: TrendingCoin;
}

export default function SimpleCoinView({ coin }: SimpleCoinViewProps) {
  const reversal = detectReversalPattern(coin);

  const kucoinUrl = `https://www.kucoin.com/price/${coin.symbol}`;
  const bitgetUrl = `https://www.bitget.com/price/${coin.symbol}`;
  const swapUrl = `https://web3.bitget.com/en/swap/${coin.chain}/${coin.pairAddress}`;
  const dexUrl = `https://dexscreener.com/${coin.chain}/${coin.pairAddress}`;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="card text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-gray-100">{coin.symbol}</h1>
          <span className="text-xs bg-surface-700 px-2 py-0.5 rounded text-gray-400 uppercase">
            {coin.chain}
          </span>
        </div>
        <div className="text-4xl font-mono font-bold text-gray-100 mb-4">
          {formatUsd(coin.priceUsd)}
        </div>
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="text-xs text-gray-500">5m</div>
            <div className={`text-sm font-mono font-semibold ${getPercentColor(coin.priceChange5m)}`}>
              {formatPercent(coin.priceChange5m)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">1h</div>
            <div className={`text-sm font-mono font-semibold ${getPercentColor(coin.priceChange1h)}`}>
              {formatPercent(coin.priceChange1h)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">24h</div>
            <div className={`text-sm font-mono font-semibold ${getPercentColor(coin.priceChange24h)}`}>
              {formatPercent(coin.priceChange24h)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Trade</h3>
        <div className="grid grid-cols-2 gap-2">
          {coin.exchangeListings.kucoin && (
            <a
              href={kucoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
            >
              KuCoin
            </a>
          )}
          {coin.exchangeListings.bitget && (
            <a
              href={bitgetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
            >
              Bitget
            </a>
          )}
          <a
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm font-medium"
          >
            Swap
          </a>
          <a
            href={dexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-surface-700 border border-surface-600 text-gray-400 hover:bg-surface-600 transition-colors text-sm font-medium"
          >
            DexScreener
          </a>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Signal</h3>
          <TrendScoreBadge score={coin.trendScore} size="lg" />
        </div>
        {reversal && (
          <div className={`p-3 rounded-lg ${reversal.color}`}>
            <div className="font-medium text-sm mb-1">{reversal.label}</div>
            <div className="text-xs opacity-80">
              {reversal.pattern === "classic" &&
                "Price dropped >5% in 24h and >2% in 1h, but bounced in the last 5 minutes. Possible bottom formation."}
              {reversal.pattern === "slight_dip" &&
                "Price dropped >2% in the last hour but showing early signs of recovery. Wait for confirmation."}
              {reversal.pattern === "strong_dip" &&
                "Price down >5% in 24h and still falling. No recovery signal — wait for a bounce."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
