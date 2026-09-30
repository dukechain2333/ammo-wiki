import type { Confidence as Level } from "@/lib/schema";

export const CONFIDENCE_LABEL: Record<Level, string> = { high: "High", medium: "Medium", low: "Low" };

export const CONFIDENCE_TEXT: Record<Level, string> = {
  high: "The load's own chronograph series across barrel lengths.",
  medium: "Measured at a couple of barrel lengths; a similar load's measured curve fills the rest.",
  low: "One reading or only the maker's rating, placed on a similar load's curve.",
};

export function Meter({ level, large }: { level: Level; large?: boolean }) {
  return (
    <span className={large ? "meter lg" : "meter"} data-level={level} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function Confidence({ level, extra }: { level: Level; extra?: React.ReactNode }) {
  return (
    <span className="conf" title={CONFIDENCE_TEXT[level]}>
      <Meter level={level} />
      <span className="conf-label" data-level={level}>
        {CONFIDENCE_LABEL[level]}
        <span className="sr-only"> confidence</span>
      </span>
      {extra}
    </span>
  );
}
