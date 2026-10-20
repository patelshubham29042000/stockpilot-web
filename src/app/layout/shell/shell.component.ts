import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from '../../core/auth';
import { BRAND } from '../../core/branding';
import { Notify } from '../../core/notify/notify.service';
import { NAV_GROUPS, NAV_TOP } from '../../core/navigation';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  auth = inject(Auth);
  private router = inject(Router);
  private closeTimer?: ReturnType<typeof setTimeout>;
  readonly brand = BRAND;
  notify = inject(Notify);

  drawerOpen = signal(false);               // phone drawer
  openGroup = signal<string | null>(null);  // the parent menu whose sub menu is showing
  private url = signal(this.router.url);

  /** Menus the signed-in user may use. A parent with no allowed sub menu is hidden. */
  topLinks = computed(() => NAV_TOP.filter(l => this.auth.can(...l.permissions)));
  groups = computed(() =>
    NAV_GROUPS
      .map(g => ({ ...g, items: g.items.filter(i => this.auth.can(...i.permissions)) }))
      .filter(g => g.items.length > 0));
  /** The parent that contains the page we are on (highlighted). */
  activeGroup = computed(() => this.groups().find(g => g.items.some(i => !i.soon && this.isUnder(i.path)))?.id ?? null);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(e => {
        this.url.set(e.urlAfterRedirects);
        this.openGroup.set(this.hoverMode() ? null : this.activeGroup());
      });
    this.openGroup.set(this.hoverMode() ? null : this.activeGroup());
  }

  private isUnder(path: string): boolean {
    const current = this.url().split(/[?#]/)[0];
    return current === path || current.startsWith(path + '/');
  }

  /** A real mouse on a wide, tall screen: sub menus fly out on hover. Everywhere else they open in place. */
  private hoverMode(): boolean {
    return window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 861px) and (min-height: 600px)').matches;
  }

  onEnter(id: string) {
    if (!this.hoverMode()) return;
    clearTimeout(this.closeTimer);
    this.openGroup.set(id);
  }

  onLeave() {
    if (!this.hoverMode()) return;
    this.closeTimer = setTimeout(() => this.openGroup.set(null), 180);
  }

  toggle(id: string) {
    if (this.hoverMode()) this.openGroup.set(id);
    else this.openGroup.update(current => current === id ? null : id);
  }

  /** Called when any link is chosen. */
  go() {
    this.drawerOpen.set(false);
    if (this.hoverMode()) this.openGroup.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.drawerOpen.set(false);
    if (this.hoverMode()) this.openGroup.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.hoverMode() && !(event.target as HTMLElement).closest('.nav-group')) this.openGroup.set(null);
  }
}
