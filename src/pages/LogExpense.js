import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './LogExpense.css';

const CATEGORIES = [
  { key: 'Food',          label: '🍔 Food' },
  { key: 'Grocery',       label: '🛒 Grocery' },
  { key: 'Rent',          label: '🏠 Rent' },
  { key: 'Cab',           label: '🚕 Cab' },
  { key: 'Entertainment', label: '🎬 Entertainment' },
  { key: 'Other',         label: '✏️ Other' },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const emptyRow = () => ({ id: Date.now() + Math.random(), name: '', qty: '1', price: '' });

export default function LogExpense() {
  const { user } = useAuth();

  const [selectedCat, setSelectedCat] = useState('');
  const [customCat,   setCustomCat]   = useState('');
  const [shop,        setShop]        = useState('');
  const [date,        setDate]        = useState(today());
  const [rows,        setRows]        = useState([emptyRow()]);
  const [toast,       setToast]       = useState({ text: '', ok: true, show: false });
  const [saving,      setSaving]      = useState(false);

  const showToast = (text, ok) => {
    setToast({ text, ok, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const effectiveCat = () =>
    selectedCat === 'Other' ? (customCat.trim() || 'Other') : selectedCat;

  const addRow    = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id) => setRows(r => r.filter(x => x.id !== id));

  const updateRow = (id, field, value) => {
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const resetForm = () => {
    setSelectedCat('');
    setCustomCat('');
    setShop('');
    setDate(today());
    setRows([emptyRow()]);
  };

  const handleSave = async () => {
    if (!shop.trim()) { showToast('Shop name is required.', false); return; }
    if (!selectedCat)  { showToast('Please select a category.', false); return; }

    const validRows = rows.filter(r => r.name.trim());
    if (!validRows.length) { showToast('Add at least one product.', false); return; }

    // Validate qty and price
    for (const r of validRows) {
      const qty = parseFloat(r.qty);
      if (isNaN(qty) || qty <= 0) {
        showToast(`Invalid quantity for "${r.name}". Must be a positive number.`, false);
        return;
      }
    }

    setSaving(true);
    try {
      // Insert expense header
      const { data: expense, error: expErr } = await supabase
        .from('expenses')
        .insert({
          user_id:  user.id,
          shop:     shop.trim(),
          date,
          category: effectiveCat(),
        })
        .select()
        .single();

      if (expErr) throw expErr;

      // Insert all product rows
      const products = validRows.map(r => ({
        expense_id: expense.id,
        name:       r.name.trim(),
        qty:        parseFloat(r.qty) || 1,
        unit_price: parseFloat(r.price) || 0,
      }));

      const { error: prodErr } = await supabase
        .from('expense_products')
        .insert(products);

      if (prodErr) throw prodErr;

      resetForm();
      showToast('Expense saved! ✓', true);
    } catch (err) {
      showToast(err.message || 'Failed to save. Try again.', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="log-panel">
      <div className="section-title">Log an Expense</div>
      <p className="section-sub">Select a category, enter the shop name and add products with prices.</p>

      {/* Category */}
      <div className="field" style={{ marginBottom: '22px' }}>
        <label>Category</label>
        <div className="cat-chips">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`cat-chip${selectedCat === c.key ? ' selected' : ''}`}
              onClick={() => { setSelectedCat(c.key); if (c.key !== 'Other') setCustomCat(''); }}
            >
              {c.label}
            </button>
          ))}
        </div>
        {selectedCat === 'Other' && (
          <input
            type="text"
            className="cat-other-input"
            placeholder="Describe your category…"
            value={customCat}
            onChange={e => setCustomCat(e.target.value)}
            autoFocus
          />
        )}
      </div>

      {/* Shop + Date */}
      <div className="form-grid">
        <div className="field">
          <label>Shop / Store Name</label>
          <input
            type="text"
            placeholder="e.g. Countdown, Pak'nSave…"
            value={shop}
            onChange={e => setShop(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Products */}
      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)' }}>
        Products &amp; Prices
      </label>
      <p className="hint" style={{ marginBottom: '12px' }}>
        Add each product, quantity (decimals allowed), and unit price.
      </p>

      <div className="product-header">
        <span>Product</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span />
      </div>

      <div className="product-rows">
        {rows.map(row => (
          <div key={row.id} className="product-row">
            <input
              type="text"
              placeholder="Product name"
              value={row.name}
              onChange={e => updateRow(row.id, 'name', e.target.value)}
            />
            {/* qty: step="any" allows decimals like 0.5, 1.25, 2.5 */}
            <input
              type="number"
              placeholder="Qty"
              min="0.001"
              step="any"
              value={row.qty}
              onChange={e => updateRow(row.id, 'qty', e.target.value)}
              style={{ textAlign: 'center' }}
            />
            <input
              type="number"
              placeholder="Price $"
              min="0"
              step="0.01"
              value={row.price}
              onChange={e => updateRow(row.id, 'price', e.target.value)}
            />
            <button
              className="remove-btn"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              title="Remove"
            >×</button>
          </div>
        ))}
      </div>

      <button className="add-product-btn" onClick={addRow}>+ Add Product</button>

      <div className="submit-row">
        <button className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Expense'}
        </button>
        <div className={`toast${toast.show ? ' show' : ''} ${toast.ok ? 'ok' : 'err'}`}>
          {toast.text}
        </div>
      </div>
    </div>
  );
}
