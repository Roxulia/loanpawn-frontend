import { useCallback, useState } from "react";
import { Button } from "../../../components/atoms";
import { Card, SectionHeader } from "../../../components/molecules";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { useUiLocale } from "../../../locales/UiLocale";
import { OwnershipDetailPanel } from "../components/OwnershipDetailPanel";
import { OwnershipFilters } from "../components/OwnershipFilters";
import { OwnershipItemPhoto } from "../components/OwnershipItemPhoto";
import { OwnershipReadError } from "../components/OwnershipReadError";
import { useOwnershipRead } from "../hooks/useOwnershipRead";
import { ownershipService } from "../services/ownershipService";
import type { OwnedItem, OwnershipHolding, OwnershipTrackingMode } from "../types";
import "../../inventory/inventory.css";
import "../ownership.css";

export function OwnedItemsPage() {
  const { t } = useUiLocale();
  const [search, setSearch] = useState("");
  const [holding, setHolding] = useState<OwnershipHolding>("all");
  const [tracking, setTracking] = useState<OwnershipTrackingMode | "">("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const load = useCallback(() => ownershipService.list({ search: search.trim(), holding, tracking_mode: tracking }, page),
    [search, holding, tracking, page]);
  const read = useOwnershipRead(JSON.stringify([search, holding, tracking, page, revision]), load, 200);
  const refreshRegister = useCallback(() => { setPage(1); setRevision((value) => value + 1); }, []);

  // Filters reset only register paging; the independently loaded selected history remains reachable.
  function changeSearch(value: string) { setSearch(value); setPage(1); }
  function changeHolding(value: OwnershipHolding) { setHolding(value); setPage(1); }
  function changeTracking(value: OwnershipTrackingMode | "") { setTracking(value); setPage(1); }

  const columns: Array<DataTableColumn<OwnedItem>> = [
    { header: "Item", key: "item", render: (item) => <div className="ownership-identity-desktop ownership-identity-mobile">
      <OwnershipItemPhoto item={item} /><div><strong>{item.name}</strong><div>{item.description}</div><small>{item.code}</small></div></div> },
    { header: "Owned", key: "owned", render: (item) => `${item.owned_quantity} ${item.unit_name ?? item.unit_code ?? ""}` },
    { header: "Reserved", key: "reserved", render: (item) => item.reserved_quantity },
    { header: "Pledged", key: "pledged", render: (item) => item.pledged_quantity },
    { header: "Available ownership", key: "available", render: (item) => item.available_quantity },
    { header: "Physical stock", key: "physical", render: (item) => item.physical_quantity },
    { header: "Awaiting receipt", key: "awaiting", render: (item) => item.awaiting_receipt_quantity },
    { header: "Received but unlinked", key: "pending", render: (item) => item.pending_link_quantity },
    { header: "Acquisition lots", key: "lots", render: (item) => item.lot_count },
  ];
  const filterProps = { search, holding, tracking, loading: read.loading, onSearch: changeSearch,
    onHolding: changeHolding, onTracking: changeTracking, onRefresh: refreshRegister };

  return <section className="page ownership-page">
    <SectionHeader title="Ownership" subtitle="Review ownership, physical stock and receipt links separately." />
    <div className="ownership-workspace">
      <div className="ownership-register-desktop ownership-register-mobile">
        <Card title="Owned item register">
          <OwnershipFilters variant="desktop" {...filterProps} />
          <OwnershipFilters variant="mobile" {...filterProps} />
          <OwnershipReadError error={read.error} retry={refreshRegister} />
          {!read.error && <DataTable items={read.data?.items ?? []} columns={columns} isLoading={read.loading} showEmptyStructure
            getItemId={(item) => item.code} getItemTitle={(item) => item.name} emptyTitle="No owned items yet"
            emptyDescription="Try another search or include depleted holdings."
            onRowClick={(item) => setSelectedCode(item.code)}
            actions={(item) => <Button type="button" variant="secondary" onClick={() => setSelectedCode(item.code)}>
              {selectedCode === item.code ? t("Selected") : t("Open details")}</Button>}
            pagination={{ currentPage: page, lastPage: read.data?.last_page ?? page, total: read.data?.total,
              onPrevious: () => setPage((value) => Math.max(1, value - 1)), onNext: () => setPage((value) => value + 1) }} />}
        </Card>
      </div>
      {selectedCode && <OwnershipDetailPanel key={selectedCode} code={selectedCode}
        onClose={() => setSelectedCode(null)} onChanged={refreshRegister} />}
    </div>
  </section>;
}
