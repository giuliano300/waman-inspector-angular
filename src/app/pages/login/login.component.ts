import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DeviceIdentityService } from '../../core/services/device-identity.service';

@Component({ selector: 'app-login', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './login.component.html', styleUrl: './login.component.scss' })
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  deviceId = '';
  error = '';
  busy = false;
  private deviceRefreshTimer?: ReturnType<typeof setInterval>;

  constructor(
    private auth: AuthService,
    private deviceIdentity: DeviceIdentityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshDeviceId();
    if (!this.deviceId) {
      let attempts = 0;
      this.deviceRefreshTimer = setInterval(() => {
        this.refreshDeviceId();
        attempts += 1;
        if (this.deviceId || attempts >= 20) this.stopDeviceRefresh();
      }, 250);
    }
  }

  ngOnDestroy(): void {
    this.stopDeviceRefresh();
  }

  async submit(): Promise<void> {
    this.busy = true;
    this.error = '';
    this.refreshDeviceId();
    const result = await this.auth.login(this.email, this.password, this.deviceId);
    this.busy = false;
    if (result === 'success') await this.router.navigateByUrl('/dashboard');
    else if (result === 'device-not-authorized') this.error = 'This application cannot be used on this device.';
    else this.error = 'Incorrect username or password!';
  }

  private refreshDeviceId(): void {
    this.deviceId = this.deviceIdentity.getDeviceId();
  }

  private stopDeviceRefresh(): void {
    if (this.deviceRefreshTimer) clearInterval(this.deviceRefreshTimer);
    this.deviceRefreshTimer = undefined;
  }
}
