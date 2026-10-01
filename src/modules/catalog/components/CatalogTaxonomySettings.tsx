import { useEffect, useState } from "react";
import { Button, Input } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { Card } from "../../../components/molecules";
import { usePermissions } from "../../auth";
import { catalogService } from "../services/catalogService";
import type { CatalogCategory, CatalogUnit } from "../types";

export function CatalogTaxonomySettings() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("manage_catalog_taxonomy");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [units, setUnits] = useState<CatalogUnit[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [unitForm, setUnitForm] = useState({
    code: "",
    name: "",
    symbol: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const [nextCategories, nextUnits] = await Promise.all([
        catalogService.categories(),
        catalogService.unitsForManagement(),
      ]);

      setCategories(nextCategories);
      setUnits(nextUnits);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load Catalog settings.",
      );
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function addCategory() {
    if (!categoryName.trim()) return;

    try {
      await catalogService.createCategory(categoryName.trim());
      setCategoryName("");
      await reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create category.",
      );
    }
  }

  async function addUnit() {
    if (!unitForm.code.trim() || !unitForm.name.trim()) return;

    try {
      await catalogService.createUnit(unitForm);
      setUnitForm({ code: "", name: "", symbol: "" });
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create unit.");
    }
  }

  async function toggleUnit(unit: CatalogUnit) {
    try {
      await catalogService.updateUnit(unit.id, !unit.is_active);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update unit.");
    }
  }

  async function toggleCategory(category: CatalogCategory) {
    try {
      await catalogService.updateCategory(category.id, {
        is_active: !category.is_active,
        update_key: category.update_key,
      });
      await reload();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update category.",
      );
    }
  }

  if (!canManage) return null;

  return (
    <div className="workflow-stack">
      {error && (
        <Alert
          title="Catalog settings action failed"
          message={error}
          tone="danger"
          onDismiss={() => setError(null)}
        />
      )}

      <Card
        title="Catalog Categories"
        description="Create tenant-specific categories for reusable catalog items."
      >
        <div className="workflow-stack">
          <div className="catalog-taxonomy__form">
            <Input
              aria-label="Category name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Category name"
            />
            <Button
              onClick={() => void addCategory()}
              disabled={!categoryName.trim()}
              variant="primary"
            >
              Add category
            </Button>
          </div>

          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                {category.name}
                {!category.is_active && " (inactive)"}
                <Button
                  onClick={() => void toggleCategory(category)}
                  variant="tertiary"
                >
                  {category.is_active ? "Deactivate" : "Activate"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card
        title="Units"
        description="Shared platform units and units configured for this tenant."
      >
        <ul>
          {units.map((unit) => (
            <li key={unit.id}>
              {unit.name}
              {unit.symbol ? ` (${unit.symbol})` : ""}
              {" · "}
              {unit.tenant_id == null ? "Shared" : "Tenant"}
              {unit.is_system ? " · Default" : ""}
              {unit.tenant_id != null && (
                <Button
                  onClick={() => void toggleUnit(unit)}
                  variant="tertiary"
                >
                  {unit.is_active ? "Deactivate" : "Activate"}
                </Button>
              )}
            </li>
          ))}
        </ul>

        <div className="catalog-taxonomy__form">
          <Input
            aria-label="Unit code"
            value={unitForm.code}
            onChange={(event) =>
              setUnitForm({ ...unitForm, code: event.target.value })
            }
            placeholder="Code"
          />
          <Input
            aria-label="Unit name"
            value={unitForm.name}
            onChange={(event) =>
              setUnitForm({ ...unitForm, name: event.target.value })
            }
            placeholder="Name"
          />
          <Input
            aria-label="Unit symbol"
            value={unitForm.symbol}
            onChange={(event) =>
              setUnitForm({ ...unitForm, symbol: event.target.value })
            }
            placeholder="Symbol (optional)"
          />
          <Button
            onClick={() => void addUnit()}
            disabled={!unitForm.code.trim() || !unitForm.name.trim()}
            variant="primary"
          >
            Add unit
          </Button>
        </div>
      </Card>
    </div>
  );
}
