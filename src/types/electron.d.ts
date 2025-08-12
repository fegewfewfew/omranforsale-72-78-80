declare global {
  interface Window {
    electronAPI?: {
      getMachineId: () => Promise<string>;
      getDefaultBackupDir: () => Promise<string>;
      saveBackup: (
        backupId: string,
        json: string,
        dir?: string
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  }
}

export {};