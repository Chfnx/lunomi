import axios from "axios";
import type { ApiResponse, NewCoin, TrendingCoin, MajorCoinAnalysis } from "@/types";

const api = axios.create({
  baseURL: "/api",
  timeout: 15_000,
});

export async function fetchNewCoins(): Promise<NewCoin[]> {
  const { data } = await api.get<ApiResponse<NewCoin[]>>("/coins/new");
  return data.data;
}

export async function fetchFreshCoins(): Promise<NewCoin[]> {
  const { data } = await api.get<ApiResponse<NewCoin[]>>("/coins/fresh");
  return data.data;
}

export async function syncCoins(): Promise<number> {
  const { data } = await api.post<{ synced: number }>("/coins/sync");
  return data.synced;
}

export async function fetchTrending(): Promise<TrendingCoin[]> {
  const { data } = await api.get<ApiResponse<TrendingCoin[]>>("/trending");
  return data.data;
}

export async function syncTrending(): Promise<number> {
  const { data } = await api.post<{ synced: number }>("/trending/sync");
  return data.synced;
}

export async function fetchHealth(): Promise<{
  status: string;
  services: { database: string; redis: string };
}> {
  const { data } = await api.get("/health");
  return data;
}

export async function fetchMajorCoinsAnalysis(): Promise<MajorCoinAnalysis[]> {
  const { data } = await api.get<ApiResponse<MajorCoinAnalysis[]>>("/major-coins/analysis");
  return data.data;
}

export default api;
