// Monri configuration — lazy-resolved so missing env vars do not crash the app
// at boot. They only error when an actual Monri call is made.

export interface MonriConfig {
  authenticityToken: string;
  merchantKey: string;
  apiUrl: string;
  mode: "test" | "production";
  webhookSecret?: string;
}

export function getMonriConfig(): MonriConfig {
  const authenticityToken = process.env.MONRI_AUTHENTICITY_TOKEN;
  const merchantKey = process.env.MONRI_MERCHANT_KEY;

  if (!authenticityToken || !merchantKey) {
    throw new Error(
      "Monri is not configured. Set MONRI_AUTHENTICITY_TOKEN and MONRI_MERCHANT_KEY in .env.",
    );
  }

  const apiUrl =
    process.env.MONRI_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://ipg.monri.com"
      : "https://ipgtest.monri.com");

  return {
    authenticityToken,
    merchantKey,
    apiUrl,
    mode: apiUrl.includes("ipgtest") ? "test" : "production",
    webhookSecret: process.env.MONRI_WEBHOOK_SECRET,
  };
}

export function isMonriConfigured(): boolean {
  return Boolean(process.env.MONRI_AUTHENTICITY_TOKEN && process.env.MONRI_MERCHANT_KEY);
}
