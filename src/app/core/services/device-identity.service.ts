import { Injectable } from '@angular/core';

interface SureFoxBridge {
  getGUID?: () => unknown;
}

const DEVICE_ID_KEY = 'waman-inspector-device-id-v1';
const SAFE_DEVICE_ID = /^[A-Za-z0-9._:-]{1,450}$/;

declare global {
  interface Window {
    surefox?: SureFoxBridge;
    wamanDeviceId?: unknown;
  }
}

@Injectable({ providedIn: 'root' })
export class DeviceIdentityService {
  getDeviceId(): string {
    const provisionedDeviceId = this.readProvisioningUrl();
    if (provisionedDeviceId) {
      this.store(provisionedDeviceId);
      return provisionedDeviceId;
    }

    const injectedDeviceId = this.normalize(window.wamanDeviceId);
    if (injectedDeviceId) return injectedDeviceId;

    try {
      const sureFoxDeviceId = this.normalize(window.surefox?.getGUID?.());
      if (sureFoxDeviceId) return sureFoxDeviceId;
    } catch {
      // Continue with the locally provisioned fallback.
    }

    return this.readStored();
  }

  private normalize(value: unknown): string {
    if (value === null || value === undefined) return '';
    const deviceId = String(value).trim();
    return deviceId && deviceId !== 'null' && deviceId !== 'undefined' ? deviceId : '';
  }

  private readProvisioningUrl(): string {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('deviceId')) return '';

      const deviceId = this.normalize(url.searchParams.get('deviceId'));
      url.searchParams.delete('deviceId');
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
      return SAFE_DEVICE_ID.test(deviceId) ? deviceId : '';
    } catch {
      return '';
    }
  }

  private store(deviceId: string): void {
    try {
      window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch {
      // SureLock may disable DOM storage; the diagnostic remains unavailable in that case.
    }
  }

  private readStored(): string {
    try {
      const deviceId = this.normalize(window.localStorage.getItem(DEVICE_ID_KEY));
      return SAFE_DEVICE_ID.test(deviceId) ? deviceId : '';
    } catch {
      return '';
    }
  }
}
