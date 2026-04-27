// GET /api/payments/monri/return
//
// Customer-facing return URL — Monri redirects the buyer here after they
// complete or cancel the payment on the hosted page. Query params include
// order_number, status, and (depending on integration mode) a digest the
// merchant should re-verify against the merchant_key.
//
// We trust this redirect only as a UX signal; the source of truth for the
// payment outcome is the asynchronous webhook at /api/webhooks/monri.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("order");
  const result = url.searchParams.get("result"); // "success" | "cancel" | other Monri statuses

  if (!orderNumber) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Send the customer to the existing confirmation page; that page reads
  // the order's paymentStatus from the DB (updated by the webhook) and
  // shows the appropriate state.
  const target = new URL(`/checkout/confirmation`, req.url);
  target.searchParams.set("order", orderNumber);
  if (result) target.searchParams.set("result", result);

  return NextResponse.redirect(target);
}
