// The slim, serializable view of a load that the client-side catalog filters and sorts.

import type { Confidence, DragModel } from "./schema";
import type { MvCurve } from "./mv";

export interface CatalogRow {
  id: string;
  caliber: string;
  brand?: string;
  name: string;
  sku?: string[];
  /** Is a generic or military-spec type, or a factory load standing in for one. */
  isStandard: boolean;
  /** For a factory load that stands in for a common type: that type's name. */
  standard?: string;
  /** Number of factory loads made to this type. */
  followers: number;
  weightGr: number;
  bc: number;
  dragModel: DragModel;
  confidence: Confidence;
  mvByBarrel: MvCurve;
  sourceCount: number;
  /** Normalized search text. */
  haystack: string;
}

export interface CaliberChip {
  id: string;
  short: string;
  count: number;
}

export const CONFIDENCE_RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };
