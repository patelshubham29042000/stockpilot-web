export interface Category { id: number; name: string; itemCount: number; }
export interface Supplier { id: number; name: string; phone: string | null; email: string | null; }
export interface Item {
  id: number; sku: string; name: string; categoryId: number | null; category: string | null; supplierId: number | null;
  price: number; cost: number; stock: number; reorderLevel: number; isActive: boolean;
}
export interface ItemInput {
  sku: string; name: string; categoryId: number | null; supplierId: number | null;
  price: number; cost: number; reorderLevel: number; stock: number;
}
export interface SupplierInput { name: string; phone: string | null; email: string | null; }
export interface LowStockRow { id: number; sku: string; name: string; stock: number; reorderLevel: number; }
export interface StockSummary { items: number; lowStock: number; stockValue: number; low: LowStockRow[]; }
