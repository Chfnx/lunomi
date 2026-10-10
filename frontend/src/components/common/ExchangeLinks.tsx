import { useState, useEffect } from "react";

interface ExchangeLinksProps {
  symbol: string;
  chain: string;
  pairAddress: string;
}

const linkCache = new Map<string, boolean>();

async function checkLink(url: string): Promise<boolean> {
  if (linkCache.has(url)) return linkCache.get(url)!;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const exists = response.ok;
    linkCache.set(url, exists);
    return exists;
  } catch {
    linkCache.set(url, false);
    return false;
  }
}

export default function ExchangeLinks({ symbol, chain, pairAddress }: ExchangeLinksProps) {
  const [kucoinExists, setKucoinExists] = useState<boolean | null>(null);
  const [bitgetExists, setBitgetExists] = useState<boolean | null>(null);

  const kucoinUrl = `https://www.kucoin.com/price/?keyword=${symbol}`;
  const bitgetUrl = `https://www.bitget.com/price/${symbol}`;
  const swapUrl = `https://web3.bitget.com/en/swap/${chain}/${pairAddress}`;

  useEffect(() => {
    checkLink(kucoinUrl).then(setKucoinExists);
    checkLink(bitgetUrl).then(setBitgetExists);
  }, [symbol]);

  const linkClass =
    "text-xs px-1.5 py-0.5 rounded bg-surface-700 text-gray-400 hover:text-brand-400 hover:bg-surface-600 transition-colors";

  return (
    <div className="flex items-center justify-center gap-1.5">
      {kucoinExists === null ? (
        <div className="w-12 h-5 bg-surface-700 rounded animate-pulse" />
      ) : kucoinExists ? (
        <a
          href={kucoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
          title="Search on KuCoin"
        >
          KuCoin
        </a>
      ) : null}

      {bitgetExists === null ? (
        <div className="w-12 h-5 bg-surface-700 rounded animate-pulse" />
      ) : bitgetExists ? (
        <a
          href={bitgetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
          title="Search on Bitget"
        >
          Bitget
        </a>
      ) : null}

      <a
        href={swapUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={linkClass}
        title="Swap on Bitget Wallet"
      >
        Swap
      </a>
    </div>
  );
}
