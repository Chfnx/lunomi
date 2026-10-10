import { formatUsd, formatPercent, getPercentColor, detectReversalPattern } from "@/utils/format";
import TrendScoreBadge from "@/components/common/TrendScoreBadge";
import ExchangeLinks from "@/components/common/ExchangeLinks";
import type { TrendingCoin } from "@/types";

interface TrendingTableProps {
  coins: TrendingCoin[];
  loading: boolean;
  onCoinSelect?: (coin: TrendingCoin) => void;
}

export default function TrendingTable({ coins, loading, onCoinSelect }: TrendingTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const hasSignals = coins.some((coin) => detectReversalPattern(coin) !== null);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Trending Coins</h2>
        <span className="text-xs text-gray-500">{coins.length} tracked</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-surface-700">
              <th className="text-center py-2 px-2">Score</th>
              <th className="text-left py-2 px-2">Token</th>
              <th className="text-left py-2 px-2">Chain</th>
              <th className="text-right py-2 px-2">Price</th>
              <th className="text-right py-2 px-2">5m</th>
              <th className="text-right py-2 px-2">1h</th>
              <th className="text-right py-2 px-2">24h</th>
              <th className="text-right py-2 px-2">Volume</th>
              <th className="text-right py-2 px-2">Liquidity</th>
              <th className="text-right py-2 px-2">MCap</th>
              {hasSignals && <th className="text-center py-2 px-2">Signal</th>}
              <th className="text-center py-2 px-2">Exchanges</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, idx) => {
              const reversal = detectReversalPattern(coin);
              return (
                <tr
                  key={`${coin.chain}-${coin.pairAddress}`}
                  className="border-b border-surface-700/50 hover:bg-surface-700/30 cursor-pointer transition-colors"
                  onClick={() => onCoinSelect?.(coin)}
                >
                  <td className="py-2 px-2 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs text-gray-500">#{idx + 1}</span>
                      <TrendScoreBadge score={coin.trendScore} size="sm" />
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div>
                      <div className="font-medium text-gray-200 flex items-center gap-1.5">
                        {coin.symbol}
                        <div className="flex gap-0.5">
                          {coin.exchangeListings.kucoin && (
                            <a
                              href={`https://www.kucoin.com/price/${coin.symbol}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer"
                              title="View on KuCoin"
                            >
                              KC
                            </a>
                          )}
                          {coin.exchangeListings.bitget && (
                            <a
                              href={`https://www.bitget.com/price/${coin.symbol}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                              title="View on Bitget"
                            >
                              BG
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[100px]">
                        {coin.name}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-xs bg-surface-700 px-1.5 py-0.5 rounded text-gray-400 uppercase">
                      {coin.chain}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">
                    {formatUsd(coin.priceUsd)}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${getPercentColor(coin.priceChange5m)}`}>
                    {formatPercent(coin.priceChange5m)}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${getPercentColor(coin.priceChange1h)}`}>
                    {formatPercent(coin.priceChange1h)}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${getPercentColor(coin.priceChange24h)}`}>
                    {formatPercent(coin.priceChange24h)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">
                    {formatUsd(coin.volume24h)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">
                    {formatUsd(coin.liquidity)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-gray-300">
                    {formatUsd(coin.marketCap)}
                  </td>
                  {hasSignals && (
                    <td className="py-2 px-2 text-center">
                      {reversal ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${reversal.color}`}
                          title={
                            reversal.pattern === "classic"
                              ? "Price dropped significantly but is now recovering"
                              : reversal.pattern === "slight_dip"
                                ? "Recent dip with early signs of stabilization"
                                : "Significant drop with no recovery yet"
                          }
                        >
                          {reversal.label}
                        </span>
                      ) : null}
                    </td>
                  )}
                  <td className="py-2 px-2">
                    <ExchangeLinks
                      symbol={coin.symbol}
                      chain={coin.chain}
                      pairAddress={coin.pairAddress}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {coins.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trending data yet. Sync to fetch trending coins.
        </div>
      )}
    </div>
  );
}
