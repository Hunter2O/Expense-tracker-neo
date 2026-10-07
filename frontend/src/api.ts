import type { Category, Summary, Transaction, TransactionInput } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = "Check the values you entered.";
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  categories: () => request<Category[]>("/api/categories"),
  transactions: (month: string) =>
    request<Transaction[]>(`/api/transactions?month=${month}`),
  summary: (month: string) => request<Summary>(`/api/summary?month=${month}`),
  addTransaction: (body: TransactionInput) =>
    request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteTransaction: (id: number) =>
    request<void>(`/api/transactions/${id}`, { method: "DELETE" }),
};
