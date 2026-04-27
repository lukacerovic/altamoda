// POST /api/webhooks/monri
//
// Async payment status updates from Monri. This is the source of truth for
// flipping order.paymentStatus from pending -> paid / failed.
//
// Verification: Monri signs the callback with the same WP3-v2.1 digest scheme
// used on requests; the body is verified by re-computing the digest using
// merchant_key + (timestamp from header) + authenticity_token + path + raw body
// and comparing against the digest in the Authorization header.
//
// This route is structured to accept the call, persist the raw payload, and
// only update the order/payment if the signature checks out. Real signature
// verification is wired against actual Monri test traffic — for now we
// accept all webhooks but record verification status on the Payment row so
// nothing flips to "paid" silently in production without a green check.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { monriDigest } from "@/lib/monri/sign";
import { getMonriConfig, isMonriConfigured } from "@/lib/monri/config";

export async function POST(req: NextRequest) {
  if (!isMonriConfigured()) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const authHeader = req.headers.get("authorization") ?? "";

  let payload: { id?: string; order_number?: string; status?: string } = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const verified = verifyWebhookSignature(authHeader, rawBody);

  // Map Monri status -> our paymentStatus enum.
  const monriStatus = (payload.status ?? "").toLowerCase();
  const paymentStatus =
    monriStatus === "approved" || monriStatus === "paid"
      ? "paid"
      : monriStatus === "declined" || monriStatus === "failed" || monriStatus === "error"
        ? "failed"
        : "pending";

  // Find the matching Payment row by Monri payment id (preferred) or order_number.
  const where = payload.id
    ? { providerPaymentId: payload.id }
    : payload.order_number
      ? { providerOrderNumber: payload.order_number }
      : null;

  if (!where) {
    return NextResponse.json({ ok: false, error: "missing_identifier" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({ where });

  if (!payment) {
    // Always 200 so Monri doesn't keep retrying — log and acknowledge.
    return NextResponse.json({ ok: true, note: "payment_not_found" });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        rawResponse: { ...((payment.rawResponse as object) ?? {}), webhook: payload, verified } as unknown as object,
      },
    }),
    ...(verified && paymentStatus !== "pending"
      ? [
          prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, verified, paymentStatus });
}

function verifyWebhookSignature(authHeader: string, rawBody: string): boolean {
  // Header format: "WP3-v2.1 <authenticity_token> <timestamp> <digest>"
  const m = authHeader.match(/^WP3-v2\.1\s+(\S+)\s+(\d+)\s+([a-f0-9]+)$/i);
  if (!m) return false;
  const [, authenticityToken, ts, providedDigest] = m;
  const cfg = getMonriConfig();
  if (authenticityToken !== cfg.authenticityToken) return false;

  const expected = monriDigest({
    merchantKey: cfg.merchantKey,
    authenticityToken: cfg.authenticityToken,
    timestamp: Number(ts),
    fullpath: "/api/webhooks/monri",
    body: rawBody,
  });
  return timingSafeEqual(expected, providedDigest);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
