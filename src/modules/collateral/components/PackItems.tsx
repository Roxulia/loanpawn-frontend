import { Button, Input, Select } from "../../../components/atoms";
import { FormField } from "../../../components/molecules";
import { CirclePlusIcon, TrashIcon } from "../../../components/icons/icon";
import { ExpenseImageInput } from "../../expenses/components/ExpenseImageInput";
import type { MaterialType } from "../../slips/services/slipService";
import type { PackItem, PackItemForm } from "../types";
import "./collateralEditor.css";

export function newPackItem(): PackItemForm {
  return {
    key: `${Date.now()}-${Math.random()}`,
    name: "",
    quantity: 1,
  };
}

export function weightUnits(item: Pick<PackItem, "kyat" | "pal" | "yway">): number {
  return Math.round(Number(item.kyat ?? 0) * 100) * 128
    + Math.round(Number(item.pal ?? 0) * 100) * 8
    + Math.round(Number(item.yway ?? 0) * 100);
}

export function PackItemsEditor({ rows, onChange, detailed = false, materials = [] }: {
  rows: PackItemForm[];
  onChange: (rows: PackItemForm[]) => void;
  detailed?: boolean;
  materials?: MaterialType[];
}) {
  const update = (key: string, patch: Partial<PackItemForm>) => onChange(rows.map((row) => row.key === key ? { ...row, ...patch } : row));
  return (
    <section className="pack-items-editor">
      <header className="pack-items-heading">
        <h3>Contained Items</h3>
        <Button type="button" variant="tertiary" onClick={() => onChange([...rows, newPackItem()])}><CirclePlusIcon /> Add Item</Button>
      </header>
      {rows.length === 0 && <p className="muted">No contained items recorded.</p>}
      {rows.map((row, index) => (
        <div className="pack-edit-row" key={row.key}>
          <div className="pack-row-fields">
            <FormField id={`${row.key}-name`} label={`Item ${index + 1} Name`}>
              <Input id={`${row.key}-name`} required maxLength={120} value={row.name} onChange={(event) => update(row.key, { name: event.target.value })} />
            </FormField>
            <FormField id={`${row.key}-quantity`} label="Quantity">
              <Input id={`${row.key}-quantity`} required type="number" min={1} step={1} value={row.quantity || ""} onChange={(event) => update(row.key, { quantity: Number(event.target.value) })} />
            </FormField>
            {detailed && <>
              {(["kyat", "pal", "yway"] as const).map((field) => (
                <FormField key={field} id={`${row.key}-${field}`} label={field[0].toUpperCase() + field.slice(1)}>
                  <Input id={`${row.key}-${field}`} type="number" min={0} max={999999.99} step="0.01" value={row[field] ?? ""} onChange={(event) => update(row.key, { [field]: event.target.value === "" ? null : event.target.value })} />
                </FormField>
              ))}
              <FormField id={`${row.key}-material`} label="Material">
                <Select id={`${row.key}-material`} value={row.material_type_id ?? ""} onChange={(event) => update(row.key, { material_type_id: Number(event.target.value) || null })}>
                  <option value="">Not recorded</option>
                  {materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
                </Select>
              </FormField>
            </>}
            {!row.id && <Button type="button" variant="ghost" title="Remove unsaved item" aria-label="Remove unsaved item" onClick={() => onChange(rows.filter((candidate) => candidate.key !== row.key))}><TrashIcon /></Button>}
          </div>
          {detailed && <div className="pack-row-image">
            {row.image_url && !row.remove_image && !row.image_reference && <img src={row.image_url} alt={row.name || "Contained item"} />}
            <ExpenseImageInput id={row.key} existingImage={Boolean(row.has_image_reference)} file={row.image_reference ?? null} isRemoved={Boolean(row.remove_image)} onChange={(file) => update(row.key, { image_reference: file ?? undefined })} onRemoveChange={(removed) => update(row.key, { remove_image: removed })} />
          </div>}
        </div>
      ))}
    </section>
  );
}

export function PackItemsView({ items }: { items: PackItem[] }) {
  return <section className="pack-items-view">
    <h3>Contained Items</h3>
    {items.length === 0 ? <p className="muted">No contained items recorded.</p> : <>
      <div className="pack-items-desktop">
        <table><thead><tr><th>Name</th><th>Quantity</th><th>Material</th><th>Kyat</th><th>Pal</th><th>Yway</th><th>Image</th></tr></thead>
          <tbody>{items.map((item, index) => <tr key={item.id ?? index}>
            <td>{item.name}</td><td>{item.quantity}</td><td>{item.material_type_name ?? "-"}</td><td>{item.kyat ?? "-"}</td><td>{item.pal ?? "-"}</td><td>{item.yway ?? "-"}</td>
            <td>{item.image_url ? <a href={item.image_url} target="_blank" rel="noreferrer"><img src={item.image_url} alt={item.name} /></a> : "-"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="pack-items-mobile">{items.map((item, index) => <div className="pack-mobile-row" key={item.id ?? index}>
        <strong>{item.name}</strong><span>Quantity: {item.quantity}</span><span>{item.material_type_name ?? "Material not recorded"}</span>
        <span>{item.kyat ?? "-"} Kyat / {item.pal ?? "-"} Pal / {item.yway ?? "-"} Yway</span>
        {item.image_url && <a href={item.image_url} target="_blank" rel="noreferrer"><img src={item.image_url} alt={item.name} /></a>}
      </div>)}</div>
    </>}
  </section>;
}
