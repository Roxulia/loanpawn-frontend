import { useCallback, useState } from "react";
import { Button, Input, Select } from "../../../components/atoms";
import { DataTable } from "../../../components/organisms";
import { useUiLocale } from "../../../locales/UiLocale";
import { useOwnershipRead } from "../hooks/useOwnershipRead";
import { ownershipService } from "../services/ownershipService";
import type { AcquisitionLot, OwnershipHolding } from "../types";
import { OwnershipReadError } from "./OwnershipReadError";

type Props = { code: string; canManage: boolean; onLink: (lot: AcquisitionLot) => void };

export function OwnershipLotTable({ code, canManage, onLink }: Props) {
  const { t } = useUiLocale();
  const [page, setPage] = useState(1);
  const [holding, setHolding] = useState<OwnershipHolding>("all");
  const [currency, setCurrency] = useState("");
  const [revision, setRevision] = useState(0);
  const load = useCallback(() => ownershipService.lots(code, page, holding, currency.trim()), [code, page, holding, currency]);
  const read = useOwnershipRead(JSON.stringify([code, page, holding, currency, revision]), load, 200);
  return <section>
    <h3>{t("Acquisition lots")}</h3>
    <div className="ownership-lot-filters-desktop ownership-lot-filters-mobile">
      <label>{t("Holdings")}<Select value={holding} onChange={(event) => { setHolding(event.target.value as OwnershipHolding); setPage(1); }}>
        <option value="all">All holdings</option><option value="current">Current holdings</option><option value="depleted">Depleted holdings</option>
      </Select></label>
      <label>{t("Currency")}<Input value={currency} maxLength={10} placeholder="All currencies"
        onChange={(event) => { setCurrency(event.target.value.toUpperCase()); setPage(1); }} /></label>
    </div>
    <OwnershipReadError error={read.error} retry={() => setRevision((value) => value + 1)} />
    {!read.error && <DataTable items={read.data?.items ?? []} isLoading={read.loading} showEmptyStructure
      getItemId={(lot) => lot.code} getItemTitle={(lot) => lot.code} emptyTitle="No acquisition lots recorded."
      columns={[
        { header: "Lot", key: "lot", render: (lot) => <><strong>{lot.code}</strong><div>{lot.acquired_at}</div><div>{lot.description}</div></> },
        { header: "Owned / reserved / pledged", key: "balance", render: (lot) => `${lot.owned_quantity} / ${lot.reserved_quantity} / ${lot.pledged_quantity}` },
        { header: "Available ownership", key: "available", render: (lot) => lot.available_quantity },
        { header: "Awaiting receipt", key: "awaiting", render: (lot) => lot.awaiting_receipt_quantity },
        { header: "Received but unlinked", key: "pending", render: (lot) => lot.pending_link_quantity },
        { header: "Unit cost", key: "cost", render: (lot) => `${lot.unit_cost_basis} ${lot.currency_code}` },
        { header: "Estimated unit value", key: "value", render: (lot) => lot.estimated_unit_value === null ? "\u2014" : `${lot.estimated_unit_value} ${lot.currency_code}` },
      ]} actions={canManage ? (lot) => lot.source_module === "PURCHASING" && lot.source_type === "PurchaseOrderLine" && lot.pending_link_quantity !== "0.000"
        ? <Button type="button" onClick={() => onLink(lot)}>Link received goods</Button> : null : undefined}
      pagination={{ currentPage: page, lastPage: read.data?.last_page ?? page, total: read.data?.total,
        onPrevious: () => setPage((value) => Math.max(1, value - 1)), onNext: () => setPage((value) => value + 1) }} />}
  </section>;
}
