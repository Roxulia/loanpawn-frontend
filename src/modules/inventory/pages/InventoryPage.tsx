import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router";
import { routePaths } from "../../../app/routes/paths";
import { Button, Input, Select } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { Card, SearchField, SectionHeader } from "../../../components/molecules";
import { ModuleNavigation } from "../../../components/molecules/ModuleNavigation";
import { DataTable, type DataTableColumn } from "../../../components/organisms";
import { useFeatures, usePermissions } from "../../auth";
import { CatalogItemSelect } from "../../catalog/components/CatalogItemSelect";
import type { CatalogItem } from "../../catalog/types";
import { inventoryService } from "../services/inventoryService";
import type {
  InventoryItem,
  InventoryLocation,
  InventoryMovement,
} from "../types";
import "../inventory.css";

const locationTypes: InventoryLocation["type"][] = [
  "SHOP",
  "STORAGE",
  "VAULT",
  "DISPLAY",
  "LENDER",
  "OTHER",
];

export function InventoryPage() {
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [activeAction, setActiveAction] = useState<"move" | "issue" | "adjust" | null>(null);
  const { hasEnabledFeature } = useFeatures();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catalogCode, setCatalogCode] = useState("");
  const [receiveItemCode, setReceiveItemCode] = useState("");
  const [trackingMode, setTrackingMode] = useState<InventoryItem["tracking_mode"]>("QUANTITY");
  const [unitCode, setUnitCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [locationCode, setLocationCode] = useState("");
  const [fromLocationCode, setFromLocationCode] = useState("");
  const [toLocationCode, setToLocationCode] = useState("");
  const [serializedItemIdentifiers, setSerializedItemIdentifiers] = useState("");
  const [serializedItemCodes, setSerializedItemCodes] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState<InventoryLocation["type"]>("SHOP");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventoryItems, inventoryLocations] = await Promise.all([
        inventoryService.list(search.trim()),
        inventoryService.locations(),
      ]);
      setItems(inventoryItems);
      setLocations(inventoryLocations);
      setLocationCode((current) => current || inventoryLocations[0]?.code || "");
      setFromLocationCode((current) => current || inventoryLocations[0]?.code || "");
      setToLocationCode((current) => current || inventoryLocations[1]?.code || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function selectItem(item: InventoryItem) {
    setSelected(item);
    try {
      const history = await inventoryService.movements(item.code);
      setMovements(history);
      setSerializedItemCodes([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load movement history.");
    }
  }

  function selectCatalogItem(_id: string, item: CatalogItem | null) {
    setCatalogCode(item?.business_code ?? "");
    if (item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setTrackingMode(item.tracking_mode);
      setUnitCode(item.unit_code);
    }
  }

  async function receiveStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    try {
      await inventoryService.receive({
        inventory_item_code: receiveItemCode || undefined,
        name: receiveItemCode ? undefined : name.trim(),
        description: receiveItemCode ? undefined : description.trim() || undefined,
        catalog_item_code: receiveItemCode || !catalogCode ? undefined : catalogCode,
        tracking_mode: receiveItemCode ? undefined : trackingMode,
        unit_code: receiveItemCode ? undefined : unitCode || undefined,
        location_code: locationCode,
        quantity: Number(quantity),
        serialized_item_identifiers: (receiveItemCode
          ? items.find((item) => item.code === receiveItemCode)?.tracking_mode
          : trackingMode) === "SERIALIZED"
          ? serializedItemIdentifiers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
          : undefined,
      });
      setNotice("Inventory received.");
      setName("");
      setDescription("");
      setCatalogCode("");
      setReceiveItemCode("");
      setSerializedItemIdentifiers("");
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to receive inventory.");
    } finally {
      setWorking(false);
    }
  }

  async function moveStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement(() => inventoryService.moveStock({
      inventory_item_code: selected.code,
      from_location_code: fromLocationCode,
      to_location_code: toLocationCode,
      update_key: selected.update_key,
      quantity: Number(quantity),
      serialized_item_codes: serializedItemCodes,
      reason: reason.trim() || undefined,
    }));
  }

  async function issueStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement(() => inventoryService.issueStock({
      inventory_item_code: selected.code,
      location_code: locationCode,
      quantity: Number(quantity),
      serialized_item_codes: serializedItemCodes,
      reason: reason.trim() || undefined,
    }));
  }

  async function adjustStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement(() => inventoryService.adjustStock({
      inventory_item_code: selected.code,
      location_code: locationCode,
      quantity: Number(quantity),
      direction,
      serialized_item_codes: serializedItemCodes,
      serialized_item_identifiers: direction === "IN"
        ? serializedItemIdentifiers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
        : undefined,
      reason: reason.trim(),
    }));
  }

  async function performMovement(operation: () => Promise<unknown>) {
    setWorking(true);
    setError(null);
    try {
      await operation();
      setNotice("Inventory movement recorded.");
      if (selected) await selectItem(selected);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to record inventory movement.");
    } finally {
      setWorking(false);
    }
  }

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    try {
      await inventoryService.createLocation({ name: locationName.trim(), type: locationType });
      setLocationName("");
      setNotice("Location created.");
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create location.");
    } finally {
      setWorking(false);
    }
  }

  const columns: Array<DataTableColumn<InventoryItem>> = [
    {
      header: "Item",
      key: "name",
      render: (item) => <><strong>{item.name}</strong><div>{item.description}</div></>,
    },
    { header: "Tracking", key: "tracking_mode", render: (item) => item.tracking_mode },
    { header: "On hand", key: "total_quantity", render: (item) => `${item.total_quantity} ${item.unit ?? ""}` },
    {
      header: "Locations",
      key: "locations",
      render: (item) => item.locations.map((row) => `${row.location}: ${row.quantity}`).join(", ") || "—",
    },
  ];

  // Keep receiving and location maintenance on dedicated routes.
  const isReceiveView = location.pathname === routePaths.inventoryReceive;
  const isLocationsView = location.pathname === routePaths.inventoryLocations;
  const inventoryNavigation = [
    { label: "Items", to: routePaths.inventory },
    ...(hasPermission("receive_inventory") ? [{ label: "Receive stock", to: routePaths.inventoryReceive }] : []),
    { label: "Locations", to: routePaths.inventoryLocations },
  ];
  const availableActions = [
    ...(hasPermission("move_inventory") ? ["move" as const] : []),
    ...(hasPermission("issue_inventory") ? ["issue" as const] : []),
    ...(hasPermission("adjust_inventory") ? ["adjust" as const] : []),
  ];
  // Show one stock operation at a time for the selected item.
  const selectedAction = activeAction && availableActions.includes(activeAction)
    ? activeAction
    : availableActions[0] ?? null;

  return (
    <section className="page inventory-page">
      <SectionHeader
        title={isReceiveView ? "Receive stock" : isLocationsView ? "Inventory locations" : "Inventory"}
        subtitle={isReceiveView
          ? "Record new stock or add units to an existing inventory item."
          : isLocationsView
            ? "Manage the places where inventory is held. Locations describe custody, not ownership."
            : "Track physical items, current quantities, and stock movements."}
      />
      <ModuleNavigation items={inventoryNavigation} label="Inventory pages" />
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Inventory action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Inventory updated" tone="success" />}

      {isReceiveView && hasPermission("receive_inventory") && (
        <Card title="Receive inventory" description="Only physically received goods increase stock.">
          <form className="inventory-form" onSubmit={(event) => void receiveStock(event)}>
            <label>
              Existing item (optional)
              <Select value={receiveItemCode} onChange={(event) => {
                const nextId = event.target.value;
                setReceiveItemCode(nextId);
                const existing = items.find((item) => item.code === nextId);
                if (existing) { setTrackingMode(existing.tracking_mode); setName(existing.name); }
              }}>
                <option value="">Create a new inventory item</option>
                {items.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.tracking_mode}</option>)}
              </Select>
            </label>
            {hasEnabledFeature("catalog_management") && !receiveItemCode && (
              <div className="inventory-form__wide">
                <label htmlFor="inventory-catalog-item">Catalog item (optional)</label>
                <CatalogItemSelect id="inventory-catalog-item" value={catalogCode} onChange={selectCatalogItem} />
              </div>
            )}
            <label>Item name<Input value={name} onChange={(event) => setName(event.target.value)} required={!receiveItemCode} disabled={Boolean(receiveItemCode)} /></label>
            <label>Description<Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={Boolean(receiveItemCode)} /></label>
            <label>Tracking mode<Select value={trackingMode} disabled={Boolean(receiveItemCode || catalogCode)} onChange={(event) => setTrackingMode(event.target.value as InventoryItem["tracking_mode"])}>
              <option value="UNIQUE">Unique</option><option value="SERIALIZED">Serialized</option><option value="QUANTITY">Quantity</option>
            </Select></label>
            <label>Measurement unit<MeasurementUnitSelect unitCode={unitCode} onChange={setUnitCode} disabled={Boolean(receiveItemCode || catalogCode)} /></label>
            <label>Location<LocationSelect locations={locations} value={locationCode} onChange={setLocationCode} /></label>
            <label>Quantity<Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
            {trackingMode === "SERIALIZED" && <label className="inventory-form__wide">Serial or IMEI identifiers, one per line<textarea value={serializedItemIdentifiers} onChange={(event) => setSerializedItemIdentifiers(event.target.value)} rows={3} /></label>}
            <div className="inventory-form__wide"><Button type="submit" variant="primary" isLoading={working}>Receive stock</Button></div>
          </form>
        </Card>
      )}

      {isLocationsView && (
        <div className="inventory-location-layout">
          <Card title="Locations" description={`${locations.length} locations`}>
            <ul className="inventory-location-list">
              {locations.map((item) => <li key={item.code}><strong>{item.name}</strong><span>{item.type} · {item.is_active ? "Active" : "Inactive"}</span></li>)}
            </ul>
          </Card>
          {hasPermission("manage_inventory_locations") && <Card title="Add a location" description="Use clear names for shops, storage rooms, vaults, or external custody.">
            <form className="inventory-form" onSubmit={(event) => void addLocation(event)}>
              <label>Location name<Input value={locationName} onChange={(event) => setLocationName(event.target.value)} required /></label>
              <label>Location type<Select value={locationType} onChange={(event) => setLocationType(event.target.value as InventoryLocation["type"])}>
                {locationTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
              </Select></label>
              <Button type="submit" isLoading={working}>Add location</Button>
            </form>
          </Card>}
        </div>
      )}

      {!isReceiveView && !isLocationsView && (
        <div className="inventory-workspace">
          <Card title="Items" description={`${items.length} inventory items`}>
            <div className="inventory-toolbar">
              <SearchField id="inventory-search" label="Search inventory" placeholder="Search item names" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Button onClick={() => void loadData()}>Refresh</Button>
            </div>
            <DataTable items={items} columns={columns} isLoading={loading} getItemId={(item) => item.code} getItemTitle={(item) => item.name} emptyTitle="No inventory items yet" emptyDescription="Receive stock to start tracking physical inventory." onRowClick={(item) => void selectItem(item)} />
          </Card>
          {selected && <Card title={selected.name} description={`${selected.tracking_mode.replaceAll("_", " ")} · ${selected.total_quantity} ${selected.unit ?? ""} on hand`}>
            <div className="inventory-location-breakdown">{selected.locations.map((row) => <div key={row.location_code ?? row.location}><span>{row.location ?? "Unassigned"}</span><strong>{row.quantity} {selected.unit ?? ""}</strong></div>)}</div>
            {selected.serialized_items.length > 0 && <details className="inventory-serialized-item-list"><summary>Serialized items ({selected.serialized_items.length})</summary><div>{selected.serialized_items.map((unit) => <label key={unit.code}><input type="checkbox" checked={serializedItemCodes.includes(unit.code)} disabled={unit.location_code === null} onChange={(event) => setSerializedItemCodes((current) => event.target.checked ? [...current, unit.code] : current.filter((code) => code !== unit.code))} />{unit.identifier || `Serialized item ${unit.code}`} · {unit.location ?? "Issued"}</label>)}</div></details>}
            {availableActions.length > 0 && <div className="inventory-action-area">
              <div className="inventory-action-picker" role="group" aria-label="Stock action">{availableActions.map((action) => <Button key={action} type="button" variant={selectedAction === action ? "primary" : "tertiary"} onClick={() => setActiveAction(action)}>{action === "move" ? "Move" : action === "issue" ? "Issue" : "Adjust"}</Button>)}</div>
              {selectedAction === "move" && <form className="inventory-single-action" onSubmit={(event) => void moveStock(event)}><h3>Move stock</h3><label>From<LocationSelect locations={locations} value={fromLocationCode} onChange={setFromLocationCode} /></label><label>To<LocationSelect locations={locations} value={toLocationCode} onChange={setToLocationCode} /></label><label>Quantity<QuantityInput value={quantity} onChange={setQuantity} /></label><label>Reason<Input aria-label="Movement reason" placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} /></label><Button type="submit" isLoading={working}>Record move</Button></form>}
              {selectedAction === "issue" && <form className="inventory-single-action" onSubmit={(event) => void issueStock(event)}><h3>Issue stock</h3><label>From location<LocationSelect locations={locations} value={locationCode} onChange={setLocationCode} /></label><label>Quantity<QuantityInput value={quantity} onChange={setQuantity} /></label><label>Reason<Input aria-label="Issue reason" placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} /></label><Button type="submit" isLoading={working}>Record issue</Button></form>}
              {selectedAction === "adjust" && <form className="inventory-single-action" onSubmit={(event) => void adjustStock(event)}><h3>Stock adjustment</h3><label>Direction<Select value={direction} onChange={(event) => setDirection(event.target.value as "IN" | "OUT")}><option value="IN">Add stock</option><option value="OUT">Remove stock</option></Select></label><label>Location<LocationSelect locations={locations} value={locationCode} onChange={setLocationCode} /></label><label>Quantity<QuantityInput value={quantity} onChange={setQuantity} /></label>{selected.tracking_mode === "SERIALIZED" && direction === "IN" && <label>Serial or IMEI identifiers<textarea aria-label="Serialized item identifiers" placeholder="One identifier per line" value={serializedItemIdentifiers} onChange={(event) => setSerializedItemIdentifiers(event.target.value)} rows={2} /></label>}<label>Reason<Input aria-label="Adjustment reason" placeholder="Required" value={reason} onChange={(event) => setReason(event.target.value)} required /></label><Button type="submit" isLoading={working}>Record adjustment</Button></form>}
            </div>}
            <section className="inventory-history"><h3>Movement history</h3><DataTable items={movements} columns={[
              { header: "Date", key: "occurred_at", render: (movement) => new Date(movement.occurred_at).toLocaleString() },
              { header: "Movement", key: "type", render: (movement) => movement.type.replaceAll("_", " ") },
              { header: "Quantity", key: "quantity", render: (movement) => movement.quantity },
              { header: "From / to", key: "route", render: (movement) => `${movement.from ?? "—"} → ${movement.to ?? "—"}` },
              { header: "Reason", key: "reason", render: (movement) => movement.reason ?? "—" },
            ]} isLoading={false} getItemId={(movement) => movement.code} getItemTitle={(movement) => movement.type} emptyTitle="No movements recorded" /></section>
          </Card>}
        </div>
      )}
    </section>
  );
}

function LocationSelect({
  locations,
  value,
  onChange,
}: {
  locations: InventoryLocation[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} required>
      {locations.filter((location) => location.is_active).map((location) => (
        <option key={location.code} value={location.code}>{location.name}</option>
      ))}
    </Select>
  );
}

function MeasurementUnitSelect({
  unitCode,
  onChange,
  disabled,
}: {
  unitCode: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [units, setUnits] = useState<Array<{ code: string; name: string; symbol: string | null }>>([]);
  useEffect(() => {
    void inventoryService.measurementUnits().then(setUnits).catch(() => setUnits([]));
  }, []);

  return (
    <Select value={unitCode} disabled={disabled} onChange={(event) => onChange(event.target.value)} required>
      {units.map((unit) => (
        <option key={unit.code} value={unit.code}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ""}</option>
      ))}
    </Select>
  );
}

function QuantityInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      aria-label="Quantity"
      type="number"
      min="0.001"
      step="0.001"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
    />
  );
}
