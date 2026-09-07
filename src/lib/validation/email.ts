/**
 * Email check shared by the checkout contact step and the order API.
 *
 * Deliberately pragmatic rather than RFC-complete: one `@`, a non-empty local
 * part with no spaces, a dotted domain, and a TLD of at least two letters.
 * `<input type="email">` alone is not enough — the browser only enforces this
 * on native form submission, and the checkout advances through a button.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

export const isValidEmail = (v: string) => {
  const s = v.trim();
  return s.length <= 254 && EMAIL.test(s);
};
