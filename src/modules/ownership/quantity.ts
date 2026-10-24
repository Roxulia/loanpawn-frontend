import type { OwnershipReceiptLinkPayload, OwnershipTrackingMode } from "./types";

/** Exact thousandths for user-entered quantities; never round or pass through a float. */
export function quantityThousandths(value: string): bigint {
  const text = value.trim();
  if (text.length > 32 || !/^\+?\d+(?:\.\d{1,3})?$/.test(text)) {
    throw new Error("Enter a positive quantity with at most three decimal places.");
  }
  const [whole, fraction = ""] = text.replace(/^\+/, "").split(".");
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
}

export function buildReceiptLinkPayload(receiptCode: string, quantity: string, updateKey: number,
  mode: OwnershipTrackingMode, selectedCodes: readonly string[], capacity: string): OwnershipReceiptLinkPayload {
  // Serialized quantities come from distinct selected identities, including selections on other pages.
  const codes = [...selectedCodes].sort();
  if (new Set(codes).size !== codes.length || codes.some((code) => !code.trim())) {
    throw new Error("Choose distinct received pieces.");
  }
  const scaled = mode === "SERIALIZED" ? BigInt(codes.length) * 1000n : quantityThousandths(quantity);
  if (scaled <= 0n || scaled > 99999999999999n || (mode === "UNIQUE" && scaled !== 1000n)) {
    throw new Error("Enter a valid quantity for this item.");
  }
  if (mode !== "SERIALIZED" && codes.length !== 0) throw new Error("Choose distinct received pieces.");
  if (scaled > quantityThousandths(capacity)) throw new Error("Quantity exceeds the remaining receipt quantity.");
  if (!receiptCode || !Number.isSafeInteger(updateKey) || updateKey < 0) throw new Error("Reload the item before linking.");
  return {
    purchase_receipt_line_code: receiptCode,
    quantity: `${scaled / 1000n}.${(scaled % 1000n).toString().padStart(3, "0")}`,
    update_key: updateKey,
    serialized_item_codes: codes,
  };
}
