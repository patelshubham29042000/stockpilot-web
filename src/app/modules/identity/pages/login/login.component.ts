import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth } from '@core/auth';
import { BRAND } from '@core/branding';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private dialog = inject(Dialog);
  private auth = inject(Auth);
  private router = inject(Router);
  readonly brand = BRAND;
  username = '';
  password = '';
  error = signal('');
  busy = signal(false);

  submit() {
    this.busy.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homePath()),
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); }
    });
  }
}
