import { useUiLocale } from "../../../locales/UiLocale";
import type { OwnedItem } from "../types";

export function OwnershipBalances({ item }: { item: OwnedItem }) {
  const { t } = useUiLocale();
  const balances: Array<[string, string]> = [
    ["Owned", item.owned_quantity], ["Reserved", item.reserved_quantity], ["Pledged", item.pledged_quantity],
    ["Available ownership", item.available_quantity], ["Physical stock", item.physical_quantity],
    ["Received backing", item.received_backed_quantity], ["Awaiting receipt", item.awaiting_receipt_quantity],
    ["Received but unlinked", item.pending_link_quantity],
  ];
  return <dl className="ownership-balances-desktop ownership-balances-mobile">
    {balances.map(([label, value]) => <div key={label}><dt>{t(label)}</dt><dd>{value} {item.unit_name ?? item.unit_code ?? ""}</dd></div>)}
  </dl>;
}
