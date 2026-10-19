import { useState } from "react";
import { useUiLocale } from "../../../locales/UiLocale";

type InventoryItemImageProps = {
  imageUrl: string | null;
  name: string;
  size?: "thumbnail" | "detail";
};

export function InventoryItemImage({ imageUrl, name, size = "thumbnail" }: InventoryItemImageProps) {
  const { t } = useUiLocale();
  // Remember only the failed URL so a freshly signed replacement can render normally.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const available = imageUrl !== null && imageUrl !== failedUrl;

  return (
    <span className={`inventory-item-image inventory-item-image--${size}`}>
      {available ? (
        <a href={imageUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={`${t("View image")}: ${name}`}>
          <img src={imageUrl} alt={name} loading="lazy" onError={() => setFailedUrl(imageUrl)} />
        </a>
      ) : (
        // Use a bundled default illustration rather than a visible empty-image message.
        <img className="inventory-item-image__default" src={`${import.meta.env.BASE_URL}images/inventory-default.svg`} alt={t("Default item image")} loading="lazy" />
      )}
    </span>
  );
}
