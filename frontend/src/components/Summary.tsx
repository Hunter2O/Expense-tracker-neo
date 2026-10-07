import type { Summary as SummaryData } from "../types";
import { formatMoney } from "../format";

export default function Summary({ data }: { data: SummaryData | null }) {
  const balance = data?.balance ?? 0;
  const maxCat = Math.max(...(data?.by_category.map((c) => c.total) ?? [0]), 1);

  return (
    <section aria-label="Month summary">
      <p className="muted">Left this month</p>
      <p className={`balance ${balance < 0 ? "neg" : ""}`}>{formatMoney(balance)}</p>
      <div className="flows">
        <span>
          <span className="dot income" aria-hidden /> In {formatMoney(data?.income ?? 0)}
        </span>
        <span>
          <span className="dot expense" aria-hidden /> Out {formatMoney(data?.expense ?? 0)}
        </span>
      </div>

      <h2>Where it went</h2>
      {data && data.by_category.length > 0 ? (
        <ul className="bars">
          {data.by_category.map((c) => (
            <li key={c.category}>
              <div className="bar-row">
                <span>{c.category}</span>
                <span>{formatMoney(c.total)}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(c.total / maxCat) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No spending recorded yet.</p>
      )}
    </section>
  );
}
