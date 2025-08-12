import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocalAccounts } from "@/contexts/LocalAccountsContext";

export function LocalAccountSwitcher() {
  const { accounts, activeAccountId, activeAccount, createAccount, renameAccount, deleteAccount, switchAccount } = useLocalAccounts();
  const [openNew, setOpenNew] = useState(false);
  const [openRename, setOpenRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => (b.lastActiveAt.localeCompare(a.lastActiveAt)));
  }, [accounts]);

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error("أدخل اسم الشركة");
      return;
    }
    createAccount(newName.trim());
    setNewName("");
    setOpenNew(false);
  };

  const handleRename = () => {
    if (!activeAccount) return;
    if (!renameValue.trim()) {
      toast.error("أدخل اسمًا صحيحًا");
      return;
    }
    renameAccount(activeAccount.id, renameValue.trim());
    setOpenRename(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("سيتم حذف بيانات الشركة من هذا الجهاز فقط. هل أنت متأكد؟")) {
      deleteAccount(id);
    }
  };

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="max-w-[120px] truncate">{activeAccount?.name || "شركة افتراضية"}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>الشركات</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> شركة جديدة
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {sortedAccounts.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">لا توجد شركات</div>
          ) : (
            sortedAccounts.map(acc => (
              <div key={acc.id} className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <button className="text-sm text-foreground hover:underline" onClick={() => switchAccount(acc.id)}>
                    {acc.name}
                  </button>
                  <div className="flex items-center gap-1">
                    {acc.id === activeAccountId && (
                      <Badge variant="secondary" className="text-[10px]">نشط</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setRenameValue(acc.name); setOpenRename(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => handleDelete(acc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Account Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>شركة جديدة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="acc-name">اسم الشركة</Label>
            <Input id="acc-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: شركة الصفوة للتجارة" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenNew(false)}>إلغاء</Button>
              <Button onClick={handleCreate}>إنشاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={openRename} onOpenChange={setOpenRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل اسم الشركة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="acc-rename">الاسم الجديد</Label>
            <Input id="acc-rename" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenRename(false)}>إلغاء</Button>
              <Button onClick={handleRename}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
