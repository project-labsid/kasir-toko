import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  RotateCcw,
  Camera,
  ChevronDown,
  ShoppingBag
} from 'lucide-react';
import { Product, Category, Customer, Sale, PaymentMethod, StoreSettings } from '../../types';
import { formatRupiah, calculatePosTotals } from '../../utils/pos-calculations';
import { tenantStore } from '../../db/tenant-store';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface PosViewProps {
  organizationId: string;
  cashierUserId: string;
  cashierName: string;
  products: Product[];
  categories: Category[];
  customers: Customer[];
  storeSettings: StoreSettings;
  onSaleCompleted: () => void;
  isScannerOpen?: boolean;
  onCloseScanner?: () => void;
}

interface CartEntry {
  product: Product;
  quantity: number;
}

export const PosView: React.FC<PosViewProps> = ({
  organizationId,
  cashierUserId,
  cashierName,
  products,
  categories,
  customers,
  storeSettings,
  onSaleCompleted,
  isScannerOpen: externalScannerOpen,
  onCloseScanner: externalCloseScanner
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [internalScannerOpen, setInternalScannerOpen] = useState(false);

  const isScannerOpen = externalScannerOpen !== undefined ? externalScannerOpen : internalScannerOpen;
  const handleCloseScanner = () => {
    if (externalCloseScanner) {
      externalCloseScanner();
    } else {
      setInternalScannerOpen(false);
    }
  };

  // Cart state
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(storeSettings.enableTax);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string>('');

  // Completed Receipt modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isActive) return false;
      const matchCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Cart totals calculation
  const calculations = useMemo(() => {
    const items = cart.map(c => ({
      productId: c.product.id,
      name: c.product.name,
      sku: c.product.sku,
      unitPrice: c.product.sellingPrice,
      costPrice: c.product.costPrice,
      quantity: c.quantity,
      currentStock: c.product.currentStock
    }));

    return calculatePosTotals(
      items,
      discountPercent,
      applyTax ? storeSettings.taxPercentage : 0,
      cashGiven
    );
  }, [cart, discountPercent, applyTax, storeSettings.taxPercentage, cashGiven]);

  // Add to cart
  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Barcode scan handler
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find(
      p =>
        (p.barcode && p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        p.sku.toLowerCase() === barcodeInput.toLowerCase().trim()
    );
    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode/SKU "${barcodeInput}" tidak ditemukan!`);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.currentStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartEntry[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
      setDiscountPercent(0);
      setSelectedCustomerId('');
    }
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashGiven(calculations.totalAmount);
    setPaymentError('');
    setShowPaymentModal(true);
  };

  // Submit POS checkout
  const handleProcessCheckout = () => {
    setPaymentError('');

    const res = tenantStore.executePosSale({
      orgId: organizationId,
      cashierUserId,
      cashierName,
      customerId: selectedCustomerId || undefined,
      items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
      discountPercent,
      taxPercent: applyTax ? storeSettings.taxPercentage : 0,
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? cashGiven : calculations.totalAmount,
      idempotencyKey: `idemp_${Date.now()}_${Math.random()}`
    });

    if (!res.success || !res.sale) {
      setPaymentError(res.error || 'Terjadi kesalahan saat memproses penjualan');
      return;
    }

    // Success: close payment, show receipt, clear cart, trigger callback
    setShowPaymentModal(false);
    setCompletedSale(res.sale);
    setCart([]);
    setDiscountPercent(0);
    setSelectedCustomerId('');
    onSaleCompleted();

    // Auto-print thermal receipt if enabled in store settings
    if (storeSettings.autoPrintReceipt !== false) {
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const scrollToCartMobile = () => {
    const el = document.getElementById('mobile-cart-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-slate-100 pb-24 md:pb-0 relative">
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white">
        {/* Search & Barcode Toolbar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk (Nama / SKU)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Barcode Quick Form & Camera Scanner Trigger */}
          <div className="flex items-center gap-1.5">
            <form onSubmit={handleBarcodeScan} className="flex items-center gap-1">
              <div className="relative w-32 sm:w-40">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="Barcode..."
                  className="w-full pl-7 pr-2 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500"
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                title="Cari Barcode"
              >
                Scan
              </button>
            </form>

            <button
              onClick={() => setInternalScannerOpen(true)}
              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1"
              title="Buka Kamera Pemindai Barcode"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Kamera</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-3 py-2 border-b border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Produk ({products.filter(p => p.isActive).length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 content-start auto-rows-max">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori.</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const inCart = cart.find(c => c.product.id === product.id);
              const isOutOfStock = product.currentStock <= 0;
              const isLowStock = product.currentStock <= product.minimumStock;

              return (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'bg-teal-50/60 border-teal-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Cart Quantity Badge */}
                  {inCart && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 text-white font-bold rounded-full text-[10px] flex items-center justify-center shadow-xs">
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                      {product.sku}
                    </div>
                    <div className="font-semibold text-slate-800 text-xs line-clamp-2 mt-0.5 leading-snug">
                      {product.name}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-teal-700">
                        {formatRupiah(product.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        /{product.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600">Habis</span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-semibold text-amber-600">
                          Sisa {product.currentStock}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Stok: {product.currentStock}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Cart Indicator on Mobile */}
      {cart.length > 0 && (
        <div className="md:hidden sticky top-2 z-20 px-3 py-1">
          <button
            onClick={scrollToCartMobile}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cart.reduce((a, b) => a + b.quantity, 0)} Item di Keranjang</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{formatRupiah(calculations.totalAmount)}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* RIGHT (Desktop/Tablet) or BOTTOM (Mobile): Active Cart & Bayar Terminal */}
      <div
        id="mobile-cart-section"
        className="w-full md:w-80 lg:w-96 xl:w-[420px] bg-white flex flex-col border-t md:border-t-0 md:border-l border-slate-200 shadow-lg z-10 shrink-0"
      >
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Pesanan Kasir</span>
              <span className="text-xs font-normal text-teal-400">
                ({cart.reduce((a, b) => a + b.quantity, 0)} item)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Kasir: <span className="text-slate-200 font-medium">{cashierName}</span>
            </div>
          </div>
          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40 p-1 flex items-center gap-1"
            title="Reset Keranjang"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Customer Selector */}
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="flex-1 bg-white border border-slate-300 rounded-md text-xs py-1 px-2 focus:outline-hidden focus:border-teal-500"
          >
            <option value="">Pelanggan Umum (Tanpa Nama)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72 md:max-h-none min-h-[140px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-6">
              <Barcode className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
              <p className="font-medium text-slate-600 text-xs">Keranjang Belanja Kosong</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                Pilih produk dari katalog atau gunakan tombol SCAN barcode.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatRupiah(item.product.sellingPrice)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-slate-900">
                      {formatRupiah(item.product.sellingPrice * item.quantity)}
                    </div>
                  </div>
                </div>

                {/* Quantity and Remove Controls */}
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.currentStock}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-400 ml-1">
                      (Maks: {item.product.currentStock})
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Hapus Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Discount & Tax Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Diskon Nota (%):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max={storeSettings.maxCashierDiscountPercent}
                value={discountPercent}
                onChange={e =>
                  setDiscountPercent(
                    Math.min(
                      storeSettings.maxCashierDiscountPercent,
                      Math.max(0, Number(e.target.value))
                    )
                  )
                }
                className="w-14 text-center bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-400">
                (Maks {storeSettings.maxCashierDiscountPercent}%)
              </span>
            </div>
          </div>

          {storeSettings.taxPercentage > 0 && (
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={e => setApplyTax(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Terapkan Pajak ({storeSettings.taxPercentage}%)</span>
              </label>
              <span className="text-slate-700 font-medium">
                {applyTax ? formatRupiah(calculations.taxAmount) : 'Rp 0'}
              </span>
            </div>
          )}

          {/* Totals Summary */}
          <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatRupiah(calculations.subtotal)}</span>
            </div>
            {calculations.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon ({discountPercent}%)</span>
                <span>-{formatRupiah(calculations.discountAmount)}</span>
              </div>
            )}
            {applyTax && calculations.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Pajak PPN</span>
                <span>+{formatRupiah(calculations.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL TAGIHAN</span>
              <span className="text-teal-700">{formatRupiah(calculations.totalAmount)}</span>
            </div>
          </div>

          {/* Pay Button - Positioned in Cart Drawer */}
          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full mt-2 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Banknote className="w-5 h-5" />
            <span>BAYAR SEKARANG ({formatRupiah(calculations.totalAmount)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Pembayaran Kasir</h3>
                <p className="text-xs text-slate-400">Pilih metode dan masukkan jumlah bayar</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Total Due Banner */}
              <div className="p-3 bg-slate-100 rounded-xl text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Total Yang Harus Dibayar
                </div>
                <div className="text-2xl font-black text-teal-700 mt-0.5">
                  {formatRupiah(calculations.totalAmount)}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Tunai</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'qris'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QRIS</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>

              {/* Cash Payment Form */}
              {paymentMethod === 'cash' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uang Yang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={e => setCashGiven(Number(e.target.value))}
                      placeholder="0"
                      className="w-full text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  {/* Cash Presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => setCashGiven(calculations.totalAmount)}
                      className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                    >
                      Uang Pas
                    </button>
                    <button
                      onClick={() => setCashGiven(50000)}
                      className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                    >
                      50.000
                    </button>
                    <button
                      onClick={() => setCashGiven(100000)}
                      className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                    >
                      100.000
                    </button>
                    <button
                      onClick={() => setCashGiven(200000)}
                      className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                    >
                      200.000
                    </button>
                  </div>

                  {/* Change Due Display */}
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-900">Uang Kembalian:</span>
                    <span className="text-lg font-black text-teal-800">
                      {formatRupiah(Math.max(0, cashGiven - calculations.totalAmount))}
                    </span>
                  </div>
                </div>
              ) : (
                /* Non-Cash / QRIS Preview */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Pindai QRIS Super Kasir Toko
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dukung GoPay, OVO, Dana, ShopeePay, BCA, Mandiri &amp; Seluruh Bank Nasional
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {paymentError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Submit Checkout Button */}
              <button
                onClick={handleProcessCheckout}
                disabled={paymentMethod === 'cash' && cashGiven < calculations.totalAmount}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SELESAIKAN TRANSAKSI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE RECEIPT MODAL & THERMAL RECEIPT PRINT AREA */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-3 bg-teal-600 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Transaksi Berhasil Dicatat!
              </span>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Thermal Receipt Content Container (Styled for 58mm / 80mm thermal printers) */}
            <div
              id="thermal-receipt-print"
              className={`p-5 font-mono text-xs text-slate-900 space-y-3 overflow-y-auto bg-white paper-${
                storeSettings.receiptPaperWidth || '58mm'
              }`}
            >
              {/* Store Header & Custom Receipt Logo (Uploaded by Account Owner) */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                {storeSettings.storeLogo ? (
                  <div className="flex justify-center mb-1">
                    <img
                      src={storeSettings.storeLogo}
                      alt="Logo Toko"
                      className="max-h-12 max-w-[140px] object-contain filter grayscale"
                    />
                  </div>
                ) : null}

                <div className="font-bold text-sm tracking-wide text-slate-900">
                  {storeSettings.storeName}
                </div>
                {storeSettings.storeAddress && (
                  <div className="text-[10px] text-slate-700 leading-tight">
                    {storeSettings.storeAddress}
                  </div>
                )}
                {storeSettings.storePhone && (
                  <div className="text-[10px] text-slate-700">Telp: {storeSettings.storePhone}</div>
                )}
                {storeSettings.receiptHeader && (
                  <div className="text-[10px] text-slate-600 pt-1">
                    {storeSettings.receiptHeader}
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-bold">{completedSale.transactionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(completedSale.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{completedSale.cashierName || 'Kasir'}</span>
                </div>
                {completedSale.customerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3">
                {completedSale.items.map(item => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="font-medium text-slate-900">{item.productNameSnapshot}</div>
                    <div className="flex justify-between text-[11px] text-slate-700">
                      <span>
                        {item.quantity} × {formatRupiah(item.unitPrice)}
                      </span>
                      <span className="font-semibold">{formatRupiah(item.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedSale.subtotal)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-800">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(completedSale.discountAmount)}</span>
                  </div>
                )}
                {completedSale.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>PPN:</span>
                    <span>+{formatRupiah(completedSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Metode:</span>
                  <span className="uppercase">{completedSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Dibayar:</span>
                  <span>{formatRupiah(completedSale.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(completedSale.changeDue)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[10px] text-slate-600 pt-1 space-y-1">
                <div>{storeSettings.receiptFooter}</div>
                <div className="text-[9px] text-slate-400 pt-1">
                  *** TERIMA KASIH ATAS KUNJUNGAN ANDA ***
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Printer Termal ({storeSettings.receiptPaperWidth || '58mm'})</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        products={products}
        isOpen={isScannerOpen}
        onClose={handleCloseScanner}
        onProductScanned={handleAddToCart}
      />
    </div>
  );
};
