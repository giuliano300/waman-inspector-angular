const localHosts = new Set(['localhost', '127.0.0.1']);

export const API_ORIGIN = 'https://auth.waman.app';

export const API_BASE = localHosts.has(window.location.hostname)
  ? '/api'
  : `${API_ORIGIN}/api`;
