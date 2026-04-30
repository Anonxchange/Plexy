export type PIIReason =
  | "TOO_LONG"
  | "DIGIT_RUN"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "TOKEN"
  | "CRYPTO_ADDR"
  | "MNEMONIC";

const MAX_LEN = 500;
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const URL_RE = /\bhttps?:\/\/\S+/i;
const PHONE_RE = /(?:\+?\d[\s\-().]?){9,}\d/;
const LONG_DIGIT_RE = /\d{6,}/;
const HEX_TOKEN_RE = /\b(?:0x)?[a-f0-9]{32,}\b/i;
const BASE58_TOKEN_RE = /\b[1-9A-HJ-NP-Za-km-z]{30,}\b/;

const BIP39_HINT_RE =
  /\b(abandon|ability|able|about|above|absent|absorb|abstract|absurd|abuse|access|accident|account|accuse|achieve|acid|acoustic|acquire|across|act|action|actor|actress|actual|adapt|add|addict|address|adjust|admit|adult|advance|advice|aerobic|affair|afford|afraid|again|age|agent|agree|ahead|aim|air|airport|aisle|alarm|album|alcohol|alert|alien|all|alley|allow|almost|alone|alpha|already|also|alter|always|amateur|amazing|among|amount|amused|analyst|anchor|ancient|anger|angle|angry|animal|ankle|announce|annual|another|answer|antenna|antique|anxiety|any|apart|apology|appear|apple|approve|april|arch|arctic|area|arena|argue|arm|armed|armor|army|around|arrange|arrest|arrive|arrow|art|artefact|artist|artwork|ask|aspect|assault|asset|assist|assume|asthma|athlete|atom|attack|attend|attitude|attract|auction|audit|august|aunt|author|auto|autumn|average|avocado|avoid|awake|aware|away|awesome|awful|awkward|axis)\b/i;

export function isLikelyPII(input: string): PIIReason | null {
  if (!input) return null;
  if (input.length > MAX_LEN) return "TOO_LONG";
  if (EMAIL_RE.test(input)) return "EMAIL";
  if (URL_RE.test(input)) return "URL";
  if (PHONE_RE.test(input)) return "PHONE";
  if (LONG_DIGIT_RE.test(input)) return "DIGIT_RUN";
  if (HEX_TOKEN_RE.test(input)) return "TOKEN";
  if (BASE58_TOKEN_RE.test(input)) return "CRYPTO_ADDR";
  const wordCount = (input.match(/\b[a-z]+\b/gi) || []).length;
  if (wordCount >= 12) {
    const matches = input.match(BIP39_HINT_RE);
    if (matches && matches.length >= 6) return "MNEMONIC";
  }
  return null;
}

export function shouldTranslate(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (isLikelyPII(trimmed)) return false;
  return true;
}
