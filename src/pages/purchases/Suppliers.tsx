import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  MapPin,
  Building,
  Users,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  center: string;
  country: string;
  category: string;
  rating: number;
  totalPurchases: number;
  status: "active" | "inactive" | "pending";
  paymentTerms: string;
  notes?: string;
  joinDate: Date;
}

const mockSuppliers: Supplier[] = [];

const categories: string[] = [];
const countries = ["السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عمان", "جمهورية مصر العربية"];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deletedSuppliers, setDeletedSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('deleted_suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load suppliers from localStorage on component mount
  useEffect(() => {
    const savedSuppliers = localStorage.getItem('suppliers');
    if (savedSuppliers) {
      try {
        const parsedSuppliers = JSON.parse(savedSuppliers);
        // Ensure it's an array before setting
        if (Array.isArray(parsedSuppliers)) {
          setSuppliers(parsedSuppliers);
        } else {
          console.warn('Invalid suppliers data in localStorage, using empty array');
          setSuppliers([]);
          localStorage.removeItem('suppliers'); // Clean invalid data
        }
      } catch (error) {
        console.error('Error parsing saved suppliers:', error);
        setSuppliers([]);
        localStorage.removeItem('suppliers'); // Clean invalid data
      }
    } else {
      setSuppliers(mockSuppliers);
    }
  }, []);

  // Save suppliers to localStorage whenever suppliers state changes
  useEffect(() => {
    try {
      localStorage.setItem('suppliers', JSON.stringify(suppliers));
      console.log('Suppliers saved to localStorage:', suppliers);
    } catch (error) {
      console.error('Error saving suppliers to localStorage:', error);
    }
  }, [suppliers]);

  // Form state for new supplier
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    center: "",
    country: "السعودية",
    category: "",
    paymentTerms: "",
    notes: ""
  });

  // Form state for edit supplier
  const [editSupplier, setEditSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    center: "",
    country: "السعودية",
    category: "",
    paymentTerms: "",
    notes: ""
  });

  const filteredSuppliers = Array.isArray(suppliers) ? suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || supplier.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline"
    };
    
    const labels = {
      active: "نشط",
      inactive: "غير نشط",
      pending: "معلق"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return "⭐".repeat(Math.floor(rating)) + (rating % 1 ? "⭐" : "");
  };

  const handleAddSupplier = () => {
    const supplier: Supplier = {
      id: Date.now().toString(),
      name: newSupplier.name,
      contactPerson: newSupplier.contactPerson,
      email: newSupplier.email,
      phone: newSupplier.phone,
      address: newSupplier.address,
      city: newSupplier.city,
      center: newSupplier.center,
      country: newSupplier.country,
      category: newSupplier.category,
      rating: 0,
      totalPurchases: 0,
      status: "pending",
      paymentTerms: newSupplier.paymentTerms,
      notes: newSupplier.notes,
      joinDate: new Date()
    };

    const updatedSuppliers = [...suppliers, supplier];
    setSuppliers(updatedSuppliers);
    
    // Force save to localStorage
    try {
      localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
      console.log('Supplier saved successfully:', supplier);
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
    
    setIsAddDialogOpen(false);
    setNewSupplier({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      center: "",
      country: "السعودية",
      category: "",
      paymentTerms: "",
      notes: ""
    });
    
    toast({
      title: "تم إضافة المورد",
      description: "تم إضافة المورد بنجاح",
    });
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditSupplier({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      center: supplier.center,
      country: supplier.country,
      category: supplier.category,
      paymentTerms: supplier.paymentTerms,
      notes: supplier.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSupplier = () => {
    if (!selectedSupplier) return;

    const updatedSupplier: Supplier = {
      ...selectedSupplier,
      name: editSupplier.name,
      contactPerson: editSupplier.contactPerson,
      email: editSupplier.email,
      phone: editSupplier.phone,
      address: editSupplier.address,
      city: editSupplier.city,
      center: editSupplier.center,
      country: editSupplier.country,
      category: editSupplier.category,
      paymentTerms: editSupplier.paymentTerms,
      notes: editSupplier.notes
    };

    setSuppliers(suppliers.map(supplier => 
      supplier.id === selectedSupplier.id ? updatedSupplier : supplier
    ));
    setIsEditDialogOpen(false);
    setSelectedSupplier(null);
    
    toast({
      title: "تم تحديث المورد",
      description: "تم تحديث بيانات المورد بنجاح",
    });
  };

  const handleDeleteSupplier = (id: string) => {
    const supplierToDelete = suppliers.find(supplier => supplier.id === id);
    if (supplierToDelete) {
      const updatedDeletedSuppliers = [...deletedSuppliers, supplierToDelete];
      setDeletedSuppliers(updatedDeletedSuppliers);
      localStorage.setItem('deleted_suppliers', JSON.stringify(updatedDeletedSuppliers));
    }
    const updatedSuppliers = suppliers.filter(supplier => supplier.id !== id);
    setSuppliers(updatedSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
    toast({
      title: "تم حذف المورد",
      description: "تم حذف المورد بنجاح",
    });
  };

  const handleDeleteAllSuppliers = () => {
    const updatedDeletedSuppliers = [...deletedSuppliers, ...suppliers];
    setDeletedSuppliers(updatedDeletedSuppliers);
    localStorage.setItem('deleted_suppliers', JSON.stringify(updatedDeletedSuppliers));
    
    setSuppliers([]);
    localStorage.removeItem('suppliers');
    toast({
      title: "تم حذف جميع الموردين",
      description: "تم حذف جميع الموردين بنجاح",
    });
  };

  const handleRestoreSuppliers = () => {
    const updatedSuppliers = [...suppliers, ...deletedSuppliers];
    setSuppliers(updatedSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers));
    
    setDeletedSuppliers([]);
    localStorage.removeItem('deleted_suppliers');
    toast({
      title: "تم استعادة الموردين",
      description: "تم استعادة جميع الموردين المحذوفين",
    });
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const activeSuppliers = Array.isArray(suppliers) ? suppliers.filter(s => s.status === "active").length : 0;
  const totalPurchases = Array.isArray(suppliers) ? suppliers.reduce((sum, supplier) => sum + supplier.totalPurchases, 0) : 0;
  const averageRating = Array.isArray(suppliers) && suppliers.length > 0 ? suppliers.reduce((sum, supplier) => sum + supplier.rating, 0) / suppliers.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground font-tajawal">الموردين</h1>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-cairo">
                <Plus className="ml-2 h-4 w-4" />
                إضافة مورد جديد
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة مورد جديد</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الشركة</Label>
                <Input
                  id="name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  placeholder="اسم الشركة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPerson">الشخص المسؤول</Label>
                <Input
                  id="contactPerson"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                  placeholder="اسم الشخص المسؤول"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                  placeholder="+966501234567"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  placeholder="العنوان بالتفصيل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  value={newSupplier.city}
                  onChange={(e) => setNewSupplier({...newSupplier, city: e.target.value})}
                  placeholder="المدينة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="center">المركز</Label>
                <Input
                  id="center"
                  value={newSupplier.center}
                  onChange={(e) => setNewSupplier({...newSupplier, center: e.target.value})}
                  placeholder="المركز"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">الدولة</Label>
                <Select value={newSupplier.country} onValueChange={(value) => setNewSupplier({...newSupplier, country: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Input
                  id="category"
                  value={newSupplier.category}
                  onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})}
                  placeholder="أدخل التصنيف"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">شروط الدفع</Label>
                <Input
                  id="paymentTerms"
                  value={newSupplier.paymentTerms}
                  onChange={(e) => setNewSupplier({...newSupplier, paymentTerms: e.target.value})}
                  placeholder="30 يوم"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                  placeholder="أدخل أي ملاحظات إضافية"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleAddSupplier} className="w-full sm:w-auto">
                إضافة المورد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="destructive" 
          onClick={handleDeleteAllSuppliers}
          disabled={suppliers.length === 0}
          className="font-cairo"
        >
          <Trash2 className="ml-2 h-4 w-4" />
          حذف جميع الموردين
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleRestoreSuppliers}
          disabled={deletedSuppliers.length === 0}
          className="font-cairo"
        >
          استعادة الموردين
        </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي الموردين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{suppliers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الموردين النشطين</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">{activeSuppliers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المشتريات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalPurchases.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">متوسط التقييم</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{averageRating.toFixed(1)} ⭐</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الموردين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-tajawal">جميع التصنيفات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-tajawal">جميع الحالات</SelectItem>
                <SelectItem value="active" className="font-tajawal">نشط</SelectItem>
                <SelectItem value="inactive" className="font-tajawal">غير نشط</SelectItem>
                <SelectItem value="pending" className="font-tajawal">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">المورد</TableHead>
                <TableHead className="font-tajawal">الشخص المسؤول</TableHead>
                <TableHead className="font-tajawal">التصنيف</TableHead>
                <TableHead className="font-tajawal">المدينة</TableHead>
                <TableHead className="font-tajawal">إجمالي المشتريات</TableHead>
                <TableHead className="font-tajawal">التقييم</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {supplier.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground">{supplier.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{supplier.category}</Badge>
                  </TableCell>
                  <TableCell>{supplier.city}</TableCell>
                  <TableCell>{supplier.totalPurchases.toLocaleString()} ج.م</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{supplier.rating}</span>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSupplier(supplier)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المورد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم الشركة</Label>
              <Input
                id="edit-name"
                value={editSupplier.name}
                onChange={(e) => setEditSupplier({...editSupplier, name: e.target.value})}
                placeholder="اسم الشركة"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-contactPerson">الشخص المسؤول</Label>
              <Input
                id="edit-contactPerson"
                value={editSupplier.contactPerson}
                onChange={(e) => setEditSupplier({...editSupplier, contactPerson: e.target.value})}
                placeholder="اسم الشخص المسؤول"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">البريد الإلكتروني</Label>
              <Input
                id="edit-email"
                type="email"
                value={editSupplier.email}
                onChange={(e) => setEditSupplier({...editSupplier, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">رقم الهاتف</Label>
              <Input
                id="edit-phone"
                value={editSupplier.phone}
                onChange={(e) => setEditSupplier({...editSupplier, phone: e.target.value})}
                placeholder="+966501234567"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="edit-address">العنوان</Label>
              <Input
                id="edit-address"
                value={editSupplier.address}
                onChange={(e) => setEditSupplier({...editSupplier, address: e.target.value})}
                placeholder="العنوان بالتفصيل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-city">المدينة</Label>
              <Input
                id="edit-city"
                value={editSupplier.city}
                onChange={(e) => setEditSupplier({...editSupplier, city: e.target.value})}
                placeholder="المدينة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-center">المركز</Label>
              <Input
                id="edit-center"
                value={editSupplier.center}
                onChange={(e) => setEditSupplier({...editSupplier, center: e.target.value})}
                placeholder="المركز"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-country">الدولة</Label>
              <Select value={editSupplier.country} onValueChange={(value) => setEditSupplier({...editSupplier, country: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدولة" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">التصنيف</Label>
              <Input
                id="edit-category"
                value={editSupplier.category}
                onChange={(e) => setEditSupplier({...editSupplier, category: e.target.value})}
                placeholder="أدخل التصنيف"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-paymentTerms">شروط الدفع</Label>
              <Input
                id="edit-paymentTerms"
                value={editSupplier.paymentTerms}
                onChange={(e) => setEditSupplier({...editSupplier, paymentTerms: e.target.value})}
                placeholder="30 يوم"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <Textarea
                id="edit-notes"
                value={editSupplier.notes}
                onChange={(e) => setEditSupplier({...editSupplier, notes: e.target.value})}
                placeholder="أدخل أي ملاحظات إضافية"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateSupplier}>
              تحديث المورد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Supplier Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل المورد</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedSupplier.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedSupplier.name}</h3>
                  <p className="text-muted-foreground">{selectedSupplier.contactPerson}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedSupplier.status)}
                    <Badge variant="outline">{selectedSupplier.category}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedSupplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedSupplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.country}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">إجمالي المشتريات</Label>
                    <p className="text-lg font-semibold">{selectedSupplier.totalPurchases.toLocaleString()} ج.م</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">التقييم</Label>
                    <p className="text-lg font-semibold">{selectedSupplier.rating} ⭐</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">شروط الدفع</Label>
                    <p className="text-sm text-muted-foreground">{selectedSupplier.paymentTerms}</p>
                  </div>
                </div>
              </div>

              {selectedSupplier.notes && (
                <div>
                  <Label className="text-sm font-medium">ملاحظات</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedSupplier.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}