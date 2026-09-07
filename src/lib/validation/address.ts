/**
 * Address field rules shared by the checkout form (live input filtering +
 * inline errors) and the order API (zod refinements in `validations/order.ts`).
 *
 * The fields deliberately accept different character classes:
 *   street       letters + digits — Serbian street names are often dates
 *                ("27. marta", "29. novembra"), so digits must stay allowed.
 *   houseNumber  starts with a digit, optional letter and/or `/` suffix
 *                ("12", "12a", "12/3"), or the literal "bb" (bez broja).
 *   city         letters only — no Serbian city name contains a digit.
 *   postalCode   digits only; Serbian codes are exactly 5 (4–6 accepted on the
 *                server so foreign addresses already in the DB keep working).
 */

/** Latin + Serbian diacritics + Cyrillic, as a character-class body. */
const L = "A-Za-zČĆĐŠŽčćđšžÀ-ÖØ-öø-ÿА-Яа-яЁё";

const LETTER = new RegExp(`[${L}]`, "g");
const STREET_DISALLOWED = new RegExp(`[^${L}0-9 .,'/-]`, "g");
const CITY_DISALLOWED = new RegExp(`[^${L} .'-]`, "g");
const HOUSE_DISALLOWED = /[^0-9A-Za-z/-]/g;
const HOUSE_NUMBER = /^(?:bb|\d{1,5}[A-Za-z]?(?:[/-]\d{1,4}[A-Za-z]?)?)$/i;

export const MAX = { street: 80, houseNumber: 10, city: 50, postalCode: 5 };

const letterCount = (v: string) => (v.match(LETTER) ?? []).length;

/** Strip characters the field does not accept and cap its length. Used on every
 *  keystroke so an invalid character never lands in the input at all. */
export const sanitizeStreet = (v: string) =>
  v.replace(STREET_DISALLOWED, "").slice(0, MAX.street);
export const sanitizeHouseNumber = (v: string) =>
  v.replace(HOUSE_DISALLOWED, "").slice(0, MAX.houseNumber);
export const sanitizeCity = (v: string) =>
  v.replace(CITY_DISALLOWED, "").slice(0, MAX.city);
export const sanitizePostalCode = (v: string) =>
  v.replace(/\D/g, "").slice(0, MAX.postalCode);

/** Full-value checks, run once the field has content. */
export const isValidStreet = (v: string) => letterCount(v.trim()) >= 2;
export const isValidHouseNumber = (v: string) => HOUSE_NUMBER.test(v.trim());
export const isValidCity = (v: string) => letterCount(v.trim()) >= 2;
export const isValidPostalCode = (v: string) => /^\d{5}$/.test(v.trim());

/** Server-side counterparts — same shape, looser bounds so addresses already
 *  saved by customers (including foreign ones) are not rejected. */
export const isAcceptableStreet = (v: string) => letterCount(v) >= 2;
export const isAcceptableCity = (v: string) => letterCount(v) >= 2 && !/\d/.test(v);
export const isAcceptablePostalCode = (v: string) => /^\d{4,6}$/.test(v.trim());
