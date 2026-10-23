import React from 'react';
import { ShoppingCart, Receipt, Barcode, Settings, LayoutDashboard } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { OrgRole } from '../../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab | 'landing';
  currentRole: OrgRole | 'super_admin';
  cartCount: number;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  currentRole,
  cartCount,
  onSelectTab,
  onOpenScanner
}) => {
  if (currentRole === 'super_admin') {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-2 py-1 flex items-center justify-between shadow-2xl safe-area-pb">
      {/* 1. Kasir / POS */}
      <button
        onClick={() => onSelectTab('pos')}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative ${
          activeTab === 'pos' ? 'text-teal-400 font-bold' : 'hover:text-slate-200'
        }`}
        aria-label="Menu Kasir POS"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </div>
        <span>Kasir</span>
      </button>

      {/* 2. Riwayat Transaksi */}
      <button
        onClick={() => onSelectTab('transactions')}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
          activeTab === 'transactions' ? 'text-teal-400 font-bold' : 'hover:text-slate-200'
        }`}
        aria-label="Menu Riwayat Transaksi"
      >
        <Receipt className="w-5 h-5" />
        <span>Transaksi</span>
      </button>

      {/* 3. DI PALING TENGAH: SCAN PRODUK */}
      <div className="flex-1 flex justify-center -mt-5">
        <button
          onClick={onOpenScanner}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-600 to-teal-400 hover:from-teal-500 hover:to-teal-300 text-white flex flex-col items-center justify-center shadow-lg shadow-teal-900/50 border-4 border-slate-900 active:scale-95 transition-transform"
          aria-label="Tombol Scan Barcode Produk"
          title="Scan Barcode Produk"
        >
          <Barcode className="w-6 h-6 stroke-[2.2]" />
          <span className="text-[9px] font-black tracking-tight leading-none">SCAN</span>
        </button>
      </div>

      {/* 4. Dashboard (Owner only) or Catalog */}
      <button
        onClick={() => onSelectTab(currentRole === 'owner' ? 'dashboard' : 'products')}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
          activeTab === 'dashboard' || activeTab === 'products'
            ? 'text-teal-400 font-bold'
            : 'hover:text-slate-200'
        }`}
        aria-label="Menu Dashboard"
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{currentRole === 'owner' ? 'Dashboard' : 'Produk'}</span>
      </button>

      {/* 5. DI SEBELAH KANAN: PENGATURAN */}
      <button
        onClick={() => onSelectTab('settings')}
        className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
          activeTab === 'settings' ? 'text-teal-400 font-bold' : 'hover:text-slate-200'
        }`}
        aria-label="Menu Pengaturan Toko"
      >
        <Settings className="w-5 h-5" />
        <span>Pengaturan</span>
      </button>
    </nav>
  );
};
