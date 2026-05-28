/**
 * app/features/admin/composables/useFeedbackSummary.ts
 *
 * Normalizes backend feedback summary into frontend view model.
 */

export interface FeedbackReason {
  label: string;
  count: number;
}

/**
 * Backend response shape.
 */
export interface FeedbackSummaryDTO {
  totalCount: number;
  upCount: number;
  downCount: number;
  reasons: FeedbackReason[];
}

/**
 * Frontend view model.
 * Keep `up` / `down` for easier template usage.
 */
export interface FeedbackSummary {
  total: number;
  up: number;
  down: number;
  reasons: FeedbackReason[];
}

function createEmptyFeedbackSummary(): FeedbackSummary {
  return {
    total: 0,
    up: 0,
    down: 0,
    reasons: [],
  };
}

export function useFeedbackSummary() {
  function buildFeedbackSummary(summary?: FeedbackSummaryDTO | null): FeedbackSummary {
    if (!summary) {
      return createEmptyFeedbackSummary();
    }

    return {
      total: summary.totalCount ?? 0,
      up: summary.upCount ?? 0,
      down: summary.downCount ?? 0,
      reasons: summary.reasons ?? [],
    };
  }

  return { buildFeedbackSummary };
}
