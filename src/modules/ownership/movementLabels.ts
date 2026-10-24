const movementLabels: Record<string, string> = {
  PURCHASE_ACQUISITION: "Purchase acquisition",
  ACQUISITION: "Acquisition",
  SALE_RESERVE: "Sale reservation",
  SALE_RELEASE: "Sale reservation released",
  SALE_CONSUME: "Sale delivery",
  SALE: "Sale delivery",
  PLEDGE: "Pledge",
  RELEASE: "Pledge released",
  FORFEITURE: "Forfeiture",
  SALE_RETURN: "Sale return",
  PURCHASE_RETURN: "Purchase return",
};

export function ownershipMovementLabel(operation: string): string {
  // Retain readable historical operation names when a future or legacy type is not in this map.
  return movementLabels[operation] ?? operation.replaceAll("_", " ");
}
