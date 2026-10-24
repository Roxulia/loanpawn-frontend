import { useCallback, useState } from "react";
import { SearchField } from "../../../components/molecules";
import { Input } from "../../../components/atoms";
import { DataTable } from "../../../components/organisms";
import { useUiLocale } from "../../../locales/UiLocale";
import { useOwnershipRead } from "../hooks/useOwnershipRead";
import { ownershipService } from "../services/ownershipService";
import { OwnershipReadError } from "./OwnershipReadError";

type Props = { code: string; lotCode: string; receiptCode: string; selected: string[]; disabled: boolean;
  onToggle: (code: string, selected: boolean) => void; onClear: () => void };

export function OwnershipPiecePicker({ code, lotCode, receiptCode, selected, disabled, onToggle, onClear }: Props) {
  const { t } = useUiLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const load = useCallback(() => ownershipService.pieceCandidates(code, lotCode, receiptCode, page, search.trim()),
    [code, lotCode, receiptCode, page, search]);
  const read = useOwnershipRead(JSON.stringify([code, lotCode, receiptCode, page, search, revision]), load, 200);
  const selectedSet = new Set(selected);
  return <div className="ownership-pieces-desktop ownership-pieces-mobile">
    <SearchField id="ownership-piece-search" label="Search received pieces" value={search} disabled={disabled}
      onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
    <p>{t("Selected pieces")}: {selected.length}</p>
    <OwnershipReadError error={read.error} retry={() => { onClear(); setRevision((value) => value + 1); }} />
    {!read.error && <DataTable items={read.data?.items ?? []} isLoading={read.loading} showEmptyStructure
      getItemId={(piece) => piece.code} getItemTitle={(piece) => piece.identifier ?? piece.code}
      emptyTitle="No received pieces" columns={[
        { header: "Select", key: "select", render: (piece) => <Input type="checkbox" aria-label={`${t("Select")}: ${piece.identifier ?? piece.code}`}
          checked={selectedSet.has(piece.code)} disabled={disabled || (!piece.is_eligible && !selectedSet.has(piece.code))}
          onChange={(event) => onToggle(piece.code, event.target.checked)} /> },
        { header: "Identifier", key: "identifier", render: (piece) => piece.identifier ?? piece.code },
        { header: "Location", key: "location", render: (piece) => piece.location_name ?? "\u2014" },
        { header: "Status", key: "status", render: (piece) => t(piece.is_eligible ? "Available for linking" : "Unavailable for linking") },
      ]} pagination={{ currentPage: page, lastPage: read.data?.last_page ?? page, total: read.data?.total,
        onNext: () => { if (!disabled) setPage((value) => value + 1); },
        onPrevious: () => { if (!disabled) setPage((value) => Math.max(1, value - 1)); } }} />}
  </div>;
}
