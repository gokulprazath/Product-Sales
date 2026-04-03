export const CAT_COLORS = {
  'Food':          { bg: '#fde8cc', color: '#7a3a08' },
  'Grocery':       { bg: '#d4edda', color: '#185c28' },
  'Rent':          { bg: '#cce0f5', color: '#0d3a6e' },
  'Cab':           { bg: '#fff3cd', color: '#7a5000' },
  'Entertainment': { bg: '#e8d4f5', color: '#480d7a' },
  'Other':         { bg: '#e2e2e2', color: '#404040' },
};

export function catStyle(cat) {
  const key = Object.keys(CAT_COLORS).find(k => cat === k) || 'Other';
  const c = CAT_COLORS[key];
  return { background: c.bg, color: c.color };
}
