import type { StylesConfig } from "react-select";

export const labelClass = "block text-[12.5px] font-semibold text-foreground/65 tracking-[0.5px] uppercase mb-2";
export const inputClass = "w-full py-2.5 pl-10 pr-3 bg-white/[0.45] border border-foreground/[0.09] rounded-[11px] text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/45 focus:bg-white/[0.65] focus:shadow-[0_0_0_3px_hsl(342_80%_53%/0.1)] transition-all duration-200";
export const errorClass = "text-xs text-primary mt-1.5";
export const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/20 pointer-events-none";

export const selectStyles: StylesConfig = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderColor: state.isFocused ? "hsl(342 80% 53% / 0.45)" : "hsl(var(--foreground) / 0.09)",
    borderRadius: "11px",
    padding: "1px 4px",
    fontSize: "14px",
    boxShadow: state.isFocused ? "0 0 0 3px hsl(342 80% 53% / 0.1)" : "none",
    "&:hover": { borderColor: "hsl(342 80% 53% / 0.3)" },
    minHeight: "40px",
    cursor: "pointer",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--foreground) / 0.2)",
    fontSize: "14px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
    fontSize: "14px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: "11px",
    border: "1px solid hsl(var(--foreground) / 0.09)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    backdropFilter: "blur(20px)",
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "hsl(342 80% 53% / 0.12)" : state.isFocused ? "hsl(342 80% 53% / 0.06)" : "transparent",
    color: "hsl(var(--foreground))",
    fontSize: "14px",
    cursor: "pointer",
    "&:active": { backgroundColor: "hsl(342 80% 53% / 0.15)" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--foreground) / 0.3)",
    "&:hover": { color: "hsl(var(--foreground) / 0.5)" },
  }),
};
