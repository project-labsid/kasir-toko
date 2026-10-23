/**
 * SUPER KASIR TOKO - Main Application Shell
 * Point of Sale (POS) & Multi-Tenant Store Management System
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { PosView } from './components/pos/PosView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { InventoryView } from './components/inventory/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { CustomersView } from './components/customers/CustomersView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { StaffView } from './components/staff/StaffView';
import { SettingsView } from './components/settings/SettingsView';
import { SuperAdminView } from './components/admin/SuperAdminView';
import { LandingView } from './components/public/LandingView';
import { MobileBottomNav } from './components/common/MobileBottomNav';

import { Organization, UserProfile, OrgRole } from './types';
import { tenantStore } from './db/tenant-store';

export default function App() {
  // Current Tenant and User State
  const [currentOrgId, setCurrentOrgId] = useState<string>('org_toko_a');
  const [currentUserId, setCurrentUserId] = useState<string>('usr_owner_a');
  const [currentRole, setCurrentRole] = useState<OrgRole | 'super_admin'>('owner');

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab | 'landing'>('pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileScannerOpen, setMobileScannerOpen] = useState(false);

  // Data Refresh Trigger
  const [dataVersion, setDataVersion] = useState(0);
  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(err => console.log('SW registration error:', err));
    }

    // Capture install prompt
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallPwa = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
    });
  };

  // Switch Tenant / Role Handler
  const handleSwitchTenant = (orgId: string, userId: string, role: OrgRole | 'super_admin') => {
    setCurrentOrgId(orgId);
    setCurrentUserId(userId);
    setCurrentRole(role);
    if (role === 'super_admin') {
      setActiveTab('admin_overview');
    } else if (role === 'cashier') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
    refreshData();
  };

  const handleResetDemoData = () => {
    if (window.confirm('Yakin ingin mereset seluruh data kembali ke setelan pabrik demo?')) {
      tenantStore.resetToDefault();
      refreshData();
    }
  };

  // Load current tenant-isolated data
  const currentOrg = tenantStore.getOrganizationById(currentOrgId) || {
    id: currentOrgId,
    name: 'Toko Kasir',
    ownerUserId: currentUserId,
    status: 'active',
    timezone: 'Asia/Jakarta',
    currencyCode: 'IDR',
    createdAt: '',
    updatedAt: ''
  };

  const currentUser = tenantStore.getUserById(currentUserId) || {
    id: currentUserId,
    email: 'user@superkasir.com',
    fullName: 'Pengguna',
    isSuperAdmin: currentRole === 'super_admin'
  };

  const allOrgs = tenantStore.getOrganizations();
  const allUsers = tenantStore.getUsers();

  // Strict Tenant Isolated Data Queries
  const products = tenantStore.getProducts(currentOrgId);
  const categories = tenantStore.getCategories(currentOrgId);
  const customers = tenantStore.getCustomers(currentOrgId);
  const suppliers = tenantStore.getSuppliers(currentOrgId);
  const sales = tenantStore.getSales(currentOrgId);
  const inventoryMovements = tenantStore.getInventoryMovements(currentOrgId);
  const purchases = tenantStore.getPurchases(currentOrgId);
  const expenses = tenantStore.getExpenses(currentOrgId);
  const storeSettings = tenantStore.getStoreSettings(currentOrgId);
  const members = tenantStore.getMembersByOrg(currentOrgId);

  // If viewing landing page
  if (activeTab === 'landing') {
    return (
      <LandingView
        onEnterApp={(orgId, userId, role) => {
          handleSwitchTenant(orgId, userId, role);
        }}
        onOpenRegister={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentOrg={currentOrg}
        currentUser={currentUser}
        currentRole={currentRole}
        allOrgs={allOrgs}
        allUsers={allUsers}
        onSwitchTenant={handleSwitchTenant}
        onResetDemoData={handleResetDemoData}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
        onOpenAuth={() => setActiveTab('landing')}
      />

      {/* Main Body Area: Sidebar + Active Content View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab as ActiveTab}
          onSelectTab={t => setActiveTab(t)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-slate-50">
          {/* Mobile Bar for opening menu */}
          <div className="p-2.5 bg-white border-b border-slate-200 lg:hidden flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              ☰ Menu Navigasi
            </button>
            <div className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">
              {currentOrg.name}
            </div>
          </div>

          {/* VIEW SWITCHER */}
          {activeTab === 'pos' && (
            <PosView
              organizationId={currentOrgId}
              cashierUserId={currentUserId}
              cashierName={currentUser.fullName}
              products={products}
              categories={categories}
              customers={customers}
              storeSettings={storeSettings}
              onSaleCompleted={refreshData}
              isScannerOpen={mobileScannerOpen}
              onCloseScanner={() => setMobileScannerOpen(false)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              organizationName={currentOrg.name}
              sales={sales}
              products={products}
              customers={customers}
              onNavigate={t => setActiveTab(t)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              organizationId={currentOrgId}
              products={products}
              categories={categories}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              organizationId={currentOrgId}
              products={products}
              movements={inventoryMovements}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              organizationId={currentOrgId}
              purchases={purchases}
              products={products}
              suppliers={suppliers}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              organizationId={currentOrgId}
              suppliers={suppliers}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              organizationId={currentOrgId}
              customers={customers}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              sales={sales}
              storeSettings={storeSettings}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              organizationId={currentOrgId}
              expenses={expenses}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              organizationName={currentOrg.name}
              sales={sales}
              expenses={expenses}
              products={products}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              organizationId={currentOrgId}
              members={members}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              organizationId={currentOrgId}
              storeSettings={storeSettings}
              onRefresh={refreshData}
            />
          )}

          {(activeTab === 'admin_overview' ||
            activeTab === 'admin_tenants' ||
            activeTab === 'admin_logs') && (
            <SuperAdminView onRefresh={refreshData} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on md/lg desktop/tablet) */}
      <MobileBottomNav
        activeTab={activeTab}
        currentRole={currentRole}
        cartCount={0}
        onSelectTab={t => {
          setActiveTab(t);
          setMobileMenuOpen(false);
        }}
        onOpenScanner={() => {
          if (activeTab !== 'pos') {
            setActiveTab('pos');
          }
          setMobileScannerOpen(true);
        }}
      />
    </div>
  );
}
