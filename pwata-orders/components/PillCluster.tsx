"use client";
import { useState } from "react";

type SingleProps = {
  options: readonly string[];
  selected: string;
  onChange: (next: string) => void;
  multi?: false;
  initialVisible?: number;
};

type MultiProps = {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi: true;
  initialVisible?: number;
};

type Props = SingleProps | MultiProps;

export default function PillCluster(props: Props) {
  const { options, multi, initialVisible = 5 } = props;
  const [expanded, setExpanded] = useState(false);

  const needsCollapse = options.length > initialVisible;
  const visible = expanded || !needsCollapse ? options : options.slice(0, initialVisible);
  const hiddenCount = options.length - initialVisible;

  const isSelected = (option: string): boolean => {
    if (multi) return (props.selected as string[]).includes(option);
    return (props.selected as string) === option;
  };

  const handle = (option: string) => {
    if (multi) {
      const current = props.selected as string[];
      const next = current.includes(option)
        ? current.filter((x) => x !== option)
        : [...current, option];
      (props.onChange as (next: string[]) => void)(next);
    } else {
      const current = props.selected as string;
      (props.onChange as (next: string) => void)(current === option ? "" : option);
    }
  };

  return (
    <div className="style-pills">
      {visible.map((option) => (
        <button
          key={option}
          type="button"
          className={`style-pill${isSelected(option) ? (multi ? " multi-selected" : " selected") : ""}`}
          onClick={() => handle(option)}
        >
          {option}
        </button>
      ))}
      {needsCollapse && !expanded && (
        <button
          type="button"
          className="cluster-expander"
          onClick={() => setExpanded(true)}
          aria-label={`Show ${hiddenCount} more options`}
        >
          + {hiddenCount} more
        </button>
      )}
      {needsCollapse && expanded && (
        <button
          type="button"
          className="cluster-expander"
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
}
