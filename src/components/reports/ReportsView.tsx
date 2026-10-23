import React, { useMemo } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { Sale, Expense, Product } from '../../types';
import { formatRupiah } from '../../utils/pos-calculations';

interface ReportsViewProps {
  organizationName: string;
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  organizationName,
  sales,
  expenses,
  products
}) => {
  // Aggregate Calculations
  const report = useMemo(() => {
    let totalRevenue = 0;
    let totalCOGS = 0; // Cost of Goods Sold

    const productSalesMap: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
    const cashierSalesMap: Record<string, { name: string; count: number; total: number }> = {};

    sales
      .filter(s => s.status === 'completed')
      .forEach(s => {
        totalRevenue += s.totalAmount;

        // Cashier stats
        const cashier = s.cashierName || 'Kasir';
        if (!cashierSalesMap[cashier]) {
          cashierSalesMap[cashier] = { name: cashier, count: 0, total: 0 };
        }
        cashierSalesMap[cashier].count += 1;
        cashierSalesMap[cashier].total += s.totalAmount;

        // Product stats & COGS
        s.items.forEach(it => {
          const itemCost = (it.unitCostSnapshot || 0) * it.quantity;
          totalCOGS += itemCost;

          if (!productSalesMap[it.productId]) {
            productSalesMap[it.productId] = {
              name: it.productNameSnapshot,
              qty: 0,
              revenue: 0,
              profit: 0
            };
          }
          productSalesMap[it.productId].qty += it.quantity;
          productSalesMap[it.productId].revenue += it.lineTotal;
          productSalesMap[it.productId].profit += it.lineTotal - itemCost;
        });
      });

    const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpense;

    return {
      totalRevenue,
      totalCOGS,
      totalExpense,
      grossProfit,
      netProfit,
      productSalesList: Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue),
      cashierSalesList: Object.values(cashierSalesMap).sort((a, b) => b.total - a.total)
    };
  }, [sales, expenses]);

  // Export to CSV
  const handleExportCSV = () => {
    let csv = `LAPORAN PENJUALAN & LABA - ${organizationName}\n`;
    csv += `Tanggal Export: ${new Date().toLocaleString('id-ID')}\n\n`;

    csv += `RINGKASAN FINANSIAL\n`;
    csv += `Total Pendapatan Penjualan,${report.totalRevenue}\n`;
    csv += `Total Harga Pokok Penjualan (HPP / Modal),${report.totalCOGS}\n`;
    csv += `Estimasi Laba Kotor,${report.grossProfit}\n`;
    csv += `Total Beban Operasional,${report.totalExpense}\n`;
    csv += `Estimasi Laba Bersih,${report.netProfit}\n\n`;

    csv += `RINCIAN PER PRODUK\n`;
    csv += `Nama Produk,Kuantitas Terjual,Omset Penjualan (Rp),Estimasi Keuntungan (Rp)\n`;
    report.productSalesList.forEach(p => {
      csv += `"${p.name}",${p.qty},${p.revenue},${p.profit}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_super_kasir_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Laporan Keuangan &amp; Analisis Penjualan
          </h1>
          <p className="text-xs text-slate-500">
            Perhitungan omset, harga modal (HPP), biaya operasional, dan laba bersih toko secara akurat.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Laporan (CSV)</span>
        </button>
      </div>

      {/* Financial Statement KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Omset Penjualan
          </span>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {formatRupiah(report.totalRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total penerimaan dari nota</div>
        </div>

        {/* Total COGS / Modal */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Modal Produk (HPP)
          </span>
          <div className="text-xl font-bold text-slate-700 mt-2">
            {formatRupiah(report.totalCOGS)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Biaya modal barang terjual</div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Laba Kotor
          </span>
          <div className="text-xl font-bold text-teal-700 mt-2">
            {formatRupiah(report.grossProfit)}
          </div>
          <div className="text-xs text-teal-600 mt-1">Omset dikurangi modal</div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Laba Bersih Toko
          </span>
          <div
            className={`text-xl font-bold mt-2 ${
              report.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatRupiah(report.netProfit)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Setelah dipotong operasional ({formatRupiah(report.totalExpense)})
          </div>
        </div>
      </div>

      {/* Two Column Breakdown: Product Performance & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Sales Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Performa Penjualan Per Produk
            </h2>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Nama Produk</th>
                  <th className="py-2.5 px-3 text-center">Terjual</th>
                  <th className="py-2.5 px-3 text-right">Omset</th>
                  <th className="py-2.5 px-4 text-right">Keuntungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.productSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Belum ada penjualan tercatat.
                    </td>
                  </tr>
                ) : (
                  report.productSalesList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">{p.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(p.revenue)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-700">
                        {formatRupiah(p.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kontribusi Penjualan Per Kasir
            </h2>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5 px-4">Nama Kasir</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Nota</th>
                  <th className="py-2.5 px-4 text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.cashierSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      Belum ada kasir yang memproses nota.
                    </td>
                  </tr>
                ) : (
                  report.cashierSalesList.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {c.count} nota
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-700">
                        {formatRupiah(c.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
