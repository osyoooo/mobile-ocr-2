import { BOOKS } from './books';

export function normalizeQuantity(value: string | number): number {
  const digits = String(value ?? '').replace(/[^0-9]/g, '');
  return digits === '' ? 0 : Number(digits);
}

export function calculateTotal(quantities: number[]): number {
  return BOOKS.reduce((sum, book, index) => sum + book.price * normalizeQuantity(quantities[index] ?? 0), 0);
}

export function formatYen(amount: number): string {
  return `${new Intl.NumberFormat('ja-JP').format(amount)}円`;
}
