import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({ selector: 'app-login', standalone: true, imports: [FormsModule, RouterLink], templateUrl: './login.component.html', styleUrl: './login.component.scss' })
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  busy = false;

  constructor(private auth: AuthService, private router: Router) {}

  async submit(): Promise<void> {
    this.busy = true;
    this.error = '';
    const success = await this.auth.login(this.email, this.password);
    this.busy = false;
    if (success) await this.router.navigateByUrl('/dashboard');
    else {
      const reason = this.auth.loginError();
      this.error = reason === 'device'
        ? 'Access is allowed only from the tablet assigned to this inspector.'
        : reason === 'network' ? 'Unable to contact Waman. Check the connection and try again.' : 'Incorrect username or password!';
    }
  }
}
