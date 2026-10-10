import type { MajorCoinAnalysis } from "@/types";

interface ATMSimulationProps {
  coin: MajorCoinAnalysis;
}

interface GridLevel {
  level: number;
  entryPrice: number;
  lotMultiplier: number;
  positionValue: number;
  cumulativeLots: number;
  cumulativeValue: number;
  avgEntry: number;
  distancePercent: number;
  pnlAtTP: number;
}

const MULTIPLIER = 1.3;
const MAX_LEVELS = 6;
const GRID_SPACING_BTC = 0.025;
const GRID_SPACING_ETH = 0.03;
const TP_PIPS_PERCENT = 0.015;

function formatUsd(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

export default function ATMSimulation({ coin }: ATMSimulationProps) {
  const isBTC = coin.symbol === "BTC";
  const spacing = isBTC ? GRID_SPACING_BTC : GRID_SPACING_ETH;
  const currentPrice = coin.price;

  const levels: GridLevel[] = [];
  let cumulativeLots = 0;
  let cumulativeValue = 0;

  for (let i = 0; i < MAX_LEVELS; i++) {
    const entryPrice = currentPrice * (1 - spacing * i);
    const lotMultiplier = Math.pow(MULTIPLIER, i);
    const positionValue = lotMultiplier * entryPrice;
    cumulativeLots += lotMultiplier;
    cumulativeValue += positionValue;
    const avgEntry = cumulativeValue / cumulativeLots;
    const distancePercent = ((entryPrice - currentPrice) / currentPrice) * 100;
    const tpPrice = avgEntry * (1 + TP_PIPS_PERCENT);
    const pnlAtTP = ((tpPrice - entryPrice) / entryPrice) * 100 * lotMultiplier;

    levels.push({
      level: i + 1,
      entryPrice,
      lotMultiplier,
      positionValue,
      cumulativeLots,
      cumulativeValue,
      avgEntry,
      distancePercent,
      pnlAtTP,
    });
  }

  const basketAvg = levels[levels.length - 1].avgEntry;
  const basketTP = basketAvg * (1 + TP_PIPS_PERCENT);
  const totalPnlPercent = ((basketTP - basketAvg) / basketAvg) * 100;
  const maxDDPercent = (spacing * (MAX_LEVELS - 1)) * 100;

  const filledLevels = levels.filter((l) => l.entryPrice <= currentPrice * 1.001);
  const activeLevels = filledLevels.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">ATM Grid Simulation</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Martingale grid based on ATM Crypto V2 strategy (1.3x multiplier, {MAX_LEVELS} levels)
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Active levels</div>
          <div className="text-lg font-bold text-gray-200">{activeLevels} / {MAX_LEVELS}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">Grid spacing</div>
          <div className="text-sm font-bold text-gray-200">{(spacing * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">Basket avg</div>
          <div className="text-sm font-bold text-gray-200">{formatUsd(basketAvg)}</div>
        </div>
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">TP target</div>
          <div className="text-sm font-bold text-emerald-400">{formatUsd(basketTP)}</div>
        </div>
        <div className="bg-surface-700/50 rounded p-2">
          <div className="text-[10px] text-gray-500 uppercase">Max drawdown</div>
          <div className="text-sm font-bold text-red-400">-{maxDDPercent.toFixed(1)}%</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-surface-700">
              <th className="text-left py-2 px-1 font-medium">Level</th>
              <th className="text-right py-2 px-1 font-medium">Entry Price</th>
              <th className="text-right py-2 px-1 font-medium">Lot Mult</th>
              <th className="text-right py-2 px-1 font-medium">Distance</th>
              <th className="text-right py-2 px-1 font-medium">Cum. Lots</th>
              <th className="text-right py-2 px-1 font-medium">Avg Entry</th>
              <th className="text-right py-2 px-1 font-medium">P&L at TP</th>
              <th className="text-center py-2 px-1 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const isActive = level.entryPrice <= currentPrice * 1.001;
              const isNext = !isActive && level.level === activeLevels + 1;

              return (
                <tr
                  key={level.level}
                  className={`border-b border-surface-700/50 ${
                    isActive ? "text-gray-300" : isNext ? "text-yellow-400/70" : "text-gray-600"
                  }`}
                >
                  <td className="py-2 px-1">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                      isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-700 text-gray-500"
                    }`}>
                      {level.level}
                    </span>
                  </td>
                  <td className="text-right py-2 px-1 font-mono">{formatUsd(level.entryPrice)}</td>
                  <td className="text-right py-2 px-1 font-mono">{level.lotMultiplier.toFixed(2)}x</td>
                  <td className="text-right py-2 px-1 font-mono">
                    {level.distancePercent === 0 ? "—" : `${level.distancePercent.toFixed(1)}%`}
                  </td>
                  <td className="text-right py-2 px-1 font-mono">{level.cumulativeLots.toFixed(2)}</td>
                  <td className="text-right py-2 px-1 font-mono">{formatUsd(level.avgEntry)}</td>
                  <td className={`text-right py-2 px-1 font-mono font-semibold ${
                    isActive ? "text-emerald-400" : "text-gray-600"
                  }`}>
                    {isActive ? `+${level.pnlAtTP.toFixed(1)}%` : "—"}
                  </td>
                  <td className="text-center py-2 px-1">
                    {isActive ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Filled</span>
                    ) : isNext ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">Next</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-gray-600">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 p-2 rounded bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-blue-400 font-semibold">Simulation:</span>{" "}
          If all {MAX_LEVELS} levels fill, basket average = {formatUsd(basketAvg)}. TP at {formatUsd(basketTP)} (+{totalPnlPercent.toFixed(1)}%).
          Worst case (all levels filled, no recovery): -{maxDDPercent.toFixed(1)}% from entry.
          Current price: {formatUsd(currentPrice)}.{" "}
          {coin.signal === "strong_buy" || coin.signal === "buy"
            ? "Signal suggests favorable entry conditions for a new grid."
            : coin.signal === "neutral"
            ? "Signal is neutral — wait for clearer conditions before starting a new grid."
            : "Signal suggests elevated risk — not recommended for new grid entry."}
        </p>
      </div>
    </div>
  );
}
