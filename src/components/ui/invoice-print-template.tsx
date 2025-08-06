/**
 * نظام قوالب طباعة الفواتير المتقدم
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, FileText, Download, Eye, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface PrintTemplate {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'thermal' | 'a4' | 'receipt';
  settings: {
    showLogo: boolean;
    showCompanyInfo: boolean;
    showCustomerInfo: boolean;
    showItemDetails: boolean;
    showPrices: boolean;
    showTotals: boolean;
    showNotes: boolean;
    showFooter: boolean;
    fontSize: number;
    paperSize: string;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
}

export interface InvoicePrintData {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: any[];
  total: number;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  paymentMethod?: string;
  status?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
  };
}

const defaultTemplates: PrintTemplate[] = [
  {
    id: 'standard',
    name: 'قالب قياسي',
    description: 'قالب طباعة قياسي مناسب لجميع الاستخدامات',
    type: 'standard',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: true,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      fontSize: 14,
      paperSize: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    }
  },
  {
    id: 'thermal',
    name: 'طابعة حرارية',
    description: 'قالب مخصص للطابعات الحرارية الصغيرة',
    type: 'thermal',
    settings: {
      showLogo: false,
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: false,
      showFooter: false,
      fontSize: 12,
      paperSize: '58mm',
      margins: { top: 5, bottom: 5, left: 5, right: 5 }
    }
  },
  {
    id: 'receipt',
    name: 'إيصال بسيط',
    description: 'إيصال بسيط للعمليات السريعة',
    type: 'receipt',
    settings: {
      showLogo: false,
      showCompanyInfo: false,
      showCustomerInfo: false,
      showItemDetails: false,
      showPrices: true,
      showTotals: true,
      showNotes: false,
      showFooter: false,
      fontSize: 12,
      paperSize: '80mm',
      margins: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  },
  {
    id: 'detailed',
    name: 'تفصيلي',
    description: 'قالب مفصل يعرض جميع المعلومات',
    type: 'a4',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: true,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      fontSize: 12,
      paperSize: 'A4',
      margins: { top: 30, bottom: 30, left: 25, right: 25 }
    }
  }
];

interface InvoicePrintTemplateProps {
  invoiceData: InvoicePrintData;
  onPrint?: (templateId: string) => void;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
    logo?: string;
  };
}

export function InvoicePrintTemplate({ 
  invoiceData, 
  onPrint,
  companyInfo
}: InvoicePrintTemplateProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('standard');
  const [customSettings, setCustomSettings] = React.useState<PrintTemplate['settings'] | null>(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = React.useState(false);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // تحديث البيانات عند تغيير إعدادات الشركة
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'company_settings') {
        forceUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // جلب بيانات الشركة من الإعدادات
  const getCompanyInfo = (): {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
    website?: string;
    description?: string;
    logo?: string;
  } => {
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
          description: companySettings.description || '',
          logo: companySettings.logo || undefined
        };
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
    
    // القيم الافتراضية في حالة عدم وجود إعدادات محفوظة
    return companyInfo || {
      name: 'شركة عمران للمبيعات',
      address: 'العنوان، المدينة، الدولة',
      phone: '+20123456789',
      email: 'info@omran.com',
      taxNumber: '123456789'
    };
  };

  const currentCompanyInfo = getCompanyInfo();

  const baseTemplate = defaultTemplates.find(t => t.id === selectedTemplate) || defaultTemplates[0];
  const currentTemplate = {
    ...baseTemplate,
    settings: customSettings || baseTemplate.settings
  };

  const generatePrintHTML = (template: PrintTemplate): string => {
    const { settings } = template;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceData.id}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: ${settings.fontSize}px;
            line-height: 1.6;
            color: #333;
            direction: rtl;
            background: white;
            margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
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
          
          .company-logo {
            max-width: 150px;
            max-height: 80px;
            margin-bottom: 15px;
          }
          
          .company-name {
            font-size: ${settings.fontSize + 6}px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .company-info {
            font-size: ${settings.fontSize - 2}px;
            color: #666;
            line-height: 1.4;
          }
          
          .invoice-title {
            font-size: ${settings.fontSize + 8}px;
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
            grid-template-columns: ${settings.showCustomerInfo ? '1fr 1fr' : '1fr'};
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
            font-size: ${settings.fontSize + 2}px;
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
            font-size: ${settings.fontSize}px;
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
          
          .items-table tr:hover {
            background-color: #f1f5f9;
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
          
          .total-label {
            font-weight: 600;
            color: #475569;
          }
          
          .total-value {
            font-weight: bold;
            color: #1e293b;
          }
          
          .final-total {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 15px;
            margin: 20px -25px -25px -25px;
            border-radius: 0 0 13px 13px;
            font-size: ${settings.fontSize + 4}px;
            font-weight: bold;
            text-align: center;
          }
          
          .notes-section {
            margin: 30px 0;
            background: #fffbeb;
            border: 2px solid #f59e0b;
            border-radius: 10px;
            padding: 20px;
          }
          
          .notes-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
            font-size: ${settings.fontSize + 2}px;
          }
          
          .notes-content {
            color: #78350f;
            line-height: 1.6;
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
            font-size: ${settings.fontSize + 4}px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
          }
          
          .footer-info {
            font-size: ${settings.fontSize - 2}px;
            color: #64748b;
            line-height: 1.4;
          }
          
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(37, 99, 235, 0.05);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
          
          @media print {
            body {
              margin: 0;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
            
            .invoice-container {
              box-shadow: none;
            }
            
            @page {
              size: ${settings.paperSize === 'A4' ? 'A4' : settings.paperSize};
              margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
            }
          }
          
          /* Thermal printer specific styles */
          ${template.type === 'thermal' ? `
            body { 
              width: 58mm; 
              font-size: 11px;
              margin: 2mm;
            }
            .invoice-details { 
              grid-template-columns: 1fr;
              gap: 10px;
            }
            .detail-section { 
              padding: 10px; 
              margin-bottom: 10px;
            }
            .items-table th, .items-table td { 
              padding: 6px 4px; 
              font-size: 10px;
            }
            .totals-section { 
              max-width: 100%; 
              padding: 15px;
            }
            .header { 
              margin-bottom: 15px; 
              padding-bottom: 10px;
            }
          ` : ''}
          
          /* Receipt printer specific styles */
          ${template.type === 'receipt' ? `
            body { 
              width: 80mm; 
              font-size: 12px;
              margin: 5mm;
            }
            .invoice-title { 
              font-size: 16px; 
              margin: 10px 0;
              padding: 10px;
            }
            .items-table th, .items-table td { 
              padding: 8px 6px;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="watermark">فاتورة</div>
        <div class="invoice-container">
          ${settings.showLogo && currentCompanyInfo.logo ? `
            <div class="header">
              <img src="${currentCompanyInfo.logo}" alt="شعار الشركة" class="company-logo" />
            </div>
          ` : ''}
          
          ${settings.showCompanyInfo ? `
            <div class="header">
              <div class="company-name">${currentCompanyInfo.name}</div>
              <div class="company-info">
                <div>${currentCompanyInfo.address}</div>
                <div>هاتف: ${currentCompanyInfo.phone} | بريد إلكتروني: ${currentCompanyInfo.email}</div>
                ${currentCompanyInfo.taxNumber ? `<div>الرقم الضريبي: ${currentCompanyInfo.taxNumber}</div>` : ''}
                ${currentCompanyInfo.website ? `<div>الموقع الإلكتروني: ${currentCompanyInfo.website}</div>` : ''}
              </div>
            </div>
          ` : ''}
          
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
                <span class="detail-value">${new Date(invoiceData.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">وقت الإصدار:</span>
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
            
            ${settings.showCustomerInfo ? `
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
            ` : ''}
          </div>
          
          ${settings.showItemDetails && invoiceData.items && invoiceData.items.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th>اسم المنتج</th>
                  <th>الكمية</th>
                  ${settings.showPrices ? '<th>السعر</th>' : ''}
                  ${settings.showPrices ? '<th>الإجمالي</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName || item.name || 'منتج'}</td>
                    <td>${item.quantity || 1}</td>
                    ${settings.showPrices ? `<td>${(item.price || 0).toLocaleString()} ج.م</td>` : ''}
                    ${settings.showPrices ? `<td>${(item.total || item.quantity * item.price || 0).toLocaleString()} ج.م</td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${settings.showTotals ? `
            <div class="totals-section">
              <div class="total-row">
                <span class="total-label">المجموع الفرعي:</span>
                <span class="total-value">${(invoiceData.subtotal || invoiceData.total).toLocaleString()} ج.م</span>
              </div>
              
              ${invoiceData.discountAmount ? `
                <div class="total-row">
                  <span class="total-label">الخصم:</span>
                  <span class="total-value">-${invoiceData.discountAmount.toLocaleString()} ج.م</span>
                </div>
              ` : ''}
              
              ${invoiceData.taxAmount ? `
                <div class="total-row">
                  <span class="total-label">الضريبة:</span>
                  <span class="total-value">${invoiceData.taxAmount.toLocaleString()} ج.م</span>
                </div>
              ` : ''}
              
              <div class="final-total">
                المبلغ الإجمالي: ${invoiceData.total.toLocaleString()} ج.م
              </div>
            </div>
          ` : ''}
          
          ${settings.showNotes && invoiceData.notes ? `
            <div class="notes-section">
              <div class="notes-title">ملاحظات:</div>
              <div class="notes-content">${invoiceData.notes}</div>
            </div>
          ` : ''}
          
          ${settings.showFooter ? `
            <div class="footer">
              <div class="thank-you">شكراً لتعاملكم معنا</div>
              <div class="footer-info">
                نتطلع لخدمتكم مرة أخرى<br>
                لأي استفسارات يرجى التواصل معنا على ${currentCompanyInfo.phone}
              </div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = (templateId: string) => {
    const printContent = generatePrintHTML(currentTemplate);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    
    if (onPrint) {
      onPrint(templateId);
    }
  };

  const handlePreview = (templateId: string) => {
    const printContent = generatePrintHTML(currentTemplate);
    
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(printContent);
      previewWindow.document.close();
    }
  };

  const handleDownload = (templateId: string) => {
    const printContent = generatePrintHTML(currentTemplate);
    
    const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `فاتورة-${invoiceData.id}-${currentTemplate.name}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          طباعة الفاتورة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="template-select">اختر قالب الطباعة</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="اختر قالب" />
              </SelectTrigger>
              <SelectContent>
                {defaultTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-sm text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => handlePrint(selectedTemplate)}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            طباعة فورية
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => handlePreview(selectedTemplate)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            معاينة
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => handleDownload(selectedTemplate)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تحميل HTML
          </Button>
          
           <Dialog open={isAdvancedSettingsOpen} onOpenChange={setIsAdvancedSettingsOpen}>
             <DialogTrigger asChild>
               <Button variant="outline" className="flex items-center gap-2">
                 <Settings className="h-4 w-4" />
                 إعدادات متقدمة
               </Button>
             </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إعدادات قالب الطباعة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">العناصر المرئية</h4>
                     {Object.entries({
                       showLogo: 'عرض الشعار',
                       showCompanyInfo: 'معلومات الشركة',
                       showCustomerInfo: 'معلومات العميل',
                       showItemDetails: 'تفاصيل الأصناف',
                       showPrices: 'عرض الأسعار',
                       showTotals: 'الإجماليات',
                       showNotes: 'الملاحظات',
                       showFooter: 'التذييل'
                     }).map(([key, label]) => (
                       <div key={key} className="flex items-center justify-between space-x-2 p-2 rounded border">
                         <Label htmlFor={key} className="font-medium">{label}</Label>
                         <Switch
                           id={key}
                           checked={currentTemplate.settings[key as keyof typeof currentTemplate.settings] as boolean}
                           onCheckedChange={(checked) => {
                             setCustomSettings(prev => ({
                               ...(prev || baseTemplate.settings),
                               [key]: checked
                             }));
                           }}
                         />
                       </div>
                     ))}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">إعدادات التنسيق</h4>
                     <div className="space-y-3">
                       <div>
                         <Label htmlFor="fontSize">حجم الخط</Label>
                         <Input
                           id="fontSize"
                           type="number"
                           min="8"
                           max="24"
                           value={currentTemplate.settings.fontSize}
                           onChange={(e) => {
                             setCustomSettings(prev => ({
                               ...(prev || baseTemplate.settings),
                               fontSize: parseInt(e.target.value) || 14
                             }));
                           }}
                           className="w-full"
                         />
                       </div>
                       
                       <div>
                         <Label htmlFor="paperSize">حجم الورق</Label>
                         <Select 
                           value={currentTemplate.settings.paperSize}
                           onValueChange={(value) => {
                             setCustomSettings(prev => ({
                               ...(prev || baseTemplate.settings),
                               paperSize: value
                             }));
                           }}
                         >
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="A4">A4 - ورق عادي</SelectItem>
                             <SelectItem value="58mm">58mm - طابعة حرارية صغيرة</SelectItem>
                             <SelectItem value="80mm">80mm - طابعة إيصالات</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <Label htmlFor="marginTop">الهامش العلوي (مم)</Label>
                           <Input
                             id="marginTop"
                             type="number"
                             min="0"
                             max="50"
                             value={currentTemplate.settings.margins.top}
                             onChange={(e) => {
                               setCustomSettings(prev => ({
                                 ...(prev || baseTemplate.settings),
                                 margins: {
                                   ...(prev?.margins || baseTemplate.settings.margins),
                                   top: parseInt(e.target.value) || 20
                                 }
                               }));
                             }}
                           />
                         </div>
                         <div>
                           <Label htmlFor="marginBottom">الهامش السفلي (مم)</Label>
                           <Input
                             id="marginBottom"
                             type="number"
                             min="0"
                             max="50"
                             value={currentTemplate.settings.margins.bottom}
                             onChange={(e) => {
                               setCustomSettings(prev => ({
                                 ...(prev || baseTemplate.settings),
                                 margins: {
                                   ...(prev?.margins || baseTemplate.settings.margins),
                                   bottom: parseInt(e.target.value) || 20
                                 }
                               }));
                             }}
                           />
                         </div>
                         <div>
                           <Label htmlFor="marginLeft">الهامش الأيسر (مم)</Label>
                           <Input
                             id="marginLeft"
                             type="number"
                             min="0"
                             max="50"
                             value={currentTemplate.settings.margins.left}
                             onChange={(e) => {
                               setCustomSettings(prev => ({
                                 ...(prev || baseTemplate.settings),
                                 margins: {
                                   ...(prev?.margins || baseTemplate.settings.margins),
                                   left: parseInt(e.target.value) || 20
                                 }
                               }));
                             }}
                           />
                         </div>
                         <div>
                           <Label htmlFor="marginRight">الهامش الأيمن (مم)</Label>
                           <Input
                             id="marginRight"
                             type="number"
                             min="0"
                             max="50"
                             value={currentTemplate.settings.margins.right}
                             onChange={(e) => {
                               setCustomSettings(prev => ({
                                 ...(prev || baseTemplate.settings),
                                 margins: {
                                   ...(prev?.margins || baseTemplate.settings.margins),
                                   right: parseInt(e.target.value) || 20
                                 }
                               }));
                             }}
                           />
                         </div>
                       </div>
                     </div>
                  </div>
                </div>
                 
                 <div className="flex justify-between pt-6 border-t">
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       onClick={() => {
                         setCustomSettings(null);
                         setSelectedTemplate('standard');
                       }}
                     >
                       إعادة تعيين
                     </Button>
                     <Button
                       variant="outline"
                       onClick={() => handlePreview(selectedTemplate)}
                     >
                       <Eye className="h-4 w-4 mr-2" />
                       معاينة التغييرات
                     </Button>
                   </div>
                   <Button
                     onClick={() => {
                       handlePrint(selectedTemplate);
                       setIsAdvancedSettingsOpen(false);
                     }}
                   >
                     <Printer className="h-4 w-4 mr-2" />
                     طباعة مع الإعدادات الجديدة
                   </Button>
                 </div>
               </div>
             </DialogContent>
           </Dialog>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>القالب المحدد:</strong> {currentTemplate.name}</p>
          <p><strong>النوع:</strong> {currentTemplate.type}</p>
          <p><strong>الوصف:</strong> {currentTemplate.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}