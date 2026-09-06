// Shared scoring logic for the Configurable Dimensions engine.

export const DIMENSION_LABELS = {
  conversion: 'Conversion Potential',
  reach: 'Reach Potential',
  priority: 'Strategic Priority',
  backing: 'Intelligence Backing',
};

export const DIMENSION_SOURCES = {
  conversion: 'Expected conversion %',
  reach: 'Expected reach (relative to best idea)',
  priority: 'Priority level',
  backing: 'Source intelligence present',
};

// Raw 0-100 value of a dimension for one idea.
export function dimensionValue(key, idea, ideas) {
  switch (key) {
    case 'conversion':
      return Math.min(100, Math.max(0, idea.expected_conversion_pct || 0));
    case 'reach': {
      const max = Math.max(...ideas.map((i) => i.expected_reach || 0), 1);
      return Math.round(((idea.expected_reach || 0) / max) * 100);
    }
    case 'priority':
      return { low: 40, medium: 70, high: 100 }[idea.priority] || 50;
    case 'backing':
      return idea.source_intelligence ? 100 : 40;
    default:
      return 50;
  }
}

// Weighted total score 0-100. Weights are normalized so scores stay comparable
// even when they don't sum to exactly 100%. Returns null when nothing is configured.
export function weightedScore(idea, ideas, dimensions) {
  const active = (dimensions || []).filter((d) => d.key && Number(d.weight) > 0);
  const totalWeight = active.reduce((sum, d) => sum + Number(d.weight), 0);
  if (active.length === 0 || totalWeight === 0) return null;
  const raw = active.reduce(
    (sum, d) => sum + (Number(d.weight) / totalWeight) * dimensionValue(d.key, idea, ideas),
    0
  );
  return Math.round(raw);
}