import { useEffect, useState } from "react";
import { InventoryItemImage } from "../../inventory/components/InventoryItemImage";
import type { OwnedItem } from "../types";

export function OwnershipItemPhoto({ item, detail = false }: { item: OwnedItem; detail?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const expires = item.image_url_expires_at === null ? null : Date.parse(item.image_url_expires_at);
  // Remove expired links as well as thumbnails; a refreshed signed URL can render normally.
  useEffect(() => {
    if (expires === null || !Number.isFinite(expires) || expires <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.max(0, expires - Date.now())));
    return () => window.clearTimeout(timer);
  }, [expires, now]);
  const available = expires === null || (Number.isFinite(expires) && expires > now);
  return <InventoryItemImage imageUrl={available ? item.image_url : null} name={item.name} size={detail ? "detail" : "thumbnail"} />;
}
