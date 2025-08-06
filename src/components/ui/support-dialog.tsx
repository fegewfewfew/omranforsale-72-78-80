import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, FileText, ExternalLink } from "lucide-react";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const supportOptions = [
    {
      icon: Phone,
      title: "اتصال هاتفي",
      description: "تحدث مع فريق الدعم مباشرة 01090695336",
      action: () => window.open("tel:01090695336"),
      titleClass: "font-cairo",
      descriptionClass: "font-tajawal"
    },
    {
      icon: MessageCircle,
      title: "دعم فوري عبر واتساب",
      description: "احصل على مساعدة فورية",
      action: () => window.open("https://wa.me/01090695336"),
      titleClass: "font-cairo",
      descriptionClass: "font-tajawal"
    },
    {
      icon: Mail,
      title: "إرسال إيميل",
      description: "راسل فريق الدعم الفني xoxobnj@gmail.com",
      action: () => window.open("mailto:xoxobnj@gmail.com"),
      titleClass: "font-cairo",
      descriptionClass: "font-tajawal"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-center font-arabic-elegant text-xl">
            الدعم الفني
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-center text-muted-foreground mb-4 font-tajawal">
            اختر الطريقة المناسبة للحصول على كود التفعيل
          </p>
          
          <div className="grid gap-3">
            {supportOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex items-start gap-3 hover:bg-card-hover transition-colors"
                  onClick={option.action}
                >
                  <IconComponent className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-right flex-1">
                    <div className={`font-medium text-foreground ${option.titleClass}`}>{option.title}</div>
                    <div className={`text-sm text-muted-foreground mt-1 ${option.descriptionClass}`}>
                      {option.description}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}