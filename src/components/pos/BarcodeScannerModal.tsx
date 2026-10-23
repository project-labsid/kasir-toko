import React, { useState } from 'react';
import { Barcode, Search, CheckCircle2, X, Camera, Zap } from 'lucide-react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/pos-calculations';

interface BarcodeScannerModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  isOpen,
  onClose,
  onProductScanned
}) => {
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);

  if (!isOpen) return null;

  // Beep sound feedback using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200Hz POS barcode scanner beep
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio might be muted by browser policy until interaction
    }
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    const code = barcodeQuery.trim().toLowerCase();
    const found = products.find(
      p =>
        (p.barcode && p.barcode.toLowerCase() === code) ||
        p.sku.toLowerCase() === code ||
        p.name.toLowerCase().includes(code)
    );

    if (found) {
      if (found.currentStock <= 0) {
        alert(`Produk "${found.name}" stok fisik sedang habis!`);
        return;
      }
      playBeep();
      onProductScanned(found);
      setLastScannedName(found.name);
      setBarcodeQuery('');
      setTimeout(() => setLastScannedName(null), 2500);
    } else {
      alert(`Barcode/SKU "${barcodeQuery}" tidak ditemukan pada toko ini!`);
    }
  };

  const handleQuickSelect = (p: Product) => {
    if (p.currentStock <= 0) return;
    playBeep();
    onProductScanned(p);
    setLastScannedName(p.name);
    setTimeout(() => setLastScannedName(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-900/60 text-teal-400 rounded-lg border border-teal-700/50">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Pemindai Barcode Kasir</h3>
              <p className="text-[11px] text-slate-400">Scan cepat produk ke keranjang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Tutup Pemindai"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Viewfinder Simulation */}
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800 relative">
          <div className="w-full h-36 border-2 border-dashed border-teal-500/60 rounded-xl relative flex flex-col items-center justify-center bg-slate-900/80 overflow-hidden">
            {/* Animated Laser Scan Line */}
            <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-md shadow-red-500/80 animate-pulse top-1/2 -translate-y-1/2" />
            <Camera className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-[11px] font-medium text-slate-400">
              Arahkan kamera ke barcode atau masukkan kode di bawah
            </span>
          </div>

          {/* Scanned notification */}
          {lastScannedName && (
            <div className="mt-2 px-3 py-1 bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>+ Masuk ke Keranjang: {lastScannedName}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <form onSubmit={handleManualScan} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={barcodeQuery}
                onChange={e => setBarcodeQuery(e.target.value)}
                placeholder="Scan / ketik barcode..."
                className="w-full pl-3 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:border-teal-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Scan
            </button>
          </form>
        </div>

        {/* Quick Scan Preset List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Pilihan Cepat Barcode Produk Toko:</span>
          </div>

          {products.filter(p => p.isActive).map(prod => (
            <button
              key={prod.id}
              onClick={() => handleQuickSelect(prod)}
              disabled={prod.currentStock <= 0}
              className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition-colors disabled:opacity-40"
            >
              <div>
                <div className="font-semibold text-xs text-slate-200">{prod.name}</div>
                <div className="text-[10px] text-teal-400 font-mono mt-0.5">
                  Barcode: {prod.barcode || prod.sku}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-xs text-white">
                  {formatRupiah(prod.sellingPrice)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Stok: {prod.currentStock}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
          >
            Selesai Memindai
          </button>
        </div>
      </div>
    </div>
  );
};
