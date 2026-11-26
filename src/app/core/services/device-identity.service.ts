import { Injectable, signal } from '@angular/core';

const DEVICE_ID_KEY = 'waman-inspector-device-id';

@Injectable({ providedIn: 'root' })
export class DeviceIdentityService {
  private readonly deviceState = signal(this.captureDeviceId());
  readonly deviceId = this.deviceState.asReadonly();

  private captureDeviceId(): string {
    const url = new URL(window.location.href);
    const supplied = this.normalize(url.searchParams.get('deviceId'));
    if (supplied) {
      localStorage.setItem(DEVICE_ID_KEY, supplied);
      url.searchParams.delete('deviceId');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      return supplied;
    }
    return this.normalize(localStorage.getItem(DEVICE_ID_KEY));
  }

  private normalize(value: string | null): string {
    const normalized = value?.trim() ?? '';
    if (!normalized || normalized.length > 200 || /[\u0000-\u001f\u007f]/.test(normalized)) return '';
    return normalized;
  }
}
