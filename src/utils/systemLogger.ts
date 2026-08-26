import { SystemAccessLog, LiveActiveUser } from '../types';

const LOGS_STORAGE_KEY = 'system_access_telemetry_logs';
const PROFILE_NAME_STORAGE_KEY = 'system_user_profile_name';
const LIVE_SESSIONS_STORAGE_KEY = 'system_active_presence_sessions';
const SESSION_ID_STORAGE_KEY = 'system_current_session_id';

/**
 * Detect client OS, Device type, and Laptop profile name from User Agent & Screen
 */
export function detectClientDeviceProfile(): {
  laptopProfile: string;
  os: string;
  deviceType: string;
  browser: string;
  screenResolution: string;
  platform: string;
  language: string;
  userAgent: string;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.platform || navigator.platform || '' : '';
  const language = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  // Screen info
  const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.screen.height : 1080;
  const screenResolution = `${screenWidth}x${screenHeight}`;

  // OS detection
  let os = 'Windows OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 11 / 10';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([0-9_]+)/);
    const ver = match ? match[1].replace(/_/g, '.') : '';
    os = ver ? `macOS ${ver}` : 'macOS';
  } else if (/Android/i.test(ua)) os = 'Android OS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (Apple)';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Browser detection
  let browser = 'Chrome';
  if (/Edg\//i.test(ua)) {
    const v = ua.match(/Edg\/([0-9.]+)/)?.[1]?.split('.')[0] || '';
    browser = `Microsoft Edge ${v}`.trim();
  } else if (/Chrome\/([0-9.]+)/i.test(ua) && !/Edg/i.test(ua)) {
    const v = ua.match(/Chrome\/([0-9.]+)/)?.[1]?.split('.')[0] || '';
    browser = `Chrome ${v}`.trim();
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    const v = ua.match(/Firefox\/([0-9.]+)/)?.[1]?.split('.')[0] || '';
    browser = `Firefox ${v}`.trim();
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    const v = ua.match(/Version\/([0-9.]+)/)?.[1]?.split('.')[0] || '';
    browser = `Safari ${v}`.trim();
  }

  // Device classification & Laptop profile naming
  let deviceType = 'Laptop / Desktop';
  if (/Tablet|iPad/i.test(ua) || (screenWidth >= 768 && screenWidth <= 1024 && 'ontouchstart' in window)) {
    deviceType = 'Tablet';
  } else if (/Mobi|Android|iPhone/i.test(ua) || screenWidth < 768) {
    deviceType = 'Mobile Device';
  }

  // Generate Laptop / Profile Name
  let laptopProfile = `${os} (${deviceType})`;
  if (/Macintosh/i.test(ua)) {
    laptopProfile = screenWidth >= 1600 ? 'MacBook Pro 16" / Desktop' : 'MacBook Pro / Air';
  } else if (/Windows/i.test(ua)) {
    if (screenWidth >= 1920) {
      laptopProfile = `Workstation Laptop (${os})`;
    } else {
      laptopProfile = `Standard PC (${os})`;
    }
  }

  return {
    laptopProfile,
    os,
    deviceType,
    browser,
    screenResolution,
    platform: String(platform),
    language,
    userAgent: ua,
  };
}

/**
 * Fetch Client IP and Geolocation details with safe fallbacks
 */
export async function fetchClientNetworkInfo(): Promise<{
  ip: string;
  location: string;
  isp: string;
}> {
  // Try fast public IP & geo provider 1 (ipwho.is)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const city = data.city || '';
        const region = data.region || '';
        const country = data.country || '';
        const locParts = [city, region, country].filter(Boolean);
        return {
          ip: data.ip || 'Unknown IP',
          location: locParts.join(', ') || 'Online Network',
          isp: data.connection?.isp || data.connection?.org || 'Internet Service Provider',
        };
      }
    }
  } catch (e) {
    // Failover silently
  }

  // Try provider 2 (ipapi.co)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const city = data.city || '';
      const region = data.region || '';
      const country = data.country_name || '';
      const locParts = [city, region, country].filter(Boolean);
      return {
        ip: data.ip || 'Unknown IP',
        location: locParts.join(', ') || 'Online Network',
        isp: data.org || 'Internet Gateway',
      };
    }
  } catch (e) {
    // Failover
  }

  // Fallback: client local network estimate
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Network';
  const tzCity = tz.split('/')[1]?.replace(/_/g, ' ') || tz;
  return {
    ip: 'Local Network Gateway',
    location: `${tzCity}`,
    isp: 'Local Intranet / Gateway',
  };
}

