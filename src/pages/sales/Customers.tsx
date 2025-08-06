import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, MapPin, Trash2, Undo2, Edit, Eye } from "lucide-react";
import { useCustomers } from "@/contexts/CustomerContext";
import { useToast } from "@/hooks/use-toast";
export default function Customers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { customers, deletedCustomers, deleteCustomer, deleteAllCustomers, restoreDeletedCustomers } = useCustomers();
  const { toast } = useToast();
  
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteAll = () => {
    deleteAllCustomers();
    toast({
      title: "تم حذف جميع العملاء",
      description: "تم حذف جميع العملاء المسجلين بنجاح",
    });
  };

  const handleRestoreCustomers = () => {
    restoreDeletedCustomers();
    toast({
      title: "تم استعادة العملاء",
      description: "تم استعادة جميع العملاء المحذوفين بنجاح",
    });
  };

  const handleDeleteCustomer = (id: number) => {
    deleteCustomer(id);
    toast({
      title: "تم حذف العميل",
      description: "تم حذف العميل بنجاح",
    });
  };

  const handleEditCustomer = (id: number) => {
    navigate(`/sales/customers/edit/${id}`);
  };

  const handleViewCustomer = (id: number) => {
    navigate(`/sales/customers/view/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mada-heading text-foreground">العملاء</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRestoreCustomers}
            disabled={deletedCustomers.length === 0}
            className="font-cairo"
          >
            <Undo2 className="h-4 w-4 ml-2" />
            استعادة العملاء المحذوفين
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAll}
            disabled={customers.length === 0}
            className="font-cairo"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف جميع العملاء
          </Button>
          <Button onClick={() => navigate("/sales/customers/new")} className="font-cairo">
            <Plus className="h-4 w-4 ml-2" />
            إضافة عميل جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">العملاء النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === "نشط").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">
              {customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-cairo">قائمة العملاء</CardTitle>
            <div className="relative w-72">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن عميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">اسم العميل</TableHead>
                <TableHead className="font-tajawal">البريد الإلكتروني</TableHead>
                <TableHead className="font-tajawal">رقم الهاتف</TableHead>
                <TableHead className="font-tajawal">العنوان</TableHead>
                <TableHead className="font-tajawal">عدد الطلبات</TableHead>
                <TableHead className="font-tajawal">إجمالي المشتريات</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {customer.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {customer.address}
                    </div>
                  </TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>{customer.totalSpent.toLocaleString()} ج.م</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === "نشط" ? "default" : "secondary"}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCustomer(customer.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
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
    </div>
  );
}