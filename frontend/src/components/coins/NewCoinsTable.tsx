import { formatUsd, formatPercent, formatNumber, getPercentColor } from "@/utils/format";
import type { NewCoin } from "@/types";
import { shortenAddress } from "@/utils/format";
import ExchangeLinks from "@/components/common/ExchangeLinks";

interface NewCoinsTableProps {
  coins: NewCoin[];
  loading: boolean;
  onCoinSelect?: (coin: NewCoin) => void;
}

export default function NewCoinsTable({ coins, loading, onCoinSelect }: NewCoinsTableProps) {
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

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">New Coins</h2>
        <span className="text-xs text-gray-500">{coins.length} found</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-surface-700">
              <th className="text-left py-2 px-2">Token</th>
              <th className="text-left py-2 px-2">Chain</th>
              <th className="text-right py-2 px-2">Price</th>
              <th className="text-right py-2 px-2">5m</th>
              <th className="text-right py-2 px-2">1h</th>
              <th className="text-right py-2 px-2">Volume</th>
              <th className="text-right py-2 px-2">Liquidity</th>
              <th className="text-right py-2 px-2">MCap</th>
              <th className="text-right py-2 px-2">Age</th>
              <th className="text-right py-2 px-2">Txns</th>
              <th className="text-left py-2 px-2">Address</th>
              <th className="text-center py-2 px-2">Exchanges</th>
            </tr>
          </thead>
          <tbody>
            {coins.slice(0, 50).map((coin) => (
              <tr
                key={coin.id}
                className="border-b border-surface-700/50 hover:bg-surface-700/30 cursor-pointer transition-colors"
                onClick={() => onCoinSelect?.(coin)}
              >
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    {coin.imageUrl && (
                      <img
                        src={coin.imageUrl}
                        alt={coin.symbol}
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-200">{coin.symbol}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[100px]">
                        {coin.name}
                      </div>
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
                <td className="py-2 px-2 text-right font-mono text-gray-300">
                  {formatUsd(coin.volume24h)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-gray-300">
                  {formatUsd(coin.liquidity)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-gray-300">
                  {formatUsd(coin.marketCap)}
                </td>
                <td className="py-2 px-2 text-right">
                  <span className="text-xs text-amber-400 font-medium">{coin.age}</span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-gray-400">
                  {formatNumber(coin.txns24h)}
                </td>
                <td className="py-2 px-2">
                  <span className="text-xs font-mono text-gray-500">
                    {shortenAddress(coin.pairAddress)}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <ExchangeLinks
                    symbol={coin.symbol}
                    chain={coin.chain}
                    pairAddress={coin.pairAddress}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {coins.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No new coins detected yet. Data refreshes automatically.
        </div>
      )}
    </div>
  );
}
