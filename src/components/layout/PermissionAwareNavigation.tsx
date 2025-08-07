import React from 'react';
import { ConditionalRender } from '@/components/auth/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  permission?: string;
  module?: string;
  action?: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve';
  role?: string;
}

interface PermissionAwareNavigationProps {
  items: NavItem[];
  renderItem: (item: NavItem, level?: number) => React.ReactNode;
  level?: number;
}

export function PermissionAwareNavigation({ 
  items, 
  renderItem, 
  level = 0 
}: PermissionAwareNavigationProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {items.map((item, index) => (
        <ConditionalRender
          key={index}
          permission={item.permission}
          module={item.module}
          action={item.action}
          role={item.role}
        >
          {renderItem(item, level)}
        </ConditionalRender>
      ))}
    </>
  );
}

// قائمة التنقل مع الصلاحيات
export const navigationItemsWithPermissions: NavItem[] = [
  {
    title: "لوحة التحكم",
    href: "/",
    icon: require("lucide-react").LayoutDashboard,
    // متاح للجميع
  },
  {
    title: "المبيعات",
    icon: require("lucide-react").ShoppingCart,
    module: "sales",
    action: "read",
    children: [
      { 
        title: "فواتير البيع", 
        href: "/sales/invoices", 
        icon: require("lucide-react").FileText,
        module: "sales",
        action: "read"
      },
      { 
        title: "العملاء", 
        href: "/sales/customers", 
        icon: require("lucide-react").Users,
        module: "customers",
        action: "read"
      },
      { 
        title: "تقارير المبيعات", 
        href: "/sales/reports", 
        icon: require("lucide-react").BarChart3,
        module: "reports",
        action: "read"
      },
    ],
  },
  {
    title: "المشتريات",
    icon: require("lucide-react").Truck,
    module: "purchases",
    action: "read",
    children: [
      { 
        title: "فواتير الشراء", 
        href: "/purchases/invoices", 
        icon: require("lucide-react").FileText,
        module: "purchases",
        action: "read"
      },
      { 
        title: "الموردين", 
        href: "/purchases/suppliers", 
        icon: require("lucide-react").UserCheck,
        module: "suppliers",
        action: "read"
      },
    ],
  },
  {
    title: "المخزون",
    icon: require("lucide-react").Package,
    module: "inventory",
    action: "read",
    children: [
      { 
        title: "إدارة المنتجات", 
        href: "/inventory/products", 
        icon: require("lucide-react").Store,
        module: "inventory",
        action: "read"
      },
      { 
        title: "المخزون الحالي", 
        href: "/inventory/stock", 
        icon: require("lucide-react").Archive,
        module: "inventory",
        action: "read"
      },
      { 
        title: "الباركود", 
        href: "/inventory/barcode", 
        icon: require("lucide-react").Scan,
        module: "inventory",
        action: "read"
      },
    ],
  },
  {
    title: "الصندوق",
    href: "/cash-register",
    icon: require("lucide-react").Wallet,
    module: "cash-register",
    action: "read"
  },
  {
    title: "المصروفات",
    href: "/expenses",
    icon: require("lucide-react").Calculator,
    module: "expenses",
    action: "read"
  },
  {
    title: "الموظفين",
    icon: require("lucide-react").Users2,
    permission: "users.read",
    children: [
      { 
        title: "إدارة الموظفين", 
        href: "/employees", 
        icon: require("lucide-react").Users,
        permission: "users.read"
      },
      { 
        title: "إضافة موظف", 
        href: "/employees/new", 
        icon: require("lucide-react").Users,
        permission: "users.create"
      },
      { 
        title: "الأجور والمرتبات", 
        href: "/payroll", 
        icon: require("lucide-react").Users2,
        permission: "users.read"
      },
    ],
  },
  {
    title: "إدارة المستثمرين",
    icon: require("lucide-react").UserCheck,
    role: "admin",
    children: [
      { 
        title: "تسجيل المستثمرين", 
        href: "/investors/registration", 
        icon: require("lucide-react").Users,
        role: "admin"
      },
      { 
        title: "مشتريات المستثمرين", 
        href: "/investors/purchases", 
        icon: require("lucide-react").ShoppingCart,
        role: "admin"
      },
      { 
        title: "تقارير المستثمرين", 
        href: "/investors/reports", 
        icon: require("lucide-react").BarChart3,
        role: "admin"
      },
      { 
        title: "اللوحة المتكاملة", 
        href: "/investors/integrated-dashboard", 
        icon: require("lucide-react").LayoutDashboard,
        role: "admin"
      },
    ],
  },
  {
    title: "محول العملة",
    href: "/currency-converter",
    icon: require("lucide-react").DollarSign,
    // متاح للجميع
  },
  {
    title: "الشيكات",
    href: "/checks",
    icon: require("lucide-react").Receipt,
    module: "checks",
    action: "read"
  },
  {
    title: "التقارير",
    icon: require("lucide-react").TrendingUp,
    module: "reports",
    action: "read",
    children: [
      { 
        title: "تقرير الأرباح", 
        href: "/reports/profit", 
        icon: require("lucide-react").TrendingUp,
        module: "reports",
        action: "read"
      },
      { 
        title: "تقرير المبيعات", 
        href: "/reports/sales", 
        icon: require("lucide-react").ShoppingCart,
        module: "reports",
        action: "read"
      },
      { 
        title: "تقرير المشتريات", 
        href: "/reports/purchases", 
        icon: require("lucide-react").Truck,
        module: "reports",
        action: "read"
      },
      { 
        title: "تقرير المخزون", 
        href: "/reports/inventory", 
        icon: require("lucide-react").Package,
        module: "reports",
        action: "read"
      },
      { 
        title: "التقارير الموحدة", 
        href: "/reports/unified", 
        icon: require("lucide-react").Activity,
        module: "reports",
        action: "read"
      },
    ],
  },
  {
    title: "إدارة المستخدمين",
    href: "/users",
    icon: require("lucide-react").Users2,
    module: "users",
    action: "read"
  },
  {
    title: "الأقساط",
    href: "/installments",
    icon: require("lucide-react").CreditCard,
    module: "installments",
    action: "read"
  },
  {
    title: "الإعدادات",
    href: "/settings",
    icon: require("lucide-react").Settings,
    module: "settings",
    action: "read"
  },
];