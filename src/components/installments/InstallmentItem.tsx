import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Installment } from '@/utils/installmentsManager';

interface InstallmentItemProps {
  installment: Installment;
}

export const InstallmentItem = ({ installment }: InstallmentItemProps) => {
  const getStatusIcon = (status: Installment['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadgeVariant = (status: Installment['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Installment['status']) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'overdue': return 'متأخر';
      case 'cancelled': return 'ملغي';
    }
  };

  const getPaymentProgress = () => {
    return installment.totalAmount > 0 ? (installment.paidAmount / installment.totalAmount) * 100 : 0;
  };

  const isOverdue = () => {
    const dueDate = new Date(installment.dueDate);
    const today = new Date();
    return installment.status === 'active' && dueDate < today;
  };

  const progress = getPaymentProgress();
  const overdue = isOverdue();

  return (
    <div 
      className={`p-4 border rounded-lg ${overdue ? 'border-destructive/50 bg-destructive/5' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(installment.status)}
          <div>
            <div className="font-medium">قسط رقم {installment.installmentNumber}</div>
            <div className="text-sm text-muted-foreground">
              {installment.originalInvoiceNumber && `فاتورة: ${installment.originalInvoiceNumber} • `}
              تاريخ الاستحقاق: {new Date(installment.dueDate).toLocaleDateString('ar-SA')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="font-semibold">{installment.totalAmount.toLocaleString()} ر.س</div>
            <div className="text-sm text-muted-foreground">
              مدفوع: {installment.paidAmount.toLocaleString()} ر.س
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(installment.status)}>
            {getStatusText(installment.status)}
          </Badge>
        </div>
      </div>

      {/* شريط التقدم */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>نسبة السداد</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>مدفوع: {installment.paidAmount.toLocaleString()} ر.س</span>
          <span>متبقي: {installment.remainingAmount.toLocaleString()} ر.س</span>
        </div>
      </div>

      {/* تاريخ آخر دفعة */}
      {installment.paymentHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            آخر دفعة: {new Date(installment.paymentHistory[installment.paymentHistory.length - 1].date).toLocaleDateString('ar-SA')}
            - مبلغ: {installment.paymentHistory[installment.paymentHistory.length - 1].amount.toLocaleString()} ر.س
          </div>
        </div>
      )}

      {/* تحذير للأقساط المتأخرة */}
      {overdue && (
        <div className="mt-3 pt-3 border-t border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            هذا القسط متأخر عن موعد الاستحقاق
          </div>
        </div>
      )}
    </div>
  );
};