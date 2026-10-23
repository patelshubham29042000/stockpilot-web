import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { PERM } from '@core/auth';
import { Dialog } from '@core/dialog/dialog.service';
import { IconComponent } from '@shared/icon/icon.component';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { RolesApi } from '@modules/identity/api';
import { PERMISSION_TREE, PermissionInfo, PermissionParent, RoleInput } from '@modules/identity/models';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, IconComponent],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.css'
})
export class RoleFormComponent implements OnInit {
  private rolesApi = inject(RolesApi);
  private router = inject(Router);
  private dialog = inject(Dialog);

  /** Filled from the URL /roles/:id/edit. Empty on /roles/new. */
  @Input() id?: string;

  name = '';
  description = '';
  selected = signal<string[]>([]);
  available = signal<PermissionInfo[]>([]);
  system = signal(false);
  busy = signal(false);
  folded = signal<string[]>([]);     // parent menus the user folded

  readonly tree: PermissionParent[] = PERMISSION_TREE;

  /** On the built-in Admin role these stay ticked, so nobody can lock everyone out of user and role management. */
  private readonly lockedForAdmin: string[] = [PERM.usersManage, PERM.rolesManage];
  isLocked(key: string) { return this.system() && this.lockedForAdmin.includes(key); }
  private treeKeys = new Set(PERMISSION_TREE.flatMap(p => p.children.map(c => c.key)));

  /** Permissions the backend knows that the tree does not list yet, so nothing can be hidden by mistake. */
  others = computed(() => this.available().filter(p => !this.treeKeys.has(p.key)));
  totalCount = computed(() => this.treeKeys.size + this.others().length);

  ngOnInit() {
    this.rolesApi.permissions().subscribe({ next: p => this.available.set(p), error: () => this.available.set([]) });
    if (this.id) {
      this.rolesApi.get(+this.id).subscribe({
        next: r => { this.name = r.name; this.description = r.description ?? ''; this.selected.set(r.permissions); this.system.set(r.isSystem); },
        error: e => this.dialog.error(errMsg(e))
      });
    }
  }

  // ---- ticking ----
  has(key: string) { return this.selected().includes(key); }

  toggle(key: string, on: boolean) {
    this.selected.update(list => on ? [...new Set([...list, key])] : list.filter(k => k !== key));
  }

  countOn(parent: PermissionParent) { return parent.children.filter(c => this.has(c.key)).length; }
  allOn(parent: PermissionParent) { return this.countOn(parent) === parent.children.length; }
  someOn(parent: PermissionParent) { const n = this.countOn(parent); return n > 0 && n < parent.children.length; }

  /** Ticking a parent selects every page inside it; unticking clears them. */
  toggleParent(parent: PermissionParent, on: boolean) {
    const keys = parent.children.map(c => c.key);
    this.selected.update(list => on ? [...new Set([...list, ...keys])] : list.filter(k => !keys.includes(k) || this.isLocked(k)));
  }

  selectAll() { this.selected.set([...this.treeKeys, ...this.others().map(p => p.key)]); }
  clearAll() { this.selected.set(this.selected().filter(k => this.isLocked(k))); }

  // ---- folding ----
  isOpen(parent: PermissionParent) { return !this.folded().includes(parent.id); }
  fold(parent: PermissionParent) {
    this.folded.update(list => list.includes(parent.id) ? list.filter(i => i !== parent.id) : [...list, parent.id]);
  }

  save() {
    if (this.selected().length === 0) { this.dialog.error('Choose at least one permission.'); return; }
    const input: RoleInput = { name: this.name, description: this.description || null, permissions: this.selected() };
    const request = this.id ? this.rolesApi.update(+this.id, input) : this.rolesApi.create(input);
    this.busy.set(true);
    request.subscribe({
      next: () => { this.dialog.success('Role saved.'); this.router.navigate(['/roles']); },
      error: e => { this.dialog.error(errMsg(e)); this.busy.set(false); }
    });
  }
}
