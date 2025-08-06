import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePerformanceOptimizations } from './utils/performanceOptimizer'
import { initializePerformanceAnalysis } from './utils/bundleAnalyzer'
import { initializePerformanceEnhancements } from './utils/performanceEnhancer'
import { initializeAdvancedOptimizations } from './utils/advancedOptimizer'
import { initializeImageOptimization } from './utils/imageOptimizer'
import './utils/errorMonitoring'

// تهيئة واحدة فقط لتجنب الرعشة
let isInitialized = false;

const initializeAppOptimizations = async () => {
  if (isInitialized) return;
  isInitialized = true;
  
  try {
    // تهيئة أساسية فقط للبدء السريع
    await initializePerformanceOptimizations();
    
    // تأخير بقية التحسينات حتى بعد التحميل الكامل
    requestIdleCallback(() => {
      Promise.all([
        initializePerformanceEnhancements(),
        initializeAdvancedOptimizations(),
        initializePerformanceAnalysis(),
        initializeImageOptimization()
      ]).catch(() => {
        // إخفاء الأخطاء لتجنب التشويش
      });
    });
  } catch (error) {
    // إخفاء الأخطاء لتجنب console spam
  }
};

// تهيئة واحدة فقط
initializeAppOptimizations();

// Register Service Worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // إزالة console.log لتجنب الرعشة
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, notify user
                if (confirm('يتوفر تحديث جديد للتطبيق. هل تريد تطبيقه الآن؟')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.error('SW registration failed: ', registrationError);
      });
  });
  
  // Listen for SW updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Online/Offline detection
window.addEventListener('online', () => {
  // إزالة console.log لتجنب الرعشة
  // Trigger background sync if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Background sync is available in modern browsers
      if ('sync' in (registration as any)) {
        return (registration as any).sync.register('data-sync');
      }
    }).catch(console.error);
  }
});

window.addEventListener('offline', () => {
  // إزالة console.log لتجنب الرعشة
});

// إزالة console.log لتجنب الرعشة

createRoot(document.getElementById("root")!).render(<App />);
