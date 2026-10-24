import { Button, Select } from "../../../components/atoms";
import { SearchField } from "../../../components/molecules";
import { useUiLocale } from "../../../locales/UiLocale";
import type { OwnershipHolding, OwnershipTrackingMode } from "../types";

type Props = { variant: "desktop" | "mobile"; search: string; holding: OwnershipHolding; tracking: OwnershipTrackingMode | "";
  loading: boolean; onSearch: (value: string) => void; onHolding: (value: OwnershipHolding) => void;
  onTracking: (value: OwnershipTrackingMode | "") => void; onRefresh: () => void };

export function OwnershipFilters({ variant, search, holding, tracking, loading, onSearch, onHolding, onTracking, onRefresh }: Props) {
  const { t } = useUiLocale();
  return <div className={`ownership-filters-${variant}`}>
    <SearchField id={`ownership-search-${variant}`} label="Search owned items" placeholder="Search item names" value={search}
      onChange={(event) => onSearch(event.target.value)} />
    <label>{t("Holdings")}<Select value={holding} onChange={(event) => onHolding(event.target.value as OwnershipHolding)}>
      <option value="all">All holdings</option><option value="current">Current holdings</option><option value="depleted">Depleted holdings</option>
    </Select></label>
    <label>{t("Tracking mode")}<Select value={tracking} onChange={(event) => onTracking(event.target.value as OwnershipTrackingMode | "")}>
      <option value="">All tracking modes</option><option value="QUANTITY">Quantity tracked</option>
      <option value="UNIQUE">Unique item</option><option value="SERIALIZED">Serialized items</option>
    </Select></label>
    <Button type="button" disabled={loading} onClick={onRefresh}>Refresh</Button>
  </div>;
}
