export function formatUsd(value: number | null): string {
  if (value === null || value === undefined) return "-";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.001) return `$${value.toFixed(4)}`;
  return `$${value.toExponential(2)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("en-US");
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400 bg-green-400/10";
  if (score >= 60) return "text-emerald-400 bg-emerald-400/10";
  if (score >= 40) return "text-yellow-400 bg-yellow-400/10";
  if (score >= 20) return "text-orange-400 bg-orange-400/10";
  return "text-red-400 bg-red-400/10";
}

export function getPercentColor(value: number | null): string {
  if (value === null) return "text-gray-400";
  return value >= 0 ? "text-green-400" : "text-red-400";
}

export type ReversalPattern =
  | "classic"
  | "slight_dip"
  | "strong_dip"
  | null;

export function detectReversalPattern(coin: {
  priceChange5m: number | null;
  priceChange1h: number | null;
  priceChange24h: number | null;
}): { pattern: ReversalPattern; label: string; color: string } | null {
  const { priceChange5m, priceChange1h, priceChange24h } = coin;
  if (priceChange5m === null || priceChange1h === null) return null;

  if (
    priceChange24h !== null &&
    priceChange24h < -5 &&
    priceChange1h < -2 &&
    priceChange5m > 0
  ) {
    return {
      pattern: "classic",
      label: "Classic Reversal",
      color: "bg-green-500/20 text-green-400 border border-green-500/30",
    };
  }

  if (priceChange1h < -2 && priceChange5m > 0) {
    return {
      pattern: "slight_dip",
      label: "Slight Dip",
      color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    };
  }

  if (
    priceChange24h !== null &&
    priceChange24h < -5 &&
    priceChange5m < -1
  ) {
    return {
      pattern: "strong_dip",
      label: "Strong Dip",
      color: "bg-red-500/20 text-red-400 border border-red-500/30",
    };
  }

  return null;
}
