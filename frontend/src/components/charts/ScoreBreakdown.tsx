import TrendScoreBadge from "@/components/common/TrendScoreBadge";
import type { TrendingCoin } from "@/types";

interface ScoreBreakdownProps {
  coin: TrendingCoin;
}

const labels: { key: keyof TrendingCoin["scoreBreakdown"]; label: string; weight: string }[] = [
  { key: "socialScore", label: "Social", weight: "13%" },
  { key: "volumeScore", label: "Volume", weight: "13%" },
  { key: "exchangeScore", label: "Exchanges", weight: "13%" },
  { key: "liquidityScore", label: "Liquidity", weight: "10%" },
  { key: "marketCapScore", label: "MCap", weight: "10%" },
  { key: "reversalScore", label: "Reversal", weight: "8%" },
  { key: "ageScore", label: "Age", weight: "6%" },
  { key: "whaleScore", label: "Whale", weight: "10%" },
  { key: "holderScore", label: "Holders", weight: "7%" },
  { key: "velocityScore", label: "Velocity", weight: "5%" },
  { key: "developerScore", label: "Dev", weight: "3%" },
  { key: "smartMoneyScore", label: "Smart $", weight: "2%" },
];

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-surface-700 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function ScoreBreakdown({ coin }: ScoreBreakdownProps) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">TrendScore Breakdown</h3>
        <TrendScoreBadge score={coin.trendScore} size="lg" />
      </div>

      <div className="space-y-3">
        {labels.map((item, idx) => (
          <div key={item.key} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-400 flex items-center justify-between">
              <span>{item.label}</span>
              <span className="text-gray-600">{item.weight}</span>
            </div>
            <div className="flex-1">
              <Bar value={coin.scoreBreakdown[item.key]} color={colors[idx]} />
            </div>
            <span className="text-xs font-mono text-gray-400 w-8 text-right">
              {coin.scoreBreakdown[item.key]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-surface-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500">Mentions</div>
            <div className="text-sm font-mono text-gray-300">{coin.socialMetrics.mentions}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Likes</div>
            <div className="text-sm font-mono text-gray-300">{coin.socialMetrics.likes}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Sentiment</div>
            <div className="text-sm font-mono text-gray-300">
              {(coin.socialMetrics.sentiment * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
