import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { catStyle } from '../lib/catColors';
import './Lookup.css';

export default function Lookup() {
  const { user } = useAuth();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const doLookup = async () => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); return; }

    setLoading(true);
    try {
      // Fetch all expense_products matching query for current user
      const { data, error } = await supabase
        .from('expense_products')
        .select(`
          name, qty, unit_price,
          expenses!inner(shop, date, category, user_id)
        `)
        .eq('expenses.user_id', user.id)
        .ilike('name', `%${q}%`)
        .order('unit_price', { ascending: true });

      if (error) throw error;

      const matches = (data || []).map(row => ({
        shop:     row.expenses.shop,
        product:  row.name,
        price:    row.unit_price,
        qty:      row.qty,
        date:     row.expenses.date,
        category: row.expenses.category,
      }));

      setResults(matches);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatQty = (qty) => {
    const n = parseFloat(qty);
    return n % 1 === 0 ? n.toString() : n.toFixed(3).replace(/\.?0+$/, '');
  };

  return (
    <div className="lookup-panel">
      <div className="section-title">Lookup a Product</div>
      <p className="section-sub">Type a product name to see which shops carry it and at what price.</p>

      <div className="lookup-box">
        <input
          type="text"
          placeholder="e.g. milk, bread, eggs…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLookup()}
        />
        <button className="lookup-btn" onClick={doLookup} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div className="lookup-results">
        {results === null && (
          <div className="no-results">Start typing a product name above ↑</div>
        )}
        {results !== null && results.length === 0 && (
          <div className="no-results">
            No records found for "<strong>{query}</strong>"
          </div>
        )}
        {results && results.map((m, i) => {
          const subtotal = m.price * m.qty;
          const qtyStr   = formatQty(m.qty);
          return (
            <div className="result-card" key={i}>
              <div>
                <div className="result-shop">{m.shop}</div>
                <div className="result-meta">
                  {m.product}
                  {parseFloat(m.qty) !== 1 ? ` × ${qtyStr}` : ''}
                  {' · '}
                  {m.date}
                  {m.category && (
                    <span className="cat-badge" style={catStyle(m.category)}>
                      {m.category}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="result-price">${subtotal.toFixed(2)}</div>
                {parseFloat(m.qty) !== 1 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    ${parseFloat(m.price).toFixed(2)} each
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
