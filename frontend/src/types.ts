export type Kind = "expense" | "income";

export interface Category {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  kind: Kind;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category: Category | null;
}

export interface TransactionInput {
  kind: Kind;
  amount: string;
  description: string;
  date: string;
  category_id: number | null;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  by_category: CategoryTotal[];
}
