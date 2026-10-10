import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/utils/format";
import { clsx } from "clsx";

export default function WalletButton() {
  const { wallet, loading, connect, disconnect } = useWallet();

  if (wallet.connected && wallet.address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-gray-400">
            {shortenAddress(wallet.address)}
          </span>
          <span className="text-xs font-mono text-brand-400">
            {wallet.balance ? `${parseFloat(wallet.balance).toFixed(4)} ETH` : "-"}
          </span>
        </div>
        <button
          onClick={disconnect}
          className={clsx(
            "btn-secondary text-sm flex items-center gap-2",
            "hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50",
          )}
        >
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="sm:hidden">{shortenAddress(wallet.address)}</span>
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className={clsx(
        "btn-primary text-sm flex items-center gap-2",
        loading && "opacity-50 cursor-not-allowed",
      )}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
