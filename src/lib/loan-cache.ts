let memoryApplicationsCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds fresh window

export function getCachedApplications(): any[] {
  if (memoryApplicationsCache && memoryApplicationsCache.length > 0) {
    return memoryApplicationsCache;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('openscore_admin_apps_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryApplicationsCache = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [];
}

export function setCachedApplications(apps: any[]) {
  if (!Array.isArray(apps)) return;
  memoryApplicationsCache = apps;
  lastFetchTime = Date.now();
  if (typeof window !== 'undefined') {
    try {
      // Store lightweight version without huge binary keys
      const lightweight = apps.map((app) => {
        const copy = { ...app };
        if (typeof copy.payment_screenshot === 'string' && copy.payment_screenshot.length > 2000) {
          copy.payment_screenshot = copy.payment_screenshot.substring(0, 100);
        }
        if (typeof copy.proof_screenshot === 'string' && copy.proof_screenshot.length > 2000) {
          copy.proof_screenshot = copy.proof_screenshot.substring(0, 100);
        }
        return copy;
      });
      localStorage.setItem('openscore_admin_apps_cache', JSON.stringify(lightweight));
    } catch (e) {}
  }
}

export function isCacheFresh(): boolean {
  return memoryApplicationsCache !== null && Date.now() - lastFetchTime < CACHE_TTL_MS;
}

export function invalidateApplicationsCache() {
  memoryApplicationsCache = null;
  lastFetchTime = 0;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('openscore_admin_apps_cache');
  }
}
