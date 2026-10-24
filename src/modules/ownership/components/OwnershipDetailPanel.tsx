import { useCallback, useState } from "react";
import { Button } from "../../../components/atoms";
import { Alert, LoadingState } from "../../../components/feedback";
import { Card } from "../../../components/molecules";
import { useUiLocale } from "../../../locales/UiLocale";
import { usePermissions } from "../../auth";
import { useOwnershipRead } from "../hooks/useOwnershipRead";
import { ownershipService } from "../services/ownershipService";
import type { AcquisitionLot } from "../types";
import { OwnershipBalances } from "./OwnershipBalances";
import { OwnershipItemPhoto } from "./OwnershipItemPhoto";
import { OwnershipLotTable } from "./OwnershipLotTable";
import { OwnershipMovementTable } from "./OwnershipMovementTable";
import { OwnershipReadError } from "./OwnershipReadError";
import { OwnershipReceiptLinkPanel } from "./OwnershipReceiptLinkPanel";

type Props = { code: string; onClose: () => void; onChanged: () => void };

export function OwnershipDetailPanel({ code, onClose, onChanged }: Props) {
  const { t } = useUiLocale();
  const { hasPermission } = usePermissions();
  const [revision, setRevision] = useState(0);
  const [linkLot, setLinkLot] = useState<AcquisitionLot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(() => ownershipService.detail(code), [code]);
  const read = useOwnershipRead(JSON.stringify([code, revision]), load);
  const item = read.data;

  function reloadCurrentItem() {
    // Refresh the version and every independent child page; never reuse a stale candidate selection.
    setLinkLot(null);
    setRevision((value) => value + 1);
    onChanged();
  }

  function completeReceiptLink() {
    setNotice("Receipt linked. Ownership and receipt availability have been refreshed.");
    reloadCurrentItem();
  }

  return <aside className="ownership-detail-desktop ownership-detail-mobile" aria-label={t("Owned item detail")}>
    <Card title={item?.name ?? "Owned item detail"}>
      <div className="ownership-detail-heading">
        <Button type="button" disabled={read.loading} onClick={reloadCurrentItem}>Refresh current item</Button>
        <Button type="button" variant="tertiary" onClick={onClose}>Close details</Button>
      </div>
      {notice && <Alert tone="success" message={notice} onDismiss={() => setNotice(null)} />}
      <OwnershipReadError error={read.error} retry={reloadCurrentItem} />
      {read.loading && <LoadingState />}
      {item && <>
        <div className="ownership-photo-desktop ownership-photo-mobile"><OwnershipItemPhoto item={item} detail /></div>
        <p>{item.description}</p>
        <OwnershipBalances item={item} />
        <p className="ownership-lot-help">{t("Available ownership is not sellable stock. Sale eligibility also requires received, linked goods in an eligible location.")}</p>
        {item.pending_link_quantity !== "0.000" && <Alert tone="warning" title="Received goods need linking"
          message={hasPermission("manage_owned_item") ? "Choose an acquisition lot below to link its received goods." : "Ask a user with ownership management permission to link received goods."} />}
        {item.awaiting_receipt_quantity !== "0.000" && <p>{t("Awaiting receipt")}: {item.awaiting_receipt_quantity} {item.unit_name ?? ""}</p>}
        <h3>{t("Physical locations")}</h3>
        {item.locations.length === 0 ? <p>{t("No physical stock recorded.")}</p> : <ul>{item.locations.map((balance) =>
          <li key={balance.location.code}>{balance.location.name}: {balance.quantity} {item.unit_name ?? ""}</li>)}</ul>}
        {linkLot && <OwnershipReceiptLinkPanel key={`${code}:${linkLot.code}:${item.update_key}`} owner={item} lot={linkLot}
          onClose={() => setLinkLot(null)} onReload={reloadCurrentItem} onSuccess={completeReceiptLink} />}
        <OwnershipLotTable key={`lots:${revision}`} code={code} canManage={hasPermission("manage_owned_item")} onLink={setLinkLot} />
        <OwnershipMovementTable key={`movements:${revision}`} code={code} />
      </>}
    </Card>
  </aside>;
}
