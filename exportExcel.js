import * as XLSX from 'xlsx';

const pad = n => String(n).padStart(2, '0');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

/**
 * @param {Array} expenses  - array of expense objects with expense_products[]
 * @param {Object} range    - { from, to } strings for filename
 */
export function exportToExcel(expenses, { from, to } = {}) {
  if (!expenses.length) { alert('No data to export yet.'); return; }

  // ── Sheet 1: All rows ─────────────────────────────────────
  const rows = [['Date', 'Category', 'Shop', 'Product', 'Qty', 'Unit Price ($)', 'Subtotal ($)']];
  expenses.forEach(e => {
    (e.expense_products || []).forEach(p => {
      rows.push([
        e.date,
        e.category || 'Other',
        e.shop,
        p.name,
        parseFloat(p.qty),
        parseFloat(p.unit_price),
        parseFloat(p.unit_price) * parseFloat(p.qty),
      ]);
    });
  });

  // ── Sheet 2: By Category ──────────────────────────────────
  const catTotals = {};
  expenses.forEach(e => {
    const c = e.category || 'Other';
    (e.expense_products || []).forEach(p => {
      catTotals[c] = (catTotals[c] || 0) + p.unit_price * p.qty;
    });
  });
  const catRows = [['Category', 'Total ($)'],
    ...Object.entries(catTotals).sort((a, b) => b[1] - a[1])];

  // ── Sheet 3: By Shop ──────────────────────────────────────
  const shopTotals = {};
  expenses.forEach(e => {
    (e.expense_products || []).forEach(p => {
      shopTotals[e.shop] = (shopTotals[e.shop] || 0) + p.unit_price * p.qty;
    });
  });
  const shopRows = [['Shop', 'Total ($)'],
    ...Object.entries(shopTotals).sort((a, b) => b[1] - a[1])];

  // ── Build workbook ────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(rows);
  ws1['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 28 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Expenses');

  const ws2 = XLSX.utils.aoa_to_sheet(catRows);
  ws2['!cols'] = [{ wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'By Category');

  const ws3 = XLSX.utils.aoa_to_sheet(shopRows);
  ws3['!cols'] = [{ wch: 24 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'By Shop');

  XLSX.writeFile(wb, `expenses_${todayStr()}.xlsx`);
}
