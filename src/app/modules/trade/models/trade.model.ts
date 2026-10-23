export interface PoLine { itemId: number; item: string; qty: number; unitCost: number; }
export type PoStatus = 'Pending' | 'Completed' | 'Cancelled';
export interface PurchaseOrder {
  id: number; number: string; status: PoStatus; createdAt: string; supplier: string;
  itemCount: number; totalQty: number; total: number; lines: PoLine[];
}
export interface PoFilter { from?: string; to?: string; status?: string; search?: string; }
export interface PoDraftLine { itemId: number | null; qty: number; unitCost: number; }
export interface PoDraft { supplierId: number | null; lines: PoDraftLine[]; }
export interface SaleLineInput { itemId: number; qty: number; }
export interface SaleCreated { number: string; total: number; }
export interface SalesDay { date: string; total: number; }
export interface SalesSummary { todaySales: number; todayCount: number; last7: SalesDay[]; }
