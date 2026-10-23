import {
  UserProfile,
  Organization,
  OrganizationMember,
  Product,
  Category,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  InventoryMovement,
  Purchase,
  Expense,
  StoreSettings,
  AuditLog,
  PlatformActivityLog,
  PaymentMethod
} from '../types';
import { calculatePosTotals } from '../utils/pos-calculations';

const STORAGE_KEY = 'super_kasir_toko_data_v1';

// Seed Initial Multi-Tenant State
interface DatabaseState {
  users: UserProfile[];
  organizations: Organization[];
  members: OrganizationMember[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  saleItems: SaleItem[];
  inventoryMovements: InventoryMovement[];
  purchases: Purchase[];
  expenses: Expense[];
  storeSettings: StoreSettings[];
  auditLogs: AuditLog[];
  platformLogs: PlatformActivityLog[];
}

const DEFAULT_STATE: DatabaseState = {
  users: [
    {
      id: 'usr_owner_a',
      email: 'budi@berkahsentosa.com',
      fullName: 'Budi Santoso',
      phone: '081234567890',
      isSuperAdmin: false
    },
    {
      id: 'usr_cashier_a',
      email: 'siti@berkahsentosa.com',
      fullName: 'Siti Rahma (Kasir Toko A)',
      phone: '081234567891',
      isSuperAdmin: false
    },
    {
      id: 'usr_owner_b',
      email: 'anwar@madurajaya.com',
      fullName: 'Cak Anwar',
      phone: '082345678901',
      isSuperAdmin: false
    },
    {
      id: 'usr_super_admin',
      email: 'admin@superkasir.com',
      fullName: 'Super Administrator',
      phone: '089999999999',
      isSuperAdmin: true
    }
  ],
  organizations: [
    {
      id: 'org_toko_a',
      name: 'Toko Berkah Sentosa',
      slug: 'berkah-sentosa',
      ownerUserId: 'usr_owner_a',
      status: 'active',
      timezone: 'Asia/Jakarta',
      currencyCode: 'IDR',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'org_toko_b',
      name: 'Warung Madura Jaya',
      slug: 'madura-jaya',
      ownerUserId: 'usr_owner_b',
      status: 'active',
      timezone: 'Asia/Jakarta',
      currencyCode: 'IDR',
      createdAt: '2026-02-15T09:30:00Z',
      updatedAt: '2026-02-15T09:30:00Z'
    }
  ],
  members: [
    {
      id: 'mem_a_1',
      organizationId: 'org_toko_a',
      userId: 'usr_owner_a',
      userEmail: 'budi@berkahsentosa.com',
      userName: 'Budi Santoso',
      role: 'owner',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'mem_a_2',
      organizationId: 'org_toko_a',
      userId: 'usr_cashier_a',
      userEmail: 'siti@berkahsentosa.com',
      userName: 'Siti Rahma (Kasir Toko A)',
      role: 'cashier',
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'mem_b_1',
      organizationId: 'org_toko_b',
      userId: 'usr_owner_b',
      userEmail: 'anwar@madurajaya.com',
      userName: 'Cak Anwar',
      role: 'owner',
      status: 'active',
      createdAt: '2026-02-15T09:30:00Z'
    }
  ],
  categories: [
    // Toko A Categories
    { id: 'cat_a_1', organizationId: 'org_toko_a', name: 'Makanan & Snack', createdAt: '2026-01-10T08:00:00Z' },
    { id: 'cat_a_2', organizationId: 'org_toko_a', name: 'Minuman Segar', createdAt: '2026-01-10T08:00:00Z' },
    { id: 'cat_a_3', organizationId: 'org_toko_a', name: 'Sembako & Kebutuhan', createdAt: '2026-01-10T08:00:00Z' },
    // Toko B Categories
    { id: 'cat_b_1', organizationId: 'org_toko_b', name: 'Rokok & Tembakau', createdAt: '2026-02-15T09:30:00Z' },
    { id: 'cat_b_2', organizationId: 'org_toko_b', name: 'Bensin & Oli', createdAt: '2026-02-15T09:30:00Z' }
  ],
  products: [
    // Toko A Products
    {
      id: 'prod_a_1',
      organizationId: 'org_toko_a',
      name: 'Kopi Susu Gula Aren 250ml',
      sku: 'KOP-AREN-01',
      barcode: '899123456701',
      categoryId: 'cat_a_2',
      categoryName: 'Minuman Segar',
      unit: 'botol',
      costPrice: 10000,
      sellingPrice: 18000,
      currentStock: 45,
      minimumStock: 10,
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'prod_a_2',
      organizationId: 'org_toko_a',
      name: 'Beras Premium Ramos 5kg',
      sku: 'SEM-BERAS-05',
      barcode: '899123456702',
      categoryId: 'cat_a_3',
      categoryName: 'Sembako & Kebutuhan',
      unit: 'karung',
      costPrice: 65000,
      sellingPrice: 75000,
      currentStock: 20,
      minimumStock: 5,
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'prod_a_3',
      organizationId: 'org_toko_a',
      name: 'Minyak Goreng Pouch 2L',
      sku: 'SEM-MYK-02',
      barcode: '899123456703',
      categoryId: 'cat_a_3',
      categoryName: 'Sembako & Kebutuhan',
      unit: 'pouch',
      costPrice: 32000,
      sellingPrice: 36000,
      currentStock: 8,
      minimumStock: 10,
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'prod_a_4',
      organizationId: 'org_toko_a',
      name: 'Keripik Singkong Balado 200g',
      sku: 'SNK-SINGKONG-01',
      barcode: '899123456704',
      categoryId: 'cat_a_1',
      categoryName: 'Makanan & Snack',
      unit: 'bungkus',
      costPrice: 9000,
      sellingPrice: 15000,
      currentStock: 3,
      minimumStock: 5,
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z'
    },
    // Toko B Products (Private to Toko B!)
    {
      id: 'prod_b_1',
      organizationId: 'org_toko_b',
      name: 'Bensin Eceran Botol 1L',
      sku: 'BNS-ECER-01',
      barcode: '899987654301',
      categoryId: 'cat_b_2',
      categoryName: 'Bensin & Oli',
      unit: 'botol',
      costPrice: 11000,
      sellingPrice: 13000,
      currentStock: 30,
      minimumStock: 5,
      isActive: true,
      createdAt: '2026-02-15T09:30:00Z',
      updatedAt: '2026-02-15T09:30:00Z'
    }
  ],
  customers: [
    {
      id: 'cust_a_1',
      organizationId: 'org_toko_a',
      name: 'Ibu Ratna',
      phone: '081398765432',
      address: 'Jl. Melati No. 12',
      createdAt: '2026-01-12T10:00:00Z'
    },
    {
      id: 'cust_b_1',
      organizationId: 'org_toko_b',
      name: 'Pak RT Slamet',
      phone: '081298765433',
      address: 'Gang Kelinci No. 4',
      createdAt: '2026-02-16T11:00:00Z'
    }
  ],
  suppliers: [
    {
      id: 'sup_a_1',
      organizationId: 'org_toko_a',
      name: 'PT Sumber Pangan Makmur',
      phone: '021-5551234',
      address: 'Kawasan Industri Pulogadung',
      createdAt: '2026-01-10T08:00:00Z'
    }
  ],
  sales: [
    {
      id: 'sale_a_1',
      organizationId: 'org_toko_a',
      transactionNumber: 'TRX-20261021-001',
      cashierUserId: 'usr_cashier_a',
      cashierName: 'Siti Rahma',
      customerId: 'cust_a_1',
      customerName: 'Ibu Ratna',
      subtotal: 75000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 75000,
      amountPaid: 100000,
      changeDue: 25000,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'completed',
      idempotencyKey: 'idemp-sample-1',
      items: [
        {
          id: 'sitem_a_1',
          organizationId: 'org_toko_a',
          saleId: 'sale_a_1',
          productId: 'prod_a_2',
          productNameSnapshot: 'Beras Premium Ramos 5kg',
          skuSnapshot: 'SEM-BERAS-05',
          quantity: 1,
          unitPrice: 75000,
          unitCostSnapshot: 65000,
          discountAmount: 0,
          lineTotal: 75000
        }
      ],
      createdAt: new Date().toISOString()
    }
  ],
  saleItems: [],
  inventoryMovements: [
    {
      id: 'mov_a_1',
      organizationId: 'org_toko_a',
      productId: 'prod_a_2',
      productName: 'Beras Premium Ramos 5kg',
      movementType: 'sale',
      quantityDelta: -1,
      referenceType: 'sale',
      referenceId: 'sale_a_1',
      reason: 'Penjualan Kasir POS TRX-20261021-001',
      actorUserId: 'usr_cashier_a',
      actorName: 'Siti Rahma',
      createdAt: new Date().toISOString()
    }
  ],
  purchases: [
    {
      id: 'pur_a_1',
      organizationId: 'org_toko_a',
      supplierId: 'sup_a_1',
      supplierName: 'PT Sumber Pangan Makmur',
      purchaseNumber: 'PO-20261010-001',
      subtotal: 1300000,
      totalAmount: 1300000,
      status: 'completed',
      items: [
        {
          productId: 'prod_a_2',
          productName: 'Beras Premium Ramos 5kg',
          quantity: 20,
          unitCost: 65000,
          lineTotal: 1300000
        }
      ],
      createdBy: 'Budi Santoso',
      createdAt: '2026-01-11T09:00:00Z'
    }
  ],
  expenses: [
    {
      id: 'exp_a_1',
      organizationId: 'org_toko_a',
      description: 'Listrik & WiFi Toko Bulan Ini',
      category: 'Utilitas',
      amount: 450000,
      expenseDate: '2026-10-05',
      createdBy: 'Budi Santoso',
      createdAt: '2026-10-05T10:00:00Z'
    }
  ],
  storeSettings: [
    {
      organizationId: 'org_toko_a',
      storeName: 'Toko Berkah Sentosa',
      storePhone: '081234567890',
      storeAddress: 'Jl. Raya Perjuangan No. 88, Jakarta Selatan',
      storeLogo: '',
      receiptHeader: 'Selamat Datang di Toko Berkah Sentosa',
      receiptFooter: 'Terima kasih atas kunjungan Anda. Belanja hemat berkah selalu!',
      taxPercentage: 0,
      enableTax: false,
      maxCashierDiscountPercent: 10,
      allowNegativeStock: false,
      receiptPaperWidth: '58mm',
      autoPrintReceipt: true,
      updatedAt: '2026-01-10T08:00:00Z'
    },
    {
      organizationId: 'org_toko_b',
      storeName: 'Warung Madura Jaya',
      storePhone: '082345678901',
      storeAddress: 'Jl. KH Mas Mansyur No. 24, Jakarta Pusat',
      storeLogo: '',
      receiptHeader: 'Warung Madura Jaya Buka 24 Jam',
      receiptFooter: 'Matur nuwun, monggo pinarak malih!',
      taxPercentage: 0,
      enableTax: false,
      maxCashierDiscountPercent: 5,
      allowNegativeStock: false,
      receiptPaperWidth: '58mm',
      autoPrintReceipt: true,
      updatedAt: '2026-02-15T09:30:00Z'
    }
  ],
  auditLogs: [
    {
      id: 'aud_1',
      organizationId: 'org_toko_a',
      actorUserId: 'usr_owner_a',
      actorEmail: 'budi@berkahsentosa.com',
      eventType: 'tenant_provisioned',
      targetType: 'organization',
      targetId: 'org_toko_a',
      metadata: { storeName: 'Toko Berkah Sentosa' },
      createdAt: '2026-01-10T08:00:00Z'
    }
  ],
  platformLogs: [
    {
      id: 'plog_1',
      actorUserId: 'usr_owner_a',
      actorEmail: 'budi@berkahsentosa.com',
      organizationId: 'org_toko_a',
      organizationName: 'Toko Berkah Sentosa',
      eventType: 'owner_registered',
      metadata: { plan: 'free' },
      createdAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'plog_2',
      actorUserId: 'usr_owner_b',
      actorEmail: 'anwar@madurajaya.com',
      organizationId: 'org_toko_b',
      organizationName: 'Warung Madura Jaya',
      eventType: 'owner_registered',
      metadata: { plan: 'free' },
      createdAt: '2026-02-15T09:30:00Z'
    }
  ]
};

class TenantStore {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STATE;
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist database state:', e);
    }
  }

  public resetToDefault(): void {
    this.state = DEFAULT_STATE;
    this.saveState();
  }

  // --- TENANT & ACCESS HELPERS ---

  public getOrganizations(): Organization[] {
    return [...this.state.organizations];
  }

  public getOrganizationById(orgId: string): Organization | undefined {
    return this.state.organizations.find(o => o.id === orgId);
  }

  public getUsers(): UserProfile[] {
    return [...this.state.users];
  }

  public getUserById(userId: string): UserProfile | undefined {
    return this.state.users.find(u => u.id === userId);
  }

  public getMembersByOrg(orgId: string): OrganizationMember[] {
    return this.state.members.filter(m => m.organizationId === orgId);
  }

  // --- STRICT TENANT ISOLATION QUERIES ---

  public getProducts(orgId: string): Product[] {
    return this.state.products.filter(p => p.organizationId === orgId);
  }

  public getProductById(orgId: string, productId: string): Product | undefined {
    return this.state.products.find(p => p.organizationId === orgId && p.id === productId);
  }

  public getCategories(orgId: string): Category[] {
    return this.state.categories.filter(c => c.organizationId === orgId);
  }

  public getCustomers(orgId: string): Customer[] {
    return this.state.customers.filter(c => c.organizationId === orgId);
  }

  public getSuppliers(orgId: string): Supplier[] {
    return this.state.suppliers.filter(s => s.organizationId === orgId);
  }

  public getSales(orgId: string): Sale[] {
    return this.state.sales
      .filter(s => s.organizationId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPurchases(orgId: string): Purchase[] {
    return this.state.purchases
      .filter(p => p.organizationId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getExpenses(orgId: string): Expense[] {
    return this.state.expenses
      .filter(e => e.organizationId === orgId)
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }

  public getInventoryMovements(orgId: string): InventoryMovement[] {
    return this.state.inventoryMovements
      .filter(m => m.organizationId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getStoreSettings(orgId: string): StoreSettings {
    const existing = this.state.storeSettings.find(s => s.organizationId === orgId);
    if (existing) return existing;
    const org = this.getOrganizationById(orgId);
    return {
      organizationId: orgId,
      storeName: org?.name || 'Toko Kasir',
      receiptHeader: 'Terima Kasih Atas Kunjungan Anda',
      receiptFooter: 'Barang yang sudah dibeli tidak dapat ditukar.',
      taxPercentage: 0,
      enableTax: false,
      maxCashierDiscountPercent: 10,
      allowNegativeStock: false,
      receiptPaperWidth: '58mm',
      autoPrintReceipt: true,
      updatedAt: new Date().toISOString()
    };
  }

  // --- MUTATION METHODS WITH STRICT TENANT CHECKS ---

  public addProduct(orgId: string, data: Omit<Product, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Product {
    const category = this.state.categories.find(c => c.id === data.categoryId && c.organizationId === orgId);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      organizationId: orgId,
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      categoryId: data.categoryId,
      categoryName: category?.name,
      unit: data.unit || 'pcs',
      costPrice: Number(data.costPrice),
      sellingPrice: Number(data.sellingPrice),
      currentStock: Number(data.currentStock),
      minimumStock: Number(data.minimumStock || 5),
      imagePath: data.imagePath,
      isActive: data.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.state.products.push(newProduct);

    // Initial stock movement if > 0
    if (newProduct.currentStock > 0) {
      this.state.inventoryMovements.push({
        id: `mov_${Date.now()}`,
        organizationId: orgId,
        productId: newProduct.id,
        productName: newProduct.name,
        movementType: 'adjustment',
        quantityDelta: newProduct.currentStock,
        reason: 'Stok Awal Produk Baru',
        actorUserId: 'system',
        createdAt: new Date().toISOString()
      });
    }

    this.saveState();
    return newProduct;
  }

  public updateProduct(orgId: string, productId: string, data: Partial<Product>): Product {
    const index = this.state.products.findIndex(p => p.id === productId && p.organizationId === orgId);
    if (index === -1) throw new Error('Produk tidak ditemukan atau bukan milik toko Anda');

    const current = this.state.products[index];
    const category = data.categoryId
      ? this.state.categories.find(c => c.id === data.categoryId && c.organizationId === orgId)
      : undefined;

    const updated: Product = {
      ...current,
      ...data,
      categoryName: category ? category.name : current.categoryName,
      updatedAt: new Date().toISOString()
    };

    // If stock adjusted manually
    if (data.currentStock !== undefined && data.currentStock !== current.currentStock) {
      const delta = data.currentStock - current.currentStock;
      this.state.inventoryMovements.push({
        id: `mov_${Date.now()}`,
        organizationId: orgId,
        productId: current.id,
        productName: current.name,
        movementType: 'adjustment',
        quantityDelta: delta,
        reason: 'Penyesuaian Manual Stok',
        actorUserId: 'owner',
        createdAt: new Date().toISOString()
      });
    }

    this.state.products[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteProduct(orgId: string, productId: string): void {
    const index = this.state.products.findIndex(p => p.id === productId && p.organizationId === orgId);
    if (index === -1) throw new Error('Produk tidak ditemukan');
    this.state.products.splice(index, 1);
    this.saveState();
  }

  public addCategory(orgId: string, name: string): Category {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      organizationId: orgId,
      name,
      createdAt: new Date().toISOString()
    };
    this.state.categories.push(newCat);
    this.saveState();
    return newCat;
  }

  public addCustomer(orgId: string, data: Omit<Customer, 'id' | 'organizationId' | 'createdAt'>): Customer {
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      organizationId: orgId,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.state.customers.push(newCust);
    this.saveState();
    return newCust;
  }

  public addSupplier(orgId: string, data: Omit<Supplier, 'id' | 'organizationId' | 'createdAt'>): Supplier {
    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      organizationId: orgId,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.state.suppliers.push(newSup);
    this.saveState();
    return newSup;
  }

  public addExpense(orgId: string, data: Omit<Expense, 'id' | 'organizationId' | 'createdAt'>): Expense {
    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      organizationId: orgId,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.state.expenses.push(newExp);
    this.saveState();
    return newExp;
  }

  public updateStoreSettings(orgId: string, data: Partial<StoreSettings>): StoreSettings {
    const index = this.state.storeSettings.findIndex(s => s.organizationId === orgId);
    const updated: StoreSettings = {
      ...this.getStoreSettings(orgId),
      ...data,
      organizationId: orgId,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      this.state.storeSettings[index] = updated;
    } else {
      this.state.storeSettings.push(updated);
    }

    // Also update org name if modified
    if (data.storeName) {
      const org = this.state.organizations.find(o => o.id === orgId);
      if (org) org.name = data.storeName;
    }

    this.saveState();
    return updated;
  }

  // --- ATOMIC POS SALE EXECUTION ---
  public executePosSale(params: {
    orgId: string;
    cashierUserId: string;
    cashierName: string;
    customerId?: string;
    items: { productId: string; quantity: number }[];
    discountPercent: number;
    taxPercent: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    idempotencyKey?: string;
  }): { success: boolean; sale?: Sale; error?: string } {
    const {
      orgId,
      cashierUserId,
      cashierName,
      customerId,
      items,
      discountPercent,
      taxPercent,
      paymentMethod,
      amountPaid,
      idempotencyKey
    } = params;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = this.state.sales.find(
        s => s.organizationId === orgId && s.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return { success: true, sale: existing };
      }
    }

    // 2. Validate Items & Fetch fresh prices from database
    const mappedItems: {
      product: Product;
      quantity: number;
    }[] = [];

    for (const reqItem of items) {
      const prod = this.state.products.find(p => p.id === reqItem.productId && p.organizationId === orgId);
      if (!prod) {
        return { success: false, error: `Produk ID ${reqItem.productId} tidak ditemukan di toko ini` };
      }
      if (!prod.isActive) {
        return { success: false, error: `Produk "${prod.name}" sedang nonaktif` };
      }
      if (prod.currentStock < reqItem.quantity) {
        return {
          success: false,
          error: `Stok produk "${prod.name}" tidak mencukupi (Tersisa: ${prod.currentStock}, Diminta: ${reqItem.quantity})`
        };
      }
      mappedItems.push({ product: prod, quantity: reqItem.quantity });
    }

    // 3. Server-side Calculation
    const calc = calculatePosTotals(
      mappedItems.map(m => ({
        productId: m.product.id,
        name: m.product.name,
        sku: m.product.sku,
        unitPrice: m.product.sellingPrice,
        costPrice: m.product.costPrice,
        quantity: m.quantity,
        currentStock: m.product.currentStock
      })),
      discountPercent,
      taxPercent,
      amountPaid
    );

    if (!calc.isValid) {
      return { success: false, error: calc.error };
    }

    if (paymentMethod === 'cash' && amountPaid < calc.totalAmount) {
      return {
        success: false,
        error: `Uang pembayaran (Rp ${amountPaid.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${calc.totalAmount.toLocaleString('id-ID')})`
      };
    }

    // 4. Generate Unique Transaction Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionNumber = `TRX-${dateStr}-${randSuffix}`;
    const saleId = `sale_${Date.now()}`;

    // 5. Build Snapshot Sale Items
    const saleItems: SaleItem[] = mappedItems.map((m, idx) => {
      const lineTotal = m.product.sellingPrice * m.quantity;
      return {
        id: `sitem_${Date.now()}_${idx}`,
        organizationId: orgId,
        saleId,
        productId: m.product.id,
        productNameSnapshot: m.product.name,
        skuSnapshot: m.product.sku,
        quantity: m.quantity,
        unitPrice: m.product.sellingPrice,
        unitCostSnapshot: m.product.costPrice,
        discountAmount: 0,
        lineTotal
      };
    });

    const customer = customerId ? this.state.customers.find(c => c.id === customerId && c.organizationId === orgId) : undefined;

    const newSale: Sale = {
      id: saleId,
      organizationId: orgId,
      transactionNumber,
      cashierUserId,
      cashierName,
      customerId,
      customerName: customer?.name,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount,
      totalAmount: calc.totalAmount,
      amountPaid: paymentMethod === 'cash' ? amountPaid : calc.totalAmount,
      changeDue: paymentMethod === 'cash' ? calc.changeDue : 0,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'completed',
      idempotencyKey,
      items: saleItems,
      createdAt: new Date().toISOString()
    };

    // 6. Deduct Stock & Record Inventory Movements Atomically
    for (const m of mappedItems) {
      const prodIndex = this.state.products.findIndex(p => p.id === m.product.id);
      if (prodIndex >= 0) {
        this.state.products[prodIndex].currentStock -= m.quantity;
        this.state.products[prodIndex].updatedAt = new Date().toISOString();
      }

      this.state.inventoryMovements.push({
        id: `mov_${Date.now()}_${m.product.id}`,
        organizationId: orgId,
        productId: m.product.id,
        productName: m.product.name,
        movementType: 'sale',
        quantityDelta: -m.quantity,
        referenceType: 'sale',
        referenceId: saleId,
        reason: `Penjualan Kasir POS ${transactionNumber}`,
        actorUserId: cashierUserId,
        actorName: cashierName,
        createdAt: new Date().toISOString()
      });
    }

    this.state.sales.push(newSale);

    // Audit log
    this.state.auditLogs.push({
      id: `aud_${Date.now()}`,
      organizationId: orgId,
      actorUserId: cashierUserId,
      actorEmail: cashierName,
      eventType: 'sale_completed',
      targetType: 'sale',
      targetId: saleId,
      metadata: { transactionNumber, total: calc.totalAmount, paymentMethod },
      createdAt: new Date().toISOString()
    });

    this.saveState();
    return { success: true, sale: newSale };
  }

  // --- SUPER ADMIN PLATFORM QUERIES (NO TRANSACTION DETAILS LEAKAGE) ---

  public getPlatformOverview(): {
    totalOwners: number;
    activeStores: number;
    pendingStores: number;
    suspendedStores: number;
    totalStaff: number;
    organizations: {
      id: string;
      name: string;
      ownerName: string;
      ownerEmail: string;
      status: string;
      staffCount: number;
      createdAt: string;
    }[];
    activityLogs: PlatformActivityLog[];
  } {
    const orgs = this.state.organizations.map(org => {
      const owner = this.state.users.find(u => u.id === org.ownerUserId);
      const staff = this.state.members.filter(m => m.organizationId === org.id);
      return {
        id: org.id,
        name: org.name,
        ownerName: owner?.fullName || 'Owner',
        ownerEmail: owner?.email || '-',
        status: org.status,
        staffCount: staff.length,
        createdAt: org.createdAt
      };
    });

    const activeStores = this.state.organizations.filter(o => o.status === 'active').length;
    const pendingStores = this.state.organizations.filter(o => o.status === 'pending_verification').length;
    const suspendedStores = this.state.organizations.filter(o => o.status === 'suspended').length;

    return {
      totalOwners: this.state.users.filter(u => !u.isSuperAdmin).length,
      activeStores,
      pendingStores,
      suspendedStores,
      totalStaff: this.state.members.length,
      organizations: orgs,
      activityLogs: [...this.state.platformLogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    };
  }

  public setStoreStatus(orgId: string, status: 'active' | 'suspended', adminEmail: string): void {
    const org = this.state.organizations.find(o => o.id === orgId);
    if (!org) throw new Error('Organisasi tidak ditemukan');
    org.status = status;
    org.updatedAt = new Date().toISOString();

    this.state.platformLogs.push({
      id: `plog_${Date.now()}`,
      actorEmail: adminEmail,
      organizationId: orgId,
      organizationName: org.name,
      eventType: `store_status_${status}`,
      metadata: { previousStatus: org.status, newStatus: status },
      createdAt: new Date().toISOString()
    });

    this.saveState();
  }

  // --- OWNER PROVISIONING ---
  public registerNewOwner(data: {
    fullName: string;
    storeName: string;
    email: string;
  }): { user: UserProfile; org: Organization } {
    const userId = `usr_${Date.now()}`;
    const orgId = `org_${Date.now()}`;

    const newUser: UserProfile = {
      id: userId,
      email: data.email,
      fullName: data.fullName,
      isSuperAdmin: false
    };

    const newOrg: Organization = {
      id: orgId,
      name: data.storeName,
      slug: data.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ownerUserId: userId,
      status: 'active',
      timezone: 'Asia/Jakarta',
      currencyCode: 'IDR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newMember: OrganizationMember = {
      id: `mem_${Date.now()}`,
      organizationId: orgId,
      userId,
      userEmail: data.email,
      userName: data.fullName,
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const newSettings: StoreSettings = {
      organizationId: orgId,
      storeName: data.storeName,
      receiptHeader: `Selamat Datang di ${data.storeName}`,
      receiptFooter: 'Terima kasih atas kunjungan Anda!',
      taxPercentage: 0,
      enableTax: false,
      maxCashierDiscountPercent: 10,
      allowNegativeStock: false,
      updatedAt: new Date().toISOString()
    };

    const defaultCategory: Category = {
      id: `cat_${Date.now()}`,
      organizationId: orgId,
      name: 'Umum & Lainnya',
      createdAt: new Date().toISOString()
    };

    this.state.users.push(newUser);
    this.state.organizations.push(newOrg);
    this.state.members.push(newMember);
    this.state.storeSettings.push(newSettings);
    this.state.categories.push(defaultCategory);

    this.state.platformLogs.push({
      id: `plog_${Date.now()}`,
      actorUserId: userId,
      actorEmail: data.email,
      organizationId: orgId,
      organizationName: data.storeName,
      eventType: 'owner_registered_and_provisioned',
      createdAt: new Date().toISOString()
    });

    this.saveState();
    return { user: newUser, org: newOrg };
  }
}

export const tenantStore = new TenantStore();
