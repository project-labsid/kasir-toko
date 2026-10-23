import React, { useState } from 'react';
import { TrendingDown, Plus, Calendar, Tag } from 'lucide-react';
import { Expense } from '../../types';
import { formatRupiah } from '../../utils/pos-calculations';
import { tenantStore } from '../../db/tenant-store';

interface ExpensesViewProps {
  organizationId: string;
  expenses: Expense[];
  onRefresh: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  organizationId,
  expenses,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operasional Toko');
  const [amount, setAmount] = useState(50000);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    tenantStore.addExpense(organizationId, {
      description: description.trim(),
      category,
      amount,
      expenseDate,
      createdBy: 'Owner'
    });

    setDescription('');
    setAmount(50000);
    setShowAddModal(false);
    onRefresh();
  };

  const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            Catatan Pengeluaran Operasional
          </h1>
          <p className="text-xs text-slate-500">
            Catat beban biaya listrik, sewa tempat, gaji staf, dan operasional lainnya untuk perhitungan laba bersih.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Total Pengeluaran Dicatat:
        </span>
        <span className="text-xl font-bold text-rose-700">
          {formatRupiah(totalExpense)}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Keterangan Biaya</th>
                <th className="py-3 px-4 text-right">Jumlah Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Belum ada pengeluaran operasional yang dicatat.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {e.expenseDate}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {e.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatRupiah(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Catat Beban Pengeluaran</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Token Listrik PLN, Beli Kantong Kresek"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                >
                  <option value="Operasional Toko">Operasional Toko</option>
                  <option value="Utilitas (Listrik/Air/Internet)">Utilitas (Listrik/Air/Internet)</option>
                  <option value="Perlengkapan & Plastik">Perlengkapan &amp; Plastik</option>
                  <option value="Gaji & Uang Makan">Gaji &amp; Uang Makan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Biaya (Rp) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-xs"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
