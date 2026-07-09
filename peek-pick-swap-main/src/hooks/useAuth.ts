import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, getToken, setToken, clearToken } from "@/lib/api";
import type { MeResponse, User } from "@/lib/types";

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => api.get<MeResponse>("/api/me"),
    enabled: !!getToken(),
    retry: false,
  });
}

interface AuthResponse {
  token: string;
  user: User;
}

export function useAuthActions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function login(email: string, password: string) {
    const data = await api.post<AuthResponse>("/api/auth/login", { email, password });
    setToken(data.token);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    return data;
  }

  async function signup(name: string, email: string, password: string) {
    return api.post<{ needsVerification: boolean }>("/api/auth/signup", { name, email, password });
  }

  async function verify(email: string, code: string) {
    const data = await api.post<AuthResponse>("/api/auth/verify", { email, code });
    setToken(data.token);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    return data;
  }

  function logout() {
    clearToken();
    queryClient.clear();
    navigate("/login");
  }

  return { login, signup, verify, logout };
}
