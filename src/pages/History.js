import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { catStyle } from '../lib/catColors';
import { exportToExcel } from '../lib/exportExcel';
import './History.css';

const pad = n => String(n).padStart(2, '0');
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = () => fmtDate(new Date());

function getRangeDates(range, customFrom, customTo) {
  const now = new Date();
  const to = today();
  if (range === 'week')    { const d = new Date(now); d.setDate(d.getDate()-7);        return { from: fmtDate(d), to }; }
  if (range === 'month')   { const d = new Date(now); d.setMonth(d.getMonth()-1);      return { from: fmtDate(d), to }; }
  if (range === '3months') { const d = new Date(now); d.setMonth(d.getMonth()-3);      return { from: fmtDate(d), to }; }
  if (range === 'year')    { const d = new Date(now); d.setFullYear(d.getFullYear()-1); return { from: fmtDate(d), to }; }
  if (range === 'all')     { return { from: '0001-01-01', to: '9999-12-31' }; }
  return { from: customFrom || '0001-01-01', to: customTo || '9999-12-31' };
}

const formatQty = qty => {
  const n = parseFloat(qty);
  return n % 1 === 0 ? n.toString() : n.toFixed(3).replace(/\.?0+$/, '');
};

export default function History({ exportTrigger }) {
  const { user } = useAuth();

  const [expenses,    setExpenses]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [range,       setRange]       = useState('month');
  const [customFrom,  setCustomFrom]  = useState('');
  const [customTo,    setCustomTo]    = useState('');
  const [filterText,  setFilterText]  = useState('');

  // Fetch all expenses + products for this user
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id, shop, date, category,
          expense_products(id, name, qty, unit_price)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-export when triggered from parent (Header button)
  useEffect(() => {
    if (exportTrigger > 0) handleExport(); // eslint-disable-line
  }, [exportTrigger]); // eslint-disable-line

  const { from, to } = getRangeDates(range, customFrom, customTo);

  const ranged = expenses.filter(e => e.date >= from && e.date <= to);

  const filtered = ranged.filter(e => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      e.shop.toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.expense_products || []).some(p => p.name.toLowerCase().includes(q))
    );
  });

  // Stats
  const totalSpend = ranged.reduce((sum, e) =>
    sum + (e.expense_products || []).reduce((s, p) => s + p.unit_price * p.qty, 0), 0);
  const shopSet = new Set(ranged.map(e => e.shop));
  const prodSet = new Set(ranged.flatMap(e => (e.expense_products || []).map(p => p.name)));
  const catTotals = {};
  ranged.forEach(e => {
    const c = e.category || 'Other';
    catTotals[c] = (catTotals[c] || 0) +
      (e.expense_products || []).reduce((s, p) => s + p.unit_price * p.qty, 0);
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;
    // expense_products cascade-deletes via FK
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL your expense data? This cannot be undone.')) return;
    const { error } = await supabase.from('expenses').delete().eq('user_id', user.id);
    if (!error) setExpenses([]);
  };

  // Expose clearAll to parent via window (simple approach)
  useEffect(() => { window.__clearAll = handleClearAll; }); // eslint-disable-line

  const handleExport = () => exportToExcel(filtered, { from, to });

  if (loading) {
    return <div className="history-loading">Loading expenses…</div>;
  }

  return (
    <div className="history-panel">
      <div className="section-title">Expense History</div>
      <p className="section-sub">Filter by date range, search by shop, product or category, and export.</p>

      {/* Stats strip */}
      <div className="stats-strip">
        <div className="stat-card">
          <div className="stat-label">Total Spend</div>
          <div className="stat-value">${totalSpend.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shops Visited</div>
          <div className="stat-value">{shopSet.size}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Products Tracked</div>
          <div className="stat-value">{prodSet.size}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Category</div>
          <div className="stat-value stat-value--sm">{topCat ? topCat[0] : '—'}</div>
        </div>
      </div>

      {/* Date range bar */}
      <div className="date-range-bar">
        {['week','month','3months','year','all'].map(r => (
          <button
            key={r}
            className={`range-btn${range === r ? ' active' : ''}`}
            onClick={() => { setRange(r); setCustomFrom(''); setCustomTo(''); }}
          >
            {r === 'week' ? 'Last Week'
              : r === 'month'   ? 'Last Month'
              : r === '3months' ? 'Last 3 Months'
              : r === 'year'    ? 'Last Year'
              : 'All Time'}
          </button>
        ))}
        <div className="range-divider" />
        <div className="custom-range">
          <span>From</span>
          <input type="date" value={customFrom}
            onChange={e => { setCustomFrom(e.target.value); setRange('custom'); }} />
          <span>To</span>
          <input type="date" value={customTo}
            onChange={e => { setCustomTo(e.target.value); setRange('custom'); }} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="history-toolbar">
        <input
          type="text"
          placeholder="Filter by shop, product or category…"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />
        <button className="btn primary" onClick={handleExport}>⬇ Export Excel</button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="no-results">
          {expenses.length === 0
            ? 'No expenses yet. Log one in the "Log Expense" tab!'
            : 'No expenses match this period or filter.'}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Shop</th>
                <th>Products</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const total = (e.expense_products || []).reduce(
                  (s, p) => s + p.unit_price * p.qty, 0);
                return (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>
                      <span className="cat-badge" style={catStyle(e.category)}>
                        {e.category || 'Other'}
                      </span>
                    </td>
                    <td className="shop-cell">{e.shop}</td>
                    <td>
                      {(e.expense_products || []).map(p => {
                        const sub = p.unit_price * p.qty;
                        const qtyStr = formatQty(p.qty);
                        return (
                          <span key={p.id} className="product-tag">
                            {p.name}
                            {parseFloat(p.qty) !== 1 ? ` ×${qtyStr}` : ''}
                            {' '}
                            <span className="ptag-price">${sub.toFixed(2)}</span>
                          </span>
                        );
                      })}
                    </td>
                    <td className="total-cell">${total.toFixed(2)}</td>
                    <td>
                      <button
                        className="delete-row-btn"
                        onClick={() => handleDelete(e.id)}
                        title="Delete"
                      >🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
