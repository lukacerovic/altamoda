// Monri HTTP client — wraps the Payment API v2 endpoints behind typed
// methods so the rest of the codebase never hand-builds the
// WP3-v2.1 Authorization header.

import { monriAuthHeader } from "./sign";
import { getMonriConfig } from "./config";
import type {
  MonriCreatePaymentRequest,
  MonriCreatePaymentResponse,
  MonriErrorResponse,
} from "./types";

interface CallOptions {
  /** Override the clock — only used by tests. */
  now?: () => number;
}

async function call<TReq, TRes>(
  method: "POST" | "GET",
  path: string,
  body: TReq | null,
  opts: CallOptions = {},
): Promise<TRes> {
  const cfg = getMonriConfig();
  const bodyStr = body ? JSON.stringify(body) : "";
  const timestamp = Math.floor((opts.now?.() ?? Date.now()) / 1000);

  const auth = monriAuthHeader({
    merchantKey: cfg.merchantKey,
    authenticityToken: cfg.authenticityToken,
    timestamp,
    fullpath: path,
    body: bodyStr,
  });

  const res = await fetch(`${cfg.apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
    },
    body: bodyStr || undefined,
  });

  const json = (await res.json()) as TRes | MonriErrorResponse;

  if (!res.ok || (json as MonriErrorResponse).status === "error" || (json as MonriErrorResponse).status === "invalid-request") {
    const err = json as MonriErrorResponse;
    throw new MonriApiError(res.status, err.message ?? `Monri ${path} failed`, err);
  }

  return json as TRes;
}

export class MonriApiError extends Error {
  constructor(
    public httpStatus: number,
    message: string,
    public payload: MonriErrorResponse,
  ) {
    super(message);
    this.name = "MonriApiError";
  }
}

export async function createPayment(
  req: MonriCreatePaymentRequest,
  opts?: CallOptions,
): Promise<MonriCreatePaymentResponse> {
  return call<MonriCreatePaymentRequest, MonriCreatePaymentResponse>(
    "POST",
    "/v2/payment/new",
    req,
    opts,
  );
}
