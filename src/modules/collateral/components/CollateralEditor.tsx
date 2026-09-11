import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select, Textarea } from "../../../components/atoms";
import { Alert } from "../../../components/feedback";
import { FinancialAmountInput, FormField } from "../../../components/molecules";
import { ApiError } from "../../../dataobjects/common/api";
import { ExpenseImageInput } from "../../expenses/components/ExpenseImageInput";
import { financialAmountToBase, type FinancialUnitCode } from "../../finance/financialUnits";
import { slipService, type MaterialType, type ItemCategoryType, type GemstoneDetailsPayload } from "../../slips/services/slipService";
import { collateralService } from "../services/collateralService";
import { formatMoney, getItemType } from "../collateralFormat";
import type { CollateralItem, CollateralUpdatePayload, PackItemForm } from "../types";
import { PackItemsEditor, weightUnits } from "./PackItems";

export function CollateralEditor({ item, onSaved, onCancel, onReload }: {
  item: CollateralItem;
  onSaved: (item: CollateralItem) => void;
  onCancel: () => void;
  onReload: () => void;
}) {
  const type = getItemType(item).toLowerCase();
  const isPack = type === "pack of jewellery";
  const isNormal = type === "normal";
  const [draft, setDraft] = useState<CollateralUpdatePayload>(() => ({
    update_key: item.update_key ?? 0,
    name: item.name,
    quantity: item.quantity ?? 1,
    ...(isNormal ? {
      description: item.description ?? null, brand_name: item.brand_name ?? item.brandName ?? null,
      item_category_type_id: item.item_category_type_id ?? item.itemCategoryTypeId ?? null,
    } : {
      material_type_id: item.material_type_id ?? item.materialTypeId ?? null,
      kyat: Number(item.kyat ?? 0), pal: Number(item.pal ?? 0), yway: Number(item.yway ?? 0),
      ...(!isPack ? { description: item.description ?? null, contains_gemstones: item.contains_gemstones ?? item.containsGemstones ?? false } : {}),
    }),
  }));
  const [rate, setRate] = useState({ amount: String(item.material_price_per_kyat ?? ""), unit: "UNIT" as FinancialUnitCode });
  const [estimate, setEstimate] = useState({ amount: String(item.estimated_value ?? item.estimatedValue ?? 0), unit: "UNIT" as FinancialUnitCode });
  const [gemstones, setGemstones] = useState<GemstoneDetailsPayload>(() => {
    const value = item.gemstone_details ?? item.gemstoneDetails;
    return value && !Array.isArray(value) && typeof value === "object" ? value as GemstoneDetailsPayload : {};
  });
  const [rows, setRows] = useState<PackItemForm[]>(() => (item.sub_items ?? []).map((row) => ({ ...row, key: `saved-${row.id}` })));
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [categories, setCategories] = useState<ItemCategoryType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [optionsReady, setOptionsReady] = useState(false);
  const patch = (value: Partial<CollateralUpdatePayload>) => setDraft((current) => ({ ...current, ...value }));

  useEffect(() => {
    let active = true;
    Promise.all([slipService.listMaterialTypes(), slipService.listItemCategoryTypes()]).then(([materialRows, categoryRows]) => {
      if (active) { setMaterials(materialRows); setCategories(categoryRows); setOptionsReady(true); }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load materials."); });
    return () => { active = false; };
  }, []);

  const parentWeight = weightUnits(draft);
  const childWeight = rows.reduce((total, row) => total + weightUnits(row), 0);
  const exceedsWeight = isPack && childWeight > parentWeight;
  const value = isNormal
    ? Math.round(financialAmountToBase(estimate) * Number(draft.quantity ?? 1))
    : rate.amount.trim() === "" ? Number(item.minimum_retail_price ?? item.minimumRetailPrice ?? 0)
      : Math.round(parentWeight / 12800 * financialAmountToBase(rate) * (isPack ? 1 : Number(draft.quantity ?? 1)));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (exceedsWeight) { setError("Contained-item weight cannot exceed the pack total."); return; }
    if (isPack && (parentWeight <= 0 || !draft.material_type_id || financialAmountToBase(rate) <= 0)) {
      setError("Enter pack total weight, material, and a positive material price per kyat."); return;
    }
    if (!draft.name?.trim() || rows.some((row) => !row.name.trim() || !Number.isInteger(row.quantity) || row.quantity < 1)) {
      setError("Each item needs a name and a positive whole-number quantity."); return;
    }
    const images = [draft.image_reference, ...rows.map((row) => row.image_reference)].filter((file): file is File => Boolean(file));
    if (images.some((file) => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Reference images must be JPG, PNG, or WebP and no larger than 5 MB."); return;
    }
    const payload: CollateralUpdatePayload = {
      ...draft, name: draft.name.trim(),
      ...(isNormal ? { estimated_value: Number(estimate.amount), estimated_value_unit: estimate.unit }
        : rate.amount.trim() !== "" ? { material_price_per_kyat: Number(rate.amount), material_price_per_kyat_unit: rate.unit } : {}),
      ...(!isNormal && !isPack ? { gemstone_details: draft.contains_gemstones ? gemstones : null } : {}),
      ...(isPack ? { quantity: 1, sub_items: rows.map((row) => ({
        ...(row.id ? { id: row.id } : {}), name: row.name.trim(), quantity: row.quantity,
        kyat: row.kyat ?? null, pal: row.pal ?? null, yway: row.yway ?? null,
        material_type_id: row.material_type_id ?? null, image_reference: row.image_reference, remove_image: row.remove_image,
      })) } : {}),
    };
    setIsSaving(true);
    try { onSaved(await collateralService.updateCollateral(item.code, payload)); }
    catch (reason) {
      if (reason instanceof ApiError) {
        setConflict(reason.statusCode === 409 || reason.message.toLowerCase().includes("another device"));
        setError(reason.errors ? Object.values(reason.errors).flat().join(" ") : reason.message);
      } else { setError(reason instanceof Error ? reason.message : "Unable to save collateral."); }
    } finally { setIsSaving(false); }
  }

  return <form className="collateral-editor" onSubmit={save}>
    <h3>Edit {item.name}</h3>
    {error && <Alert title="Unable to save" message={error} tone="danger" />}
    {conflict && <Button onClick={onReload}>Reload current item</Button>}
    <fieldset disabled={isSaving || conflict}>
      <div className="collateral-editor-fields">
        <FormField id="collateral-name" label={isPack ? "Pack Name" : "Name"}>
          <Input id="collateral-name" required maxLength={120} value={draft.name ?? ""} onChange={(event) => patch({ name: event.target.value })} />
        </FormField>
        {!isPack && <FormField id="collateral-quantity" label="Quantity">
          <Input id="collateral-quantity" required type="number" min={1} step={1} value={draft.quantity ?? ""} onChange={(event) => patch({ quantity: Number(event.target.value) })} />
        </FormField>}
        {!isPack && <FormField id="collateral-description" label="Description">
          <Textarea id="collateral-description" value={draft.description ?? ""} onChange={(event) => patch({ description: event.target.value || null })} />
        </FormField>}
        {isNormal ? <>
          <FormField id="collateral-brand" label="Brand"><Input id="collateral-brand" maxLength={80} value={draft.brand_name ?? ""} onChange={(event) => patch({ brand_name: event.target.value || null })} /></FormField>
          <FormField id="collateral-category" label="Category"><Select id="collateral-category" value={draft.item_category_type_id ?? ""} onChange={(event) => patch({ item_category_type_id: Number(event.target.value) || null })}>
            <option value="">Not recorded</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select></FormField>
          <FormField id="collateral-estimate" label="Estimated Value"><FinancialAmountInput id="collateral-estimate" min="0" value={estimate} onChange={setEstimate} /></FormField>
        </> : <>
          <FormField id="collateral-material" label="Material"><Select id="collateral-material" required={isPack} value={draft.material_type_id ?? ""} onChange={(event) => patch({ material_type_id: Number(event.target.value) || null })}>
            <option value="">Select material</option>{materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
          </Select></FormField>
          <FormField id="collateral-rate" label="Material Price per Kyat"><FinancialAmountInput id="collateral-rate" min="0" value={rate} onChange={setRate} /></FormField>
          {(["kyat", "pal", "yway"] as const).map((field) => <FormField key={field} id={`collateral-${field}`} label={`${isPack ? "Total " : ""}${field[0].toUpperCase() + field.slice(1)}`}>
            <Input id={`collateral-${field}`} type="number" min={0} max={999999.99} step="0.01" value={draft[field] ?? ""} onChange={(event) => patch({ [field]: Number(event.target.value) })} />
          </FormField>)}
        </>}
      </div>
      {!isNormal && !isPack && <>
        <label className="checkbox-line"><input type="checkbox" checked={Boolean(draft.contains_gemstones)} onChange={(event) => patch({ contains_gemstones: event.target.checked })} /> Contains Gemstones</label>
        {draft.contains_gemstones && <div className="collateral-editor-fields">
          {(["type", "weight", "quantity", "grade"] as const).map((field) => <FormField key={field} id={`gemstone-${field}`} label={`Gemstone ${field}`}>
            <Input id={`gemstone-${field}`} type={field === "quantity" ? "number" : "text"} min={field === "quantity" ? 1 : undefined} step={field === "quantity" ? 1 : undefined} value={gemstones[field] ?? ""} onChange={(event) => setGemstones((current) => ({ ...current, [field]: event.target.value === "" ? undefined : field === "quantity" ? Number(event.target.value) : event.target.value }))} />
          </FormField>)}
        </div>}
      </>}
      <p>Minimum Retail Price: <strong>{formatMoney(value)}</strong></p>
      {!isPack && <div className="pack-row-image">
        {(item.image_url ?? item.imageUrl) && !draft.remove_image && !draft.image_reference && <img src={(item.image_url ?? item.imageUrl)!} alt={item.name} />}
        <ExpenseImageInput id="collateral-image" existingImage={Boolean(item.has_image_reference ?? item.hasImageReference)} file={draft.image_reference ?? null} isRemoved={Boolean(draft.remove_image)} onChange={(file) => patch({ image_reference: file ?? undefined })} onRemoveChange={(removed) => patch({ remove_image: removed })} />
      </div>}
      {isPack && <>
        <div className="collateral-weight-summary"><span>Recorded: {(childWeight / 12800).toFixed(4)} Kyat</span><span>Remaining: {((parentWeight - childWeight) / 12800).toFixed(4)} Kyat</span></div>
        {exceedsWeight && <Alert title="Weight exceeds pack" message="Reduce contained-item weight or increase the pack total." tone="warning" />}
        <PackItemsEditor rows={rows} onChange={setRows} detailed materials={materials} />
      </>}
    </fieldset>
    <div className="collateral-editor-actions">
      <Button type="submit" variant="primary" isLoading={isSaving} disabled={conflict || exceedsWeight || !optionsReady}>Save</Button>
      <Button onClick={onCancel} disabled={isSaving}>Cancel</Button>
    </div>
  </form>;
}
