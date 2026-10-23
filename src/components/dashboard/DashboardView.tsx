import React, { useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Package,
  Users,
  Coins,
  ArrowUpRight,
  ShoppingCart,
  Plus,
  Boxes
} from 'lucide-react';
import { Sale, Product, Customer } from '../../types';
import { formatRupiah } from '../../utils/pos-calculations';
import { ActiveTab } from '../common/Sidebar';

interface DashboardViewProps {
  organizationName: string;
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  organizationName,
  sales,
  products,
  customers,
  onNavigate
}) => {
  // Metrics calculations
  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(s => s.createdAt.startsWith(today) && s.status === 'completed');

    const totalTodayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalTransactions = todaySales.length;

    // Gross profit estimation: Total line total minus (unitCostSnapshot * quantity)
    let totalGrossProfit = 0;
    sales
      .filter(s => s.status === 'completed')
      .forEach(s => {
        s.items.forEach(item => {
          const cost = (item.unitCostSnapshot || 0) * item.quantity;
          totalGrossProfit += item.lineTotal - cost;
        });
      });

    // Low stock products
    const lowStockList = products.filter(p => p.isActive && p.currentStock <= p.minimumStock);

    // Top selling products count
    const productSoldMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales
      .filter(s => s.status === 'completed')
      .forEach(s => {
        s.items.forEach(item => {
          if (!productSoldMap[item.productId]) {
            productSoldMap[item.productId] = {
              name: item.productNameSnapshot,
              qty: 0,
              revenue: 0
            };
          }
          productSoldMap[item.productId].qty += item.quantity;
          productSoldMap[item.productId].revenue += item.lineTotal;
        });
      });

    const topProducts = Object.values(productSoldMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalTodayRevenue,
      totalTransactions,
      totalGrossProfit,
      lowStockList,
      topProducts,
      totalProductsCount: products.filter(p => p.isActive).length,
      totalCustomersCount: customers.length
    };
  }, [sales, products, customers]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Dashboard {organizationName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau performa penjualan, ketersediaan stok, dan laba toko secara real-time.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buka Kasir (POS)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Penjualan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {formatRupiah(metrics.totalTodayRevenue)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{metrics.totalTransactions} transaksi tercatat</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Laba Kotor
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-2">
            {formatRupiah(metrics.totalGrossProfit)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Selisih harga jual terhadap modal
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stok Menipis / Habis
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                metrics.lowStockList.length > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-50 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-600 mt-2">
            {metrics.lowStockList.length} Produk
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 flex items-center gap-1"
          >
            <span>Tinjau persediaan</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Master Data */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Katalog &amp; Pelanggan
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {metrics.totalProductsCount} Produk
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.totalCustomersCount} Pelanggan terdaftar
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Produk Terlaris</h2>
              <p className="text-xs text-slate-400">Berdasarkan volume transaksi penjualan</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Lihat Laporan
            </button>
          </div>

          <div className="space-y-3">
            {metrics.topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi penjualan yang tercatat.
              </div>
            ) : (
              metrics.topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-400">Terjual {p.qty} unit</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {formatRupiah(p.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Peringatan Stok Menipis</h2>
              <p className="text-xs text-slate-400">
                Segera lakukan restock ke supplier sebelum barang habis
              </p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Kelola Stok
            </button>
          </div>

          <div className="space-y-3">
            {metrics.lowStockList.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 text-xs font-medium">
                Semua stok produk dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              metrics.lowStockList.map(prod => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-200"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{prod.name}</div>
                    <div className="text-[11px] text-slate-500">
                      SKU: {prod.sku} · Min: {prod.minimumStock} {prod.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        prod.currentStock <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Sisa: {prod.currentStock} {prod.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
