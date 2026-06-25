import { formatYen } from '@/lib/calc';

export function TotalAmount({ total }: { total: number }) {
  return (
    <div className="total" aria-live="polite">
      <div className="label">総合計</div>
      <div className="amount">{formatYen(total)}</div>
    </div>
  );
}
