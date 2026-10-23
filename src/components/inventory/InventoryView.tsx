import React, { useState } from 'react';
import { Boxes, ArrowDownRight, ArrowUpRight, Plus, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { Product, InventoryMovement } from '../../types';
import { tenantStore } from '../../db/tenant-store';

interface InventoryViewProps {
  organizationId: string;
  products: Product[];
  movements: InventoryMovement[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  organizationId,
  products,
  movements,
  onRefresh
}) => {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Stok Masuk Tambahan');
  const [error, setError] = useState('');

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      setError('Pilih produk terlebih dahulu');
      return;
    }
    if (quantity <= 0) {
      setError('Kuantitas penyesuaian harus lebih dari 0');
      return;
    }

    const delta = adjustmentType === 'in' ? quantity : -quantity;
    const newStock = product.currentStock + delta;
    if (newStock < 0) {
      setError(`Pengurangan melebihi stok yang ada (Stok sekarang: ${product.currentStock})`);
      return;
    }

    try {
      tenantStore.updateProduct(organizationId, product.id, {
        currentStock: newStock
      });
      setShowAdjustModal(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menyesuaikan stok');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-teal-600" />
            Persediaan &amp; Mutasi Inventaris
          </h1>
          <p className="text-xs text-slate-500">
            Audit histori pergerakan stok keluar/masuk, penyesuaian fisik, dan pencegahan stok minus.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProductId(products[0]?.id || '');
            setQuantity(1);
            setReason('Stok Masuk Tambahan');
            setError('');
            setShowAdjustModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Penyesuaian Stok Fisik</span>
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {products.some(p => p.currentStock <= p.minimumStock) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900">
            <span className="font-bold">Perhatian:</span> Beberapa produk telah mencapai atau berada di bawah batas minimum stok. Segera buat pesanan pembelian restock.
          </div>
        </div>
      )}

      {/* Two Column Layout: Current Stock Table & Mutation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stock Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status Stok Saat Ini
            </h2>
            <span className="text-xs text-slate-500">{products.length} produk</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Nama Produk &amp; SKU</th>
                  <th className="py-2.5 px-3 text-center">Batas Min</th>
                  <th className="py-2.5 px-4 text-right">Stok Fisik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const isLow = p.currentStock <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            p.currentStock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mutation Audit Trail */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catatan Riwayat Mutasi (Audit Trail)
            </h2>
            <span className="text-xs text-slate-500">{movements.length} log mutasi</span>
          </div>

          <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-100 p-2">
            {movements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada mutasi stok tercatat.
              </div>
            ) : (
              movements.map(m => {
                const isPositive = m.quantityDelta > 0;
                return (
                  <div key={m.id} className="p-2.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{m.productName || 'Produk'}</div>
                        <div className="text-[11px] text-slate-500">{m.reason || 'Mutasi Stok'}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(m.createdAt).toLocaleString('id-ID')} · Oleh: {m.actorName || 'Kasir/Owner'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Penyesuaian Fisik Stok</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-3">
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Produk
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arah Penyesuaian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('in')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      adjustmentType === 'in'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Tambah Stok (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('out')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      adjustmentType === 'out'
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Kurang Stok (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kuantitas Perubahan
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan / Keterangan Penyesuaian *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Contoh: Stok opname fisik, barang rusak, retur supplier"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-xs"
                >
                  Terapkan Mutasi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
