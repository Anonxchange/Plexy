import { safeIsoCode, sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { isValidAmount, isValidNumber } from "@/lib/validators";
import type { AirtimeCountry, AirtimeOperator } from "@/hooks/user-airtime";
import type { Biller, ReloadlyProduct } from "@/hooks/use-utility-billers";

export function mapAirtimeCountry(raw: unknown): AirtimeCountry {
  const r = raw as Record<string, unknown>;
  return {
    isoName: safeIsoCode(typeof r.isoName === "string" ? r.isoName : ""),
    name: sanitizeText(typeof r.name === "string" ? r.name : ""),
    currencyCode: sanitizeText(typeof r.currencyCode === "string" ? r.currencyCode : ""),
    currencyName: sanitizeText(typeof r.currencyName === "string" ? r.currencyName : ""),
    currencySymbol: sanitizeText(typeof r.currencySymbol === "string" ? r.currencySymbol : ""),
    flagUrl: sanitizeUrl(typeof r.flagUrl === "string" ? r.flagUrl : ""),
    callingCodes: Array.isArray(r.callingCodes)
      ? r.callingCodes.map(c => sanitizeText(String(c)))
      : [],
  };
}

export function mapAirtimeOperator(raw: unknown): AirtimeOperator {
  const r = raw as Record<string, unknown>;
  const country = (r.country ?? {}) as Record<string, unknown>;
  const fixedDesc = r.fixedAmountsDescriptions as Record<string, unknown> | null;
  const localFixedDesc = r.localFixedAmountsDescriptions as Record<string, unknown> | null;

  return {
    operatorId: isValidNumber(r.operatorId) ? (r.operatorId as number) : 0,
    name: sanitizeText(typeof r.name === "string" ? r.name : ""),
    bundle: Boolean(r.bundle),
    data: Boolean(r.data),
    pin: Boolean(r.pin),
    supportsLocalAmounts: Boolean(r.supportsLocalAmounts),
    denominationType: sanitizeText(typeof r.denominationType === "string" ? r.denominationType : ""),
    senderCurrencyCode: sanitizeText(typeof r.senderCurrencyCode === "string" ? r.senderCurrencyCode : ""),
    senderCurrencySymbol: sanitizeText(typeof r.senderCurrencySymbol === "string" ? r.senderCurrencySymbol : ""),
    destinationCurrencyCode: sanitizeText(typeof r.destinationCurrencyCode === "string" ? r.destinationCurrencyCode : ""),
    destinationCurrencySymbol: sanitizeText(typeof r.destinationCurrencySymbol === "string" ? r.destinationCurrencySymbol : ""),
    commission: isValidNumber(r.commission) ? (r.commission as number) : 0,
    minAmount: isValidAmount(r.minAmount) ? (r.minAmount as number) : null,
    maxAmount: isValidAmount(r.maxAmount) ? (r.maxAmount as number) : null,
    localMinAmount: isValidAmount(r.localMinAmount) ? (r.localMinAmount as number) : null,
    localMaxAmount: isValidAmount(r.localMaxAmount) ? (r.localMaxAmount as number) : null,
    country: {
      isoName: safeIsoCode(typeof country.isoName === "string" ? country.isoName : ""),
      name: sanitizeText(typeof country.name === "string" ? country.name : ""),
      flagUrl: sanitizeUrl(typeof country.flagUrl === "string" ? country.flagUrl : ""),
    },
    logoUrls: Array.isArray(r.logoUrls)
      ? r.logoUrls.map(u => sanitizeUrl(String(u))).filter(Boolean)
      : [],
    fixedAmounts: Array.isArray(r.fixedAmounts)
      ? (r.fixedAmounts as unknown[]).filter(isValidNumber) as number[]
      : [],
    fixedAmountsDescriptions: fixedDesc
      ? Object.fromEntries(
          Object.entries(fixedDesc).map(([k, v]) => [sanitizeText(k), sanitizeText(String(v))])
        )
      : {},
    localFixedAmounts: Array.isArray(r.localFixedAmounts)
      ? (r.localFixedAmounts as unknown[]).filter(isValidNumber) as number[]
      : [],
    localFixedAmountsDescriptions: localFixedDesc
      ? Object.fromEntries(
          Object.entries(localFixedDesc).map(([k, v]) => [sanitizeText(k), sanitizeText(String(v))])
        )
      : {},
  };
}

export function mapBiller(raw: unknown): Biller {
  const r = raw as Record<string, unknown>;
  return {
    id: isValidNumber(r.id) ? (r.id as number) : 0,
    name: sanitizeText(typeof r.name === "string" ? r.name : ""),
    countryCode: sanitizeText(typeof r.countryCode === "string" ? r.countryCode : ""),
    countryName: sanitizeText(typeof r.countryName === "string" ? r.countryName : ""),
    type: sanitizeText(typeof r.type === "string" ? r.type : ""),
    serviceType: sanitizeText(typeof r.serviceType === "string" ? r.serviceType : ""),
    localAmountSupported: Boolean(r.localAmountSupported),
    localTransactionCurrencyCode: sanitizeText(typeof r.localTransactionCurrencyCode === "string" ? r.localTransactionCurrencyCode : ""),
    localTransactionFee: isValidNumber(r.localTransactionFee) ? (r.localTransactionFee as number) : 0,
    localTransactionFeeCurrencyCode: sanitizeText(typeof r.localTransactionFeeCurrencyCode === "string" ? r.localTransactionFeeCurrencyCode : ""),
    localTransactionFeePercentage: isValidNumber(r.localTransactionFeePercentage) ? (r.localTransactionFeePercentage as number) : 0,
    denominationType: sanitizeText(typeof r.denominationType === "string" ? r.denominationType : ""),
    minLocalTransactionAmount: isValidAmount(r.minLocalTransactionAmount) ? (r.minLocalTransactionAmount as number) : null,
    maxLocalTransactionAmount: isValidAmount(r.maxLocalTransactionAmount) ? (r.maxLocalTransactionAmount as number) : null,
    minAmount: isValidAmount(r.minAmount) ? (r.minAmount as number) : null,
    maxAmount: isValidAmount(r.maxAmount) ? (r.maxAmount as number) : null,
    localFixedAmounts: Array.isArray(r.localFixedAmounts)
      ? (r.localFixedAmounts as unknown[]).filter(isValidNumber) as number[]
      : null,
    fixedAmounts: Array.isArray(r.fixedAmounts)
      ? (r.fixedAmounts as unknown[]).filter(isValidNumber) as number[]
      : null,
    fixedAmountsDescriptions: typeof r.fixedAmountsDescriptions === "object" && r.fixedAmountsDescriptions
      ? r.fixedAmountsDescriptions as Record<string, string>
      : null,
    localFixedAmountsDescriptions: typeof r.localFixedAmountsDescriptions === "object" && r.localFixedAmountsDescriptions
      ? r.localFixedAmountsDescriptions as Record<string, string>
      : null,
  };
}

export function mapReloadlyProduct(raw: unknown): ReloadlyProduct {
  const r = raw as Record<string, unknown>;
  const brand = (r.brand ?? {}) as Record<string, unknown>;
  const country = (r.country ?? {}) as Record<string, unknown>;
  const category = (r.category ?? {}) as Record<string, unknown>;
  const redeemInstruction = (r.redeemInstruction ?? {}) as Record<string, unknown>;

  return {
    productId: isValidNumber(r.productId) ? (r.productId as number) : 0,
    productName: sanitizeText(typeof r.productName === "string" ? r.productName : ""),
    global: Boolean(r.global),
    supportsPreOrder: Boolean(r.supportsPreOrder),
    senderFee: isValidNumber(r.senderFee) ? (r.senderFee as number) : 0,
    senderFeePercentage: isValidNumber(r.senderFeePercentage) ? (r.senderFeePercentage as number) : 0,
    discountPercentage: isValidNumber(r.discountPercentage) ? (r.discountPercentage as number) : 0,
    denominationType: sanitizeText(typeof r.denominationType === "string" ? r.denominationType : ""),
    recipientCurrencyCode: sanitizeText(typeof r.recipientCurrencyCode === "string" ? r.recipientCurrencyCode : ""),
    minRecipientDenomination: isValidAmount(r.minRecipientDenomination) ? (r.minRecipientDenomination as number) : null,
    maxRecipientDenomination: isValidAmount(r.maxRecipientDenomination) ? (r.maxRecipientDenomination as number) : null,
    fixedRecipientDenominations: Array.isArray(r.fixedRecipientDenominations)
      ? (r.fixedRecipientDenominations as unknown[]).filter(isValidNumber) as number[]
      : null,
    logoUrls: Array.isArray(r.logoUrls)
      ? r.logoUrls.map(u => sanitizeUrl(String(u))).filter(Boolean)
      : [],
    brand: {
      brandId: isValidNumber(brand.brandId) ? (brand.brandId as number) : 0,
      brandName: sanitizeText(typeof brand.brandName === "string" ? brand.brandName : ""),
    },
    country: {
      isoName: safeIsoCode(typeof country.isoName === "string" ? country.isoName : ""),
      name: sanitizeText(typeof country.name === "string" ? country.name : ""),
    },
    category: {
      id: isValidNumber(category.id) ? (category.id as number) : 0,
      name: sanitizeText(typeof category.name === "string" ? category.name : ""),
    },
    redeemInstruction: {
      concise: sanitizeText(typeof redeemInstruction.concise === "string" ? redeemInstruction.concise : ""),
      verbose: sanitizeText(typeof redeemInstruction.verbose === "string" ? redeemInstruction.verbose : ""),
    },
  };
}
