import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { InvestorProvider } from "@/contexts/InvestorContext";
import { ModularAppProvider } from "@/core/ModularAppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppIntegrationProvider } from "@/contexts/AppIntegrationContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LazyComponentWrapper } from "@/components/performance/LazyComponentWrapper";
// Temporarily removed PerformanceMonitor to debug React context issues
import { ErrorBoundary } from "@/components/ui/error-handling";
import { SEOManager } from "@/components/SEO/SEOManager";
import { ChecksReport } from "@/components/reports/ChecksReport";
import { PWAInstaller } from "@/components/ui/pwa-installer";
// Removed OptimizedApp to fix React context issues

// الصفحات الأساسية (بدون lazy loading لتجنب مشاكل الهوك)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// استخدام النظام المحسن للـ Code Splitting
import { 
  SalesBundle, 
  InventoryBundle, 
  PurchasesBundle, 
  ReportsBundle, 
  EmployeesBundle, 
  InvestorsBundle,
  preloadCriticalRoutes 
} from "./components/performance/CodeSplitting";

// Lazy load الصفحات الأخرى
const CashRegister = lazy(() => import("./pages/CashRegister"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Installments = lazy(() => import("./pages/Installments"));
const Settings = lazy(() => import("./pages/Settings"));
const CurrencyConverter = lazy(() => import("./pages/CurrencyConverter"));
const Checks = lazy(() => import("./pages/Checks"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const UserSessions = lazy(() => import("./pages/UserSessions"));
const Sessions = lazy(() => import("./pages/Sessions"));
const AdminSessions = lazy(() => import("./pages/AdminSessions"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Documentation = lazy(() => import("./pages/Documentation"));

const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const Returns = lazy(() => import("./pages/Returns"));
const SystemIntegration = lazy(() => import("./pages/SystemIntegration"));
const SecureInventoryDashboard = lazy(() => import("./components/inventory/SecureInventoryDashboard"));
const ProductDisplay = lazy(() => import("./pages/ProductDisplay"));

// تحميل مسبق محسن ومتدرج للصفحات المهمة
setTimeout(() => {
  preloadCriticalRoutes();
}, 1000);

// تكوين QueryClient محسن للأداء
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      gcTime: 10 * 60 * 1000, // 10 دقائق
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ModularAppProvider>
            <AppIntegrationProvider>
              <CustomerProvider>
                <InvestorProvider>
                  <Toaster />
                  <Sonner />
                  <OfflineIndicator />
                  {/* PerformanceMonitor removed to debug React context issues */}
                  <PWAInstaller />
                  <BrowserRouter>
                    <SEOManager />
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-screen bg-background">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                          <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
                        </div>
                      </div>
                    }>
                       <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                         <Route path="/forgot-password" element={
                           <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                             {React.createElement(lazy(() => import('./pages/ForgotPassword')))}
                           </Suspense>
                         } />
                         <Route path="/reset-password" element={
                           <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                             {React.createElement(lazy(() => import('./pages/ResetPassword')))}
                           </Suspense>
                         } />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Index />
                          </ProtectedRoute>
                        } />
                        
                        {/* Sales routes with Suspense */}
                        <Route path="/sales/invoices" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                                <SalesBundle.Invoices />
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/sales/invoices/new" element={
                          <ProtectedRoute>
                            <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                              <SalesBundle.NewInvoice />
                            </Suspense>
                          </ProtectedRoute>
                        } />
                        <Route path="/sales/customers" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                                <SalesBundle.Customers />
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/sales/customers/new" element={
                          <ProtectedRoute>
                            <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                              <SalesBundle.NewCustomer />
                            </Suspense>
                          </ProtectedRoute>
                        } />
                        <Route path="/sales/customers/view/:id" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                                <SalesBundle.ViewCustomer />
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        <Route path="/sales/customers/edit/:id" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                                <SalesBundle.EditCustomer />
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Users route with Suspense */}
                        <Route path="/users" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                                <UserManagement />
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        {/* User Sessions route */}
                        <Route path="/user-sessions" element={
                          <ProtectedRoute>
                            <AppLayout>
                              <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                                <UserSessions />
                              </Suspense>
                            </AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Sessions Management */}
                        <Route path="/sessions" element={
                          <ProtectedRoute>
                            <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                              <Sessions />
                            </Suspense>
                          </ProtectedRoute>
                        } />

                        {/* Admin Sessions */}
                        <Route path="/admin-sessions" element={
                          <ProtectedRoute>
                            <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                              <AdminSessions />
                            </Suspense>
                          </ProtectedRoute>
                        } />

                        {/* Activity Log */}
                        <Route path="/activity-log" element={
                          <ProtectedRoute>
                            <Suspense fallback={<div className="p-4">جاري التحميل...</div>}>
                              <ActivityLog />
                            </Suspense>
                          </ProtectedRoute>
                        } />
                        
                        {/* Other routes wrapped in Suspense */}
                        <Route path="/purchases/invoices" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><PurchasesBundle.Invoices /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/purchases/invoices/new" element={<ProtectedRoute><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><PurchasesBundle.NewPurchase /></Suspense></ProtectedRoute>} />
                         <Route path="/purchases/suppliers" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><PurchasesBundle.Suppliers /></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="/inventory/products" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InventoryBundle.Products /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/inventory/products/new" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InventoryBundle.NewProduct /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/inventory/stock" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InventoryBundle.Stock /></Suspense></AppLayout></ProtectedRoute>} />
                         <Route path="/inventory/barcode" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InventoryBundle.Barcode /></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="/cash-register" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><CashRegister /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/expenses" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><Expenses /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/installments" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><Installments /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/currency-converter" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><CurrencyConverter /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/checks" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><Checks /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/returns" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><Returns /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/product-display" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><ProductDisplay /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/payroll" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><EmployeesBundle.Payroll /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/employees" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><EmployeesBundle.List /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/employees/new" element={<ProtectedRoute><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><EmployeesBundle.New /></Suspense></ProtectedRoute>} />
                        
                        <Route path="/investors/registration" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InvestorsBundle.Registration /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/investors/purchases" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InvestorsBundle.Purchases /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/investors/reports" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InvestorsBundle.Reports /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/investors/integrated-dashboard" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><InvestorsBundle.Dashboard /></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="/settings" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><Settings /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/documentation" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><Documentation /></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="/monitoring" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><MonitoringPage /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/system-integration" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><SystemIntegration /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/secure-inventory" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><SecureInventoryDashboard /></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="/reports/profit" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><ReportsBundle.Profit /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/reports/sales" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><ReportsBundle.Sales /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/reports/purchases" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><ReportsBundle.Purchases /></Suspense></AppLayout></ProtectedRoute>} />
                        <Route path="/reports/inventory" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><ReportsBundle.Inventory /></Suspense></AppLayout></ProtectedRoute>} />
                         <Route path="/reports/comparative" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><ReportsBundle.Comparative /></Suspense></AppLayout></ProtectedRoute>} />
                         <Route path="/reports/checks" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><LazyComponentWrapper><ChecksReport /></LazyComponentWrapper></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="/sales/dashboard" element={<ProtectedRoute><AppLayout><Suspense fallback={<div className="p-4">جاري التحميل...</div>}><SalesBundle.Dashboard /></Suspense></AppLayout></ProtectedRoute>} />
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </InvestorProvider>
              </CustomerProvider>
            </AppIntegrationProvider>
          </ModularAppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
