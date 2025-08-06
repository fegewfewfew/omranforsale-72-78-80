import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DefaultRoles, UserRole } from '@/types/auth';
import { Badge } from '@/components/ui/badge';

interface RoleSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  showDescription?: boolean;
  availableRoles?: UserRole[];
}

export function RoleSelector({
  value,
  onValueChange,
  disabled = false,
  label = "الدور الوظيفي",
  showDescription = false,
  availableRoles = DefaultRoles
}: RoleSelectorProps) {
  const selectedRole = availableRoles.find(role => role.id === value);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="role-selector">{label}</Label>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id="role-selector">
          <SelectValue placeholder="اختر الدور الوظيفي" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{role.nameAr}</span>
                <Badge variant="secondary" className="mr-2">
                  مستوى {role.level}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showDescription && selectedRole && (
        <p className="text-sm text-muted-foreground">
          {selectedRole.description}
        </p>
      )}
    </div>
  );
}

// مكون لعرض معلومات الدور
interface RoleInfoProps {
  role: UserRole;
  showPermissions?: boolean;
}

export function RoleInfo({ role, showPermissions = false }: RoleInfoProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{role.nameAr}</h3>
        <Badge variant={role.isSystem ? "default" : "secondary"}>
          {role.isSystem ? "نظام" : "مخصص"}
        </Badge>
        <Badge variant="outline">
          مستوى {role.level}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {role.description}
      </p>
      
      {showPermissions && (
        <div className="mt-3">
          <h4 className="text-sm font-medium mb-2">الصلاحيات:</h4>
          <div className="flex flex-wrap gap-1">
            {role.permissions.map((permission, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}