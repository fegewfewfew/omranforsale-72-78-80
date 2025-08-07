import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Wallet,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  Truck,
  Calculator,
  BarChart3,
  CreditCard,
  UserCheck,
  Store,
  Scan,
  Archive,
  DollarSign,
  Receipt,
  Users2,
  Menu,
  X,
  HelpCircle,
  FolderOpen,
  RotateCcw,
  Link,
  Shield,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import omranLogo from "@/assets/omran-logo.png";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: "لوحة التحكم",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "عرض المنتجات للعملاء",
    href: "/product-display",
    icon: Store,
  },
  {
    title: "المبيعات",
    icon: ShoppingCart,
    children: [
      { title: "فواتير البيع", href: "/sales/invoices", icon: FileText },
      { title: "العملاء", href: "/sales/customers", icon: Users },
    ],
  },
  {
    title: "المشتريات",
    icon: Truck,
    children: [
      { title: "فواتير الشراء", href: "/purchases/invoices", icon: FileText },
      { title: "الموردين", href: "/purchases/suppliers", icon: UserCheck },
    ],
  },
  {
    title: "المخزون",
    icon: Package,
    children: [
      { title: "إدارة المنتجات", href: "/inventory/products", icon: Store },
      { title: "المخزون الحالي", href: "/inventory/stock", icon: Archive },
      { title: "الباركود", href: "/inventory/barcode", icon: Scan },
    ],
  },
  {
    title: "الصندوق",
    href: "/cash-register",
    icon: Wallet,
  },
  {
    title: "المصروفات",
    href: "/expenses",
    icon: Calculator,
  },
  {
    title: "الموظفين",
    icon: Users2,
    children: [
      { title: "إدارة الموظفين", href: "/employees", icon: Users },
      { title: "إضافة موظف", href: "/employees/new", icon: Users },
      { title: "الأجور والمرتبات", href: "/payroll", icon: Users2 },
    ],
  },
  {
    title: "محول العملة",
    href: "/currency-converter",
    icon: DollarSign,
  },
  {
    title: "الشيكات",
    href: "/checks",
    icon: Receipt,
  },
  {
    title: "المرتجعات",
    href: "/returns",
    icon: RotateCcw,
  },
   {
     title: "التقارير",
     icon: TrendingUp,
      children: [
        { title: "تقرير الأرباح", href: "/reports/profit", icon: TrendingUp },
        { title: "تقرير المبيعات", href: "/reports/sales", icon: ShoppingCart },
        { title: "تقرير المشتريات", href: "/reports/purchases", icon: Truck },
        { title: "تقرير المخزون", href: "/reports/inventory", icon: Package },
      ],
   },
   {
     title: "إدارة المستخدمين",
     href: "/users",
     icon: Users2,
   },
   {
     title: "إدارة الجلسات",
     icon: Shield,
     children: [
       { title: "جلساتي", href: "/sessions", icon: Shield },
       { title: "لوحة تحكم الجلسات", href: "/admin-sessions", icon: Users2 },
       { title: "سجل النشاط", href: "/activity-log", icon: FileText },
       { title: "جلسات المستخدم", href: "/user-sessions", icon: Shield },
     ],
   },
  {
    title: "الأقساط",
    href: "/installments",
    icon: CreditCard,
  },
   {
     title: "صحة النظام",
     href: "/system-health",
     icon: Activity,
   },
   {
     title: "نظام التكامل",
     href: "/system-integration",
     icon: Link,
   },
   {
     title: "الإعدادات",
     href: "/settings",
     icon: Settings,
   },
];

function NavItemComponent({ item, level = 0 }: { item: NavItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between text-right hover:bg-primary/10 hover:text-primary transition-colors",
              level > 0 && "mr-4"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span className="font-janna-bold">{item.title}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {item.children?.map((child, index) => (
            <NavItemComponent key={index} item={child} level={level + 1} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <NavLink
      to={item.href || "#"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
          level > 0 && "mr-4 text-muted-foreground",
          isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        )
      }
    >
      <item.icon className="h-5 w-5" />
      <span className="font-janna-bold">{item.title}</span>
    </NavLink>
  );
}

export function AppSidebar({ isOpen, onClose, onToggle }: AppSidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "fixed top-16 right-0 z-40 w-64 h-[calc(100vh-4rem)] bg-card border-l border-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={omranLogo} alt="عمران للمبيعات" className="w-8 h-8" />
              <h2 className="font-arabic-elegant text-lg text-card-foreground">عمران للمبيعات</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            {navigationItems.map((item, index) => (
              <NavItemComponent key={index} item={item} />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-sm text-muted-foreground text-center font-arabic-elegant">
              عمران للمبيعات v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}