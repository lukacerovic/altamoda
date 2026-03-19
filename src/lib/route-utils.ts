/**
 * Extract route params from Next.js context.
 * Handles both Promise-based (Next.js 15+) and direct params.
 */
export async function getRouteParams<T extends Record<string, string>>(
  context: unknown
): Promise<T> {
  const ctx = context as { params: T | Promise<T> }
  const params = ctx.params
  if (params instanceof Promise) {
    return await params
  }
  return params
}
