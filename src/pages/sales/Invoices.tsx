import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Download, Calendar, Loader2, Trash2, Edit, RefreshCw, RotateCcw, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { InvoicePrintTemplate } from "@/components/ui/invoice-print-template";

export default function Invoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletedInvoices, setDeletedInvoices] = useState<any[]>([]);
  const [showDeletedInvoices, setShowDeletedInvoices] = useState(false);
  const [isRestoringAll, setIsRestoringAll] = useState(false);

  // Load invoices and deleted invoices from localStorage on component mount
  useEffect(() => {
    const savedInvoices = localStorage.getItem('sales_invoices');
    if (savedInvoices) {
      try {
        const parsedInvoices = JSON.parse(savedInvoices);
        // Ensure it's an array before setting
        if (Array.isArray(parsedInvoices)) {
          setInvoices(parsedInvoices);
        } else {
          console.warn('Invalid invoices data in localStorage, using empty array');
          setInvoices([]);
          localStorage.removeItem('sales_invoices'); // Clean invalid data
        }
      } catch (error) {
        console.error('Error parsing saved invoices:', error);
        setInvoices([]);
        localStorage.removeItem('sales_invoices'); // Clean invalid data
      }
    }

    const savedDeletedInvoices = localStorage.getItem('deleted_sales_invoices');
    if (savedDeletedInvoices) {
      try {
        const parsedDeletedInvoices = JSON.parse(savedDeletedInvoices);
        // Ensure it's an array before setting
        if (Array.isArray(parsedDeletedInvoices)) {
          setDeletedInvoices(parsedDeletedInvoices);
        } else {
          console.warn('Invalid deleted invoices data in localStorage, using empty array');
          setDeletedInvoices([]);
          localStorage.removeItem('deleted_sales_invoices'); // Clean invalid data
        }
      } catch (error) {
        console.error('Error parsing deleted invoices:', error);
        setDeletedInvoices([]);
        localStorage.removeItem('deleted_sales_invoices'); // Clean invalid data
      }
    }
  }, []);
  
  // Debug logs to understand the issue
  console.log('Invoices state:', invoices, 'Type:', typeof invoices, 'IsArray:', Array.isArray(invoices));
  console.log('DeletedInvoices state:', deletedInvoices, 'Type:', typeof deletedInvoices, 'IsArray:', Array.isArray(deletedInvoices));
  console.log('ShowDeletedInvoices:', showDeletedInvoices);
  
  const sourceArray = showDeletedInvoices ? deletedInvoices : invoices;
  console.log('Source array for filtering:', sourceArray, 'Type:', typeof sourceArray, 'IsArray:', Array.isArray(sourceArray));
  
  const filteredInvoices = Array.isArray(sourceArray) ? 
    sourceArray.filter(invoice => {
      if (!invoice) return false;
      const matchesSearch = (invoice.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (invoice.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "الكل" || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) : [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "مدفوعة": return "default";
      case "معلقة": return "secondary";
      case "ملغية": return "destructive";
      default: return "secondary";
    }
  };

  const totalInvoices = Array.isArray(invoices) ? invoices.length : 0;
  const paidInvoices = Array.isArray(invoices) ? invoices.filter(inv => inv?.status === "مدفوعة").length : 0;
  const pendingInvoices = Array.isArray(invoices) ? invoices.filter(inv => inv?.status === "معلقة").length : 0;
  const totalRevenue = Array.isArray(invoices) ? 
    invoices.filter(inv => inv?.status === "مدفوعة")
            .reduce((sum, inv) => sum + (inv?.total || 0), 0) : 0;

  const handleViewInvoice = async (invoice: any) => {
    setLoadingInvoiceId(invoice.id);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSelectedInvoice(invoice);
    setLoadingInvoiceId(null);
  };

  const handleDownloadInvoice = async (invoice: any) => {
    setLoadingInvoiceId(invoice.id);
    
    try {
      // استخدام نظام الطباعة المحسن
      const invoicePrintData = {
        id: invoice.id,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        date: invoice.date,
        items: invoice.itemsDetails || [],
        total: invoice.total,
        subtotal: invoice.subtotal || invoice.total,
        taxAmount: invoice.taxAmount,
        discountAmount: invoice.discountAmount,
        notes: invoice.notes,
        paymentMethod: invoice.paymentMethod,
        status: invoice.status
      };

      // تحويل البيانات إلى HTML محسن
      const printContent = generateEnhancedPrintHTML(invoicePrintData);
      
      const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `فاتورة-${invoice.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم التحميل",
        description: `تم تحميل فاتورة ${invoice.id} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل الفاتورة",
        variant: "destructive",
      });
    }
    
    setLoadingInvoiceId(null);
  };

  const generateEnhancedPrintHTML = (invoiceData: any) => {
    // جلب بيانات الشركة من الإعدادات
    const getCompanyInfo = () => {
      try {
        const savedCompanySettings = localStorage.getItem('company_settings');
        if (savedCompanySettings) {
          const companySettings = JSON.parse(savedCompanySettings);
          return {
            name: companySettings.nameAr || companySettings.name || 'شركة عمران للمبيعات',
            address: companySettings.address || 'العنوان، المدينة، الدولة',
            phone: companySettings.phone || '+20123456789',
            email: companySettings.email || 'info@omran.com',
            taxNumber: companySettings.taxNumber || '123456789',
            website: companySettings.website || '',
            description: companySettings.description || ''
          };
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
      
      return {
        name: 'شركة عمران للمبيعات',
        address: 'العنوان، المدينة، الدولة',
        phone: '+20123456789',
        email: 'info@omran.com',
        taxNumber: '123456789'
      };
    };

    const companyInfo = getCompanyInfo();

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceData.id}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            direction: rtl;
            background: white;
            margin: 20mm;
          }
          
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .company-info {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }
          
          .invoice-title {
            font-size: 22px;
            font-weight: bold;
            color: #1e40af;
            margin: 20px 0;
            text-align: center;
            background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #2563eb;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .detail-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          
          .detail-title {
            font-weight: bold;
            font-size: 16px;
            color: #1e40af;
            margin-bottom: 15px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
          }
          
          .detail-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .detail-label {
            font-weight: 600;
            color: #475569;
            min-width: 100px;
          }
          
          .detail-value {
            color: #1e293b;
            font-weight: 500;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .items-table th {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            font-weight: bold;
            padding: 15px 12px;
            text-align: center;
          }
          
          .items-table td {
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          
          .items-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .totals-section {
            margin: 30px auto 0 auto;
            width: 100%;
            max-width: 400px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border: 2px solid #2563eb;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .final-total {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 15px;
            margin: 20px -25px -25px -25px;
            border-radius: 0 0 13px 13px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          
          .thank-you {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
          }
          
          @media print {
            body { margin: 0; background: white !important; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-name">${companyInfo.name}</div>
            <div class="company-info">
              <div>${companyInfo.address}</div>
              <div>هاتف: ${companyInfo.phone} | بريد إلكتروني: ${companyInfo.email}</div>
              ${companyInfo.taxNumber ? `<div>الرقم الضريبي: ${companyInfo.taxNumber}</div>` : ''}
              ${companyInfo.website ? `<div>الموقع الإلكتروني: ${companyInfo.website}</div>` : ''}
            </div>
          </div>
          
          <div class="invoice-title">
            فاتورة مبيعات رقم ${invoiceData.id}
          </div>
          
          <div class="invoice-details">
            <div class="detail-section">
              <div class="detail-title">معلومات الفاتورة</div>
              <div class="detail-item">
                <span class="detail-label">رقم الفاتورة:</span>
                <span class="detail-value">${invoiceData.id}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">تاريخ الإصدار:</span>
                <span class="detail-value">${format(new Date(invoiceData.date), "dd/MM/yyyy")}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">وقت الطباعة:</span>
                <span class="detail-value">${new Date().toLocaleTimeString('ar-EG')}</span>
              </div>
              ${invoiceData.paymentMethod ? `
                <div class="detail-item">
                  <span class="detail-label">طريقة الدفع:</span>
                  <span class="detail-value">${invoiceData.paymentMethod}</span>
                </div>
              ` : ''}
              ${invoiceData.status ? `
                <div class="detail-item">
                  <span class="detail-label">حالة الفاتورة:</span>
                  <span class="detail-value">${invoiceData.status}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="detail-section">
              <div class="detail-title">معلومات العميل</div>
              <div class="detail-item">
                <span class="detail-label">اسم العميل:</span>
                <span class="detail-value">${invoiceData.customerName}</span>
              </div>
              ${invoiceData.customerPhone ? `
                <div class="detail-item">
                  <span class="detail-label">رقم الهاتف:</span>
                  <span class="detail-value">${invoiceData.customerPhone}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${invoiceData.items && invoiceData.items.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th>اسم المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName || 'منتج'}</td>
                    <td>${item.quantity || 1}</td>
                    <td>${(item.price || 0).toLocaleString()} ج.م</td>
                    <td>${(item.total || 0).toLocaleString()} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          <div class="totals-section">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${(invoiceData.subtotal || invoiceData.total).toLocaleString()} ج.م</span>
            </div>
            
            ${invoiceData.discountAmount ? `
              <div class="total-row">
                <span>الخصم:</span>
                <span>-${invoiceData.discountAmount.toLocaleString()} ج.م</span>
              </div>
            ` : ''}
            
            ${invoiceData.taxAmount ? `
              <div class="total-row">
                <span>الضريبة:</span>
                <span>${invoiceData.taxAmount.toLocaleString()} ج.م</span>
              </div>
            ` : ''}
            
            <div class="final-total">
              المبلغ الإجمالي: ${invoiceData.total.toLocaleString()} ج.م
            </div>
          </div>
          
          ${invoiceData.notes ? `
            <div style="margin: 30px 0; background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 20px;">
              <div style="font-weight: bold; color: #92400e; margin-bottom: 10px;">ملاحظات:</div>
              <div style="color: #78350f;">${invoiceData.notes}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <div class="thank-you">شكراً لتعاملكم معنا</div>
            <div style="font-size: 12px; color: #64748b;">
              نتطلع لخدمتكم مرة أخرى
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleEditInvoice = (invoice: any) => {
    // Navigate to edit page with invoice data
    navigate(`/sales/invoices/new?edit=${invoice.id}`, { 
      state: { 
        editMode: true, 
        invoiceData: invoice 
      } 
    });
  };

  const handleDeleteAllInvoices = () => {
    console.log("Delete all invoices clicked");
    console.log("Current invoices count:", invoices.length);
    setIsDeletingAll(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      console.log("Moving invoices to deleted...");
      
      // Move current invoices to deleted invoices
      const currentDeletedInvoices = [...deletedInvoices, ...invoices];
      setDeletedInvoices(currentDeletedInvoices);
      localStorage.setItem('deleted_sales_invoices', JSON.stringify(currentDeletedInvoices));
      
      // Clear current invoices
      setInvoices([]);
      localStorage.removeItem('sales_invoices');
      console.log("Invoices moved to deleted, new length should be 0");
      
      toast({
        title: "تم حذف جميع الفواتير",
        description: "تم نقل جميع الفواتير إلى المحذوفات، يمكن استعادتها لاحقاً",
        variant: "default",
      });
      
      setIsDeletingAll(false);
    }, 1000);
  };

  const handleRestoreAllInvoices = () => {
    setIsRestoringAll(true);
    
    setTimeout(() => {
      // Move deleted invoices back to active invoices
      const restoredInvoices = [...invoices, ...deletedInvoices];
      setInvoices(restoredInvoices);
      localStorage.setItem('sales_invoices', JSON.stringify(restoredInvoices));
      
      // Clear deleted invoices
      setDeletedInvoices([]);
      localStorage.removeItem('deleted_sales_invoices');
      
      toast({
        title: "تم استعادة الفواتير",
        description: "تم استعادة جميع الفواتير المحذوفة بنجاح",
        variant: "default",
      });
      
      setIsRestoringAll(false);
      setShowDeletedInvoices(false);
    }, 1000);
  };

  const handleRestoreSingleInvoice = (invoiceToRestore: any) => {
    // Add invoice back to active invoices
    const updatedInvoices = [...invoices, invoiceToRestore];
    setInvoices(updatedInvoices);
    localStorage.setItem('sales_invoices', JSON.stringify(updatedInvoices));
    
    // Remove from deleted invoices
    const updatedDeletedInvoices = deletedInvoices.filter(inv => inv.id !== invoiceToRestore.id);
    setDeletedInvoices(updatedDeletedInvoices);
    localStorage.setItem('deleted_sales_invoices', JSON.stringify(updatedDeletedInvoices));
    
    toast({
      title: "تم استعادة الفاتورة",
      description: `تم استعادة الفاتورة ${invoiceToRestore.id} بنجاح`,
      variant: "default",
    });
  };

  const handleDeleteSingleInvoice = (invoiceToDelete: any) => {
    // Add invoice to deleted invoices
    const updatedDeletedInvoices = [...deletedInvoices, invoiceToDelete];
    setDeletedInvoices(updatedDeletedInvoices);
    localStorage.setItem('deleted_sales_invoices', JSON.stringify(updatedDeletedInvoices));
    
    // Remove from active invoices
    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceToDelete.id);
    setInvoices(updatedInvoices);
    localStorage.setItem('sales_invoices', JSON.stringify(updatedInvoices));
    
    toast({
      title: "تم حذف الفاتورة",
      description: `تم حذف الفاتورة ${invoiceToDelete.id} ونقلها إلى المحذوفات`,
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mada-heading text-foreground">فواتير البيع</h1>
        <div className="flex items-center gap-3">
          {deletedInvoices.length > 0 && (
            <Button 
              variant={showDeletedInvoices ? "default" : "outline"} 
              onClick={() => setShowDeletedInvoices(!showDeletedInvoices)}
            >
              <RotateCcw className="h-4 w-4 ml-2" />
              الفواتير المحذوفة ({deletedInvoices.length})
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
               <Button variant="destructive" disabled={isDeletingAll} className="font-cairo">
                {isDeletingAll ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 ml-2" />
                )}
                حذف جميع الفواتير
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من حذف جميع الفواتير؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم نقل جميع الفواتير إلى المحذوفات، ويمكن استعادتها لاحقاً.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllInvoices}>
                  حذف جميع الفواتير
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => navigate("/sales/invoices/new")} className="font-cairo">
            <Plus className="h-4 w-4 ml-2" />
            إنشاء فاتورة جديدة
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الفواتير المدفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الفواتير المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">
              {totalRevenue.toLocaleString()} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="font-cairo">
              {showDeletedInvoices ? "الفواتير المحذوفة" : "قائمة الفواتير"}
              {showDeletedInvoices && deletedInvoices.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isRestoringAll}
                      >
                        {isRestoringAll ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 ml-2" />
                        )}
                        استعادة الكل
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>استعادة جميع الفواتير المحذوفة؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم استعادة جميع الفواتير المحذوفة ({deletedInvoices.length} فاتورة) إلى قائمة الفواتير النشطة.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestoreAllInvoices}>
                          استعادة الكل
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الكل" className="font-tajawal">جميع الحالات</SelectItem>
                  <SelectItem value="مدفوعة" className="font-tajawal">مدفوعة</SelectItem>
                  <SelectItem value="معلقة" className="font-tajawal">معلقة</SelectItem>
                  <SelectItem value="ملغية" className="font-tajawal">ملغية</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-72">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن فاتورة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">رقم الفاتورة</TableHead>
                <TableHead className="font-tajawal">اسم العميل</TableHead>
                <TableHead className="font-tajawal">التاريخ</TableHead>
                <TableHead className="font-tajawal">عدد الأصناف</TableHead>
                <TableHead className="font-tajawal">المبلغ الإجمالي</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">طريقة الدفع</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-muted-foreground" />
                       {format(new Date(invoice.date), "dd/MM/yyyy")}
                     </div>
                   </TableCell>
                  <TableCell>{invoice.items}</TableCell>
                  <TableCell>{invoice.total.toLocaleString()} ج.م</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invoice.paymentMethod}
                    </Badge>
                  </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2">
                       {showDeletedInvoices ? (
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => handleRestoreSingleInvoice(invoice)}
                           title="استعادة الفاتورة"
                         >
                           <RotateCcw className="h-4 w-4" />
                         </Button>
                       ) : (
                         <>
                           <Dialog>
                             <DialogTrigger asChild>
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 onClick={() => handleViewInvoice(invoice)}
                                 disabled={loadingInvoiceId === invoice.id}
                               >
                                 {loadingInvoiceId === invoice.id ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                 ) : (
                                   <Eye className="h-4 w-4" />
                                 )}
                               </Button>
                             </DialogTrigger>
                             {selectedInvoice && (
                               <DialogContent className="max-w-2xl">
                                 <DialogHeader>
                                   <DialogTitle>تفاصيل الفاتورة {selectedInvoice.id}</DialogTitle>
                                 </DialogHeader>
                                 <div className="space-y-4">
                                   <div className="grid grid-cols-2 gap-4">
                                     <div>
                                       <Label className="text-sm font-medium text-muted-foreground">اسم العميل</Label>
                                       <p className="text-sm">{selectedInvoice.customerName}</p>
                                     </div>
                                      <div>
                                        <Label className="text-sm font-medium text-muted-foreground">التاريخ</Label>
                                        <p className="text-sm">{format(new Date(selectedInvoice.date), "dd/MM/yyyy")}</p>
                                      </div>
                                     <div>
                                       <Label className="text-sm font-medium text-muted-foreground">عدد الأصناف</Label>
                                       <p className="text-sm">{selectedInvoice.items}</p>
                                     </div>
                                     <div>
                                       <Label className="text-sm font-medium text-muted-foreground">المبلغ الإجمالي</Label>
                                       <p className="text-sm font-bold">{selectedInvoice.total.toLocaleString()} ج.م</p>
                                     </div>
                                     <div>
                                       <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                                       <Badge variant={getStatusVariant(selectedInvoice.status)} className="w-fit">
                                         {selectedInvoice.status}
                                       </Badge>
                                     </div>
                                     <div>
                                       <Label className="text-sm font-medium text-muted-foreground">طريقة الدفع</Label>
                                       <Badge variant="outline" className="w-fit">
                                         {selectedInvoice.paymentMethod}
                                       </Badge>
                                     </div>
                                   </div>
                                 </div>
                               </DialogContent>
                             )}
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                              title="تعديل الفاتورة"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={loadingInvoiceId === invoice.id}
                                    title="طباعة الفاتورة"
                                  >
                                    {loadingInvoiceId === invoice.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Printer className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>طباعة الفاتورة {invoice.id}</DialogTitle>
                                  </DialogHeader>
                                  <InvoicePrintTemplate
                                    invoiceData={{
                                      id: invoice.id,
                                      customerName: invoice.customerName,
                                      customerPhone: invoice.customerPhone,
                                      date: invoice.date,
                                      items: invoice.itemsDetails || [],
                                      total: invoice.total,
                                      subtotal: invoice.subtotal || invoice.total,
                                      taxAmount: invoice.taxAmount,
                                      discountAmount: invoice.discountAmount,
                                      notes: invoice.notes,
                                      paymentMethod: invoice.paymentMethod,
                                      status: invoice.status
                                    }}
                                    onPrint={(templateId) => {
                                      toast({
                                        title: "تم إرسال الطباعة",
                                        description: `تم طباعة الفاتورة ${invoice.id} باستخدام القالب المحدد`,
                                      });
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice)}
                                disabled={loadingInvoiceId === invoice.id}
                                title="تحميل HTML"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   title="حذف الفاتورة"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>حذف الفاتورة</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     هل أنت متأكد من حذف الفاتورة {invoice.id}؟ سيتم نقلها إلى المحذوفات ويمكن استعادتها لاحقاً.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDeleteSingleInvoice(invoice)}>
                                     حذف الفاتورة
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                         </>
                       )}
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}