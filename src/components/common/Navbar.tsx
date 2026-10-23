import React, { useState } from 'react';
import {
  Store,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Building2,
  Users
} from 'lucide-react';
import { Organization, UserProfile, OrgRole } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

interface NavbarProps {
  currentOrg: Organization;
  currentUser: UserProfile;
  currentRole: OrgRole | 'super_admin';
  allOrgs: Organization[];
  allUsers: UserProfile[];
  onSwitchTenant: (orgId: string, userId: string, role: OrgRole | 'super_admin') => void;
  onResetDemoData: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentOrg,
  currentUser,
  currentRole,
  allOrgs,
  allUsers,
  onSwitchTenant,
  onResetDemoData,
  deferredPrompt,
  onInstallPwa,
  onOpenAuth
}) => {
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 select-none shadow-md">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & Store Name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/image_c62bdde1.png"
                alt="Logo Super Kasir Toko"
                className="w-9 h-9 rounded-lg object-contain bg-white shadow-sm p-0.5"
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 font-bold tracking-tight text-base text-white">
                  <span>SUPER</span>
                  <span className="text-teal-400">KASIR</span>
                  <span className="text-amber-400">TOKO</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="truncate max-w-[160px] sm:max-w-xs font-medium text-slate-200">
                    {currentRole === 'super_admin' ? 'Platform Administration' : currentOrg.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {currentRole === 'super_admin' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Super Admin</span>
                </>
              ) : currentRole === 'owner' ? (
                <>
                  <Store className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-teal-400">Owner</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-sky-400">Kasir</span>
                </>
              )}
            </div>
          </div>

          {/* Center: Multi-Tenant Switcher Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors shadow-sm"
              title="Ganti Akun & Toko (Uji Isolasi Tenant)"
              aria-label="Ganti Akun dan Toko"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline">Ganti Toko / Akun</span>
              <span className="md:hidden">Ganti Akun</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            {deferredPrompt && (
              <button
                onClick={onInstallPwa}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-all animate-pulse"
                aria-label="Install Aplikasi POS ke Perangkat"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install PWA</span>
              </button>
            )}

            {/* Backend Connection Indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300"
              title={
                isSupabaseConfigured
                  ? 'Terhubung dengan Database Supabase Cloud'
                  : 'Mode Sandbox Interaktif dengan Isolasi Tenant Penuh'
              }
            >
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Cloud</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Sandbox Tenant Terisolasi</span>
                </>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-teal-400">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-200">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {currentUser.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Switch Tenant / Role Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  Uji Isolasi Multi-Tenant & Akses Peran
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Buktikan bahwa Toko A dan Toko B memiliki data yang 100% terpisah.
                </p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
                aria-label="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Tenant A Options */}
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Tenant 1: Toko Berkah Sentosa
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onSwitchTenant('org_toko_a', 'usr_owner_a', 'owner');
                      setShowSwitchModal(false);
                    }}
                    className={`p-2.5 rounded-md text-left text-xs border transition-all ${
                      currentOrg.id === 'org_toko_a' && currentRole === 'owner'
                        ? 'bg-teal-900/40 border-teal-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Budi Santoso (Owner)</div>
                    <div className="text-[11px] text-slate-400">Hak Akses: Penuh Toko A</div>
                  </button>

                  <button
                    onClick={() => {
                      onSwitchTenant('org_toko_a', 'usr_cashier_a', 'cashier');
                      setShowSwitchModal(false);
                    }}
                    className={`p-2.5 rounded-md text-left text-xs border transition-all ${
                      currentOrg.id === 'org_toko_a' && currentRole === 'cashier'
                        ? 'bg-sky-900/40 border-sky-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">Siti Rahma (Kasir)</div>
                    <div className="text-[11px] text-slate-400">Hak Akses: POS & Transaksi</div>
                  </button>
                </div>
              </div>

              {/* Tenant B Options */}
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Tenant 2: Warung Madura Jaya
                </div>
                <button
                  onClick={() => {
                    onSwitchTenant('org_toko_b', 'usr_owner_b', 'owner');
                    setShowSwitchModal(false);
                  }}
                  className={`w-full p-2.5 rounded-md text-left text-xs border transition-all ${
                    currentOrg.id === 'org_toko_b' && currentRole === 'owner'
                      ? 'bg-amber-900/40 border-amber-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Cak Anwar (Owner Toko B)</div>
                  <div className="text-[11px] text-slate-400">
                    Data produk & transaksi terpisah total dari Toko A
                  </div>
                </button>
              </div>

              {/* Super Admin Option */}
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Akun Platform: Super Admin
                </div>
                <button
                  onClick={() => {
                    onSwitchTenant('org_toko_a', 'usr_super_admin', 'super_admin');
                    setShowSwitchModal(false);
                  }}
                  className={`w-full p-2.5 rounded-md text-left text-xs border transition-all ${
                    currentRole === 'super_admin'
                      ? 'bg-purple-900/40 border-purple-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-100">Super Administrator</div>
                  <div className="text-[11px] text-slate-400">
                    Monitoring agregat platform & manajemen akun toko (privasi transaksi terjaga)
                  </div>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={() => {
                  onResetDemoData();
                  setShowSwitchModal(false);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded hover:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Data Demo
              </button>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-white"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
