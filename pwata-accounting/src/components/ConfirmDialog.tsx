"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PromptOptions {
  title: string;
  body?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

type State =
  | { kind: "closed" }
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void };

export function useConfirm() {
  const [state, setState] = useState<State>({ kind: "closed" });
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setState({ kind: "closed" });
    setValue("");
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ kind: "confirm", opts, resolve });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setValue(opts.defaultValue ?? "");
      setState({ kind: "prompt", opts, resolve });
    });
  }, []);

  useEffect(() => {
    if (state.kind === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (state.kind === "confirm") state.resolve(false);
        if (state.kind === "prompt") state.resolve(null);
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    if (state.kind === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  const render = useCallback(() => {
    if (state.kind === "closed") return null;
    const danger = state.kind === "confirm" && state.opts.danger;
    const confirmLabel = state.opts.confirmLabel ?? (state.kind === "confirm" ? (danger ? "Delete" : "Confirm") : "Save");
    const cancelLabel = state.opts.cancelLabel ?? "Cancel";

    const onCancel = () => {
      if (state.kind === "confirm") state.resolve(false);
      if (state.kind === "prompt") state.resolve(null);
      close();
    };
    const onConfirm = () => {
      if (state.kind === "confirm") {
        state.resolve(true);
        close();
      } else {
        const v = value.trim();
        if (state.opts.required && !v) {
          inputRef.current?.focus();
          return;
        }
        state.resolve(v.length ? v : (state.opts.required ? v : ""));
        close();
      }
    };

    return (
      <>
        <div className="confirm-backdrop" onClick={onCancel} />
        <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <h3 id="confirm-title" className="confirm-title">{state.opts.title}</h3>
          {state.opts.body && <p className="confirm-body">{state.opts.body}</p>}
          {state.kind === "prompt" && (
            <div className="confirm-field">
              {state.opts.label && <label className="label">{state.opts.label}</label>}
              <input
                ref={inputRef}
                type="text"
                className="input"
                placeholder={state.opts.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }}
              />
            </div>
          )}
          <div className="confirm-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
            <button
              type="button"
              className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </>
    );
  }, [state, value, close]);

  return { confirm, prompt, render };
}
