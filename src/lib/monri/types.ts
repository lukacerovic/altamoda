// Monri Payment API v2 types.
// Reference: https://ipg.monri.com/en/documentation/payment_api

export type MonriCurrency = "RSD" | "EUR" | "BAM" | "HRK" | "USD" | "CHF";
export type MonriTransactionType = "authorize" | "purchase";
export type MonriScenario = "charge" | "add_payment_method";

/** POST /v2/payment/new request body. */
export interface MonriCreatePaymentRequest {
  /** Minor units. e.g. 10.24 EUR -> 1024. */
  amount: number;
  /** 2-40 chars, must be unique per merchant. */
  order_number: string;
  currency: MonriCurrency;
  transaction_type: MonriTransactionType;
  /** 3-100 chars, free-form description. */
  order_info: string;
  scenario?: MonriScenario;
  customer_uuid?: string;
  /** HTTPS URL Monri redirects the customer to on success. */
  success_url_override?: string;
  /** HTTPS URL Monri redirects the customer to on cancellation. */
  cancel_url_override?: string;
  /** HTTPS URL Monri POSTs async status updates to. */
  callback_url_override?: string;
}

/** POST /v2/payment/new response (success). */
export interface MonriCreatePaymentResponse {
  status: "approved";
  /** Payment identifier, ~40 chars. */
  id: string;
  /** Used by Components/JS to authenticate the customer-side flow. */
  client_secret: string;
}

export interface MonriErrorResponse {
  status: "error" | "invalid-request";
  message: string;
}

/** Webhook payload Monri POSTs to callback_url_override. Field set is best-effort
 *  per the public docs; verify at integration time. */
export interface MonriWebhookPayload {
  id: string;
  order_number: string;
  status: string; // "approved" | "declined" | "...".
  amount: number;
  currency: MonriCurrency;
  transaction_type: MonriTransactionType;
  digest?: string;
  /** Pass-through fields Monri may include. */
  [key: string]: unknown;
}
