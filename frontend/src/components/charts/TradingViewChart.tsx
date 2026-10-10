import { useEffect, useRef, memo } from "react";

interface TradingViewChartProps {
  symbol?: string;
  chain?: string;
  pairAddress?: string;
}

function TradingViewChart({ symbol = "BINANCE:BTCUSDT", chain, pairAddress }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tvSymbol = chain && pairAddress
    ? undefined
    : symbol;

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
      studies: [
        "STD;EMA",
        "STD;Relative_Strength_Index",
        "STD;MACD",
        "STD;Bollinger_Bands",
        "STD;Fibonacci_Retracement",
      ],
      overrides: {
        "mainSeriesStyle.candleStyle.upColor": "#22c55e",
        "mainSeriesStyle.candleStyle.downColor": "#ef4444",
        "mainSeriesStyle.candleStyle.borderUpColor": "#22c55e",
        "mainSeriesStyle.candleStyle.borderDownColor": "#ef4444",
      },
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol, chain, pairAddress]);

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          {chain && pairAddress
            ? `${symbol || "Token"} Chart`
            : symbol}
        </h2>
        {chain && (
          <span className="text-xs bg-surface-700 px-2 py-0.5 rounded text-gray-400 uppercase">
            {chain}
          </span>
        )}
      </div>

      <div className="relative w-full" style={{ height: "calc(100% - 3rem)" }}>
        <div ref={containerRef} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
          <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}

export default memo(TradingViewChart);
