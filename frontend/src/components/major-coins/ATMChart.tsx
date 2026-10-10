import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries, type IChartApi, ColorType, CrosshairMode } from "lightweight-charts";
import type { Candle } from "@/services/api";
import type { MajorCoinAnalysis } from "@/types";

interface ATMChartProps {
  coin: MajorCoinAnalysis;
  candles: Candle[];
}

const GRID_COLORS = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"];
const TP_COLOR = "#06b6d4";
const CURRENT_PRICE_COLOR = "#f59e0b";

function calcGridLevels(price: number, isBTC: boolean) {
  const spacing = isBTC ? 0.025 : 0.03;
  const levels: { price: number; level: number }[] = [];
  for (let i = 0; i < 6; i++) {
    levels.push({ price: price * (1 - spacing * i), level: i + 1 });
  }
  return levels;
}

export default function ATMChart({ coin, candles }: ATMChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    containerRef.current.innerHTML = "";

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const formatted = candles.map((c) => ({
      time: Math.floor(c.time / 1000) as unknown as string,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(formatted as any);

    const ema20 = calcLine(candles.map((c) => c.close), 20);
    const ema50 = calcLine(candles.map((c) => c.close), 50);
    const ema200 = calcLine(candles.map((c) => c.close), 200);

    addLineSeries(chart, candles, ema20, "#f59e0b", "EMA 20");
    addLineSeries(chart, candles, ema50, "#3b82f6", "EMA 50");
    addLineSeries(chart, candles, ema200, "#ef4444", "EMA 200");

    const bb = calcBollinger(candles.map((c) => c.close), 20, 2);
    addLineSeries(chart, candles, bb.upper, "#8b5cf6", "BB Upper");
    addLineSeries(chart, candles, bb.middle, "#6b7280", "BB Middle");
    addLineSeries(chart, candles, bb.lower, "#8b5cf6", "BB Lower");

    const isBTC = coin.symbol === "BTC";
    const gridLevels = calcGridLevels(coin.price, isBTC);

    for (let i = 0; i < gridLevels.length; i++) {
      const { price, level } = gridLevels[i];
      candleSeries.createPriceLine({
        price,
        color: GRID_COLORS[i],
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `L${level}`,
      });
    }

    const avgEntry = gridLevels.reduce((sum, l) => sum + l.price, 0) / gridLevels.length;
    const tpTarget = avgEntry * 1.015;

    candleSeries.createPriceLine({
      price: tpTarget,
      color: TP_COLOR,
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: "TP",
    });

    candleSeries.createPriceLine({
      price: coin.price,
      color: CURRENT_PRICE_COLOR,
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: "Now",
    });

    for (const s of coin.indicators.support) {
      candleSeries.createPriceLine({
        price: s,
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "S",
      });
    }
    for (const r of coin.indicators.resistance) {
      candleSeries.createPriceLine({
        price: r,
        color: "#f43f5e",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "R",
      });
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [coin, candles]);

  return <div ref={containerRef} className="w-full" />;
}

function calcLine(prices: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let ema = prices[0];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      ema = prices[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

function calcBollinger(prices: number[], period: number, mult: number) {
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
      continue;
    }
    const slice = prices.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, p) => sum + (p - avg) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper.push(avg + mult * std);
    middle.push(avg);
    lower.push(avg - mult * std);
  }

  return { upper, middle, lower };
}

function addLineSeries(
  chart: IChartApi,
  candles: Candle[],
  values: (number | null)[],
  color: string,
  _title: string,
) {
  const series = chart.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
  const data = candles
    .map((c, i) => (values[i] !== null ? { time: Math.floor(c.time / 1000) as any, value: values[i]! } : null))
    .filter(Boolean);
  series.setData(data as any);
  return series;
}
