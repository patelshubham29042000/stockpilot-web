import { Component, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth } from '@core/auth';
import { BRAND } from '@core/branding';
import { RegisterResponse } from '@core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private dialog = inject(Dialog);
  private auth = inject(Auth);
  readonly brand = BRAND;
  username = '';
  fullName = '';
  password = '';
  confirm = '';
  error = signal('');
  busy = signal(false);
  result = signal<RegisterResponse | null>(null);

  submit() {
    if (this.password !== this.confirm) { this.dialog.error('Passwords do not match.'); return; }
    this.busy.set(true);
    this.error.set('');
    this.auth.register(this.username, this.fullName, this.password).subscribe({
      next: r => { this.result.set(r); this.busy.set(false); },
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); }
    });
  }
}
