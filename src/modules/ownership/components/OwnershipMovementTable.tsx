import { useCallback, useState } from "react";
import { DataTable } from "../../../components/organisms";
import { useUiLocale } from "../../../locales/UiLocale";
import { ownershipMovementLabel } from "../movementLabels";
import { useOwnershipRead } from "../hooks/useOwnershipRead";
import { ownershipService } from "../services/ownershipService";
import { OwnershipReadError } from "./OwnershipReadError";

export function OwnershipMovementTable({ code }: { code: string }) {
  const { t } = useUiLocale();
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const load = useCallback(() => ownershipService.movements(code, page), [code, page]);
  const read = useOwnershipRead(JSON.stringify([code, page, revision]), load);
  return <section><h3>{t("Ownership movements")}</h3>
    <OwnershipReadError error={read.error} retry={() => setRevision((value) => value + 1)} />
    {!read.error && <DataTable items={read.data?.items ?? []} isLoading={read.loading} showEmptyStructure
      getItemId={(row) => row.code} getItemTitle={(row) => t(ownershipMovementLabel(row.operation))}
      emptyTitle="No ownership movements" columns={[
        { header: "Date", key: "date", render: (row) => row.occurred_at },
        { header: "Ownership action", key: "change", render: (row) => t(ownershipMovementLabel(row.operation)) },
        { header: "Quantity", key: "quantity", render: (row) => row.quantity },
        { header: "Owned change", key: "owned", render: (row) => row.owned_delta },
        { header: "Reserved change", key: "reserved", render: (row) => row.reserved_delta },
        { header: "Pledged change", key: "pledged", render: (row) => row.pledged_delta },
      ]} pagination={{ currentPage: page, lastPage: read.data?.last_page ?? page, total: read.data?.total,
        onPrevious: () => setPage((value) => Math.max(1, value - 1)), onNext: () => setPage((value) => value + 1) }} />}
  </section>;
}
