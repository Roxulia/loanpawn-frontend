import { isApiError } from "../../dataobjects/common/api";

export function ownershipErrorMessage(error: unknown): string {
  if (isApiError(error) && error.errors) return Object.values(error.errors).flat().join(" ");
  return error instanceof Error ? error.message : "Unable to load ownership data.";
}

