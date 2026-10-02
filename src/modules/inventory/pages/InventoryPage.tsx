import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { Card, SearchField, SectionHeader } from "../../../components/molecules";
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
  const [unitIdentifiers, setUnitIdentifiers] = useState("");
  const [unitCodes, setUnitCodes] = useState<string[]>([]);
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
      setUnitCodes([]);
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
        unit_identifiers: (receiveItemCode
          ? items.find((item) => item.code === receiveItemCode)?.tracking_mode
          : trackingMode) === "SERIALIZED"
          ? unitIdentifiers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
          : undefined,
      });
      setNotice("Inventory received.");
      setName("");
      setDescription("");
      setCatalogCode("");
      setReceiveItemCode("");
      setUnitIdentifiers("");
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
    await performMovement(() => inventoryService.move({
      inventory_item_code: selected.code,
      from_location_code: fromLocationCode,
      to_location_code: toLocationCode,
      quantity: Number(quantity),
      inventory_unit_codes: unitCodes,
      reason: reason.trim() || undefined,
    }));
  }

  async function issueStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement(() => inventoryService.issue({
      inventory_item_code: selected.code,
      location_code: locationCode,
      quantity: Number(quantity),
      inventory_unit_codes: unitCodes,
      reason: reason.trim() || undefined,
    }));
  }

  async function adjustStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement(() => inventoryService.adjust({
      inventory_item_code: selected.code,
      location_code: locationCode,
      quantity: Number(quantity),
      direction,
      inventory_unit_codes: unitCodes,
      unit_identifiers: direction === "IN"
        ? unitIdentifiers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
        : undefined,
      reason: reason.trim(),
    }));
  }

  async function performMovement(operation: () => Promise<InventoryItem>) {
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

  return (
    <section className="page">
      <SectionHeader
        title="Inventory"
        subtitle="Track physical items, where they are, and their movement history."
      />
      {error && <Alert message={error} onDismiss={() => setError(null)} title="Inventory action failed" tone="danger" />}
      {notice && <Alert message={notice} onDismiss={() => setNotice(null)} title="Inventory updated" tone="success" />}

      <Card title="Inventory Items" description={`${items.length} items`}>
        <div className="inventory-toolbar">
          <SearchField
            id="inventory-search"
            label="Search inventory"
            placeholder="Search item names"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onClick={() => void loadData()}>Refresh</Button>
        </div>
        <DataTable
          items={items}
          columns={columns}
          isLoading={loading}
          getItemId={(item) => item.code}
          getItemTitle={(item) => item.name}
          emptyTitle="No inventory yet"
          onRowClick={(item) => void selectItem(item)}
        />
      </Card>

      {hasPermission("receive_inventory") && (
        <Card title="Receive Inventory" description="Only physically received goods increase stock.">
          <form className="inventory-form" onSubmit={(event) => void receiveStock(event)}>
            <label>
              Existing inventory item (optional)
              <Select
                value={receiveItemCode}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setReceiveItemCode(nextId);
                  const existing = items.find((item) => item.code === nextId);
                  if (existing) {
                    setTrackingMode(existing.tracking_mode);
                    setName(existing.name);
                  }
                }}
              >
                <option value="">Create a new inventory item</option>
                {items.map((item) => (
                  <option key={item.code} value={item.code}>{item.name} · {item.tracking_mode}</option>
                ))}
              </Select>
            </label>
            {hasEnabledFeature("catalog_management") && !receiveItemCode && (
              <div className="inventory-form__wide">
                <label htmlFor="inventory-catalog-item">Reusable catalog item (optional)</label>
                <CatalogItemSelect id="inventory-catalog-item" value={catalogCode} onChange={selectCatalogItem} />
              </div>
            )}
            <label>
              Item name
              <Input value={name} onChange={(event) => setName(event.target.value)} required={!receiveItemCode} disabled={Boolean(receiveItemCode)} />
            </label>
            <label>
              Description
              <Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={Boolean(receiveItemCode)} />
            </label>
            <label>
              Tracking mode
              <Select value={trackingMode} disabled={Boolean(receiveItemCode || catalogCode)} onChange={(event) => setTrackingMode(event.target.value as InventoryItem["tracking_mode"])}>
                <option value="UNIQUE">Unique</option>
                <option value="SERIALIZED">Serialized</option>
                <option value="QUANTITY">Quantity</option>
              </Select>
            </label>
            <label>
              Unit
              <UnitSelect unitCode={unitCode} onChange={setUnitCode} disabled={Boolean(receiveItemCode || catalogCode)} />
            </label>
            <label>
              Location
              <LocationSelect locations={locations} value={locationCode} onChange={setLocationCode} />
            </label>
            <label>
              Quantity
              <Input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </label>
            {trackingMode === "SERIALIZED" && (
              <label className="inventory-form__wide">
                Serial / IMEI identifiers, one per line
                <textarea value={unitIdentifiers} onChange={(event) => setUnitIdentifiers(event.target.value)} rows={3} />
              </label>
            )}
            <div className="inventory-form__wide">
              <Button type="submit" variant="primary" isLoading={working}>Receive</Button>
            </div>
          </form>
        </Card>
      )}

      {selected && (
        <Card title={selected.name} description={`${selected.tracking_mode} · ${selected.total_quantity} ${selected.unit ?? ""}`}>
          {selected.units.length > 0 && (
            <div className="inventory-unit-list">
              <h3>Serialized Units</h3>
              {selected.units.map((unit) => (
                <label key={unit.code}>
                  <input
                    type="checkbox"
                    checked={unitCodes.includes(unit.code)}
                    disabled={unit.location_code === null}
                    onChange={(event) => setUnitIds((current) => event.target.checked
                      ? [...current, unit.code]
                      : current.filter((code) => code !== unit.code))}
                  />
                  {unit.identifier || `Unit ${unit.code}`} · {unit.location ?? "Issued"}
                </label>
              ))}
            </div>
          )}
          <div className="inventory-actions-grid">
            {hasPermission("move_inventory") && (
              <form onSubmit={(event) => void moveStock(event)}>
                <h3>Move</h3>
                <LocationSelect locations={locations} value={fromLocationCode} onChange={setFromLocationCode} />
                <LocationSelect locations={locations} value={toLocationCode} onChange={setToLocationCode} />
                <QuantityInput value={quantity} onChange={setQuantity} />
                <Input aria-label="Movement reason" placeholder="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} />
                <Button type="submit" isLoading={working}>Move stock</Button>
              </form>
            )}
            {hasPermission("issue_inventory") && (
              <form onSubmit={(event) => void issueStock(event)}>
                <h3>Issue</h3>
                <LocationSelect locations={locations} value={locationCode} onChange={setLocationCode} />
                <QuantityInput value={quantity} onChange={setQuantity} />
                <Input aria-label="Issue reason" placeholder="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} />
                <Button type="submit" isLoading={working}>Issue stock</Button>
              </form>
            )}
            {hasPermission("adjust_inventory") && (
              <form onSubmit={(event) => void adjustStock(event)}>
                <h3>Audited Adjustment</h3>
                <Select value={direction} onChange={(event) => setDirection(event.target.value as "IN" | "OUT")}>
                  <option value="IN">Adjust in</option>
                  <option value="OUT">Adjust out</option>
                </Select>
                <LocationSelect locations={locations} value={locationCode} onChange={setLocationCode} />
                <QuantityInput value={quantity} onChange={setQuantity} />
                {selected.tracking_mode === "SERIALIZED" && direction === "IN" && (
                  <textarea aria-label="Unit identifiers" placeholder="Unit identifiers, one per line" value={unitIdentifiers} onChange={(event) => setUnitIdentifiers(event.target.value)} rows={2} />
                )}
                <Input aria-label="Adjustment reason" placeholder="Required reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
                <Button type="submit" isLoading={working}>Adjust stock</Button>
              </form>
            )}
          </div>
          <h3>Movement History</h3>
          <DataTable
            items={movements}
            columns={[
              { header: "When", key: "occurred_at", render: (movement) => new Date(movement.occurred_at).toLocaleString() },
              { header: "Movement", key: "type", render: (movement) => movement.type },
              { header: "Quantity", key: "quantity", render: (movement) => movement.quantity },
              { header: "Route", key: "route", render: (movement) => `${movement.from ?? "—"} → ${movement.to ?? "—"}` },
              { header: "Reason", key: "reason", render: (movement) => movement.reason ?? "—" },
            ]}
            isLoading={false}
            getItemId={(movement) => movement.code}
            getItemTitle={(movement) => movement.type}
            emptyTitle="No movements recorded"
          />
        </Card>
      )}

      <Card title="Locations" description="Locations describe custody only; they do not indicate ownership.">
        <form className="inventory-form" onSubmit={(event) => void addLocation(event)}>
          <label>
            Location name
            <Input value={locationName} onChange={(event) => setLocationName(event.target.value)} required />
          </label>
          <label>
            Type
            <Select value={locationType} onChange={(event) => setLocationType(event.target.value as InventoryLocation["type"])}>
              {locationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </label>
          <Button type="submit" isLoading={working} disabled={!hasPermission("manage_inventory_locations")}>Add location</Button>
        </form>
        <ul className="inventory-location-list">
          {locations.map((location) => <li key={location.code}>{location.name} <span>{location.type}{location.is_active ? " · Active" : " · Inactive"}</span></li>)}
        </ul>
      </Card>
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

function UnitSelect({
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
    void inventoryService.units().then(setUnits).catch(() => setUnits([]));
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
