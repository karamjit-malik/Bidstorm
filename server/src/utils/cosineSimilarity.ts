/**
 * Cosine similarity between two sparse vectors keyed by user id:
 *   sim(A,B) = Σ(w_A · w_B) / (‖A‖ · ‖B‖)
 * where the dot product sums over users who interacted with both items and the
 * norms use every user who interacted with each item. Returns 0 when either
 * vector is empty (no shared users → no measurable similarity).
 */
export function cosineSimilarity(
  a: Map<number, number>,
  b: Map<number, number>,
): number {
  if (a.size === 0 || b.size === 0) return 0;

  // Iterate the smaller map for the dot product.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [user, wSmall] of small) {
    const wLarge = large.get(user);
    if (wLarge !== undefined) dot += wSmall * wLarge;
  }
  if (dot === 0) return 0;

  const normA = norm(a);
  const normB = norm(b);
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

function norm(vec: Map<number, number>): number {
  let sum = 0;
  for (const w of vec.values()) sum += w * w;
  return Math.sqrt(sum);
}
