import axios from "axios";
import { cacheGet, cacheSet } from "../../shared/cache/redis.js";

interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi: number;
  ema20: number;
  ema50: number;
  ema200: number;
  macd: { value: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number; width: number };
  support: number[];
  resistance: number[];
  currentPrice: number;
}

interface ConsolidationAnalysis {
  isConsolidating: boolean;
  rangeLow: number;
  rangeHigh: number;
  rangeWidth: number;
  duration: string;
  explanation: string;
}

interface AnalysisResult {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  indicators: TechnicalIndicators;
  consolidation: ConsolidationAnalysis;
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  signalScore: number;
  prediction: string;
  analysis: string[];
  chartLines: { label: string; value: number; color: string }[];
  timestamp: string;
}

const COINGECKO_API = "https://api.coingecko.com/api/v3";

async function fetchOHLCV(coinId: string, days: number): Promise<OHLCV[]> {
  const { data } = await axios.get(`${COINGECKO_API}/coins/${coinId}/ohlc`, {
    params: { vs_currency: "usd", days },
    timeout: 15000,
  });

  return data.map(([time, open, high, low, close]: [number, number, number, number, number]) => ({
    time,
    open,
    high,
    low,
    close,
    volume: 0,
  }));
}

function calcEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calcRSI(prices: number[], period = 14): number {
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine.slice(25), 9);
  const macdVal = macdLine[macdLine.length - 1];
  const signalVal = signalLine[signalLine.length - 1];
  return { value: macdVal, signal: signalVal, histogram: macdVal - signalVal };
}

function calcBollinger(prices: number[], period = 20, mult = 2): { upper: number; middle: number; lower: number; width: number } {
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + (p - middle) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const upper = middle + mult * std;
  const lower = middle - mult * std;
  return { upper, middle, lower, width: (upper - lower) / middle * 100 };
}

function findSupportResistance(candles: OHLCV[], lookback = 5): { support: number[]; resistance: number[] } {
  const pivots: { price: number; type: "high" | "low" }[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const slice = candles.slice(i - lookback, i + lookback + 1);
    const lows = slice.map((c) => c.low);
    const highs = slice.map((c) => c.high);

    if (candles[i].low === Math.min(...lows)) {
      pivots.push({ price: candles[i].low, type: "low" });
    }
    if (candles[i].high === Math.max(...highs)) {
      pivots.push({ price: candles[i].high, type: "high" });
    }
  }

  const clustered = clusterLevels(pivots, 0.015);
  const currentPrice = candles[candles.length - 1].close;

  const support = clustered
    .filter((l) => l.price < currentPrice)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map((l) => l.price);

  const resistance = clustered
    .filter((l) => l.price > currentPrice)
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map((l) => l.price);

  return { support, resistance };
}

function clusterLevels(pivots: { price: number; type: "high" | "low" }[], threshold: number): { price: number; touches: number }[] {
  const levels: { price: number; touches: number }[] = [];

  for (const p of pivots) {
    const existing = levels.find((l) => Math.abs(l.price - p.price) / l.price < threshold);
    if (existing) {
      existing.price = (existing.price * existing.touches + p.price) / (existing.touches + 1);
      existing.touches++;
    } else {
      levels.push({ price: p.price, touches: 1 });
    }
  }

  return levels.filter((l) => l.touches >= 2).sort((a, b) => b.touches - a.touches);
}

function detectConsolidation(candles: OHLCV[], coinName: string): ConsolidationAnalysis {
  const recent = candles.slice(-48);
  const closes = recent.map((c) => c.close);
  const rangeHigh = Math.max(...recent.map((c) => c.high));
  const rangeLow = Math.min(...recent.map((c) => c.low));
  const rangeWidth = ((rangeHigh - rangeLow) / rangeLow) * 100;

  const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance = closes.reduce((sum, c) => sum + (c - avg) ** 2, 0) / closes.length;
  const cv = (Math.sqrt(variance) / avg) * 100;

  const isConsolidating = rangeWidth < 5 && cv < 2;

  let duration = "~2 dagen";
  if (rangeWidth < 3) duration = "~3-5 dagen";
  if (rangeWidth < 2) duration = "~1 week+";

  let explanation = "";
  if (isConsolidating) {
    explanation =
      `${coinName} beweegt zijwaarts in een nauwe range. Dit betekent dat kopers en verkopers in evenwicht zijn. ` +
      "Een uitbraak (breakout) boven de bovenkant of onder de onderkant volgt vaak na zo'n consolidatie. " +
      "Hoe langer de consolidatie, hoe krachtiger de daaropvolgende beweging.";
  } else {
    explanation =
      "Geen duidelijke consolidatie gedetecteerd. De prijs beweegt met voldoende volatiliteit " +
      "om een trendmatige beweging aan te geven.";
  }

  return { isConsolidating, rangeLow, rangeHigh, rangeWidth, duration, explanation };
}

