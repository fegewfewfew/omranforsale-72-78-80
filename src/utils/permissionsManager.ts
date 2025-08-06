import { storage } from './storage';

export type Permission = 
  // Sales permissions
  | 'sales:view' | 'sales:create' | 'sales:edit' | 'sales:delete'
  | 'sales:invoices:view' | 'sales:invoices:create' | 'sales:invoices:edit' | 'sales:invoices:delete'
  | 'sales:customers:view' | 'sales:customers:create' | 'sales:customers:edit' | 'sales:customers:delete'
  | 'sales:reports:view'
  
  // Purchases permissions
  | 'purchases:view' | 'purchases:create' | 'purchases:edit' | 'purchases:delete'
  | 'purchases:invoices:view' | 'purchases:invoices:create' | 'purchases:invoices:edit' | 'purchases:invoices:delete'
  | 'purchases:suppliers:view' | 'purchases:suppliers:create' | 'purchases:suppliers:edit' | 'purchases:suppliers:delete'
  | 'purchases:reports:view'
  
  // Inventory permissions
  | 'inventory:view' | 'inventory:create' | 'inventory:edit' | 'inventory:delete'
  | 'inventory:products:view' | 'inventory:products:create' | 'inventory:products:edit' | 'inventory:products:delete'
  | 'inventory:stock:view' | 'inventory:stock:edit'
  | 'inventory:movements:view' | 'inventory:movements:create'
  | 'inventory:reports:view'
  
  // Financial permissions
  | 'finance:cashregister:view' | 'finance:cashregister:edit'
  | 'finance:expenses:view' | 'finance:expenses:create' | 'finance:expenses:edit' | 'finance:expenses:delete'
  | 'finance:checks:view' | 'finance:checks:create' | 'finance:checks:edit' | 'finance:checks:delete'
  | 'finance:installments:view' | 'finance:installments:create' | 'finance:installments:edit' | 'finance:installments:delete'
  | 'finance:returns:view' | 'finance:returns:create' | 'finance:returns:edit' | 'finance:returns:delete'
  | 'finance:reports:view'
  
  // HR permissions
  | 'hr:employees:view' | 'hr:employees:create' | 'hr:employees:edit' | 'hr:employees:delete'
  | 'hr:payroll:view' | 'hr:payroll:create' | 'hr:payroll:edit' | 'hr:payroll:delete'
  | 'hr:reports:view'
  
  // System permissions
  | 'system:users:view' | 'system:users:create' | 'system:users:edit' | 'system:users:delete'
  | 'system:settings:view' | 'system:settings:edit'
  | 'system:backup:view' | 'system:backup:create' | 'system:backup:restore'
  | 'system:reports:view' | 'system:reports:unified'
  
  // Admin permissions
  | 'admin:all';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  additionalPermissions?: Permission[];
  deniedPermissions?: Permission[];
}

export interface UserSession {
  userId: string;
  username: string;
  roleId: string;
  permissions: Permission[];
  loginTime: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  permission: Permission;
  timestamp: string;
  success: boolean;
  details?: any;
  ipAddress?: string;
}

export class PermissionsManager {
  private static instance: PermissionsManager;
  private currentSession: UserSession | null = null;

  static getInstance(): PermissionsManager {
    if (!PermissionsManager.instance) {
      PermissionsManager.instance = new PermissionsManager();
    }
    return PermissionsManager.instance;
  }

  constructor() {
    this.initializeDefaultRoles();
    this.loadCurrentSession();
  }

