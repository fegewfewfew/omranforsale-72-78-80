/**
 * Storage utilities for offline functionality
 * Ensures data persistence and reliability
 */

export class OfflineStorage {
  private static instance: OfflineStorage;
  private syncQueue: Array<{ key: string; data: any; timestamp: number }> = [];

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  /**
   * Enhanced localStorage with retry mechanism
   */
  setItem(key: string, data: any): boolean {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      });
      
      localStorage.setItem(key, serializedData);
      
      // Add to sync queue for backup
      this.addToSyncQueue(key, data);
      
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      return this.fallbackSave(key, data);
    }
  }

  /**
   * Enhanced localStorage retrieval
   */
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      
      // Handle old format (direct data)
      if (!parsed.timestamp) {
        return parsed as T;
      }
      
      // Handle new format (with metadata)
      return parsed.data as T;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return this.fallbackGet(key, defaultValue);
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      this.removeFromSyncQueue(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  clear(): boolean {
    try {
      localStorage.clear();
      this.syncQueue = [];
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all stored keys
   */
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get all items as object
   */
  getAllItems(): Record<string, any> {
    try {
      const allData: Record<string, any> = {};
      
      for (const key of this.getAllKeys()) {
        allData[key] = this.getItem(key);
      }
      
      return allData;
    } catch (error) {
      console.error('Error getting all items:', error);
      return {};
    }
  }

  /**
   * Export all data for backup
   */
  exportData(): string {
    try {
      const allData = this.getAllItems();
      
      return JSON.stringify({
        data: allData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  }

  /**
   * Import data from backup
   */
  importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      if (!imported.data) {
        throw new Error('Invalid backup format');
      }
      
      for (const [key, value] of Object.entries(imported.data)) {
        this.setItem(key, value);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Check storage health
   */
  checkStorageHealth(): { isHealthy: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Test basic functionality
      const testKey = '__test_storage__';
      const testData = { test: true, timestamp: Date.now() };
      
      this.setItem(testKey, testData);
      const retrieved = this.getItem<{ test: boolean; timestamp: number }>(testKey);
      
      if (!retrieved || retrieved.test !== testData.test) {
        errors.push('Storage read/write test failed');
      }
      
      this.removeItem(testKey);
      
      // Check storage space
      const usage = this.getStorageUsage();
      if (usage.usedPercentage > 90) {
        errors.push('Storage is nearly full (> 90%)');
      }
      
    } catch (error) {
      errors.push(`Storage health check failed: ${error.message}`);
    }
    
    return {
      isHealthy: errors.length === 0,
      errors
    };
  }

  /**
   * Get storage usage information
   */
  getStorageUsage(): { used: number; total: number; usedPercentage: number } {
    try {
      let used = 0;
      for (const key of this.getAllKeys()) {
        used += localStorage.getItem(key)?.length || 0;
      }
      
      // Estimate total available (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      
      return {
        used,
        total,
        usedPercentage: (used / total) * 100
      };
    } catch (error) {
      return { used: 0, total: 0, usedPercentage: 0 };
    }
  }

  /**
   * Fallback save using sessionStorage
   */
  private fallbackSave(key: string, data: any): boolean {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
      console.warn(`Saved to sessionStorage as fallback: ${key}`);
      return true;
    } catch (error) {
      console.error(`Fallback save failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Fallback get using sessionStorage
   */
  private fallbackGet<T>(key: string, defaultValue: T | null): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Fallback get failed for ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Add to sync queue for later synchronization
   */
  private addToSyncQueue(key: string, data: any): void {
    const existingIndex = this.syncQueue.findIndex(item => item.key === key);
    const queueItem = { key, data, timestamp: Date.now() };
    
    if (existingIndex !== -1) {
      this.syncQueue[existingIndex] = queueItem;
    } else {
      this.syncQueue.push(queueItem);
    }
    
    // Keep only last 100 items
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-100);
    }
  }

  /**
   * Remove from sync queue
   */
  private removeFromSyncQueue(key: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.key !== key);
  }
}

// Create singleton instance
export const storage = OfflineStorage.getInstance();

// Helper functions for common operations
export const saveData = (key: string, data: any): boolean => storage.setItem(key, data);
export const loadData = <T>(key: string, defaultValue: T | null = null): T | null => storage.getItem(key, defaultValue);
export const removeData = (key: string): boolean => storage.removeItem(key);
export const clearAllData = (): boolean => storage.clear();

// Data validation helpers
export const validateData = (data: any): boolean => {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
};

// Auto-backup functionality محسن
export const createAutoBackup = (): void => {
  const backupData = storage.exportData();
  if (backupData) {
    storage.setItem('__auto_backup__', {
      data: backupData,
      created: new Date().toISOString()
    });
  }
};

// تحسين Auto-backup للأداء
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', createAutoBackup);
  
  // إنشاء backup كل 15 دقيقة بدلاً من 5 (لتحسين الأداء)
  // وفقط إذا كان هناك تغييرات
  let lastBackupHash = '';
  setInterval(() => {
    const currentData = storage.exportData();
    const currentHash = btoa(currentData).slice(0, 100); // hash مختصر
    
    if (currentHash !== lastBackupHash) {
      createAutoBackup();
      lastBackupHash = currentHash;
    }
  }, 15 * 60 * 1000); // كل 15 دقيقة
}
