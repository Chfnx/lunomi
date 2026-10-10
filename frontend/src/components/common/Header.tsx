import WalletButton from "@/components/wallet/WalletButton";

export default function Header() {
  return (
    <header className="bg-surface-800 border-b border-surface-700 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-brand-400 tracking-tight">
          Lunomi
        </h1>
        <WalletButton />
      </div>
    </header>
  );
}
