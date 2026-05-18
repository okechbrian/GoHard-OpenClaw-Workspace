"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
  meta?: string;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  emptyText?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  value, onChange, options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  onCreateNew, createNewLabel = "+ Add new",
  emptyText = "No matches",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="searchable-trigger"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="searchable-trigger-content">
            <span className="searchable-trigger-label">{selected.label}</span>
            {selected.sublabel && <span className="searchable-trigger-sub">{selected.sublabel}</span>}
          </span>
        ) : (
          <span className="searchable-trigger-placeholder">{placeholder}</span>
        )}
        <span className="searchable-trigger-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <>
          <div className="searchable-backdrop" onClick={() => setOpen(false)} />
          <div className="searchable-sheet" role="dialog" aria-label={placeholder}>
            <div className="searchable-sheet-handle" />
            <input
              ref={inputRef}
              type="search"
              className="searchable-search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="searchable-list" role="listbox">
              {filtered.length === 0 ? (
                <div className="searchable-empty">{emptyText}</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={opt.id === value}
                    className={`searchable-item${opt.id === value ? " active" : ""}`}
                    onClick={() => { onChange(opt.id); setOpen(false); setQuery(""); }}
                  >
                    <span className="searchable-item-main">
                      <span className="searchable-item-label">{opt.label}</span>
                      {opt.sublabel && <span className="searchable-item-sub">{opt.sublabel}</span>}
                    </span>
                    {opt.meta && <span className="searchable-item-meta">{opt.meta}</span>}
                  </button>
                ))
              )}
            </div>
            {onCreateNew && (
              <button
                type="button"
                className="searchable-create"
                onClick={() => { setOpen(false); setQuery(""); onCreateNew(); }}
              >
                {createNewLabel}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