function generateSignal(indicators: TechnicalIndicators, consolidation: ConsolidationAnalysis): { signal: AnalysisResult["signal"]; score: number } {
  let score = 0;
  const { rsi, ema20, ema50, ema200, macd, bollinger } = indicators;
  const price = indicators.currentPrice;

  if (rsi < 30) score += 25;
  else if (rsi < 40) score += 15;
  else if (rsi < 50) score += 5;
  else if (rsi > 70) score -= 25;
  else if (rsi > 60) score -= 10;

  if (price > ema200) score += 15;
  else score -= 15;

  if (price > ema50) score += 10;
  else score -= 10;

  if (ema20 > ema50) score += 10;
  else score -= 5;

  if (macd.histogram > 0 && macd.value > macd.signal) score += 15;
  else if (macd.histogram < 0 && macd.value < macd.signal) score -= 15;

  if (price <= bollinger.lower * 1.01) score += 15;
  else if (price >= bollinger.upper * 0.99) score -= 15;

  if (consolidation.isConsolidating && price < (consolidation.rangeLow + consolidation.rangeHigh) / 2) {
    score += 10;
  }

  score = Math.max(-100, Math.min(100, score));

  let signal: AnalysisResult["signal"];
  if (score >= 50) signal = "strong_buy";
  else if (score >= 20) signal = "buy";
  else if (score <= -50) signal = "strong_sell";
  else if (score <= -20) signal = "sell";
  else signal = "neutral";

  return { signal, score };
}

function generatePrediction(indicators: TechnicalIndicators, consolidation: ConsolidationAnalysis): string {
  const { rsi, macd, ema200, currentPrice } = indicators;
  const parts: string[] = [];

  if (consolidation.isConsolidating) {
    const breakoutDirection = currentPrice > (consolidation.rangeLow + consolidation.rangeHigh) / 2 ? "omhoog" : "omlaag";
    parts.push(`Consolidatie actief (${consolidation.rangeWidth.toFixed(1)}% range). Kans op breakout ${breakoutDirection}.`);
  }

  if (rsi < 35) {
    parts.push("RSI in oversold zone — historisch gezien volgt vaak een bounce binnen 3-7 dagen.");
  } else if (rsi > 65) {
    parts.push("RSI in overbought zone — kans op correctie of pullback is verhoogd.");
  }

  if (macd.histogram > 0 && macd.value > macd.signal) {
    parts.push("MACD bullish crossover — momentum draait positief.");
  } else if (macd.histogram < 0 && macd.value < macd.signal) {
    parts.push("MACD bearish — momentum is negatief.");
  }

  if (currentPrice > ema200) {
    parts.push("Prijs boven EMA200 — langetermijntrend is bullish.");
  } else {
    parts.push("Prijs onder EMA200 — langetermijntrend is bearish.");
  }

  if (indicators.bollinger.width < 3) {
    parts.push("Bollinger Bands zeer smal — grote beweging staat te wachten.");
  }

  return parts.join(" ");
}

function generateAnalysis(indicators: TechnicalIndicators, consolidation: ConsolidationAnalysis, signal: string): string[] {
  const lines: string[] = [];
  const { rsi, ema20, ema50, ema200, macd, bollinger } = indicators;
  const price = indicators.currentPrice;

  lines.push(`RSI(14): ${rsi.toFixed(1)} — ${rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutraal"}`);
  lines.push(`EMA20: $${ema20.toFixed(0)} | EMA50: $${ema50.toFixed(0)} | EMA200: $${ema200.toFixed(0)}`);

  if (ema20 > ema50 && ema50 > ema200) {
    lines.push("EMA-stapeling bullish (20 > 50 > 200) — sterke opwaartse trendstructuur.");
  } else if (ema20 < ema50 && ema50 < ema200) {
    lines.push("EMA-stapeling bearish (20 < 50 < 200) — afwaartse trendstructuur.");
  }

  lines.push(`MACD: ${macd.histogram > 0 ? "bullish" : "bearish"} (histogram: ${macd.histogram.toFixed(2)})`);
  lines.push(`Bollinger: $${bollinger.lower.toFixed(0)} — $${bollinger.upper.toFixed(0)} (breedte: ${bollinger.width.toFixed(1)}%)`);

  if (consolidation.isConsolidating) {
    lines.push(`Consolidatie: $${consolidation.rangeLow.toFixed(0)} — $${consolidation.rangeHigh.toFixed(0)} (${consolidation.duration})`);
  }

  if (indicators.support.length > 0) {
    lines.push(`Support: ${indicators.support.map((s) => `$${s.toFixed(0)}`).join(", ")}`);
  }
  if (indicators.resistance.length > 0) {
    lines.push(`Weerstand: ${indicators.resistance.map((r) => `$${r.toFixed(0)}`).join(", ")}`);
  }

  if (signal === "strong_buy" || signal === "buy") {
    lines.push("Advies: gunstig inkoopmoment — technische indicaten wijzen op instap.");
  } else if (signal === "neutral") {
    lines.push("Advies: geen duidelijk inkoopmoment — wacht op meer bevestiging.");
  } else {
    lines.push("Advies: geen goed inkoopmoment — indicaten wijzen op te hoog risico.");
  }

  return lines;
}

