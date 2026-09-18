import { apiRequest, setAccessToken } from "./apiService";
import type { User, UserHistory } from "@/types/user";

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const response = await apiRequest<{ user: User; token: string }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify(input) },
  );
  setAccessToken(response.token);
  return response.user;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<User> {
  const response = await apiRequest<{ user: User; token: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify(input) },
  );
  setAccessToken(response.token);
  return response.user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}
export async function getCurrentUser(): Promise<User> {
  const response = await apiRequest<{ user: User; token: string }>("/auth/me");
  setAccessToken(response.token);
  return response.user;
}
export async function getMyHistory(): Promise<UserHistory> {
  return apiRequest<UserHistory>("/users/me/history");
}
