// Monri WP3-v2.1 request signer.
//
// Per https://ipg.monri.com/en/documentation/payment_api the digest is
//   SHA512(merchant_key + timestamp + authenticity_token + fullpath + body)
// and the Authorization header takes the form
//   "WP3-v2.1 <authenticity_token> <timestamp> <digest>"
//
// `fullpath` is the request path including the leading slash (e.g.
// "/v2/payment/new"). `body` is the JSON-encoded request body verbatim, or
// the empty string for GET requests.

import { createHash } from "node:crypto";

export interface SignInput {
  merchantKey: string;
  authenticityToken: string;
  timestamp: number; // Unix seconds — caller controls clock for testability
  fullpath: string;
  body: string;
}

export function monriDigest(input: SignInput): string {
  const concatenated =
    input.merchantKey +
    String(input.timestamp) +
    input.authenticityToken +
    input.fullpath +
    input.body;
  return createHash("sha512").update(concatenated).digest("hex");
}

export function monriAuthHeader(input: SignInput): string {
  const digest = monriDigest(input);
  return `WP3-v2.1 ${input.authenticityToken} ${input.timestamp} ${digest}`;
}
