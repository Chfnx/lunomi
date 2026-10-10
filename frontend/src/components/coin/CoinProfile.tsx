import { useEffect, useRef } from "react";
import { formatUsd, formatPercent, getPercentColor, detectReversalPattern } from "@/utils/format";
import TrendScoreBadge from "@/components/common/TrendScoreBadge";
import ScoreBreakdown from "@/components/charts/ScoreBreakdown";
import type { TrendingCoin } from "@/types";

interface CoinProfileProps {
  coin: TrendingCoin;
  onBack: () => void;
}

function getTradingViewSymbol(symbol: string): string {
  return `${symbol.toUpperCase()}USDT`;
}

function CoinChart({ symbol, chain, pairAddress }: { symbol: string; chain: string; pairAddress: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = getTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      studies: ["STD;EMA", "STD;Fibonacci_Retracement"],
      overrides: {
        "mainSeriesStyle.candleStyle.upColor": "#22c55e",
        "mainSeriesStyle.candleStyle.downColor": "#ef4444",
        "mainSeriesStyle.candleStyle.borderUpColor": "#22c55e",
        "mainSeriesStyle.candleStyle.borderDownColor": "#ef4444",
      },
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">{symbol} Chart</h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">via TradingView</span>
          <a
            href={`https://dexscreener.com/${chain}/${pairAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300"
          >
            DexScreener
          </a>
        </div>
      </div>
      <div className="relative flex-1 w-full">
        <div ref={containerRef} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
          <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-700/50 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-mono font-semibold text-gray-200">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function CoinProfile({ coin, onBack }: CoinProfileProps) {
  const reversal = detectReversalPattern(coin);

  const kucoinUrl = `https://www.kucoin.com/price/${coin.symbol}`;
  const bitgetUrl = `https://www.bitget.com/price/${coin.symbol}`;
  const swapUrl = `https://web3.bitget.com/en/swap/${coin.chain}/${coin.pairAddress}`;
  const dexUrl = `https://dexscreener.com/${coin.chain}/${coin.pairAddress}`;

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-100">{coin.symbol}</h1>
          <span className="text-sm text-gray-500">{coin.name}</span>
          <span className="text-xs bg-surface-700 px-2 py-0.5 rounded text-gray-400 uppercase">
            {coin.chain}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {reversal && (
            <span className={`text-xs px-2 py-1 rounded ${reversal.color}`}>
              {reversal.label}
            </span>
          )}
          <TrendScoreBadge score={coin.trendScore} size="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2" style={{ height: "500px" }}>
          <CoinChart
            symbol={coin.symbol}
            chain={coin.chain}
            pairAddress={coin.pairAddress}
          />
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Price</h3>
            <div className="text-2xl font-mono font-bold text-gray-100 mb-3">
              {formatUsd(coin.priceUsd)}
            </div>
            <div className="grid grid-cols-3 gap-2">
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
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Market Data</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Volume 24h" value={formatUsd(coin.volume24h)} />
              <MetricCard label="Liquidity" value={formatUsd(coin.liquidity)} />
              <MetricCard label="Market Cap" value={formatUsd(coin.marketCap)} />
              <MetricCard
                label="Vol/Liq Ratio"
                value={
                  coin.volume24h && coin.liquidity
                    ? `${(coin.volume24h / coin.liquidity).toFixed(2)}x`
                    : "-"
                }
                sub="Higher = more active"
              />
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
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                >
                  <span>KuCoin</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {coin.exchangeListings.bitget && (
                <a
                  href={bitgetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
                >
                  <span>Bitget</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <a
                href={swapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm font-medium"
              >
                <span>Swap</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href={dexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-gray-400 hover:bg-surface-600 transition-colors text-sm font-medium"
              >
                <span>DexScreener</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScoreBreakdown coin={coin} />

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Social Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Mentions" value={coin.socialMetrics.mentions.toString()} />
            <MetricCard label="Sentiment" value={`${(coin.socialMetrics.sentiment * 100).toFixed(0)}%`} />
            <MetricCard label="Likes" value={coin.socialMetrics.likes.toString()} />
            <MetricCard label="Retweets" value={coin.socialMetrics.retweets.toString()} />
          </div>

          {reversal && (
            <div className="mt-4 pt-3 border-t border-surface-700">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Reversal Signal</h4>
              <div className={`p-3 rounded-lg ${reversal.color}`}>
                <div className="font-medium text-sm mb-1">{reversal.label}</div>
                <div className="text-xs opacity-80">
                  {reversal.pattern === "classic" &&
                    "Price dropped >5% in 24h and >2% in 1h, but is now bouncing in the last 5 minutes. This could be a bottom formation."}
                  {reversal.pattern === "slight_dip" &&
                    "Price dipped >2% in the last hour but is showing early recovery signs in the last 5 minutes. Watch for confirmation."}
                  {reversal.pattern === "strong_dip" &&
                    "Price is down >5% in 24h and still declining in the last 5 minutes. No recovery signal yet — wait for a bounce."}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="opacity-60">5m:</span>{" "}
                    <span className="font-mono">{formatPercent(coin.priceChange5m)}</span>
                  </div>
                  <div>
                    <span className="opacity-60">1h:</span>{" "}
                    <span className="font-mono">{formatPercent(coin.priceChange1h)}</span>
                  </div>
                  <div>
                    <span className="opacity-60">24h:</span>{" "}
                    <span className="font-mono">{formatPercent(coin.priceChange24h)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
