import React, { useState } from 'react';
import { Truck, Plus, PackageCheck, Calendar } from 'lucide-react';
import { Purchase, Product, Supplier } from '../../types';
import { formatRupiah } from '../../utils/pos-calculations';
import { tenantStore } from '../../db/tenant-store';

interface PurchasesViewProps {
  organizationId: string;
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  organizationId,
  purchases,
  products,
  suppliers,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(0);
  const [error, setError] = useState('');

  const handleOpenModal = () => {
    setSupplierId(suppliers[0]?.id || '');
    const firstProduct = products[0];
    setProductId(firstProduct?.id || '');
    setQuantity(10);
    setUnitCost(firstProduct?.costPrice || 0);
    setError('');
    setShowModal(true);
  };

  const handleProductChange = (prodId: string) => {
    setProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitCost(prod.costPrice);
    }
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const product = products.find(p => p.id === productId);
    if (!product) {
      setError('Pilih produk yang dibeli');
      return;
    }
    if (quantity <= 0) {
      setError('Kuantitas harus lebih dari 0');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    const lineTotal = unitCost * quantity;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const purchaseNumber = `PO-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    // Add purchase
    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      organizationId,
      supplierId: supplier?.id,
      supplierName: supplier?.name,
      purchaseNumber,
      subtotal: lineTotal,
      totalAmount: lineTotal,
      status: 'completed',
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitCost,
          lineTotal
        }
      ],
      createdBy: 'Owner',
      createdAt: new Date().toISOString()
    };

    // Update product stock and cost price
    tenantStore.updateProduct(organizationId, product.id, {
      currentStock: product.currentStock + quantity,
      costPrice: unitCost > 0 ? unitCost : product.costPrice
    });

    // We can push to state via tenantStore
    (tenantStore as any).state.purchases.push(newPurchase);
    (tenantStore as any).saveState();

    setShowModal(false);
    onRefresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            Pengadaan Barang &amp; Pembelian
          </h1>
          <p className="text-xs text-slate-500">
            Catatan stok masuk dari supplier dengan pembaruan otomatis ke persediaan toko.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={products.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Restock Pembelian Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">No. PO</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Rincian Barang</th>
                <th className="py-3 px-4 text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada riwayat pembelian supplier.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.purchaseNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {p.supplierName || 'Pemasok Umum'}
                    </td>
                    <td className="py-3 px-3">
                      {p.items.map((it, idx) => (
                        <div key={idx} className="text-xs">
                          {it.productName} ({it.quantity} × {formatRupiah(it.unitCost)})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-800">
                      {formatRupiah(p.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Catat Pembelian Supplier (Restock)</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 space-y-3">
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Supplier
                </label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                >
                  <option value="">-- Pemasok / Grosir Umum --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Produk Yang Dibeli *
                </label>
                <select
                  value={productId}
                  onChange={e => handleProductChange(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Masuk (Qty) *
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
                    Harga Beli Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={unitCost}
                    onChange={e => setUnitCost(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Total Pembelian:</span>
                <span className="text-base font-bold text-teal-800">
                  {formatRupiah(unitCost * quantity)}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-xs"
                >
                  Simpan &amp; Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
