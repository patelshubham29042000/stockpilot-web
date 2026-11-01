import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errMsg } from '@core/api';
import { Auth, PERM } from '@core/auth';
import { Dialog } from '@core/dialog/dialog.service';
import { PageHeaderComponent } from '@shared/page-header/page-header.component';
import { CategoriesApi, ItemsApi } from '@modules/catalog/api';
import { Category, Item } from '@modules/catalog/models';
import { SalesApi } from '../../api';

interface CartLine { item: Item; qty: number; }
type View = 'categories' | 'items' | 'search';

const PAGE = 60;   // item tiles shown at a time

/**
 * Sale screen. Scan or search at the top, or pick a category first and then an item.
 * Only the chosen category (or the search results) is loaded, so it stays fast with thousands of items.
 */
@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, PageHeaderComponent],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements AfterViewInit, OnDestroy {
  private itemsApi = inject(ItemsApi);
  private categoriesApi = inject(CategoriesApi);
  private salesApi = inject(SalesApi);
  private dialog = inject(Dialog);
  auth = inject(Auth);
  readonly PERM = PERM;
  private timer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('scanBox', { static: true }) scanBox!: ElementRef<HTMLInputElement>;

  // what is on show
  categories = signal<Category[]>([]);
  loadingCategories = signal(true);
  view = signal<View>('categories');
  current = signal<Category | null>(null);     // the category that was tapped
  tiles = signal<Item[]>([]);                  // items of that category, or the search results
  loadingTiles = signal(false);
  searchTerm = signal('');
  shown = signal(PAGE);
  visible = computed(() => this.tiles().slice(0, this.shown()));
  code = '';                                   // what is scanned or typed in the box

  // the bill
  cart = signal<CartLine[]>([]);
  justAdded = signal<number | null>(null);
  busy = signal(false);
  total = computed(() => this.cart().reduce((sum, c) => sum + c.item.price * c.qty, 0));
  units = computed(() => this.cart().reduce((sum, c) => sum + c.qty, 0));

  constructor() { this.loadCategories(); }

  ngAfterViewInit() {
    // On a computer the scan box is ready for the scanner. On a phone we do not pop the keyboard open.
    if (window.matchMedia('(pointer: fine)').matches) this.focusBox();
  }

  ngOnDestroy() { clearTimeout(this.timer); clearTimeout(this.flashTimer); }

  // ---- browse: categories, then items ----

  private loadCategories() {
    this.categoriesApi.forSale().subscribe({
      next: r => { this.categories.set(r); this.loadingCategories.set(false); },
      error: e => { this.loadingCategories.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  openCategory(category: Category) {
    this.current.set(category);
    this.view.set('items');
    this.loadItems(category);
  }

  private loadItems(category: Category) {
    this.loadingTiles.set(true);
    this.itemsApi.list('', false, { categoryId: category.id, activeOnly: true }).subscribe({
      next: r => { this.tiles.set(r); this.shown.set(PAGE); this.loadingTiles.set(false); },
      error: e => { this.loadingTiles.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  backToCategories() {
    clearTimeout(this.timer);
    this.code = '';
    this.current.set(null);
    this.tiles.set([]);
    this.view.set('categories');
    this.focusBox();
  }

  showMore() { this.shown.update(n => n + PAGE); }

  // ---- scan or search ----

  /** Typing: from 2 characters on, show matching items after a short pause. An empty box goes back. */
  onType(text: string) {
    this.code = text;
    clearTimeout(this.timer);
    const term = text.trim();
    if (term.length === 0) { this.leaveSearch(); return; }
    if (term.length < 2) return;
    this.timer = setTimeout(() => this.searchFor(term, false), 250);
  }

  /** A scanner types the code and presses Enter. The Add button does the same. */
  scan() {
    const text = this.code.trim();
    if (!text) return;
    clearTimeout(this.timer);
    this.itemsApi.byCode(text).subscribe({
      next: item => { this.add(item); this.resetBox(); },
      // not a code: treat it as a name and show the matches (a red popup when there are none)
      error: (e: HttpErrorResponse) => e.status === 404 ? this.searchFor(text, true) : this.dialog.error(errMsg(e))
    });
  }

  private searchFor(term: string, announceEmpty: boolean) {
    this.view.set('search');
    this.searchTerm.set(term);
    this.loadingTiles.set(true);
    this.itemsApi.list(term, false, { activeOnly: true }).subscribe({
      next: r => {
        if (term !== this.code.trim()) return;   // the user typed more since: ignore this old answer
        this.tiles.set(r);
        this.shown.set(PAGE);
        this.loadingTiles.set(false);
        if (announceEmpty && r.length === 0) this.dialog.error(`No item found for "${term}".`).then(() => this.focusBox());
      },
      error: e => { this.loadingTiles.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** Leave the search results and return to where the user was. */
  private leaveSearch() {
    if (this.view() !== 'search') return;
    const category = this.current();
    if (category) { this.view.set('items'); this.loadItems(category); }
    else { this.view.set('categories'); this.tiles.set([]); }
  }

  clearSearch() { this.code = ''; this.leaveSearch(); this.focusBox(); }
  private resetBox() { this.code = ''; this.leaveSearch(); this.focusBox(); }
  private focusBox() { const el = this.scanBox?.nativeElement; el?.focus(); el?.select(); }

  // ---- the bill ----

  add(item: Item) {
    if (item.stock < 1) { this.dialog.error(`${item.name} is out of stock.`).then(() => this.focusBox()); return; }
    const lines = this.cart();
    const existing = lines.find(c => c.item.id === item.id);
    if (!existing) {
      this.cart.set([{ item, qty: 1 }, ...lines]);                       // the newest line stays on top
    } else if (existing.qty >= item.stock) {
      this.dialog.error(`Only ${item.stock} of ${item.name} in stock.`).then(() => this.focusBox());
      return;
    } else {
      this.cart.set(lines.map(c => c === existing ? { ...c, qty: c.qty + 1 } : c));
    }
    this.flash(item.id);
  }

  change(line: CartLine, delta: number) {
    const qty = line.qty + delta;
    this.cart.set(qty <= 0
      ? this.cart().filter(c => c !== line)
      : this.cart().map(c => c === line ? { ...c, qty: Math.min(qty, line.item.stock) } : c));
  }

  remove(line: CartLine) { this.cart.set(this.cart().filter(c => c !== line)); }

  async clearBill() {
    if (this.cart().length === 0) return;
    if (!(await this.dialog.confirm('Remove everything from this bill?'))) return;
    this.cart.set([]);
    this.focusBox();
  }

  private flash(id: number) {
    this.justAdded.set(id);
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.justAdded.set(null), 900);
  }

  pay() {
    if (this.cart().length === 0) return;
    this.busy.set(true);
    this.salesApi.checkout(this.cart().map(c => ({ itemId: c.item.id, qty: c.qty }))).subscribe({
      next: r => {
        this.busy.set(false);
        this.cart.set([]);
        this.dialog.success(`Sale ${r.number} saved. Total ₹${r.total}.`).then(() => this.focusBox());
        this.refresh();
      },
      error: e => { this.busy.set(false); this.dialog.error(errMsg(e)); this.refresh(); }
    });
  }

  /** Park the bill. No stock is taken out until it is completed in Find sales. */
  async hold() {
    if (this.cart().length === 0) return;
    if (!(await this.dialog.confirm('Put this bill on hold?\nNo stock is taken out until it is completed in Find sales.'))) return;
    this.busy.set(true);
    this.salesApi.checkout(this.cart().map(c => ({ itemId: c.item.id, qty: c.qty })), true).subscribe({
      next: r => {
        this.busy.set(false);
        this.cart.set([]);
        this.dialog.info(`Bill ${r.number} is on hold. Total ₹${r.total}.`).then(() => this.focusBox());
      },
      error: e => { this.busy.set(false); this.dialog.error(errMsg(e)); }
    });
  }

  /** Stock changed after a sale, so reload what is on show. */
  private refresh() {
    this.loadCategories();
    const category = this.current();
    if (this.view() === 'items' && category) this.loadItems(category);
    else if (this.view() === 'search') this.searchFor(this.searchTerm(), false);
  }
}
