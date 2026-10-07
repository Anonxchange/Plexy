const POLICY_NAME = "pexly-style";

const STYLE_ALLOWLIST = [
  /^linear-gradient\(/i,
  /^radial-gradient\(/i,
  /^conic-gradient\(/i,
  /^blur\(/i,
  /^brightness\(/i,
  /^grayscale\(/i,
  /^hsl\(/i,
  /^hsla\(/i,
  /^rgba?\(/i,
  /^translateX\(/i,
  /^translateY\(/i,
  /^translate\(/i,
  /^scale\(/i,
  /^rotate\(/i,
  /^matrix\(/i,
  /^var\(--/i,
  /^transparent$/i,
  /^none$/i,
  /^inherit$/i,
  /^initial$/i,
  /^unset$/i,
  /^currentColor$/i,
];

declare global {
  interface Window {
    trustedTypes?: {
      createPolicy?: (name: string, rules: { createStyleString: (value: string) => string }) => any;
      getPolicy?: (name: string) => any | null;
    };
  }
}

function getTrustedStylePolicy() {
  if (typeof window === "undefined" || !window.trustedTypes) return null;

  const existing = window.trustedTypes.getPolicy?.(POLICY_NAME);
  if (existing) return existing;

  try {
    return window.trustedTypes.createPolicy?.(POLICY_NAME, {
      createStyleString(value: string) {
        const normalized = value.trim();
        if (!normalized) {
          throw new Error("Empty style value");
        }

        const allowed = STYLE_ALLOWLIST.some((pattern) => pattern.test(normalized));
        if (!allowed) {
          throw new Error(`Untrusted style value: ${value}`);
        }

        return normalized;
      },
    });
  } catch {
    return null;
  }
}

export function trustedStyle(value: string): string {
  if (typeof window === "undefined") return value;

  const policy = getTrustedStylePolicy();
  if (!policy) return value;

  try {
    return policy.createStyleString(value);
  } catch {
    return value;
  }
}
