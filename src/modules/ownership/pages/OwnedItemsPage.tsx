import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { Card, SearchField, SectionHeader } from "../../../components/molecules";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { useUiLocale } from "../../../locales/UiLocale";
import { usePermissions } from "../../auth";
import type { InventoryItem } from "../../inventory/types";
import { ownershipService } from "../services/ownershipService";
import type { OwnedItem, OwnershipMovement } from "../types";
import "../ownership.css";

export function OwnedItemsPage() {
  const { t } = useUiLocale();
  const { hasPermission } = usePermissions();
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
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
      const [ownedItems, physicalItems] = await Promise.all([
        ownershipService.list(search.trim()),
        ownershipService.inventoryOptions(),
      ]);
      setItems(ownedItems);
      setInventoryItems(physicalItems);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load owned items.");
    } finally {
      setLoading(false);
    }
  }, [search]);

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

  const columns: Array<DataTableColumn<OwnedItem>> = [
    { header: "Item", key: "name", render: (item) => <><strong>{item.name}</strong><div>{item.description}</div></> },
    { header: "Owned", key: "owned_quantity", render: (item) => `${item.owned_quantity} ${item.unit ?? ""}` },
    { header: "Pledged", key: "pledged_quantity", render: (item) => `${item.pledged_quantity} ${item.unit ?? ""}` },
    { header: "Available", key: "available_quantity", render: (item) => `${item.available_quantity} ${item.unit ?? ""}` },
    { header: "Inventory location", key: "inventory_locations", render: (item) => item.inventory_locations.map((row) => `${row.location ?? "—"}: ${row.quantity}`).join(", ") || "—" },
    { header: "Acquisition lots", key: "lots", render: (item) => item.lots.length },
  ];

  return (
    <section className="page">
      <SectionHeader title="Owned Items" subtitle="Track what the tenant owns, acquisition costs, pledged amounts, and physical locations." />
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Ownership action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Ownership updated" tone="success" />}

      <Card title="Owned Items" description={`${items.length} items`}>
        <div className="ownership-toolbar">
          <SearchField id="ownership-search" label="Search owned items" placeholder="Search item names" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button onClick={() => void loadData()}>Refresh</Button>
        </div>
        <DataTable items={items} columns={columns} isLoading={loading} getItemId={(item) => item.code} getItemTitle={(item) => item.name} emptyTitle="No owned items yet" onRowClick={(item) => void selectOwnedItem(item)} />
      </Card>

      {hasPermission("create_owned_item") && (
        <Card title="Record ownership acquisition" description="Select an existing Inventory item. This records ownership and cost without receiving physical stock.">
          <p className="ownership-lot-help">{t("Each time an item is acquired, record its quantity, cost, and currency separately.")}</p>
          <form className="ownership-form" onSubmit={(event) => void createAcquisition(event)}>
            <label>{t("Inventory item")}<Select value={inventoryItemCode} onChange={(event) => setInventoryItemCode(event.target.value)} required>
              <option value="">Select an item</option>
              {inventoryItems.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.tracking_mode})</option>)}
            </Select></label>
            <label>{t("Quantity")}<Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
            <label>{t("Acquired date")}<Input type="date" value={acquiredAt} onChange={(event) => setAcquiredAt(event.target.value)} required /></label>
            <label>{t("Unit cost")}<Input type="number" min="0" step="0.0001" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required /></label>
            <label>{t("Estimated unit value")}<Input type="number" min="0" step="0.0001" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} /></label>
            <label>{t("Lot currency")}<Input minLength={3} maxLength={3} value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())} required /></label>
            <label className="ownership-form__wide">{t("Description")}<Input maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <Button type="submit" variant="primary" isLoading={working}>Record acquisition</Button>
          </form>
        </Card>
      )}

      {selected && (
        <Card title={`${selected.name} history`} description="Each lot keeps its own cost and currency; movements determine the current Ownership balances.">
          <h3>{t("Acquisition history")}</h3>
          <div className="ownership-lots">
            {selected.lots.map((lot) => <article className="ownership-lot" key={lot.code}>
              <strong>{lot.acquired_at} · {lot.acquired_quantity} acquired</strong>
              <span>Remaining {lot.remaining_quantity} · pledged {lot.pledged_quantity} · available {lot.available_quantity}</span>
              <span>Cost {lot.unit_cost_basis} {lot.currency_code} / unit{lot.estimated_unit_value ? ` · Value ${lot.estimated_unit_value} ${lot.currency_code} / unit` : ""}</span>
              {lot.description && <span>{lot.description}</span>}
            </article>)}
          </div>
          <DataTable items={movements} columns={[
            { header: "Date", key: "occurred_at", render: (movement) => movement.occurred_at },
            { header: "Change", key: "movement_type", render: (movement) => movement.movement_type },
            { header: "Quantity", key: "quantity", render: (movement) => movement.quantity },
            { header: "Owned delta", key: "owned_delta", render: (movement) => movement.owned_delta },
            { header: "Pledged delta", key: "pledged_delta", render: (movement) => movement.pledged_delta },
          ]} getItemId={(movement) => movement.code} getItemTitle={(movement) => movement.movement_type} emptyTitle="No ownership movements" />
        </Card>
      )}
    </section>
  );
}
