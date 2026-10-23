export type PlatformRole = 'super_admin';
export type OrgRole = 'owner' | 'manager' | 'cashier';
export type AccountStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted';
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'debit' | 'credit';
export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'return_in' | 'return_out';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isSuperAdmin?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  ownerUserId: string;
  status: AccountStatus;
  timezone: string;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: OrgRole;
  status: AccountStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  imagePath?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
}

export interface SaleItem {
  id: string;
  organizationId: string;
  saleId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot?: string;
  quantity: number;
  unitPrice: number;
  unitCostSnapshot: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  organizationId: string;
  transactionNumber: string;
  cashierUserId: string;
  cashierName?: string;
  customerId?: string;
  customerName?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'refunded';
  status: 'completed' | 'cancelled';
  idempotencyKey?: string;
  items: SaleItem[];
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  productId: string;
  productName?: string;
  movementType: MovementType;
  quantityDelta: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  actorUserId: string;
  actorName?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  organizationId: string;
  supplierId?: string;
  supplierName?: string;
  purchaseNumber: string;
  subtotal: number;
  totalAmount: number;
  status: 'completed' | 'cancelled';
  items: PurchaseItem[];
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  createdBy: string;
  createdAt: string;
}

export interface StoreSettings {
  organizationId: string;
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  storeLogo?: string;
  receiptHeader: string;
  receiptFooter: string;
  taxPercentage: number;
  enableTax: boolean;
  maxCashierDiscountPercent: number;
  allowNegativeStock: boolean;
  receiptPaperWidth?: '58mm' | '80mm';
  autoPrintReceipt?: boolean;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId?: string;
  actorUserId?: string;
  actorEmail?: string;
  eventType: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformActivityLog {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  organizationId?: string;
  organizationName?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
