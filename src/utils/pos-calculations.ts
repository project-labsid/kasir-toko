/**
 * SUPER KASIR TOKO - Pure Business Logic & Calculation Utilities
 */

export interface CartItemInput {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  currentStock: number;
}

export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  changeDue: number;
  isValid: boolean;
  error?: string;
}

/**
 * Calculates POS totals strictly and deterministically.
 */
export function calculatePosTotals(
  items: CartItemInput[],
  discountPercent: number = 0,
  taxPercent: number = 0,
  amountPaid: number = 0
): CalculationResult {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      changeDue: 0,
      isValid: false,
      error: 'Keranjang belanja kosong'
    };
  }

  // Check stock for every item
  for (const item of items) {
    if (item.quantity <= 0) {
      return {
        subtotal: 0,
        discountAmount: 0,
        taxableAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        changeDue: 0,
        isValid: false,
        error: `Kuantitas produk "${item.name}" harus lebih dari 0`
      };
    }
    if (item.quantity > item.currentStock) {
      return {
        subtotal: 0,
        discountAmount: 0,
        taxableAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        changeDue: 0,
        isValid: false,
        error: `Stok produk "${item.name}" tidak mencukupi (Tersedia: ${item.currentStock}, Diminta: ${item.quantity})`
      };
    }
  }

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const clampedDiscountPercent = Math.max(0, Math.min(100, discountPercent));
  const discountAmount = Math.round((subtotal * clampedDiscountPercent) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  const clampedTaxPercent = Math.max(0, taxPercent);
  const taxAmount = Math.round((taxableAmount * clampedTaxPercent) / 100);
  const totalAmount = taxableAmount + taxAmount;
  const changeDue = Math.max(0, amountPaid - totalAmount);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
    changeDue,
    isValid: true
  };
}

/**
 * Formats Rupiah currency (IDR)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Validates Tenant Isolation Constraint
 */
export function assertTenantMatch(callerTenantId: string, resourceTenantId: string): boolean {
  if (!callerTenantId || !resourceTenantId) return false;
  return callerTenantId === resourceTenantId;
}
