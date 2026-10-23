import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Building,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Search,
  Lock
} from 'lucide-react';
import { tenantStore } from '../../db/tenant-store';

interface SuperAdminViewProps {
  onRefresh: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'logs'>('overview');
  const [search, setSearch] = useState('');

  const overview = useMemo(() => {
    return tenantStore.getPlatformOverview();
  }, [tenantStore]);

  const handleToggleStoreStatus = (orgId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (
      window.confirm(
        `Konfirmasi: Ubah status toko menjadi "${nextStatus.toUpperCase()}"?`
      )
    ) {
      tenantStore.setStoreStatus(orgId, nextStatus, 'admin@superkasir.com');
      onRefresh();
    }
  };

  const filteredOrgs = overview.organizations.filter(o => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      o.name.toLowerCase().includes(q) ||
      o.ownerName.toLowerCase().includes(q) ||
      o.ownerEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Super Admin Shield Header */}
      <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/60 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-900/60 rounded-lg text-purple-400 border border-purple-700/50">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Platform Super Admin Dashboard
            </h1>
          </div>
          <p className="text-xs text-purple-200/70 mt-1">
            Monitoring kesehatan platform, status toko mitra, dan log aktivitas sistem.
          </p>
        </div>

        {/* Privacy Lock Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 border border-purple-700/40 rounded-xl text-xs text-purple-200">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Privasi Transaksi Terproteksi RLS</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Ringkasan Metrik
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'tenants'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daftar Toko &amp; Owner ({overview.organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'logs'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Log Aktivitas Platform ({overview.activityLogs.length})
        </button>
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Toko Terdaftar
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {overview.organizations.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Organisasi tenant terisolasi</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Toko Aktif
              </span>
              <div className="text-2xl font-bold text-emerald-700 mt-2">
                {overview.activeStores}
              </div>
              <div className="text-xs text-slate-400 mt-1">Beroperasi normal</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Toko Ditangguhkan
              </span>
              <div className="text-2xl font-bold text-rose-700 mt-2">
                {overview.suspendedStores}
              </div>
              <div className="text-xs text-slate-400 mt-1">Akses dinonaktifkan</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Akun Pengguna
              </span>
              <div className="text-2xl font-bold text-purple-700 mt-2">
                {overview.totalOwners + overview.totalStaff}
              </div>
              <div className="text-xs text-slate-400 mt-1">Owner &amp; Staf Kasir</div>
            </div>
          </div>

          {/* Privacy Notice Card */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Prinsip Keamanan &amp; Perlindungan Privasi Toko</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sesuai standar arsitektur <strong>SUPER KASIR TOKO</strong>, akun Super Admin hanya
              diberikan kewenangan memonitor ketersediaan sistem dan mengelola status lisensi toko.
              Super Admin tidak memiliki akses ke rincian keranjang belanja, isi transaksi nota,
              data pelanggan personal, maupun harga modal dari masing-masing pemilik toko.
            </p>
          </div>
        </div>
      )}

      {/* VIEW: TENANTS LIST */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama toko, nama owner, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Toko</th>
                  <th className="py-3 px-3">Owner / Pemilik</th>
                  <th className="py-3 px-3">Jumlah Anggota</th>
                  <th className="py-3 px-3">Status Toko</th>
                  <th className="py-3 px-4 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.map(org => (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{org.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {org.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{org.ownerName}</div>
                      <div className="text-[11px] text-slate-400">{org.ownerEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {org.staffCount} anggota
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          org.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {org.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStoreStatus(org.id, org.status)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                          org.status === 'active'
                            ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {org.status === 'active' ? 'Tangguhkan Toko' : 'Aktifkan Toko'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Log Kejadian Keamanan &amp; Aktivitas Platform
            </h2>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {overview.activityLogs.map(log => (
              <div key={log.id} className="p-2.5 flex items-start justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">
                    {log.eventType.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Aktor: {log.actorEmail || 'Sistem'} · Toko: {log.organizationName || '-'}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.createdAt).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
