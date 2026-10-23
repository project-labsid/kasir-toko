import React, { useState } from 'react';
import {
  Store,
  ShieldCheck,
  Zap,
  Smartphone,
  BarChart,
  CheckCircle2,
  ArrowRight,
  Lock,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import { tenantStore } from '../../db/tenant-store';

interface LandingViewProps {
  onEnterApp: (orgId: string, userId: string, role: 'owner' | 'cashier' | 'super_admin') => void;
  onOpenRegister: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterApp, onOpenRegister }) => {
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'privacy' | 'terms' | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regStoreName.trim() || !regEmail.trim()) return;

    const res = tenantStore.registerNewOwner({
      fullName: regFullName.trim(),
      storeName: regStoreName.trim(),
      email: regEmail.trim()
    });

    setRegSuccess(true);
    setTimeout(() => {
      onEnterApp(res.org.id, res.user.id, 'owner');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/aistudio/image_c62bdde1.png" alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5" />
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-white">
              <span>SUPER</span>
              <span className="text-teal-400">KASIR</span>
              <span className="text-amber-400">TOKO</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('login')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Masuk Kasir / Owner
            </button>
            <button
              onClick={() => setActiveModal('register')}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              Daftar Toko Baru (Gratis)
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistem Point of Sale (POS) Multi-Tenant &amp; PWA Modern</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Aplikasi Kasir Toko Modern, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              Aman, Cepat &amp; Terisolasi Sempurna
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Kelola penjualan kasir, cetak struk thermal, scan barcode, pantau stok barang real-time,
            dan peroleh laporan keuntungan otomatis. Setiap toko mendapatkan database terisolasi penuh.
          </p>

          {/* Quick Demo Entrance Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onEnterApp('org_toko_a', 'usr_owner_a', 'owner')}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-teal-900/40 flex items-center gap-2 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Masuk Sebagai Toko A (Owner Budi)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEnterApp('org_toko_b', 'usr_owner_b', 'owner')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-all"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Coba Toko B (Owner Cak Anwar)</span>
            </button>

            <button
              onClick={() => onEnterApp('org_toko_a', 'usr_super_admin', 'super_admin')}
              className="px-4 py-3 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800 font-semibold rounded-xl text-xs sm:text-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Super Admin Platform</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-slate-950/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Keunggulan SUPER KASIR TOKO
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Dirancang khusus untuk pemilik toko, minimarket, warung, dan kasir dengan standar keamanan tingkat tinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Isolasi Multi-Tenant Penuh</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toko A dan Toko B terpisah total di level Row Level Security (RLS) PostgreSQL. Owner lain maupun kasir tidak dapat mengintip produk atau nota toko Anda.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Transaksi POS Cepat &amp; Atomik</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kalkulasi harga dihitung ulang oleh server. Dilengkapi sistem kunci baris database (FOR UPDATE) sehingga dua kasir tidak akan menjual barang yang sama melebihi stok.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">PWA &amp; Segala Perangkat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dapat diinstall langsung ke laptop, PC kasir, tablet Android/iPad, atau smartphone. Bekerja mulus dengan tombol sentuh yang nyaman dan responsif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SUPER KASIR TOKO</span>
            <span>· Sistem Point of Sale Multi-Tenant</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-slate-300">
              Kebijakan Privasi
            </button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-slate-300">
              Syarat &amp; Ketentuan
            </button>
          </div>
        </div>
      </footer>

      {/* LOGIN QUICK MODAL */}
      {activeModal === 'login' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Masuk ke Toko Anda</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onEnterApp('org_toko_a', 'usr_owner_a', 'owner');
                  setActiveModal(null);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-0.5"
              >
                <div className="font-bold text-white">Owner: Toko Berkah Sentosa</div>
                <div className="text-slate-400">budi@berkahsentosa.com</div>
              </button>

              <button
                onClick={() => {
                  onEnterApp('org_toko_a', 'usr_cashier_a', 'cashier');
                  setActiveModal(null);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-0.5"
              >
                <div className="font-bold text-white">Kasir: Siti Rahma (Toko A)</div>
                <div className="text-slate-400">siti@berkahsentosa.com</div>
              </button>

              <button
                onClick={() => {
                  onEnterApp('org_toko_b', 'usr_owner_b', 'owner');
                  setActiveModal(null);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs space-y-0.5"
              >
                <div className="font-bold text-white">Owner: Warung Madura Jaya</div>
                <div className="text-slate-400">anwar@madurajaya.com</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW STORE MODAL */}
      {activeModal === 'register' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Daftar Toko Baru (Owner)</h3>
                <p className="text-xs text-slate-400">Dapatkan tenant toko terisolasi secara gratis</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {regSuccess ? (
              <div className="p-4 bg-teal-950/80 border border-teal-700 text-teal-300 rounded-xl text-xs space-y-1 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-teal-400 mb-1" />
                <div className="font-bold text-sm text-white">Toko Berhasil Dibuat!</div>
                <div>Mengalihkan ke dashboard toko Anda...</div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap Pemilik (Owner) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="Contoh: Hendra Wijaya"
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Toko / Usaha *
                  </label>
                  <input
                    type="text"
                    required
                    value={regStoreName}
                    onChange={e => setRegStoreName(e.target.value)}
                    placeholder="Contoh: Toko Barokah 99"
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Aktif *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password Akun *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all mt-2"
                >
                  Buat Toko &amp; Mulai Berjualan
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Kebijakan Privasi Data Toko</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>SUPER KASIR TOKO</strong> menjamin perlindungan privasi data tingkat tinggi dengan model isolasi multi-tenant:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Seluruh data transaksi, pelanggan, produk, dan modal hanya dapat diakses oleh anggota organisasi yang sah.</li>
                <li>Kebijakan Row Level Security (RLS) pada PostgreSQL mencegah akses lintas toko.</li>
                <li>Super Admin platform dilarang keras membuka isi nota belanja, keranjang, atau harga modal toko Anda.</li>
                <li>Kami tidak menjual data belanja pelanggan Anda ke pihak manapun.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TERMS MODAL */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Syarat &amp; Ketentuan Penggunaan</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>Dengan menggunakan SUPER KASIR TOKO, Anda menyetujui:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Menggunakan sistem kasir untuk kegiatan perniagaan yang sah menurut hukum Republik Indonesia.</li>
                <li>Menjaga kerahasiaan kredensial login akun Owner dan staf kasir masing-masing.</li>
                <li>Mengakui keabsahan pencatatan mutasi stok dan nota transaksi digital.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
