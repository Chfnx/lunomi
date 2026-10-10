import { ethers } from "ethers";

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connected: boolean;
}

export async function connectMetaMask(): Promise<WalletState> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);
  const network = await provider.getNetwork();

  return {
    address,
    balance: ethers.formatEther(balance),
    chainId: Number(network.chainId),
    connected: true,
  };
}

export async function getBalance(address: string): Promise<string> {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export async function disconnect(): Promise<void> {
  // MetaMask doesn't have a true disconnect, we just clear our state
  // The user can revoke permissions in MetaMask settings
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