function buildChartLines(indicators: TechnicalIndicators, consolidation: ConsolidationAnalysis): { label: string; value: number; color: string }[] {
  const lines: { label: string; value: number; color: string }[] = [];

  lines.push({ label: "EMA 20", value: indicators.ema20, color: "#f59e0b" });
  lines.push({ label: "EMA 50", value: indicators.ema50, color: "#3b82f6" });
  lines.push({ label: "EMA 200", value: indicators.ema200, color: "#ef4444" });
  lines.push({ label: "BB Upper", value: indicators.bollinger.upper, color: "#8b5cf6" });
  lines.push({ label: "BB Middle", value: indicators.bollinger.middle, color: "#6b7280" });
  lines.push({ label: "BB Lower", value: indicators.bollinger.lower, color: "#8b5cf6" });

  for (const s of indicators.support) {
    lines.push({ label: "Support", value: s, color: "#10b981" });
  }
  for (const r of indicators.resistance) {
    lines.push({ label: "Resistance", value: r, color: "#f43f5e" });
  }

  if (consolidation.isConsolidating) {
    lines.push({ label: "Range High", value: consolidation.rangeHigh, color: "#06b6d4" });
    lines.push({ label: "Range Low", value: consolidation.rangeLow, color: "#06b6d4" });
  }

  return lines;
}

async function analyzeCoin(coinId: string, symbol: string, name: string): Promise<AnalysisResult> {
  const candles = await fetchOHLCV(coinId, 365);
  const closes = candles.map((c) => c.close);
  const currentPrice = closes[candles.length - 1];

  const prevDayClose = closes[candles.length - 2] ?? currentPrice;
  const change24h = ((currentPrice - prevDayClose) / prevDayClose) * 100;

  const ema20Arr = calcEMA(closes, 20);
  const ema50Arr = calcEMA(closes, 50);
  const ema200Arr = calcEMA(closes, 200);

  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes);
  const bollinger = calcBollinger(closes);
  const { support, resistance } = findSupportResistance(candles);
  const consolidation = detectConsolidation(candles, name);

  const indicators: TechnicalIndicators = {
    rsi,
    ema20: ema20Arr[ema20Arr.length - 1],
    ema50: ema50Arr[ema50Arr.length - 1],
    ema200: ema200Arr[ema200Arr.length - 1],
    macd,
    bollinger,
    support,
    resistance,
    currentPrice,
  };

  const { signal, score } = generateSignal(indicators, consolidation);
  const prediction = generatePrediction(indicators, consolidation);
  const analysis = generateAnalysis(indicators, consolidation, signal);
  const chartLines = buildChartLines(indicators, consolidation);

  return {
    symbol,
    name,
    price: currentPrice,
    change24h,
    indicators,
    consolidation,
    signal,
    signalScore: score,
    prediction,
    analysis,
    chartLines,
    timestamp: new Date().toISOString(),
  };
}

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
];

export async function getMajorCoinsAnalysis(): Promise<AnalysisResult[]> {
  const cacheKey = "major-coins:analysis";
  const cached = await cacheGet<AnalysisResult[]>(cacheKey);
  if (cached) return cached;

  const results = await Promise.all(COINS.map((c) => analyzeCoin(c.id, c.symbol, c.name)));

  await cacheSet(cacheKey, results, 300);
  return results;
}

export type { AnalysisResult, TechnicalIndicators, ConsolidationAnalysis };
