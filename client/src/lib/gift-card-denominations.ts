export interface GiftCardDenominationFields {
  denominationType?: string | null;
  fixedRecipientDenominations?: readonly unknown[] | null;
  minRecipientDenomination?: unknown;
  maxRecipientDenomination?: unknown;
  minAmount?: unknown;
  maxAmount?: unknown;
}

export interface GiftCardDenominationRange {
  min: number | null;
  max: number | null;
  fixed: number[];
}

function toFiniteAmount(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function getGiftCardDenominationRange(
  card: GiftCardDenominationFields | null | undefined,
): GiftCardDenominationRange {
  const fixed = Array.from(
    new Set(
      (Array.isArray(card?.fixedRecipientDenominations)
        ? card.fixedRecipientDenominations
        : []
      )
        .map(toFiniteAmount)
        .filter((amount): amount is number => amount !== null),
    ),
  ).sort((a, b) => a - b);

  if (fixed.length > 0) {
    return {
      min: fixed[0],
      max: fixed[fixed.length - 1],
      fixed,
    };
  }

  return {
    min: toFiniteAmount(card?.minRecipientDenomination ?? card?.minAmount),
    max: toFiniteAmount(card?.maxRecipientDenomination ?? card?.maxAmount),
    fixed,
  };
}

export function hasGiftCardDenominationRange(card: unknown): boolean {
  const range = getGiftCardDenominationRange(card as GiftCardDenominationFields | null | undefined);
  return range.min !== null && range.max !== null;
}
