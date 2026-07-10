/** Formats a monetary amount for user-facing messages (e.g. "$1,250.00"). */
export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
