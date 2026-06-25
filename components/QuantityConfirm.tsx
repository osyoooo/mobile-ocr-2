'use client';

import { useMemo, useState } from 'react';
import { BOOKS } from '@/lib/books';
import { calculateTotal, normalizeQuantity } from '@/lib/calc';
import { TotalAmount } from './TotalAmount';

type QuantityConfirmProps = {
  initialQuantities: number[];
  cellImages: string[];
  onRetry: () => void;
};

export function QuantityConfirm({ initialQuantities, cellImages, onRetry }: QuantityConfirmProps) {
  const [quantities, setQuantities] = useState<number[]>(() => BOOKS.map((_, index) => initialQuantities[index] ?? 0));
  const total = useMemo(() => calculateTotal(quantities), [quantities]);

  const update = (index: number, value: string) => {
    setQuantities((current) => current.map((quantity, i) => (i === index ? normalizeQuantity(value) : quantity)));
  };

  return (
    <section className="card confirm-card">
      <h1>確認・修正</h1>
      <p className="notice">OCRは仮読み取りです。左の切り出し画像を見ながら、誤読があれば冊数だけ修正してください。金額は総合計のみ表示します。</p>

      <div className="confirm-list">
        {BOOKS.map((book, index) => (
          <div className="quantity-row" key={book.no}>
            <div className="no-cell">No{book.no}</div>
            <div className="cell-thumb-wrap">
              {cellImages[index] ? <img className="cell-thumb" src={cellImages[index]} alt={`No${book.no}の切り出し画像`} /> : <span className="empty-thumb">画像なし</span>}
            </div>
            <label className="quantity-input-wrap">
              <span className="book-name">{book.name}</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantities[index] || ''}
                aria-label={`No${book.no} 申込冊数`}
                onChange={(event) => update(index, event.target.value)}
                placeholder="0"
              />
            </label>
          </div>
        ))}
      </div>

      <TotalAmount total={total} />

      <div className="actions">
        <button className="button ghost" type="button" onClick={onRetry}>最初から撮り直す</button>
      </div>
    </section>
  );
}
