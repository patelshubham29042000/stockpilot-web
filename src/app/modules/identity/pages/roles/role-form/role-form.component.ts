import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { Dialog } from '@core/dialog/dialog.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { PermissionInfo, RoleInput } from '@modules/identity/models';
import { NoticeComponent } from '@shared/notice/notice.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { RolesApi } from '@modules/identity/api';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, NoticeComponent],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.css'
})
export class RoleFormComponent implements OnInit {
  private dialog = inject(Dialog);
  private rolesApi = inject(RolesApi);
  private router = inject(Router);

  /** Filled from the URL /roles/:id/edit. Empty on /roles/new. */
  @Input() id?: string;

  name = '';
  description = '';
  selected = signal<string[]>([]);
  available = signal<PermissionInfo[]>([]);
  system = signal(false);
  error = signal('');
  busy = signal(false);

  groups = computed(() => {
    const map = new Map<string, PermissionInfo[]>();
    for (const p of this.available()) {
      if (!map.has(p.group)) map.set(p.group, []);
      map.get(p.group)!.push(p);
    }
    return Array.from(map, ([name, items]) => ({ name, items }));
  });

  ngOnInit() {
    this.rolesApi.permissions().subscribe(p => this.available.set(p));
    if (this.id) {
      this.rolesApi.get(+this.id).subscribe({
        next: r => { this.name = r.name; this.description = r.description ?? ''; this.selected.set(r.permissions); this.system.set(r.isSystem); },
        error: e => this.dialog.error(errMsg(e))
      });
    }
  }

  has(key: string) { return this.selected().includes(key); }
  toggle(key: string, checked: boolean) {
    this.selected.update(list => checked ? [...list, key] : list.filter(k => k !== key));
  }
  selectAll() { this.selected.set(this.available().map(p => p.key)); }
  clearAll() { this.selected.set([]); }

  save() {
    if (this.selected().length === 0) { this.dialog.error('Choose at least one permission.'); return; }
    const input: RoleInput = { name: this.name, description: this.description || null, permissions: this.selected() };
    const request = this.id ? this.rolesApi.update(+this.id, input) : this.rolesApi.create(input);
    this.busy.set(true);
    this.error.set('');
    request.subscribe({
      next: () => { this.dialog.success('Role saved.'); this.router.navigate(['/roles']); },
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); }
    });
  }
}
