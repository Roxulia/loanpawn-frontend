import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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
import { InventoryItemImage } from "../components/InventoryItemImage";
import { isApiError } from "../../../dataobjects/common/api";
import { translateUiText, useUiLocale } from "../../../locales/UiLocale";
import { clearIdempotencyKey, idempotencyKeyForPayload, type IdempotencyKeyState } from "../../../services/http/idempotency";
import type {
  InventoryItem,
  InventoryItemSummary,
  InventoryLocation,
  InventoryMovement,
  InventoryReadPage,
  InventorySerializedItem,
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
  // Keep translated feedback stable so locale changes refresh reads without render loops.
  const { locale } = useUiLocale();
  const t = useCallback((text: string) => translateUiText(locale, text), [locale]);
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [activeAction, setActiveAction] = useState<"move" | "issue" | "adjust" | null>(null);
  const { hasEnabledFeature } = useFeatures();
  const [items, setItems] = useState<InventoryItemSummary[]>([]);
  // Keep list pagination separate from selected detail and history pagination.
  const [itemPage, setItemPage] = useState(1);
  const [itemLastPage, setItemLastPage] = useState(1);
  const [itemTotal, setItemTotal] = useState(0);
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const [detailLoading, setDetailLoading] = useState(false);
  // Retain each intent through transport failures; changed payloads receive a fresh key.
  const stockIntent = useRef<IdempotencyKeyState>(null);
  const locationIntent = useRef<IdempotencyKeyState>(null);
  const submitting = useRef(false);
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [locationActive, setLocationActive] = useState(true);
  const [locationSellable, setLocationSellable] = useState(true);
  const [itemLocationFilter, setItemLocationFilter] = useState("");
  const [itemTrackingFilter, setItemTrackingFilter] = useState("");
  const [unitPage, setUnitPage] = useState(1);
  const [unitSearch, setUnitSearch] = useState("");
  const [unitLocation, setUnitLocation] = useState("");
  const [unitsAvailableOnly, setUnitsAvailableOnly] = useState(false);
  const [unitResult, setUnitResult] = useState<InventoryReadPage<InventorySerializedItem> | null>(null);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  // Track bounded history metadata and ignore superseded page requests.
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRequest = useRef(0);
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
    // Ignore superseded search/page results, including their loading and error state.
    const requestId = ++listRequest.current;
    setLoading(true);
    setError(null);
    try {
      const [inventoryItems, inventoryLocations] = await Promise.all([
        inventoryService.list(search.trim(), itemPage, itemLocationFilter, itemTrackingFilter),
        inventoryService.locations(),
      ]);
      if (requestId !== listRequest.current) return;
      // Recover a page removed by the latest stock/filter change without an empty register.
      if (itemPage > inventoryItems.last_page) { setItemPage(inventoryItems.last_page); return; }
      setItems(inventoryItems.items);
      setItemLastPage(inventoryItems.last_page);
      setItemTotal(inventoryItems.total);
      setLocations(inventoryLocations);
      setLocationCode((current) => current || inventoryLocations[0]?.code || "");
      setFromLocationCode((current) => current || inventoryLocations[0]?.code || "");
      setToLocationCode((current) => current || inventoryLocations[1]?.code || "");
    } catch (cause) {
      if (requestId !== listRequest.current) return;
      setError(cause instanceof Error ? cause.message : t("Unable to load inventory."));
    } finally {
      if (requestId === listRequest.current) setLoading(false);
    }
  }, [search, itemPage, itemLocationFilter, itemTrackingFilter, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    // Cancel stale identity responses when selection, page, or custody filters change.
    if (!selected || selected.tracking_mode !== "SERIALIZED") return;
    let active = true;
    const timer = window.setTimeout(() => {
      setUnitsLoading(true);
      setUnitResult(null);
      void inventoryService.serializedItems(selected.code, unitPage, unitLocation, unitSearch, unitsAvailableOnly)
        .then((result) => { if (active) { if (unitPage > result.last_page) setUnitPage(result.last_page); else setUnitResult(result); } })
        .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : t("Unable to load serialized items.")); })
        .finally(() => { if (active) setUnitsLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [selected, unitPage, unitLocation, unitSearch, unitsAvailableOnly, t]);

  async function selectItem(item: Pick<InventoryItem, "code">) {
    // Refresh authoritative detail before enabling operations; never reuse a list snapshot.
    const requestId = ++detailRequest.current;
    setDetailLoading(true);
    ++historyRequest.current;
    setSelected(null);
    setError(null);
    setSerializedItemCodes([]);
    setUnitResult(null);
    setUnitPage(1);
    setUnitSearch("");
    setUnitLocation("");
    try {
      const detail = await inventoryService.detail(item.code);
      if (requestId !== detailRequest.current) return;
      setSelected(detail);
      await loadHistory(detail.code, 1);
    } catch (cause) {
      if (requestId === detailRequest.current) {
        setError(cause instanceof Error ? cause.message : t("Unable to load inventory."));
      }
    } finally {
      if (requestId === detailRequest.current) setDetailLoading(false);
    }
  }

  async function loadHistory(itemCode: string, page: number) {
    // Clear the previous page so another item's history is never shown during loading.
    const requestId = ++historyRequest.current;
    setMovements([]);
    setHistoryLoading(true);
    setError(null);
    try {
      const history = await inventoryService.movements(itemCode, page);
      if (requestId !== historyRequest.current) return;
      setMovements(history.items);
      setHistoryPage(history.current_page);
      setHistoryLastPage(history.last_page);
      setHistoryTotal(history.total);
    } catch (cause) {
      if (requestId !== historyRequest.current) return;
      setError(cause instanceof Error ? cause.message : t("Unable to load movement history."));
    } finally {
      if (requestId === historyRequest.current) setHistoryLoading(false);
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
    if (submitting.current) return;
    submitting.current = true;
    setWorking(true);
    setError(null);
    try {
      const payload = {
        inventory_item_code: receiveItemCode || undefined,
        name: receiveItemCode ? undefined : name.trim(),
        description: receiveItemCode ? undefined : description.trim() || undefined,
        catalog_item_code: receiveItemCode || !catalogCode ? undefined : catalogCode,
        tracking_mode: receiveItemCode ? undefined : trackingMode,
        unit_code: receiveItemCode ? undefined : unitCode || undefined,
        location_code: locationCode,
        quantity,
        serialized_item_identifiers: (receiveItemCode
          ? items.find((item) => item.code === receiveItemCode)?.tracking_mode
          : trackingMode) === "SERIALIZED"
          ? serializedItemIdentifiers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
          : undefined,
      };
      await inventoryService.receive(payload, idempotencyKeyForPayload(stockIntent, { operation: "receive", payload }));
      clearIdempotencyKey(stockIntent);
      setNotice(t("Inventory received."));
      setName("");
      setDescription("");
      setCatalogCode("");
      setReceiveItemCode("");
      setSerializedItemIdentifiers("");
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Unable to receive inventory."));
    } finally {
      submitting.current = false;
      setWorking(false);
    }
  }

  async function moveStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement("moveStock", {
      inventory_item_code: selected.code,
      from_location_code: fromLocationCode,
      to_location_code: toLocationCode,
      update_key: selected.update_key,
      quantity,
      serialized_item_codes: serializedItemCodes,
      reason: reason.trim() || undefined,
    });
  }

  async function issueStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement("issueStock", {
      inventory_item_code: selected.code,
      location_code: locationCode,
      quantity,
      serialized_item_codes: serializedItemCodes,
      reason: reason.trim() || undefined,
    });
  }

  async function adjustStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await performMovement("adjustStock", {
      inventory_item_code: selected.code,
      location_code: locationCode,
      quantity,
      direction,
      serialized_item_codes: serializedItemCodes,
      serialized_item_identifiers: direction === "IN"
        ? serializedItemIdentifiers.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
        : undefined,
      reason: reason.trim(),
    });
  }

  async function performMovement(operation: "moveStock" | "issueStock" | "adjustStock", payload: Record<string, unknown>) {
    // Block duplicate clicks before React commits the working state.
    if (submitting.current) return;
    submitting.current = true;
    setWorking(true);
    setError(null);
    try {
      await inventoryService[operation](payload, idempotencyKeyForPayload(stockIntent, { operation, payload }));
      clearIdempotencyKey(stockIntent);
      setNotice(t("Inventory movement recorded."));
      if (selected) await selectItem(selected);
      await loadData();
    } catch (cause) {
      // A conflict refreshes detail for explicit review; never resubmit stock automatically.
      if (isApiError(cause) && cause.statusCode === 409) {
        clearIdempotencyKey(stockIntent);
        if (selected) await selectItem(selected);
        await loadData();
        setError(t("Inventory changed. Review the refreshed stock before trying again."));
      } else setError(cause instanceof Error ? cause.message : t("Unable to record inventory movement."));
    } finally {
      submitting.current = false;
      setWorking(false);
    }
  }

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setWorking(true);
    setError(null);
    try {
      const payload = { name: locationName.trim(), type: locationType };
      // Location edits carry the selected optimistic version and all editable restrictions.
      if (editingLocation) {
        const update = { ...payload, is_active: locationActive, is_sellable: locationSellable, update_key: editingLocation.update_key };
        await inventoryService.updateLocation(editingLocation.code, update, idempotencyKeyForPayload(locationIntent, { code: editingLocation.code, ...update }));
      } else await inventoryService.createLocation(payload, idempotencyKeyForPayload(locationIntent, payload));
      clearIdempotencyKey(locationIntent);
      setEditingLocation(null);
      setLocationName("");
      setNotice(t("Location saved."));
      await loadData();
    } catch (cause) {
      if (isApiError(cause) && cause.statusCode === 409) {
        clearIdempotencyKey(locationIntent);
        const fresh = await inventoryService.locations().catch(() => null);
        if (fresh) {
          setLocations(fresh);
          const current = fresh.find((row) => row.code === editingLocation?.code);
          if (current) beginLocationEdit(current);
        }
        setError(t("Location changed. Review the refreshed location before trying again."));
      } else setError(cause instanceof Error ? cause.message : t("Unable to save location."));
    } finally {
      submitting.current = false;
      setWorking(false);
    }
  }

  function beginLocationEdit(item: InventoryLocation) {
    // Copy the versioned location into the form and begin a new edit intent.
    clearIdempotencyKey(locationIntent);
    setEditingLocation(item);
    setLocationName(item.name);
    setLocationType(item.type);
    setLocationActive(item.is_active);
    setLocationSellable(item.is_sellable ?? false);
  }

  const columns: Array<DataTableColumn<InventoryItemSummary>> = [
    {
      header: "Item",
      key: "name",
      // Keep the same photo cue in desktop rows and mobile item cards.
      render: (item) => <div className="inventory-item-identity-desktop inventory-item-identity-mobile"><InventoryItemImage imageUrl={item.image_url} name={item.name} /><div><strong>{item.name}</strong><div>{item.description}</div></div></div>,
    },
    { header: "Tracking", key: "tracking_mode", render: (item) => item.tracking_mode },
    { header: "On hand", key: "total_quantity", render: (item) => `${item.total_quantity} ${item.unit_name}` },
    {
      header: "Available",
      key: "available_quantity",
      render: (item) => `${item.available_quantity} ${item.unit_name}`,
    },
  ];

  // Keep receiving and location maintenance on dedicated routes.
  const isReceiveView = location.pathname === routePaths.inventoryReceive;
  const isLocationsView = location.pathname === routePaths.inventoryLocations;
  const inventoryNavigation = [
    { label: "Items", to: routePaths.inventory },
    ...(hasEnabledFeature("inventory_manual_operations") && hasPermission("receive_inventory") ? [{ label: "Receive stock", to: routePaths.inventoryReceive }] : []),
    { label: "Locations", to: routePaths.inventoryLocations },
  ];
  const availableActions = [
    ...(hasPermission("move_inventory") ? ["move" as const] : []),
    ...(hasEnabledFeature("inventory_manual_operations") && hasPermission("issue_inventory") ? ["issue" as const] : []),
    ...(hasEnabledFeature("inventory_manual_operations") && hasPermission("adjust_inventory") ? ["adjust" as const] : []),
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

      {isReceiveView && hasEnabledFeature("inventory_manual_operations") && hasPermission("receive_inventory") && (
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
            <label>Location<LocationSelect locations={locations} value={locationCode} onChange={(value) => { setLocationCode(value); setSerializedItemCodes([]); }} /></label>
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
              {locations.map((item) => <li key={item.code}><strong>{item.name}</strong><span>{item.type} · {t(item.is_active ? "Active" : "Inactive")}</span>{hasPermission("manage_inventory_locations") && <Button disabled={working} onClick={() => beginLocationEdit(item)}>{t("Edit")}</Button>}</li>)}
            </ul>
          </Card>
          {hasPermission("manage_inventory_locations") && <Card title={t(editingLocation ? "Edit location" : "Add a location")} description={t("Locations can be deactivated only when stock and active reservations are cleared.")}>
            <form className="inventory-form" onSubmit={(event) => void addLocation(event)}>
              <label>Location name<Input value={locationName} onChange={(event) => setLocationName(event.target.value)} required /></label>
              <label>Location type<Select value={locationType} onChange={(event) => setLocationType(event.target.value as InventoryLocation["type"])}>
                {locationTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
              </Select></label>
              {editingLocation && <>
                <label><span>{t("Active")}</span><input type="checkbox" checked={locationActive} disabled={editingLocation.is_default || working} onChange={(event) => setLocationActive(event.target.checked)} /></label>
                <label><span>{t("Sellable")}</span><input type="checkbox" checked={locationSellable} disabled={working} onChange={(event) => setLocationSellable(event.target.checked)} /></label>
                {editingLocation.is_default && <p>{t("The default location must remain active.")}</p>}
              </>}
              <Button type="submit" isLoading={working}>{t("Save location")}</Button>
              {editingLocation && <Button disabled={working} onClick={() => { setEditingLocation(null); setLocationName(""); clearIdempotencyKey(locationIntent); }}>{t("Cancel")}</Button>}
            </form>
          </Card>}
        </div>
      )}

      {!isReceiveView && !isLocationsView && (
        <div className="inventory-workspace">
          <Card title="Items" description={`${itemTotal} inventory items`}>
            <div className="inventory-toolbar">
              <SearchField id="inventory-search" label="Search inventory" placeholder="Search item names" value={search} onChange={(event) => { ++listRequest.current; setItemPage(1); setSearch(event.target.value); }} />
              <label>{t("Location")}<Select value={itemLocationFilter} onChange={(event) => { ++listRequest.current; setItemPage(1); setItemLocationFilter(event.target.value); }}><option value="">{t("All locations")}</option>{locations.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}</Select></label>
              <label>{t("Tracking")}<Select value={itemTrackingFilter} onChange={(event) => { ++listRequest.current; setItemPage(1); setItemTrackingFilter(event.target.value); }}><option value="">{t("All tracking modes")}</option>{["UNIQUE", "SERIALIZED", "QUANTITY"].map((mode) => <option key={mode}>{mode}</option>)}</Select></label>
              <Button onClick={() => void loadData()}>Refresh</Button>
            </div>
            <DataTable items={items} columns={columns} pagination={{ currentPage: itemPage, lastPage: itemLastPage, total: itemTotal, onPrevious: () => { if (!loading) setItemPage((page) => page - 1); }, onNext: () => { if (!loading) setItemPage((page) => page + 1); } }} isLoading={loading} getItemId={(item) => item.code} getItemTitle={(item) => item.name} emptyTitle="No inventory items yet" emptyDescription={t("No inventory items match these filters.")} onRowClick={(item) => { if (!working) { clearIdempotencyKey(stockIntent); void selectItem(item); } }} />
          </Card>
          {detailLoading && <p role="status">{t("Loading item details...")}</p>}
          {selected && <Card title={selected.name} description={`${selected.tracking_mode.replaceAll("_", " ")} · ${selected.total_quantity} ${selected.unit_name} on hand`}>
            <div className="inventory-item-photo-desktop inventory-item-photo-mobile"><InventoryItemImage imageUrl={selected.image_url} name={selected.name} size="detail" /></div>
            <div className="inventory-location-breakdown">{selected.locations.map((row) => <div key={row.location.code}><span>{row.location.name}</span><strong>{row.quantity} {selected.unit_name}</strong></div>)}</div>
            {selected.tracking_mode === "SERIALIZED" && <section className="inventory-serialized-item-list">
              <h3>{t("Serialized items")}</h3>
              <div className="inventory-unit-filters-desktop inventory-unit-filters-mobile">
                <SearchField id="inventory-unit-search" label={t("Search identifiers")} value={unitSearch} onChange={(event) => { setUnitResult(null); setUnitsLoading(true); setUnitPage(1); setUnitSearch(event.target.value); setSerializedItemCodes([]); }} />
                <label>{t("Location")}<Select value={unitLocation} onChange={(event) => { setUnitResult(null); setUnitsLoading(true); setUnitPage(1); setUnitLocation(event.target.value); setSerializedItemCodes([]); }}><option value="">{t("All locations")}</option>{locations.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}</Select></label>
                <label><input type="checkbox" checked={unitsAvailableOnly} onChange={(event) => { setUnitResult(null); setUnitsLoading(true); setUnitPage(1); setUnitsAvailableOnly(event.target.checked); setSerializedItemCodes([]); }} />{t("Available only")}</label>
              </div>
              <DataTable items={unitResult?.items ?? []} columns={[
                { header: t("Select"), key: "selection", render: (unit) => <input type="checkbox" aria-label={unit.identifier || unit.code} checked={serializedItemCodes.includes(unit.code)} disabled={!unit.is_available || working || unit.location?.code !== (selectedAction === "move" ? fromLocationCode : locationCode)} onClick={(event) => event.stopPropagation()} onChange={(event) => setSerializedItemCodes((current) => event.target.checked ? [...new Set([...current, unit.code])] : current.filter((code) => code !== unit.code))} /> },
                { header: t("Identifier"), key: "identifier", render: (unit) => unit.identifier || unit.code },
                { header: t("Location"), key: "location", render: (unit) => unit.location?.name ?? t("Issued") },
                { header: t("Status"), key: "status", render: (unit) => t(unit.is_reserved ? "Reserved" : unit.is_available ? "Available" : "Unavailable") },
              ]} isLoading={unitsLoading} getItemId={(unit) => unit.code} getItemTitle={(unit) => unit.identifier || unit.code} emptyTitle={t("No serialized items match these filters.")} pagination={{ currentPage: unitPage, lastPage: unitResult?.last_page ?? 1, total: unitResult?.total ?? 0, onPrevious: () => { if (!unitsLoading) { setUnitResult(null); setUnitsLoading(true); setUnitPage((page) => page - 1); } }, onNext: () => { if (!unitsLoading) { setUnitResult(null); setUnitsLoading(true); setUnitPage((page) => page + 1); } } }} />
              <p>{t("Selected items")}: {serializedItemCodes.length} <Button disabled={working} onClick={() => setSerializedItemCodes([])}>{t("Clear selection")}</Button></p>
            </section>}
            {availableActions.length > 0 && <div className="inventory-action-area">
              <div className="inventory-action-picker" role="group" aria-label="Stock action">{availableActions.map((action) => <Button key={action} type="button" variant={selectedAction === action ? "primary" : "tertiary"} disabled={working} onClick={() => { if (selectedAction !== action) { setActiveAction(action); setSerializedItemCodes([]); clearIdempotencyKey(stockIntent); } }}>{action === "move" ? "Move" : action === "issue" ? "Issue" : "Adjust"}</Button>)}</div>
              {selectedAction === "move" && <form className="inventory-single-action" onSubmit={(event) => void moveStock(event)}><h3>Move stock</h3><label>From<LocationSelect locations={locations} value={fromLocationCode} onChange={(value) => { setFromLocationCode(value); setSerializedItemCodes([]); }} /></label><label>To<LocationSelect locations={locations} value={toLocationCode} onChange={setToLocationCode} /></label><label>Quantity<QuantityInput value={quantity} onChange={setQuantity} /></label><label>Reason<Input aria-label="Movement reason" placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} /></label><Button type="submit" isLoading={working}>Record move</Button></form>}
              {selectedAction === "issue" && <form className="inventory-single-action" onSubmit={(event) => void issueStock(event)}><h3>Issue stock</h3><label>From location<LocationSelect locations={locations} value={locationCode} onChange={(value) => { setLocationCode(value); setSerializedItemCodes([]); }} /></label><label>Quantity<QuantityInput value={quantity} onChange={setQuantity} /></label><label>Reason<Input aria-label="Issue reason" placeholder="Optional" value={reason} onChange={(event) => setReason(event.target.value)} /></label><Button type="submit" isLoading={working}>Record issue</Button></form>}
              {selectedAction === "adjust" && <form className="inventory-single-action" onSubmit={(event) => void adjustStock(event)}><h3>Stock adjustment</h3><label>Direction<Select value={direction} onChange={(event) => setDirection(event.target.value as "IN" | "OUT")}><option value="IN">Add stock</option><option value="OUT">Remove stock</option></Select></label><label>Location<LocationSelect locations={locations} value={locationCode} onChange={(value) => { setLocationCode(value); setSerializedItemCodes([]); }} /></label><label>Quantity<QuantityInput value={quantity} onChange={setQuantity} /></label>{selected.tracking_mode === "SERIALIZED" && direction === "IN" && <label>Serial or IMEI identifiers<textarea aria-label="Serialized item identifiers" placeholder="One identifier per line" value={serializedItemIdentifiers} onChange={(event) => setSerializedItemIdentifiers(event.target.value)} rows={2} /></label>}<label>Reason<Input aria-label="Adjustment reason" placeholder="Required" value={reason} onChange={(event) => setReason(event.target.value)} required /></label><Button type="submit" isLoading={working}>Record adjustment</Button></form>}
            </div>}
            <section className="inventory-history"><h3>Movement history</h3><DataTable items={movements} columns={[
              { header: "Date", key: "occurred_at", render: (movement) => new Date(movement.occurred_at).toLocaleString() },
              { header: "Movement", key: "type", render: (movement) => movement.type.replaceAll("_", " ") },
              { header: "Quantity", key: "quantity", render: (movement) => movement.quantity },
              { header: "From / to", key: "route", render: (movement) => `${movement.from_location?.name ?? "—"} → ${movement.to_location?.name ?? "—"}` },
              { header: "Reason", key: "reason", render: (movement) => movement.reason ?? "—" },
            ]} pagination={{ currentPage: historyPage, lastPage: historyLastPage, total: historyTotal, onPrevious: () => { if (!historyLoading) void loadHistory(selected.code, historyPage - 1); }, onNext: () => { if (!historyLoading) void loadHistory(selected.code, historyPage + 1); } }} isLoading={historyLoading} getItemId={(movement) => movement.code} getItemTitle={(movement) => movement.type} emptyTitle="No movements recorded" /></section>
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