/**
 * Get Saved User Profile Name or fallback
 */
export function getSavedUserProfileName(): string {
  try {
    const saved = localStorage.getItem(PROFILE_NAME_STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    // ignore
  }
  return 'Admin (admin@local.com)';
}

export function setSavedUserProfileName(name: string): void {
  try {
    localStorage.setItem(PROFILE_NAME_STORAGE_KEY, name);
    // Refresh heartbeat immediately with new profile name
    pulseLiveHeartbeat();
  } catch (e) {
    // ignore
  }
}

/**
 * Load all stored access logs
 */
export function getStoredAccessLogs(): SystemAccessLog[] {
  try {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load system access logs', e);
  }

  return [];
}

/**
 * Save access logs array to localStorage
 */
export function saveStoredAccessLogs(logs: SystemAccessLog[]): void {
  try {
    // Keep max 500 records to prevent localStorage overflow
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save system access logs', e);
  }
}

/**
 * Record a new Access Log entry
 */
export async function recordSystemAccessLog(
  userProfile?: string,
  action: string = 'User Login'
): Promise<SystemAccessLog> {
  const profile = userProfile || getSavedUserProfileName();
  if (userProfile) {
    setSavedUserProfileName(userProfile);
  }

  const device = detectClientDeviceProfile();
  const netInfo = await fetchClientNetworkInfo();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const newLog: SystemAccessLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: now.toISOString(),
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`,
    userProfile: profile,
    laptopProfile: device.laptopProfile,
    browser: device.browser,
    ipAddress: netInfo.ip,
    location: netInfo.location,
    isp: netInfo.isp,
    action,
    deviceDetails: {
      screenResolution: device.screenResolution,
      os: device.os,
      deviceType: device.deviceType,
      platform: device.platform,
      language: device.language,
      userAgent: device.userAgent,
    },
  };

  const currentLogs = getStoredAccessLogs();
  const updatedLogs = [newLog, ...currentLogs];
  saveStoredAccessLogs(updatedLogs);

  // Dispatch custom window event so UI can reactively update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('system_access_log_updated', { detail: newLog }));
  }

  return newLog;
}

/**
 * Calculate Today, Month, and Year access statistics
 */
export function calculateAccessLogStats(logs: SystemAccessLog[]) {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = `${currentYearStr}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = `${currentMonthStr}-${String(now.getDate()).padStart(2, '0')}`;

  let todayCount = 0;
  let monthCount = 0;
  let yearCount = 0;

  const uniqueIPs = new Set<string>();
  const uniqueUsers = new Set<string>();

  for (const log of logs) {
    if (log.date === todayStr) {
      todayCount++;
    }
    if (log.date && log.date.startsWith(currentMonthStr)) {
      monthCount++;
    }
    if (log.date && log.date.startsWith(currentYearStr)) {
      yearCount++;
    }
    if (log.ipAddress) {
      uniqueIPs.add(log.ipAddress);
    }
    if (log.userProfile) {
      uniqueUsers.add(log.userProfile);
    }
  }

  return {
    todayCount,
    monthCount,
    yearCount,
    totalCount: logs.length,
    uniqueIPsCount: uniqueIPs.size,
    uniqueUsersCount: uniqueUsers.size,
    todayDate: todayStr,
    currentMonth: currentMonthStr,
    currentYear: currentYearStr,
  };
}

/**
 * Get or create unique Session ID for the current browser tab
 */
export function getOrCreateCurrentSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  try {
    let sid = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (!sid) {
      sid = `SES-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      sessionStorage.setItem(SESSION_ID_STORAGE_KEY, sid);
    }
    return sid;
  } catch (e) {
    return `SES-${Date.now()}-FALLBACK`;
  }
}

/**
 * Get cached network info to avoid spamming public IP APIs on every heartbeat
 */
let cachedNetInfo: { ip: string; location: string; isp: string } | null = null;
export async function getCachedClientNetworkInfo() {
  if (!cachedNetInfo) {
    cachedNetInfo = await fetchClientNetworkInfo();
  }
  return cachedNetInfo;
}

/**
 * Retrieve all currently active live sessions (filtering out sessions older than 12 seconds)
 */
export function getLiveActiveUsers(): LiveActiveUser[] {
  if (typeof window === 'undefined') return [];
  const currentSessionId = getOrCreateCurrentSessionId();
  const now = Date.now();
  const activeThreshold = 15000; // 15 seconds cutoff for active presence

  try {
    const raw = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
    let sessions: LiveActiveUser[] = raw ? JSON.parse(raw) : [];

    // Filter stale sessions
    const validSessions = sessions.filter((s) => now - s.lastHeartbeat <= activeThreshold);

    // Save cleaned list if stale sessions were pruned
    if (validSessions.length !== sessions.length) {
      localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(validSessions));
    }

    // Mark current device flag
    return validSessions.map((s) => ({
      ...s,
      isCurrentDevice: s.sessionId === currentSessionId,
    }));
  } catch (e) {
    console.warn('Failed to parse live active sessions', e);
    return [];
  }
}

/**
 * Publish heartbeat for the current browser session
 */
export async function pulseLiveHeartbeat(currentTabTitle: string = 'Dashboard'): Promise<LiveActiveUser[]> {
  if (typeof window === 'undefined') return [];
  const sessionId = getOrCreateCurrentSessionId();
  const device = detectClientDeviceProfile();
  const netInfo = await getCachedClientNetworkInfo();
  const userProfile = getSavedUserProfileName();

  const now = Date.now();
  const activeThreshold = 15000;

  try {
    const raw = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
    let sessions: LiveActiveUser[] = raw ? JSON.parse(raw) : [];

    // Filter stale sessions
    let filtered = sessions.filter((s) => now - s.lastHeartbeat <= activeThreshold && s.sessionId !== sessionId);

    // Find if session existed before to preserve onlineSince
    const existing = sessions.find((s) => s.sessionId === sessionId);
    const onlineSince = existing?.onlineSince || new Date().toISOString();

    const currentSession: LiveActiveUser = {
      sessionId,
      userProfile,
      laptopProfile: device.laptopProfile,
      ipAddress: netInfo.ip,
      location: netInfo.location,
      isp: netInfo.isp,
      browser: device.browser,
      screenResolution: device.screenResolution,
      os: device.os,
      deviceType: device.deviceType,
      currentTab: currentTabTitle,
      onlineSince,
      lastHeartbeat: now,
      isCurrentDevice: true,
    };

    const updatedSessions = [currentSession, ...filtered];
    localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));

    // Broadcast update
    notifyLiveUsersUpdated(updatedSessions);
    return updatedSessions;
  } catch (e) {
    console.warn('Error pulsing live heartbeat', e);
    return [];
  }
}

/**
 * Remove session immediately on unload or tab close
 */
export function removeCurrentLiveSession(): void {
  if (typeof window === 'undefined') return;
  const sessionId = getOrCreateCurrentSessionId();

  try {
    const raw = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
    if (!raw) return;
    const sessions: LiveActiveUser[] = JSON.parse(raw);
    const updated = sessions.filter((s) => s.sessionId !== sessionId);
    localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    notifyLiveUsersUpdated(updated);
  } catch (e) {
    // ignore
  }
}

/**
 * Helper to dispatch window events & BroadcastChannel for multi-tab live sync
 */
function notifyLiveUsersUpdated(users: LiveActiveUser[]) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('system_live_users_updated', { detail: users }));

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('system_presence_channel');
      channel.postMessage({ type: 'HEARTBEAT_UPDATE', users });
      channel.close();
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Subscribe to real-time live users changes
 */
export function subscribeToLiveUsers(callback: (users: LiveActiveUser[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getLiveActiveUsers());
  };

  window.addEventListener('system_live_users_updated', handleUpdate);
  window.addEventListener('storage', (e) => {
    if (e.key === LIVE_SESSIONS_STORAGE_KEY) {
      callback(getLiveActiveUsers());
    }
  });

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel('system_presence_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'HEARTBEAT_UPDATE') {
          callback(getLiveActiveUsers());
        }
      };
    } catch (e) {
      // ignore
    }
  }

  // Return initial
  callback(getLiveActiveUsers());

  return () => {
    window.removeEventListener('system_live_users_updated', handleUpdate);
    if (bc) {
      bc.close();
    }
  };
}
