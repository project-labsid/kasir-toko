import React, { useState, useMemo } from 'react';
import { Receipt, Search, Printer, RotateCcw, Eye, Calendar, User, CheckCircle2 } from 'lucide-react';
import { Sale, StoreSettings } from '../../types';
import { formatRupiah } from '../../utils/pos-calculations';

interface TransactionsViewProps {
  sales: Sale[];
  storeSettings: StoreSettings;
  onRefresh: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  sales,
  storeSettings,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        s.transactionNumber.toLowerCase().includes(q) ||
        (s.cashierName && s.cashierName.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q))
      );
    });
  }, [sales, search]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Riwayat Transaksi Penjualan
          </h1>
          <p className="text-xs text-slate-500">
            Daftar seluruh nota penjualan, status pembayaran, dan pencetakan ulang struk.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nomor nota, kasir, atau pelanggan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-3">Waktu &amp; Tanggal</th>
                <th className="py-3 px-3">Kasir &amp; Pelanggan</th>
                <th className="py-3 px-3">Metode Bayar</th>
                <th className="py-3 px-3 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">
                      {sale.transactionNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(sale.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{sale.cashierName || 'Kasir'}</div>
                      <div className="text-[11px] text-slate-400">
                        {sale.customerName ? `Pelanggan: ${sale.customerName}` : 'Pelanggan Umum'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(sale.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        title="Lihat / Cetak Ulang Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Salinan Struk Transaksi</span>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 font-mono text-xs text-slate-800 space-y-3 overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
                <div className="font-bold text-sm tracking-wide text-slate-900">
                  {storeSettings.storeName}
                </div>
                {storeSettings.storeAddress && (
                  <div className="text-[10px] text-slate-600">{storeSettings.storeAddress}</div>
                )}
                <div className="text-[10px] text-slate-500 pt-1">
                  {storeSettings.receiptHeader}
                </div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold">{selectedSale.transactionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(selectedSale.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedSale.cashierName || 'Kasir'}</span>
                </div>
                {selectedSale.customerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{selectedSale.customerName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                {selectedSale.items.map(item => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="font-medium">{item.productNameSnapshot}</div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>
                        {item.quantity} × {formatRupiah(item.unitPrice)}
                      </span>
                      <span className="font-semibold">{formatRupiah(item.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedSale.discountAmount)}</span>
                  </div>
                )}
                {selectedSale.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Pajak PPN:</span>
                    <span>+{formatRupiah(selectedSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Metode:</span>
                  <span className="uppercase">{selectedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dibayar:</span>
                  <span>{formatRupiah(selectedSale.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-teal-800">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(selectedSale.changeDue)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-1">
                {storeSettings.receiptFooter}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handlePrint}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ulang Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
