"use client";
import type { ServicePackage } from "@/lib/services";
import { formatUGX } from "@/lib/services";

interface Props {
  packages: ServicePackage[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function PackageSelector({ packages, selected, onSelect }: Props) {
  const current = packages.find((p) => p.id === selected) ?? packages[0];

  return (
    <div className="pkg-selector">
      <div className="pkg-chip-row" role="radiogroup" aria-label="Choose a package">
        {packages.map((pkg) => {
          const active = pkg.id === current?.id;
          return (
            <button
              key={pkg.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`pkg-chip${active ? " active" : ""}`}
              onClick={() => onSelect(pkg.id)}
            >
              <span className="pkg-chip-label">{pkg.label}</span>
              <span className="pkg-chip-price">{formatUGX(pkg.price)}</span>
            </button>
          );
        })}
      </div>
      {current && (
        <p className="pkg-detail">{current.description}</p>
      )}
    </div>
  );
}
