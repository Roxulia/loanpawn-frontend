import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router";
import { Button, Input, Select } from "../../../components/atoms";
import { routePaths } from "../../../app/routes/paths";
import { Alert } from "../../../components/feedback";
import { Card, SearchField, SectionHeader } from "../../../components/molecules";
import { ModuleNavigation } from "../../../components/molecules/ModuleNavigation";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { usePermissions } from "../../auth";
import type { InventoryItem } from "../../inventory/types";
import { ownershipService } from "../services/ownershipService";
import type { ExpiredCollateral, OwnedItem, OwnershipMovement } from "../types";
import "../ownership.css";

export function OwnedItemsPage() {
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const isAcquisitionView = location.pathname === routePaths.ownershipAcquire;
  const isExpiredCollateralView = location.pathname === routePaths.ownershipExpiredCollateral;
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [expiredCollateral, setExpiredCollateral] = useState<ExpiredCollateral[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<ExpiredCollateral | null>(null);
  const [movements, setMovements] = useState<OwnershipMovement[]>([]);
  const [selected, setSelected] = useState<OwnedItem | null>(null);
  const [search, setSearch] = useState("");
  const [inventoryItemCode, setInventoryItemCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [acquiredAt, setAcquiredAt] = useState(new Date().toISOString().slice(0, 10));
  const [unitCost, setUnitCost] = useState("0");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [currencyCode, setCurrencyCode] = useState("MMK");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isExpiredCollateralView) {
        setExpiredCollateral(await ownershipService.expiredCollateral(search.trim()));
        setInventoryItems([]);
        setItems([]);
      } else {
        const physicalItems = await ownershipService.inventoryOptions();
        setInventoryItems(physicalItems);
        if (isAcquisitionView) {
          setItems([]);
        } else {
          setItems(await ownershipService.list(search.trim()));
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load ownership data.");
    } finally {
      setLoading(false);
    }
  }, [isAcquisitionView, isExpiredCollateralView, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 200);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function selectOwnedItem(item: OwnedItem) {
    setSelected(item);
    try {
      setMovements(await ownershipService.movements(item.code));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load ownership history.");
    }
  }

  async function createAcquisition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const selectedInventory = inventoryItems.find((item) => item.code === inventoryItemCode);
      if (!selectedInventory) throw new Error("Select an existing Inventory item.");
      await ownershipService.acquire({
        inventory_item_code: selectedInventory.code,
        quantity: Number(quantity),
        acquired_at: acquiredAt,
        unit_cost_basis: Number(unitCost),
        ...(estimatedValue ? { estimated_unit_value: Number(estimatedValue) } : {}),
        currency_code: currencyCode.trim().toUpperCase(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setNotice("Acquisition recorded.");
      setDescription("");
      setSelected(null);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record acquisition.");
    } finally {
      setWorking(false);
    }
  }


  // Prefill acquisition values from the server-applied collateral cost rule.
  function beginExpiredCollateralTransfer(item: ExpiredCollateral) {
    setSelectedTransfer(item);
    setUnitCost(String(item.recommended_unit_cost_basis));
    setEstimatedValue(String(item.estimated_unit_value));
    setCurrencyCode(item.currency_code);
    setAcquiredAt(new Date().toISOString().slice(0, 10));
    setDescription(`Transferred from expired slip ${item.slip_no ?? ""}`.trim());
  }

  // Submit the explicit ownership decision with an idempotency key.
  async function transferExpiredCollateral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTransfer) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      await ownershipService.transferExpiredCollateral(selectedTransfer.code, {
        acquired_at: acquiredAt,
        unit_cost_basis: Number(unitCost),
        ...(estimatedValue ? { estimated_unit_value: Number(estimatedValue) } : {}),
        currency_code: currencyCode.trim().toUpperCase(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setNotice(`${selectedTransfer.name} transferred to Owned Items.`);
      setSelectedTransfer(null);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to transfer expired collateral.");
    } finally {
      setWorking(false);
    }
  }
  const columns: Array<DataTableColumn<OwnedItem>> = [
    { header: "Item", key: "name", render: (item) => <><strong>{item.name}</strong><div>{item.description}</div></> },
    { header: "Owned", key: "owned_quantity", render: (item) => `${item.owned_quantity} ${item.unit ?? ""}` },
    { header: "Pledged", key: "pledged_quantity", render: (item) => `${item.pledged_quantity} ${item.unit ?? ""}` },
    { header: "Available", key: "available_quantity", render: (item) => `${item.available_quantity} ${item.unit ?? ""}` },
    { header: "Inventory location", key: "inventory_locations", render: (item) => item.inventory_locations.map((row) => `${row.location ?? "—"}: ${row.quantity}`).join(", ") || "—" },
    { header: "Acquisition lots", key: "lots", render: (item) => item.lots.length },
  ];


  const expiredCollateralColumns: Array<DataTableColumn<ExpiredCollateral>> = [
    { header: "Collateral", key: "name", render: (item) => <><strong>{item.name}</strong><div>{item.type}</div></> },
    { header: "Slip and customer", key: "slip", render: (item) => <><strong>{item.slip_no ?? "—"}</strong><div>{item.customer_name ?? "Unknown customer"}</div></> },
    { header: "Quantity", key: "quantity", render: (item) => item.quantity },
    { header: "Loan amount", key: "loan_amount", render: (item) => new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency_code, maximumFractionDigits: 0 }).format(item.loan_amount) },
    { header: "Estimated value", key: "estimated_value", render: (item) => new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency_code, maximumFractionDigits: 0 }).format(item.estimated_value) },
    { header: "Expired", key: "expire_at", render: (item) => item.expire_at ? new Date(item.expire_at).toLocaleDateString() : "—" },
    { header: "Action", key: "action", render: (item) => <Button type="button" variant="tertiary" onClick={() => beginExpiredCollateralTransfer(item)}>Review transfer</Button> },
  ];
  // Keep acquisition entry separate from the owned item register.
  const ownershipNavigation = [
    { label: "Owned items", to: routePaths.ownership },
    ...(hasPermission("create_owned_item") ? [{ label: "Record acquisition", to: routePaths.ownershipAcquire }] : []),
    ...(hasPermission("list_owned_item") ? [{ label: "Expired collateral", to: routePaths.ownershipExpiredCollateral }] : []),
  ];

  return (
    <section className="page ownership-page">
      <SectionHeader
        title={isExpiredCollateralView ? "Expired collateral" : isAcquisitionView ? "Record an acquisition" : "Ownership"}
        subtitle={isExpiredCollateralView ? "Review expired collateral still in tenant custody and transfer selected items into Owned Items." : isAcquisitionView
          ? "Record owned quantity and acquisition cost separately from physical stock receipt."
          : "Review owned, pledged, and available quantities with their acquisition history."}
      />
      <ModuleNavigation items={ownershipNavigation} label="Ownership pages" />
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Ownership action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Ownership updated" tone="success" />}

      {isAcquisitionView && hasPermission("create_owned_item") && (
        <Card title="New acquisition" description="Choose an Inventory item and record its quantity, cost, and currency as a separate lot.">
          <p className="ownership-lot-help">Each acquisition keeps its own cost and currency for accurate history.</p>
          <form className="ownership-form" onSubmit={(event) => void createAcquisition(event)}>
            <label>Inventory item<Select value={inventoryItemCode} onChange={(event) => setInventoryItemCode(event.target.value)} required>
              <option value="">Select an item</option>
              {inventoryItems.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.tracking_mode.replaceAll("_", " ")})</option>)}
            </Select></label>
            <label>Quantity<Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
            <label>Acquired date<Input type="date" value={acquiredAt} onChange={(event) => setAcquiredAt(event.target.value)} required /></label>
            <label>Unit cost<Input type="number" min="0" step="0.0001" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required /></label>
            <label>Estimated unit value<Input type="number" min="0" step="0.0001" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} /></label>
            <label>Lot currency<Input minLength={3} maxLength={3} value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())} required /></label>
            <label className="ownership-form__wide">Description<Input maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <div className="ownership-form__wide"><Button type="submit" variant="primary" isLoading={working}>Record acquisition</Button></div>
          </form>
        </Card>
      )}

      {/* Keep the expired collateral transfer workflow separate from the owned item register. */}
      {isExpiredCollateralView && (
        <div className="expired-collateral-page">
          <Card title="Expired collateral" description={`${expiredCollateral.length} eligible items`}>
            <div className="ownership-toolbar">
              <SearchField id="expired-collateral-search" label="Search expired collateral" placeholder="Search item, slip, or customer" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Button onClick={() => void loadData()}>Refresh</Button>
            </div>
            <div className="expired-collateral-desktop"><DataTable items={expiredCollateral} columns={expiredCollateralColumns} isLoading={loading} getItemId={(item) => item.code} getItemTitle={(item) => item.name} emptyTitle="No expired collateral to transfer" /></div>
            <div className="expired-collateral-mobile">
              {loading && <p>Loading expired collateral…</p>}
              {!loading && expiredCollateral.length === 0 && <p>No expired collateral to transfer.</p>}
              {expiredCollateral.map((item) => <article className="expired-collateral-mobile-card" key={item.code}>
                <div><strong>{item.name}</strong><span>{item.type} · Qty {item.quantity}</span></div>
                <div><span>Slip</span><strong>{item.slip_no ?? "—"} · {item.customer_name ?? "Unknown customer"}</strong></div>
                <div><span>Loan amount</span><strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency_code, maximumFractionDigits: 0 }).format(item.loan_amount)}</strong></div>
                <Button type="button" variant="tertiary" onClick={() => beginExpiredCollateralTransfer(item)}>Review transfer</Button>
              </article>)}
            </div>
          </Card>
          {selectedTransfer && <Card title="Review ownership transfer" description={`${selectedTransfer.name} · Slip ${selectedTransfer.slip_no ?? "—"}`}>
            <p className="expired-collateral-rule">{selectedTransfer.collateral_item_count === 1 ? `Single collateral entry: acquisition cost is prefilled from the slip loan amount (${selectedTransfer.loan_amount} ${selectedTransfer.currency_code}).` : `Multiple collateral entries: cost basis starts at zero; estimated unit value is prefilled from this item.`}</p>
            <form className="ownership-form" onSubmit={(event) => void transferExpiredCollateral(event)}>
              <label>Quantity<Input value={String(selectedTransfer.quantity)} readOnly /></label>
              <label>Acquired date<Input type="date" value={acquiredAt} onChange={(event) => setAcquiredAt(event.target.value)} required /></label>
              <label>Acquisition cost basis<Input type="number" min="0" step="0.0001" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required /></label>
              <label>Estimated unit value<Input type="number" min="0" step="0.0001" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} /></label>
              <label>Currency<Input minLength={3} maxLength={3} value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())} required /></label>
              <label className="ownership-form__wide">Description<Input maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <div className="ownership-form__wide expired-collateral-actions"><Button type="button" variant="secondary" onClick={() => setSelectedTransfer(null)}>Cancel</Button><Button type="submit" variant="primary" isLoading={working} disabled={!hasPermission("create_owned_item")}>Confirm transfer</Button></div>
            </form>
          </Card>}
        </div>
      )}

      {!isAcquisitionView && !isExpiredCollateralView && (
        <div className="ownership-workspace">
          <Card title="Owned item register" description={`${items.length} items`}>
            <div className="ownership-toolbar">
              <SearchField id="ownership-search" label="Search owned items" placeholder="Search item names" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Button onClick={() => void loadData()}>Refresh</Button>
            </div>
            <DataTable items={items} columns={columns} isLoading={loading} getItemId={(item) => item.code} getItemTitle={(item) => item.name} emptyTitle="No owned items yet" onRowClick={(item) => void selectOwnedItem(item)} />
          </Card>

          {selected && <Card title={`${selected.name} history`} description="Acquisition lots and ownership movements for this item.">
            <div className="ownership-detail-heading"><strong>{selected.owned_quantity} {selected.unit ?? ""} owned</strong><Button type="button" variant="tertiary" onClick={() => setSelected(null)}>Close details</Button></div>
            <div className="ownership-balance-grid"><div><span>Pledged</span><strong>{selected.pledged_quantity} {selected.unit ?? ""}</strong></div><div><span>Available</span><strong>{selected.available_quantity} {selected.unit ?? ""}</strong></div></div>
            <h3>Acquisition lots</h3>
            <div className="ownership-lots">
              {selected.lots.length === 0 && <p>No acquisition lots recorded.</p>}
              {selected.lots.map((lot) => <article className="ownership-lot" key={lot.code}>
                <strong>{lot.acquired_at} · {lot.acquired_quantity} acquired</strong>
                <span>Remaining {lot.remaining_quantity} · pledged {lot.pledged_quantity} · available {lot.available_quantity}</span>
                <span>Cost {lot.unit_cost_basis} {lot.currency_code} / unit{lot.estimated_unit_value ? ` · Value ${lot.estimated_unit_value} ${lot.currency_code} / unit` : ""}</span>
                {lot.description && <span>{lot.description}</span>}
              </article>)}
            </div>
            <h3>Ownership movements</h3>
            <DataTable items={movements} columns={[
              { header: "Date", key: "occurred_at", render: (movement) => movement.occurred_at },
              { header: "Change", key: "movement_type", render: (movement) => movement.movement_type.replaceAll("_", " ") },
              { header: "Quantity", key: "quantity", render: (movement) => movement.quantity },
              { header: "Owned change", key: "owned_delta", render: (movement) => movement.owned_delta },
              { header: "Pledged change", key: "pledged_delta", render: (movement) => movement.pledged_delta },
            ]} getItemId={(movement) => movement.code} getItemTitle={(movement) => movement.movement_type} emptyTitle="No ownership movements" />
          </Card>}
        </div>
      )}
    </section>
  );
}
