import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  Receipt,
  TrendingDown,
  BarChart3,
  UserCog,
  Settings,
  ShieldAlert,
  Building,
  Activity
} from 'lucide-react';
import { OrgRole } from '../../types';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'transactions'
  | 'expenses'
  | 'reports'
  | 'staff'
  | 'settings'
  | 'admin_overview'
  | 'admin_tenants'
  | 'admin_logs';

interface SidebarProps {
  currentRole: OrgRole | 'super_admin';
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const isSuperAdmin = currentRole === 'super_admin';
  const isOwner = currentRole === 'owner';
  const isCashier = currentRole === 'cashier';

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <div className="font-bold text-white flex items-center gap-2">
            <img src="/assets/aistudio/image_c62bdde1.png" alt="Logo" className="w-7 h-7 rounded object-contain bg-white p-0.5" />
            <span>SUPER KASIR</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {isSuperAdmin ? (
            <div>
              <div className="px-3 text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                SUPER ADMIN PLATFORM
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleNavClick('admin_overview')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'admin_overview'
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Monitoring Platform</span>
                </button>

                <button
                  onClick={() => handleNavClick('admin_tenants')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'admin_tenants'
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>Manajemen Toko & Owner</span>
                </button>

                <button
                  onClick={() => handleNavClick('admin_logs')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'admin_logs'
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Log Aktivitas Sistem</span>
                </button>
              </nav>
            </div>
          ) : (
            <>
              {/* Main POS & Dashboard */}
              <div>
                <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  OPERASIONAL UTAMA
                </div>
                <nav className="space-y-1">
                  {/* Dashboard: only for Owner */}
                  {isOwner && (
                    <button
                      onClick={() => handleNavClick('dashboard')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === 'dashboard'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-400" />
                      <span>Ringkasan Dashboard</span>
                    </button>
                  )}

                  {/* Kasir POS: highlight as primary action */}
                  <button
                    onClick={() => handleNavClick('pos')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      activeTab === 'pos'
                        ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-teal-900/50'
                        : 'bg-teal-950/60 hover:bg-teal-900/50 text-teal-300 border border-teal-800/60'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-teal-300" />
                    <span>KASIR (POS TERMINAL)</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('transactions')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'transactions'
                        ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span>Riwayat Transaksi</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('customers')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'customers'
                        ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Data Pelanggan</span>
                  </button>
                </nav>
              </div>

              {/* Catalog & Inventory (Owner) */}
              {isOwner && (
                <div>
                  <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    KATALOG &amp; INVENTARIS
                  </div>
                  <nav className="space-y-1">
                    <button
                      onClick={() => handleNavClick('products')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'products'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>Produk &amp; Kategori</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('inventory')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'inventory'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Boxes className="w-4 h-4 text-slate-400" />
                      <span>Stok &amp; Mutasi Inventaris</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('purchases')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'purchases'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>Pembelian (Restock)</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('suppliers')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'suppliers'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>Daftar Supplier</span>
                    </button>
                  </nav>
                </div>
              )}

              {/* Financial & Analytics (Owner) */}
              {isOwner && (
                <div>
                  <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    KEUANGAN &amp; LAPORAN
                  </div>
                  <nav className="space-y-1">
                    <button
                      onClick={() => handleNavClick('expenses')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'expenses'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4 text-slate-400" />
                      <span>Catat Pengeluaran</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('reports')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'reports'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span>Laporan &amp; Ekspor CSV</span>
                    </button>
                  </nav>
                </div>
              )}

              {/* Store & Staff Management (Owner) */}
              {isOwner && (
                <div>
                  <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    PENGATURAN TOKO
                  </div>
                  <nav className="space-y-1">
                    <button
                      onClick={() => handleNavClick('staff')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'staff'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <UserCog className="w-4 h-4 text-slate-400" />
                      <span>Pegawai &amp; Hak Akses</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('settings')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === 'settings'
                          ? 'bg-teal-900/40 text-teal-200 border border-teal-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Pengaturan Toko &amp; Struk</span>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          SUPER KASIR TOKO v1.0.0
        </div>
      </aside>
    </>
  );
};
