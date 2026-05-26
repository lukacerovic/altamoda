import Image from "next/image";

/**
 * Accepted-payment branding required by the acquirer (UniCredit Bank Srbija /
 * Nexi-SIA VPOS) before go-live: the card-scheme marks, the 3-D Secure security
 * badges, and the UniCredit logo linked to the bank's site.
 *
 * Each mark is rendered inside a white "chip" so the logos display correctly on
 * any background (the dark footer as well as light pages). Heights are fixed and
 * widths follow each asset's intrinsic aspect ratio.
 *
 * Apple Pay / Google Pay assets are staged in /public/payment-logos but are NOT
 * shown here — they are only advertised once enabled on the VPOS profile.
 */

interface Logo {
  src: string;
  alt: string;
  /** Intrinsic dimensions (for next/image); display size is set via className. */
  w: number;
  h: number;
}

const SCHEMES: Logo[] = [
  { src: "/payment-logos/visa.png", alt: "Visa", w: 220, h: 74 },
  { src: "/payment-logos/mastercard.png", alt: "Mastercard", w: 220, h: 156 },
  { src: "/payment-logos/dinacard.png", alt: "DinaCard", w: 300, h: 140 },
];

const SECURITY: Logo[] = [
  { src: "/payment-logos/visa-secure.png", alt: "Visa Secure", w: 198, h: 198 },
  {
    src: "/payment-logos/mastercard-identity-check.png",
    alt: "Mastercard Identity Check",
    w: 2102,
    h: 600,
  },
];

const UNICREDIT: Logo = {
  src: "/payment-logos/unicredit.jpg",
  alt: "UniCredit Bank Srbija",
  w: 566,
  h: 76,
};

/** A single logo wrapped in a white chip. `h-5` ≈ 20px tall, width auto. */
function Chip({ logo, heightClass }: { logo: Logo; heightClass: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded bg-white px-2 py-1 shadow-sm ring-1 ring-black/5">
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.w}
        height={logo.h}
        className={`${heightClass} w-auto`}
      />
    </span>
  );
}

interface PaymentLogosProps {
  className?: string;
  /** Larger chips for content pages; smaller for the footer/checkout strip. */
  size?: "sm" | "md";
}

export default function PaymentLogos({ className = "", size = "sm" }: PaymentLogosProps) {
  const h = size === "md" ? "h-7" : "h-5";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SCHEMES.map((logo) => (
        <Chip key={logo.src} logo={logo} heightClass={h} />
      ))}
      {SECURITY.map((logo) => (
        <Chip key={logo.src} logo={logo} heightClass={h} />
      ))}
      {/* UniCredit Bank logo — must link to the bank's site (acquirer requirement). */}
      <a
        href="https://www.unicreditbank.rs"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="UniCredit Bank Srbija"
        className="inline-flex"
      >
        <Chip logo={UNICREDIT} heightClass={h} />
      </a>
    </div>
  );
}
