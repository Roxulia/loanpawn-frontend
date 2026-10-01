import { useEffect, useState } from "react";
import { Button, Input, Select } from "../../../components/atoms";
import { SearchableSelect } from "../../../components/molecules";
import { catalogService } from "../services/catalogService";
import type { CatalogItem, CatalogTrackingMode } from "../types";

type Props = {
  id: string;
  value: string;
  onChange: (id: string, item: CatalogItem | null) => void;
  canQuickCreate?: boolean;
};

export function CatalogItemSelect({
  id,
  value,
  onChange,
  canQuickCreate = false,
}: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [trackingMode, setTrackingMode] =
    useState<CatalogTrackingMode>("QUANTITY");
  const [error, setError] = useState<string | null>(null);
  const selected = items.find((item) => String(item.id) === value);

  async function search(query: string) {
    setLoading(true);

    try {
      setItems(await catalogService.searchItems(query));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to search catalog items.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search("");
  }, []);

  async function createItem() {
    if (!name.trim()) return;

    setLoading(true);

    try {
      const item = await catalogService.createItem({
        name: name.trim(),
        tracking_mode: trackingMode,
      });

      setItems((current) => [
        item,
        ...current.filter((entry) => entry.id !== item.id),
      ]);
      onChange(String(item.id), item);
      setCreating(false);
      setName("");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create catalog item.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="catalog-item-select">
      <SearchableSelect
        id={id}
        value={value}
        options={items}
        isLoading={loading}
        getOptionValue={(item) => String(item.id)}
        getOptionLabel={(item) => item.name}
        getOptionDescription={(item) =>
          [item.category, item.sku].filter(Boolean).join(" · ")
        }
        onChange={(nextId) =>
          onChange(
            nextId,
            items.find((item) => String(item.id) === nextId) ?? null,
          )
        }
        onSearchChange={(query) => void search(query)}
        placeholder="Search catalog items"
        emptyMessage="No matching catalog items."
      />

      {selected?.unit && <small>{selected.unit.name}</small>}

      {canQuickCreate && (
        <Button onClick={() => setCreating(true)} variant="tertiary">
          Create catalog item
        </Button>
      )}

      {error && <p role="alert">{error}</p>}

      {creating && (
        <div
          className="catalog-quick-create"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-create-title`}
        >
          <div className="catalog-quick-create__panel">
            <h2 id={`${id}-create-title`}>Quick create catalog item</h2>

            <label htmlFor={`${id}-name`}>Name</label>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />

            <label htmlFor={`${id}-tracking`}>Tracking mode</label>
            <Select
              id={`${id}-tracking`}
              value={trackingMode}
              onChange={(event) =>
                setTrackingMode(event.target.value as CatalogTrackingMode)
              }
            >
              <option value="QUANTITY">Quantity</option>
              <option value="SERIALIZED">Serialized</option>
              <option value="UNIQUE">Unique</option>
            </Select>

            <p>
              Unit defaults to Unit. SKU, barcode, and category can be added
              later.
            </p>

            <div className="catalog-quick-create__actions">
              <Button onClick={() => setCreating(false)}>Cancel</Button>
              <Button
                onClick={() => void createItem()}
                disabled={!name.trim()}
                isLoading={loading}
                variant="primary"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
