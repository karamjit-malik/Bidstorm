const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return formatter.format(Number.isFinite(n) ? n : 0);
}
