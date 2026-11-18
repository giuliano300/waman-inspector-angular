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
    else this.error = 'Incorrect username or password!';
  }
}
