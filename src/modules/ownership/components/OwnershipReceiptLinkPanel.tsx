import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { SearchField } from "../../../components/molecules";
import { DataTable } from "../../../components/organisms";
import { isApiError } from "../../../dataobjects/common/api";
import { useUiLocale } from "../../../locales/UiLocale";
import { idempotencyKeyForPayload, clearIdempotencyKey, type IdempotencyKeyState } from "../../../services/http/idempotency";
import { usePermissions } from "../../auth";
import { useOwnershipRead } from "../hooks/useOwnershipRead";
import { buildReceiptLinkPayload } from "../quantity";
import { ownershipService } from "../services/ownershipService";
import type { AcquisitionLot, OwnershipDetail, OwnershipReceiptCandidate } from "../types";
import { OwnershipPiecePicker } from "./OwnershipPiecePicker";
import { OwnershipReadError } from "./OwnershipReadError";
import { ownershipErrorMessage } from "../errors";

type Props = { owner: OwnershipDetail; lot: AcquisitionLot; onSuccess: () => void; onReload: () => void; onClose: () => void };

export function OwnershipReceiptLinkPanel({ owner, lot, onSuccess, onReload, onClose }: Props) {
  const { t } = useUiLocale();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("manage_owned_item");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [receipt, setReceipt] = useState<OwnershipReceiptCandidate | null>(null);
  const [quantity, setQuantity] = useState("1.000");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [conflicted, setConflicted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intent = useRef<IdempotencyKeyState>(null);
  const submitting = useRef(false);
  const active = useRef(true);
  const load = useCallback(() => ownershipService.receiptCandidates(owner.code, lot.code, page, search.trim()),
    [owner.code, lot.code, page, search]);
  const read = useOwnershipRead(JSON.stringify([owner.code, lot.code, page, search, revision]), load, 200);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  function chooseReceipt(candidate: OwnershipReceiptCandidate) {
    // Changing source clears identities from the previous receipt, including selections on other pages.
    setReceipt(candidate);
    setSelectedCodes([]);
    setQuantity(owner.tracking_mode === "UNIQUE" ? "1.000" : candidate.remaining_to_link_quantity);
    setError(null);
  }

  function togglePiece(code: string, checked: boolean) {
    setSelectedCodes((codes) => checked ? [...codes.filter((value) => value !== code), code] : codes.filter((value) => value !== code));
  }

  function refreshCandidates() {
    // Explicit refresh requires a fresh selection; transport retries alone retain the original intent.
    setReceipt(null);
    setSelectedCodes([]);
    setRevision((value) => value + 1);
  }

  async function submitReceiptLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !canManage || !receipt || conflicted) return;
    submitting.current = true;
    setWorking(true);
    setError(null);
    try {
      const payload = buildReceiptLinkPayload(receipt.purchase_receipt_line_code, quantity, owner.update_key,
        owner.tracking_mode, selectedCodes, receipt.remaining_to_link_quantity);
      const key = idempotencyKeyForPayload(intent, { item: owner.code, lot: lot.code, ...payload });
      await ownershipService.linkReceipt(owner.code, lot.code, payload, key);
      if (!active.current) return;
      clearIdempotencyKey(intent);
      onSuccess();
    } catch (cause) {
      if (!active.current) return;
      if (isApiError(cause) && cause.statusCode === 409) {
        // Never silently resubmit a stale version; the user must reload and review current availability.
        setConflicted(true);
        setError("Ownership changed. Reload the item and review receipt availability before trying again.");
      } else {
        setError(ownershipErrorMessage(cause));
      }
    } finally {
      submitting.current = false;
      if (active.current) setWorking(false);
    }
  }

  return <section className="ownership-link-desktop ownership-link-mobile" aria-label={t("Link received goods")}>
    <div className="ownership-detail-heading"><h3>{t("Link received goods")}</h3>
      <Button type="button" variant="tertiary" disabled={working} onClick={onClose}>Cancel</Button></div>
    <p>{t("Link only received goods from this lot's purchase. This does not record another acquisition.")}</p>
    <p>{t("Lot")}: {lot.code}</p>
    {error && <Alert tone="danger" title="Ownership action failed" message={error} />}
    {conflicted ? <Button type="button" onClick={onReload}>Reload current item</Button> : <>
      <SearchField id="ownership-receipt-search" label="Search purchase receipts" value={search} disabled={working}
        onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <Button type="button" disabled={working} onClick={refreshCandidates}>Refresh candidates</Button>
      <OwnershipReadError error={read.error} retry={refreshCandidates} />
      {!read.error && <DataTable items={read.data?.items ?? []} isLoading={read.loading} showEmptyStructure
        getItemId={(candidate) => candidate.purchase_receipt_line_code} getItemTitle={(candidate) => candidate.purchase_receipt_line_code}
        emptyTitle="No receipt candidates" columns={[
          { header: "Receipt line", key: "receipt", render: (candidate) => candidate.purchase_receipt_line_code },
          { header: "Date", key: "date", render: (candidate) => candidate.received_at },
          { header: "Received quantity", key: "received", render: (candidate) => candidate.received_quantity },
          { header: "Remaining to link", key: "remaining", render: (candidate) => candidate.remaining_to_link_quantity },
          { header: "Action", key: "action", render: (candidate) => <Button type="button" variant="secondary"
            disabled={working || candidate.remaining_to_link_quantity === "0.000"} onClick={() => chooseReceipt(candidate)}>
            {receipt?.purchase_receipt_line_code === candidate.purchase_receipt_line_code ? "Selected" : "Select"}</Button> },
        ]} pagination={{ currentPage: page, lastPage: read.data?.last_page ?? page, total: read.data?.total,
          onPrevious: () => { if (!working) setPage((value) => Math.max(1, value - 1)); },
          onNext: () => { if (!working) setPage((value) => value + 1); } }} />}
      {receipt && <form className="ownership-link-form" onSubmit={(event) => void submitReceiptLink(event)}>
        <p>{t("Selected receipt")}: {receipt.purchase_receipt_line_code}</p>
        {owner.tracking_mode === "SERIALIZED" ? <OwnershipPiecePicker key={receipt.purchase_receipt_line_code}
          code={owner.code} lotCode={lot.code} receiptCode={receipt.purchase_receipt_line_code}
          selected={selectedCodes} disabled={working} onToggle={togglePiece} onClear={() => setSelectedCodes([])} /> :
          <label>{t("Quantity")}<Input type="text" inputMode="decimal" required maxLength={32}
            readOnly={owner.tracking_mode === "UNIQUE"} disabled={working} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>}
        <p>{t("If a request times out, retry unchanged to reuse its original request key.")}</p>
        <Button type="submit" variant="primary" isLoading={working} disabled={!canManage || (owner.tracking_mode === "SERIALIZED" && selectedCodes.length === 0)}>
          Link selected goods
        </Button>
      </form>}
    </>}
  </section>;
}
