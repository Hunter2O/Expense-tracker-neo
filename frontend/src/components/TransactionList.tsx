import type { Transaction } from "../types";
import { dayLabel, formatMoney } from "../format";

interface Props {
  items: Transaction[];
  onDelete: (id: number) => void;
}

export default function TransactionList({ items, onDelete }: Props) {
  if (items.length === 0) {
    return <p className="muted">Nothing here yet. Add your first transaction to start this month.</p>;
  }

  const byDay = new Map<string, Transaction[]>();
  for (const tx of items) {
    byDay.set(tx.date, [...(byDay.get(tx.date) ?? []), tx]);
  }

  return (
    <div>
      {[...byDay.entries()].map(([day, txs]) => (
        <section key={day} className="day">
          <h3>{dayLabel(day)}</h3>
          <ul>
            {txs.map((tx) => (
              <li key={tx.id}>
                <div>
                  <p className="desc">{tx.description}</p>
                  <p className="muted small">{tx.category?.name ?? "Uncategorised"}</p>
                </div>
                <p className={`amt ${tx.kind}`}>
                  {tx.kind === "income" ? "+" : "−"}
                  {formatMoney(tx.amount)}
                </p>
                <button
                  className="ghost"
                  aria-label={`Delete ${tx.description}`}
                  onClick={() => onDelete(tx.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
