import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Edit3, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthDialog } from "./auth-dialog";

interface LogoManagerProps {
  currentLogo?: string;
  onLogoChange: (logo: string) => void;
}

export function LogoManager({ currentLogo, onLogoChange }: LogoManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogo || "");
  const [logoText, setLogoText] = useState("عمران");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = localStorage.getItem("admin_authenticated");
    setIsAuthenticated(authStatus === "true");
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
        onLogoChange(result);
        toast({
          title: "تم التحديث",
          description: "تم تحديث الشعار بنجاح",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (logoUrl) {
      onLogoChange(logoUrl);
      toast({
        title: "تم التحديث", 
        description: "تم تحديث الشعار بنجاح",
      });
      setIsOpen(false);
    }
  };

  const handleTextUpdate = () => {
    onLogoChange(`text:${logoText}`);
    toast({
      title: "تم التحديث",
      description: "تم تحديث نص الشعار بنجاح",
    });
    setIsOpen(false);
  };

  const resetToDefault = () => {
    setLogoUrl("");
    setLogoText("عمران");
    onLogoChange("text:عمران");
    toast({
      title: "تم الإعادة",
      description: "تم إعادة تعيين الشعار للافتراضي",
    });
    setIsOpen(false);
  };

  const handleLogoClick = () => {
    // Logo is now fixed and non-editable
    return;
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setIsOpen(true);
  };

  // Logo is now fixed and non-editable - return null to hide the edit button
  return null;
}