  // Initialize default roles
  private initializeDefaultRoles(): void {
    const existingRoles = this.getRoles();
    if (existingRoles.length === 0) {
      const defaultRoles: Role[] = [
        {
          id: 'admin',
          name: 'مدير النظام',
          description: 'صلاحيات كاملة لجميع أجزاء النظام',
          permissions: ['admin:all'],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sales_manager',
          name: 'مدير المبيعات',
          description: 'إدارة المبيعات والعملاء والتقارير',
          permissions: [
            'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
            'sales:invoices:view', 'sales:invoices:create', 'sales:invoices:edit', 'sales:invoices:delete',
            'sales:customers:view', 'sales:customers:create', 'sales:customers:edit', 'sales:customers:delete',
            'sales:reports:view',
            'inventory:view', 'inventory:products:view', 'inventory:stock:view',
            'finance:reports:view'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'purchases_manager',
          name: 'مدير المشتريات',
          description: 'إدارة المشتريات والموردين',
          permissions: [
            'purchases:view', 'purchases:create', 'purchases:edit', 'purchases:delete',
            'purchases:invoices:view', 'purchases:invoices:create', 'purchases:invoices:edit', 'purchases:invoices:delete',
            'purchases:suppliers:view', 'purchases:suppliers:create', 'purchases:suppliers:edit', 'purchases:suppliers:delete',
            'purchases:reports:view',
            'inventory:view', 'inventory:products:view', 'inventory:stock:view', 'inventory:stock:edit',
            'finance:reports:view'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'inventory_manager',
          name: 'مدير المخزون',
          description: 'إدارة المنتجات والمخزون',
          permissions: [
            'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
            'inventory:products:view', 'inventory:products:create', 'inventory:products:edit', 'inventory:products:delete',
            'inventory:stock:view', 'inventory:stock:edit',
            'inventory:movements:view', 'inventory:movements:create',
            'inventory:reports:view'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'cashier',
          name: 'أمين الصندوق',
          description: 'إدارة المبيعات والصندوق',
          permissions: [
            'sales:view', 'sales:create',
            'sales:invoices:view', 'sales:invoices:create',
            'sales:customers:view',
            'inventory:view', 'inventory:products:view', 'inventory:stock:view',
            'finance:cashregister:view', 'finance:cashregister:edit'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'hr_manager',
          name: 'مدير الموارد البشرية',
          description: 'إدارة الموظفين والرواتب',
          permissions: [
            'hr:employees:view', 'hr:employees:create', 'hr:employees:edit', 'hr:employees:delete',
            'hr:payroll:view', 'hr:payroll:create', 'hr:payroll:edit', 'hr:payroll:delete',
            'hr:reports:view'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'finance_manager',
          name: 'مدير الحسابات',
          description: 'إدارة الشؤون المالية والتقارير',
          permissions: [
            'finance:cashregister:view', 'finance:cashregister:edit',
            'finance:expenses:view', 'finance:expenses:create', 'finance:expenses:edit', 'finance:expenses:delete',
            'finance:checks:view', 'finance:checks:create', 'finance:checks:edit', 'finance:checks:delete',
            'finance:installments:view', 'finance:installments:create', 'finance:installments:edit', 'finance:installments:delete',
            'finance:returns:view', 'finance:returns:create', 'finance:returns:edit', 'finance:returns:delete',
            'finance:reports:view',
            'system:reports:view', 'system:reports:unified'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'viewer',
          name: 'مستخدم للعرض فقط',
          description: 'عرض البيانات فقط بدون إمكانية التعديل',
          permissions: [
            'sales:view', 'sales:invoices:view', 'sales:customers:view', 'sales:reports:view',
            'purchases:view', 'purchases:invoices:view', 'purchases:suppliers:view', 'purchases:reports:view',
            'inventory:view', 'inventory:products:view', 'inventory:stock:view', 'inventory:movements:view', 'inventory:reports:view',
            'finance:cashregister:view', 'finance:expenses:view', 'finance:checks:view', 'finance:installments:view', 'finance:returns:view', 'finance:reports:view',
            'hr:employees:view', 'hr:payroll:view', 'hr:reports:view',
            'system:reports:view'
          ],
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      storage.setItem('user_roles', defaultRoles);

      // Create default admin user
      const defaultAdmin: User = {
        id: 'admin_user',
        username: 'admin',
        email: 'admin@company.com',
        fullName: 'مدير النظام',
        roleId: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingUsers = storage.getItem('system_users', []);
      if (!existingUsers.find((u: User) => u.username === 'admin')) {
        existingUsers.push(defaultAdmin);
        storage.setItem('system_users', existingUsers);
      }
    }
  }

  // Load current session
  private loadCurrentSession(): void {
    const sessionData = storage.getItem('current_user_session', null);
    if (sessionData) {
      this.currentSession = sessionData;
    }
  }

  // Role management
  getRoles(): Role[] {
    return storage.getItem('user_roles', []);
  }

  getRole(roleId: string): Role | null {
    const roles = this.getRoles();
    return roles.find(r => r.id === roleId) || null;
  }

  createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const roles = this.getRoles();
      const newRole: Role = {
        ...roleData,
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      roles.push(newRole);
      storage.setItem('user_roles', roles);
      this.logAccess('create_role', 'roles', 'system:users:create', true, { roleId: newRole.id });
      return true;
    } catch (error) {
      console.error('Error creating role:', error);
      return false;
    }
  }

  updateRole(roleId: string, updates: Partial<Role>): boolean {
    try {
      const roles = this.getRoles();
      const roleIndex = roles.findIndex(r => r.id === roleId);
      
      if (roleIndex === -1) return false;

      // Don't allow updating system roles
      if (roles[roleIndex].isSystem) {
        console.warn('Cannot update system role');
        return false;
      }

      roles[roleIndex] = {
        ...roles[roleIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      storage.setItem('user_roles', roles);
      this.logAccess('update_role', 'roles', 'system:users:edit', true, { roleId });
      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      return false;
    }
  }

  deleteRole(roleId: string): boolean {
    try {
      const roles = this.getRoles();
      const role = roles.find(r => r.id === roleId);
      
      if (!role || role.isSystem) {
        console.warn('Cannot delete system role');
        return false;
      }

      // Check if any users are using this role
      const users = this.getUsers();
      const usersWithRole = users.filter(u => u.roleId === roleId);
      
      if (usersWithRole.length > 0) {
        console.warn('Cannot delete role: users are assigned to this role');
        return false;
      }

      const filteredRoles = roles.filter(r => r.id !== roleId);
      storage.setItem('user_roles', filteredRoles);
      this.logAccess('delete_role', 'roles', 'system:users:delete', true, { roleId });
      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }

  // User management
  getUsers(): User[] {
    return storage.getItem('system_users', []);
  }

  getUser(userId: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === userId) || null;
  }

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const users = this.getUsers();
      
      // Check if username already exists
      if (users.find(u => u.username === userData.username)) {
        console.warn('Username already exists');
        return false;
      }

      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(newUser);
      storage.setItem('system_users', users);
      this.logAccess('create_user', 'users', 'system:users:create', true, { userId: newUser.id });
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      return false;
    }
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) return false;

      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      storage.setItem('system_users', users);
      this.logAccess('update_user', 'users', 'system:users:edit', true, { userId });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  deleteUser(userId: string): boolean {
    try {
      const users = this.getUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      storage.setItem('system_users', filteredUsers);
      this.logAccess('delete_user', 'users', 'system:users:delete', true, { userId });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Session management
  login(username: string): UserSession | null {
    try {
      const user = this.getUserByUsername(username);
      if (!user || !user.isActive) return null;

      const role = this.getRole(user.roleId);
      if (!role) return null;

      const permissions = this.getUserPermissions(user);
      
      const session: UserSession = {
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
        permissions,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      this.currentSession = session;
      storage.setItem('current_user_session', session);

      // Update user last login
      this.updateUser(user.id, { lastLogin: new Date().toISOString() });
      
      this.logAccess('login', 'system', 'system:users:view', true, { username });
      return session;
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  }

  logout(): void {
    if (this.currentSession) {
      this.logAccess('logout', 'system', 'system:users:view', true, { username: this.currentSession.username });
    }
    
    this.currentSession = null;
    storage.removeItem('current_user_session');
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  getCurrentUser(): User | null {
    if (!this.currentSession) return null;
    return this.getUser(this.currentSession.userId);
  }

  updateLastActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date().toISOString();
      storage.setItem('current_user_session', this.currentSession);
    }
  }

  // Permission checking
  hasPermission(permission: Permission): boolean {
    if (!this.currentSession) return false;
    
    // Admin has all permissions
    if (this.currentSession.permissions.includes('admin:all')) return true;
    
    return this.currentSession.permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  checkPermission(permission: Permission, logAccess: boolean = true): boolean {
    const hasAccess = this.hasPermission(permission);
    
    if (logAccess) {
      this.logAccess('check_permission', 'system', permission, hasAccess);
    }
    
    return hasAccess;
  }

  // Get effective permissions for a user
  getUserPermissions(user: User): Permission[] {
    const role = this.getRole(user.roleId);
    if (!role) return [];

    let permissions = [...role.permissions];

    // Add additional permissions
    if (user.additionalPermissions) {
      permissions = [...permissions, ...user.additionalPermissions];
    }

    // Remove denied permissions
    if (user.deniedPermissions) {
      permissions = permissions.filter(p => !user.deniedPermissions!.includes(p));
    }

    // Remove duplicates
    return [...new Set(permissions)];
  }

  // Access logging
  logAccess(action: string, resource: string, permission: Permission, success: boolean, details?: any): void {
    try {
      const logs = storage.getItem('access_logs', []);
      const log: AccessLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.currentSession?.userId || 'system',
        username: this.currentSession?.username || 'system',
        action,
        resource,
        permission,
        timestamp: new Date().toISOString(),
        success,
        details
      };

      logs.push(log);

      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      storage.setItem('access_logs', logs);
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  getAccessLogs(limit: number = 100): AccessLog[] {
    const logs = storage.getItem('access_logs', []);
    return logs.slice(-limit).reverse();
  }

  getUserAccessLogs(userId: string, limit: number = 50): AccessLog[] {
    const logs = storage.getItem('access_logs', []);
    return logs
      .filter((log: AccessLog) => log.userId === userId)
      .slice(-limit)
      .reverse();
  }

  // Utility methods
  getAllPermissions(): Permission[] {
    return [
      // Sales permissions
      'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
      'sales:invoices:view', 'sales:invoices:create', 'sales:invoices:edit', 'sales:invoices:delete',
      'sales:customers:view', 'sales:customers:create', 'sales:customers:edit', 'sales:customers:delete',
      'sales:reports:view',
      
      // Purchases permissions
      'purchases:view', 'purchases:create', 'purchases:edit', 'purchases:delete',
      'purchases:invoices:view', 'purchases:invoices:create', 'purchases:invoices:edit', 'purchases:invoices:delete',
      'purchases:suppliers:view', 'purchases:suppliers:create', 'purchases:suppliers:edit', 'purchases:suppliers:delete',
      'purchases:reports:view',
      
      // Inventory permissions
      'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
      'inventory:products:view', 'inventory:products:create', 'inventory:products:edit', 'inventory:products:delete',
      'inventory:stock:view', 'inventory:stock:edit',
      'inventory:movements:view', 'inventory:movements:create',
      'inventory:reports:view',
      
      // Financial permissions
      'finance:cashregister:view', 'finance:cashregister:edit',
      'finance:expenses:view', 'finance:expenses:create', 'finance:expenses:edit', 'finance:expenses:delete',
      'finance:checks:view', 'finance:checks:create', 'finance:checks:edit', 'finance:checks:delete',
      'finance:installments:view', 'finance:installments:create', 'finance:installments:edit', 'finance:installments:delete',
      'finance:returns:view', 'finance:returns:create', 'finance:returns:edit', 'finance:returns:delete',
      'finance:reports:view',
      
      // HR permissions
      'hr:employees:view', 'hr:employees:create', 'hr:employees:edit', 'hr:employees:delete',
      'hr:payroll:view', 'hr:payroll:create', 'hr:payroll:edit', 'hr:payroll:delete',
      'hr:reports:view',
      
      // System permissions
      'system:users:view', 'system:users:create', 'system:users:edit', 'system:users:delete',
      'system:settings:view', 'system:settings:edit',
      'system:backup:view', 'system:backup:create', 'system:backup:restore',
      'system:reports:view', 'system:reports:unified',
      
      // Admin permissions
      'admin:all'
    ];
  }

  getPermissionsByCategory(): { [category: string]: Permission[] } {
    return {
      'المبيعات': [
        'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
        'sales:invoices:view', 'sales:invoices:create', 'sales:invoices:edit', 'sales:invoices:delete',
        'sales:customers:view', 'sales:customers:create', 'sales:customers:edit', 'sales:customers:delete',
        'sales:reports:view'
      ],
      'المشتريات': [
        'purchases:view', 'purchases:create', 'purchases:edit', 'purchases:delete',
        'purchases:invoices:view', 'purchases:invoices:create', 'purchases:invoices:edit', 'purchases:invoices:delete',
        'purchases:suppliers:view', 'purchases:suppliers:create', 'purchases:suppliers:edit', 'purchases:suppliers:delete',
        'purchases:reports:view'
      ],
      'المخزون': [
        'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
        'inventory:products:view', 'inventory:products:create', 'inventory:products:edit', 'inventory:products:delete',
        'inventory:stock:view', 'inventory:stock:edit',
        'inventory:movements:view', 'inventory:movements:create',
        'inventory:reports:view'
      ],
      'الشؤون المالية': [
        'finance:cashregister:view', 'finance:cashregister:edit',
        'finance:expenses:view', 'finance:expenses:create', 'finance:expenses:edit', 'finance:expenses:delete',
        'finance:checks:view', 'finance:checks:create', 'finance:checks:edit', 'finance:checks:delete',
        'finance:installments:view', 'finance:installments:create', 'finance:installments:edit', 'finance:installments:delete',
        'finance:returns:view', 'finance:returns:create', 'finance:returns:edit', 'finance:returns:delete',
        'finance:reports:view'
      ],
      'الموارد البشرية': [
        'hr:employees:view', 'hr:employees:create', 'hr:employees:edit', 'hr:employees:delete',
        'hr:payroll:view', 'hr:payroll:create', 'hr:payroll:edit', 'hr:payroll:delete',
        'hr:reports:view'
      ],
      'إدارة النظام': [
        'system:users:view', 'system:users:create', 'system:users:edit', 'system:users:delete',
        'system:settings:view', 'system:settings:edit',
        'system:backup:view', 'system:backup:create', 'system:backup:restore',
        'system:reports:view', 'system:reports:unified',
        'admin:all'
      ]
    };
  }
}

// Export singleton instance
export const permissionsManager = PermissionsManager.getInstance();
