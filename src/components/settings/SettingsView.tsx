import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Store, FileText, Percent, Image, Printer } from 'lucide-react';
import { StoreSettings } from '../../types';
import { tenantStore } from '../../db/tenant-store';

interface SettingsViewProps {
  organizationId: string;
  storeSettings: StoreSettings;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  organizationId,
  storeSettings,
  onRefresh
}) => {
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [storePhone, setStorePhone] = useState(storeSettings.storePhone || '');
  const [storeAddress, setStoreAddress] = useState(storeSettings.storeAddress || '');
  const [storeLogo, setStoreLogo] = useState(storeSettings.storeLogo || '');
  const [receiptHeader, setReceiptHeader] = useState(storeSettings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(storeSettings.receiptFooter);
  const [taxPercentage, setTaxPercentage] = useState(storeSettings.taxPercentage);
  const [enableTax, setEnableTax] = useState(storeSettings.enableTax);
  const [maxCashierDiscountPercent, setMaxCashierDiscountPercent] = useState(
    storeSettings.maxCashierDiscountPercent
  );
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'58mm' | '80mm'>(
    storeSettings.receiptPaperWidth || '58mm'
  );
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(
    storeSettings.autoPrintReceipt !== false
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setStoreLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    tenantStore.updateStoreSettings(organizationId, {
      storeName,
      storePhone,
      storeAddress,
      storeLogo,
      receiptHeader,
      receiptFooter,
      taxPercentage,
      enableTax,
      maxCashierDiscountPercent,
      receiptPaperWidth,
      autoPrintReceipt
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Pengaturan Toko &amp; Kustomisasi Struk
          </h1>
          <p className="text-xs text-slate-500">
            Sesuaikan identitas toko, logo struk khusus, ukuran kertas printer termal, dan pesan nota belanja.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan toko dan logo struk berhasil disimpan!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile & Logo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            <Store className="w-4 h-4 text-teal-600" />
            <span>Identitas Bisnis &amp; Toko</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Toko *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp Toko
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={e => setStorePhone(e.target.value)}
                placeholder="08..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap Toko (Dicetak pada Struk)
            </label>
            <textarea
              rows={2}
              value={storeAddress}
              onChange={e => setStoreAddress(e.target.value)}
              placeholder="Jl. Raya..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          {/* Logo Struk Khusus (Berbeda dari Logo Aplikasi) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Logo Khusus Struk Nota Toko (Monokrom / Cetak Termal)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Logo ini khusus dicetak pada struk pembelian toko Anda (berbeda dengan logo branding aplikasi).
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt="Logo Struk"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-1 text-[10px] text-slate-400">
                    <Image className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    Tanpa Logo
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Atau gunakan URL gambar:</span>
                  <input
                    type="url"
                    value={storeLogo}
                    onChange={e => setStoreLogo(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-xs border border-slate-300 rounded px-2 py-0.5"
                  />
                  {storeLogo && (
                    <button
                      type="button"
                      onClick={() => setStoreLogo('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Printer & Receipt Settings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Format Kertas Printer Termal &amp; Teks Struk</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lebar Kertas Printer Termal
              </label>
              <select
                value={receiptPaperWidth}
                onChange={e => setReceiptPaperWidth(e.target.value as '58mm' | '80mm')}
                className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
              >
                <option value="58mm">58mm (Standar Mini Printer Bluetooth / USB)</option>
                <option value="80mm">80mm (Standar POS Printer Lebar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Otomatis Dialog Cetak Struk
              </label>
              <label className="flex items-center gap-2 mt-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={e => setAutoPrintReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Buka dialog cetak otomatis saat transaksi kasir selesai</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pesan Pembuka Nota (Header)
            </label>
            <input
              type="text"
              value={receiptHeader}
              onChange={e => setReceiptHeader(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pesan Penutup Nota (Footer)
            </label>
            <input
              type="text"
              value={receiptFooter}
              onChange={e => setReceiptFooter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        {/* Financial & Policy Rules */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            <Percent className="w-4 h-4 text-teal-600" />
            <span>Aturan Pajak &amp; Diskon Kasir</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTax}
                  onChange={e => setEnableTax(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Aktifkan Perhitungan Pajak Penjualan (PPN)</span>
              </label>

              {enableTax && (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Persentase Pajak (%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercentage}
                    onChange={e => setTaxPercentage(Number(e.target.value))}
                    className="w-24 text-xs font-bold border border-slate-300 rounded-lg p-2"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Maksimum Diskon Kasir (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={maxCashierDiscountPercent}
                onChange={e => setMaxCashierDiscountPercent(Number(e.target.value))}
                className="w-24 text-xs font-bold border border-slate-300 rounded-lg p-2"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Mencegah kasir memberikan diskon berlebihan tanpa otorisasi owner.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Seluruh Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
