import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { monriDigest, monriAuthHeader } from "@/lib/monri/sign";

// Reference example from https://ipg.monri.com/en/documentation/payment_api
//   merchant_key       = "qwert1234"
//   timestamp          = 1593457122
//   authenticity_token = "7db11ea5d4a1af32421b564c79b946d1ead3daf0"
//   fullpath           = "/v2/payment/new"
//   body               = '{"example":"1"}'
//
// Expected concatenated input:
//   qwert123415934571227db11ea5d4a1af32421b564c79b946d1ead3daf0/v2/payment/new{"example":"1"}
const FIXTURE = {
  merchantKey: "qwert1234",
  timestamp: 1593457122,
  authenticityToken: "7db11ea5d4a1af32421b564c79b946d1ead3daf0",
  fullpath: "/v2/payment/new",
  body: '{"example":"1"}',
};

const FIXTURE_INPUT =
  FIXTURE.merchantKey +
  String(FIXTURE.timestamp) +
  FIXTURE.authenticityToken +
  FIXTURE.fullpath +
  FIXTURE.body;

const FIXTURE_DIGEST = createHash("sha512").update(FIXTURE_INPUT).digest("hex");

describe("Monri WP3-v2.1 signer", () => {
  it("digest concatenates fields in the exact docs order", () => {
    expect(monriDigest(FIXTURE)).toBe(FIXTURE_DIGEST);
  });

  it("digest is 128-char SHA512 hex", () => {
    const d = monriDigest(FIXTURE);
    expect(d).toHaveLength(128);
    expect(d).toMatch(/^[a-f0-9]{128}$/);
  });

  it("changing the body changes the digest", () => {
    const a = monriDigest(FIXTURE);
    const b = monriDigest({ ...FIXTURE, body: '{"example":"2"}' });
    expect(a).not.toBe(b);
  });

  it("changing the timestamp changes the digest", () => {
    const a = monriDigest(FIXTURE);
    const b = monriDigest({ ...FIXTURE, timestamp: FIXTURE.timestamp + 1 });
    expect(a).not.toBe(b);
  });

  it("empty body is treated as empty string, not omitted", () => {
    const withEmpty = monriDigest({ ...FIXTURE, body: "" });
    const withSpace = monriDigest({ ...FIXTURE, body: " " });
    expect(withEmpty).not.toBe(withSpace);
  });

  it("authHeader formats as 'WP3-v2.1 <token> <timestamp> <digest>'", () => {
    const header = monriAuthHeader(FIXTURE);
    expect(header).toBe(
      `WP3-v2.1 ${FIXTURE.authenticityToken} ${FIXTURE.timestamp} ${FIXTURE_DIGEST}`,
    );
  });
});
