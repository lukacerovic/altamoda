// POST /api/payments/monri/init
//
// Creates a Monri payment session for an existing order and returns the
// client_secret + id the frontend needs to either (a) redirect the customer
// to Monri's hosted page, or (b) hand off to Monri Components.
//
// Order timing model: the order row already exists in our DB at status=novi,
// paymentStatus=pending (created by POST /api/orders). This endpoint creates
// the matching Payment row, calls Monri to initialise the session, and
// stores Monri's payment id + raw response.

import { z } from "zod";
import { prisma } from "@/lib/db";
import { withErrorHandler, successResponse, ApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { createPayment, MonriApiError } from "@/lib/monri/client";
import { isMonriConfigured } from "@/lib/monri/config";
import type { MonriCurrency } from "@/lib/monri/types";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

const SUPPORTED_CURRENCIES = new Set<MonriCurrency>(["RSD", "EUR", "BAM", "HRK", "USD", "CHF"]);

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth();

  if (!isMonriConfigured()) {
    throw new ApiError(503, "Payments are not configured on this environment.");
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new ApiError(400, "Invalid request");
  }

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, userId: user.id },
    select: { id: true, orderNumber: true, total: true, currency: true, paymentStatus: true },
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus === "paid") throw new ApiError(409, "Order already paid");
  if (!SUPPORTED_CURRENCIES.has(order.currency as MonriCurrency)) {
    throw new ApiError(400, `Currency ${order.currency} not supported by Monri.`);
  }

  // Convert decimal to minor units. Monri's API expects integer minor units
  // for every supported currency (10.24 EUR -> 1024).
  const amount = Math.round(Number(order.total) * 100);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const monriReq = {
    amount,
    order_number: order.orderNumber,
    currency: order.currency as MonriCurrency,
    transaction_type: "purchase" as const,
    order_info: `Alta Moda ${order.orderNumber}`,
    success_url_override: `${baseUrl}/api/payments/monri/return?order=${order.orderNumber}&result=success`,
    cancel_url_override: `${baseUrl}/api/payments/monri/return?order=${order.orderNumber}&result=cancel`,
    callback_url_override: `${baseUrl}/api/webhooks/monri`,
  };

  try {
    const monriRes = await createPayment(monriReq);

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "monri",
        providerPaymentId: monriRes.id,
        providerOrderNumber: order.orderNumber,
        amount: order.total,
        currency: order.currency,
        status: "created",
        rawRequest: monriReq,
        rawResponse: monriRes as unknown as object,
      },
    });

    return successResponse({
      paymentId: monriRes.id,
      clientSecret: monriRes.client_secret,
      // Customer-facing redirect target. Monri's exact redirect URL pattern
      // for the hosted/WebPay flow is confirmed at integration time once
      // test credentials are available — use the client_secret with their
      // Components SDK or send the customer to the URL Monri returns here.
      redirectUrl: null,
    });
  } catch (e) {
    if (e instanceof MonriApiError) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "monri",
          providerOrderNumber: order.orderNumber,
          amount: order.total,
          currency: order.currency,
          status: "error",
          rawRequest: monriReq,
          rawResponse: { error: e.message, payload: e.payload } as unknown as object,
        },
      });
      throw new ApiError(
        e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 502,
        e.message,
      );
    }
    throw e;
  }
});
