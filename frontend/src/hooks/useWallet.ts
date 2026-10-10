import { useState, useEffect, useCallback } from "react";
import { connectMetaMask, getBalance, type WalletState } from "@/services/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await connectMetaMask();
      setWallet(state);
      localStorage.setItem("wallet_connected", "true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      balance: null,
      chainId: null,
      connected: false,
    });
    localStorage.removeItem("wallet_connected");
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet.address) return;
    try {
      const balance = await getBalance(wallet.address);
      setWallet((prev) => ({ ...prev, balance }));
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }
  }, [wallet.address]);

  useEffect(() => {
    const wasConnected = localStorage.getItem("wallet_connected") === "true";
    if (wasConnected && (window as any).ethereum) {
      connect().catch(() => {
        localStorage.removeItem("wallet_connected");
      });
    }
  }, [connect]);

  useEffect(() => {
    if (!(window as any).ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        connect().catch(console.error);
      }
    };

    const handleChainChanged = () => {
      connect().catch(console.error);
    };

    (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
    (window as any).ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if ((window as any).ethereum.removeListener) {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [connect, disconnect]);

  return {
    wallet,
    loading,
    error,
    connect,
    disconnect,
    refreshBalance,
  };
}
