import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Input } from "../atoms";

type SearchableSelectProps<TOption> = {
  disabled?: boolean;
  emptyMessage?: string;
  error?: string | null;
  getOptionDescription?: (option: TOption) => string;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  hasError?: boolean;
  id: string;
  isLoading?: boolean;
  loadingMessage?: string;
  menuPortal?: boolean;
  onChange: (value: string) => void;
  onSearchChange?: (query: string) => void;
  options: TOption[];
  placeholder?: string;
  value: string;
};

export function SearchableSelect<TOption>({
  disabled = false,
  emptyMessage = "No options found.",
  error = null,
  getOptionDescription,
  getOptionLabel,
  getOptionValue,
  hasError = false,
  id,
  isLoading = false,
  loadingMessage = "Loading options...",
  menuPortal = false,
  onChange,
  onSearchChange,
  options,
  placeholder = "Search options",
  value,
}: SearchableSelectProps<TOption>) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected =
    options.find((option) => getOptionValue(option) === value) ?? null;
  const visibleOptions = useMemo(() => {
    if (onSearchChange) return options;
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      `${getOptionLabel(option)} ${getOptionDescription?.(option) ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [getOptionDescription, getOptionLabel, onSearchChange, options, query]);
  const menuId = `${id}-options`;
  const updateMenuPosition = useCallback(() => {
    if (!menuPortal || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const gap = 4;
    const maxHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const height = Math.min(maxHeight, Math.max(120, Math.max(spaceBelow, spaceAbove)));
    const shouldOpenAbove = spaceBelow < 160 && spaceAbove > spaceBelow;

    setMenuStyle({
      left: rect.left,
      maxHeight: height,
      top: shouldOpenAbove
        ? Math.max(gap, rect.top - height - gap)
        : rect.bottom + gap,
      width: rect.width,
    });
  }, [menuPortal]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      )
        setIsOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen || !menuPortal) return;

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, menuPortal, updateMenuPosition]);

  function updateQuery(nextQuery: string) {
    if (disabled) return;
    setQuery(nextQuery);
    updateMenuPosition();
    setIsOpen(true);
    setActiveIndex(-1);
    onSearchChange?.(nextQuery);
    if (value) onChange("");
  }

  function choose(option: TOption) {
    if (disabled) return;
    onChange(getOptionValue(option));
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  }

  const menu = (
    <div
      className={[
        "ui-searchable-select__menu",
        menuPortal ? "ui-searchable-select__menu--portal" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id={menuId}
      ref={menuRef}
      role="listbox"
      style={menuPortal ? menuStyle : undefined}
    >
      {isLoading ? (
        <span className="ui-searchable-select__status">
          {loadingMessage}
        </span>
      ) : error ? (
        <span className="ui-searchable-select__status ui-searchable-select__status--error">
          {error}
        </span>
      ) : visibleOptions.length ? (
        visibleOptions.map((option, index) => (
          <button
            aria-selected={getOptionValue(option) === value}
            className={[
              "ui-searchable-select__option",
              activeIndex === index ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            id={`${menuId}-${index}`}
            key={getOptionValue(option)}
            onClick={() => choose(option)}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
            type="button"
          >
            <strong>{getOptionLabel(option)}</strong>
            {getOptionDescription && (
              <span>{getOptionDescription(option)}</span>
            )}
          </button>
        ))
      ) : (
        <span className="ui-searchable-select__status">{emptyMessage}</span>
      )}
    </div>
  );

  return (
    <div className="ui-searchable-select" ref={rootRef}>
      <Input
        aria-activedescendant={
          activeIndex >= 0 ? `${menuId}-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={menuId}
        aria-expanded={isOpen}
        autoComplete="off"
        disabled={disabled}
        hasError={hasError}
        id={id}
        onChange={(event) => updateQuery(event.target.value)}
        onFocus={() => {
          if (!disabled) {
            updateMenuPosition();
            setIsOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            updateMenuPosition();
            setIsOpen(true);
            setActiveIndex((index) =>
              Math.min(index + 1, visibleOptions.length - 1),
            );
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
          }
          if (
            event.key === "Enter" &&
            activeIndex >= 0 &&
            visibleOptions[activeIndex]
          ) {
            event.preventDefault();
            choose(visibleOptions[activeIndex]);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        type="search"
        value={selected ? getOptionLabel(selected) : query}
      />
      {isOpen && !disabled && (
        menuPortal && typeof document !== "undefined"
          ? createPortal(menu, document.body)
          : menu
      )}
    </div>
  );
}
