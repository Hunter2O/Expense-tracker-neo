import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { monthLabel, shiftMonth, toMonthKey } from "./format";
import type { Category, Summary as SummaryData, Transaction, TransactionInput } from "./types";
import Summary from "./components/Summary";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";

export default function App() {
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [txs, sum] = await Promise.all([api.transactions(month), api.summary(month)]);
      setTransactions(txs);
      setSummary(sum);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    }
  }, [month]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setError("Could not reach the server."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(tx: TransactionInput) {
    await api.addTransaction(tx);
    // Jump to the month of the new entry so it's visible right away.
    const entryMonth = tx.date.slice(0, 7);
    if (entryMonth !== month) setMonth(entryMonth);
    else await load();
  }

  async function handleDelete(id: number) {
    await api.deleteTransaction(id);
    await load();
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>Expense Tracker</h1>
        <nav className="months" aria-label="Choose month">
          <button aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </button>
          <span>{monthLabel(month)}</span>
          <button aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>
            ›
          </button>
        </nav>
      </header>

      {error && (
        <p className="error banner" role="alert">
          {error}
        </p>
      )}

      <div className="layout">
        <aside className="left">
          <Summary data={summary} />
          <TransactionForm categories={categories} onAdd={handleAdd} />
        </aside>
        <section className="right">
          <h2>Transactions</h2>
          <TransactionList items={transactions} onDelete={handleDelete} />
        </section>
      </div>
    </main>
  );
}
