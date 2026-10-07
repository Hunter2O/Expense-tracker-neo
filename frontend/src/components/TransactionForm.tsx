import { useState } from "react";
import type { Category, Kind, TransactionInput } from "../types";
import { todayISO } from "../format";

interface Props {
  categories: Category[];
  onAdd: (tx: TransactionInput) => Promise<void>;
}

export default function TransactionForm({ categories, onAdd }: Props) {
  const [kind, setKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setError("Enter an amount above zero, with up to two decimals.");
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        kind,
        amount,
        description: description.trim(),
        date,
        category_id: categoryId ? Number(categoryId) : null,
      });
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Add a transaction</h2>

      <div className="segmented" role="group" aria-label="Type">
        {(["expense", "income"] as Kind[]).map((k) => (
          <button
            type="button"
            key={k}
            className={kind === k ? "on" : ""}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
          >
            {k === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <label>
        Amount
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>

      <label>
        What was it for?
        <input
          value={description}
          maxLength={200}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <div className="row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary" disabled={saving}>
        {saving ? "Saving…" : "Save transaction"}
      </button>
    </form>
  );
}
