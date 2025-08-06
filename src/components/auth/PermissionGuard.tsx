import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionAction } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  module?: string;
  action?: PermissionAction;
  role?: string;
  fallback?: ReactNode;
  showAlert?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  module,
  action,
  role,
  fallback,
  showAlert = true
}: PermissionGuardProps) {
  const { hasPermission, canAccess, hasRole } = useAuth();

  // التحقق من الصلاحية
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (module && action) {
    hasAccess = canAccess(module, action);
  } else if (role) {
    hasAccess = hasRole(role);
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAlert) {
      return (
        <Alert variant="destructive" className="m-4">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى هذا المحتوى. يرجى التواصل مع مدير النظام.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// مكون للتحكم في العناصر بناءً على الصلاحيات
interface ConditionalRenderProps {
  children: ReactNode;
  permission?: string;
  module?: string;
  action?: PermissionAction;
  role?: string;
  inverse?: boolean; // عكس النتيجة
}

export function ConditionalRender({
  children,
  permission,
  module,
  action,
  role,
  inverse = false
}: ConditionalRenderProps) {
  const { hasPermission, canAccess, hasRole } = useAuth();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (module && action) {
    hasAccess = canAccess(module, action);
  } else if (role) {
    hasAccess = hasRole(role);
  }

  if (inverse) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : null;
}

// مكون للأزرار مع الصلاحيات
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  permission?: string;
  module?: string;
  action?: PermissionAction;
  role?: string;
  showTooltip?: boolean;
}

export function PermissionButton({
  children,
  permission,
  module,
  action,
  role,
  showTooltip = true,
  className,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, canAccess, hasRole } = useAuth();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (module && action) {
    hasAccess = canAccess(module, action);
  } else if (role) {
    hasAccess = hasRole(role);
  }

  if (!hasAccess) {
    return null; // إخفاء الزر تماماً إذا لم تكن هناك صلاحية
  }

  return (
    <button
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}