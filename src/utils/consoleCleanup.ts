/**
 * أداة تنظيف console.log تلقائياً من الكود
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// قائمة استثناءات الملفات التي لا يجب تنظيفها
const EXCLUDE_FILES = [
  'consoleCleanup.ts',
  'performanceEnhancer.ts',
  'performanceOptimizer.ts',
  'bundleAnalyzer.ts'
];

// استبدالات console.log
const CONSOLE_REPLACEMENTS = [
  {
    pattern: /console\.log\([^)]*\);?\s*$/gm,
    replacement: '// Debug log removed'
  },
  {
    pattern: /console\.log\([^)]*\);\s*\n/g,
    replacement: ''
  },
  {
    pattern: /^\s*\/\/ Debug log removed\s*$/gm,
    replacement: ''
  },
  {
    pattern: /\n\s*\n\s*\n/g,
    replacement: '\n\n'
  }
];

// استبدالات localStorage
const LOCALSTORAGE_REPLACEMENTS = [
  {
    pattern: /localStorage\.getItem\(([^)]+)\)/g,
    replacement: 'storage.getItem($1, null)'
  },
  {
    pattern: /localStorage\.setItem\(([^,]+),\s*([^)]+)\)/g,
    replacement: 'storage.setItem($1, $2)'
  },
  {
    pattern: /localStorage\.removeItem\(([^)]+)\)/g,
    replacement: 'storage.removeItem($1)'
  },
  {
    pattern: /localStorage\.clear\(\)/g,
    replacement: 'storage.clear()'
  }
];

/**
 * تنظيف console.log من ملف واحد
 */
export function cleanupFileConsole(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // تطبيق استبدالات console
    for (const replacement of CONSOLE_REPLACEMENTS) {
      const originalContent = content;
      content = content.replace(replacement.pattern, replacement.replacement);
      if (content !== originalContent) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`تم تنظيف console.log من: ${filePath}`);
    }

    return hasChanges;
  } catch (error) {
    console.error(`خطأ في تنظيف الملف ${filePath}:`, error);
    return false;
  }
}

/**
 * استبدال localStorage بـ storage محسن
 */
export function replaceLocalStorage(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // إضافة import للـ storage إذا لم يكن موجوداً ووجد localStorage
    if (content.includes('localStorage') && !content.includes("import { storage }")) {
      const firstImport = content.indexOf('import');
      if (firstImport !== -1) {
        const newImport = "import { storage } from '@/utils/storage';\n";
        content = content.substring(0, firstImport) + newImport + content.substring(firstImport);
        hasChanges = true;
      }
    }

    // تطبيق استبدالات localStorage
    for (const replacement of LOCALSTORAGE_REPLACEMENTS) {
      const originalContent = content;
      content = content.replace(replacement.pattern, replacement.replacement);
      if (content !== originalContent) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`تم استبدال localStorage في: ${filePath}`);
    }

    return hasChanges;
  } catch (error) {
    console.error(`خطأ في استبدال localStorage في ${filePath}:`, error);
    return false;
  }
}

/**
 * تنظيف مجلد بشكل تكراري
 */
export function cleanupDirectory(dirPath: string): void {
  try {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // تكرار للمجلدات الفرعية
        cleanupDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        // تنظيف الملفات TypeScript/React
        if (!EXCLUDE_FILES.includes(item)) {
          cleanupFileConsole(fullPath);
          replaceLocalStorage(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`خطأ في تنظيف المجلد ${dirPath}:`, error);
  }
}

/**
 * تنظيف شامل للمشروع
 */
export function performFullCleanup(): void {
  console.log('بدء التنظيف الشامل للمشروع...');
  
  const srcPath = join(process.cwd(), 'src');
  cleanupDirectory(srcPath);
  
  console.log('تم إكمال التنظيف الشامل للمشروع');
}

// تشغيل التنظيف عند استيراد هذا الملف في بيئة التطوير
if (process.env.NODE_ENV === 'development' && process.argv.includes('--cleanup')) {
  performFullCleanup();
}