export interface AuditLog { id: number; entity: string; action: string; userName: string; details: string; at: string; }
export type AuditSource = 'identity' | 'catalog' | 'trade';
export type AuditRow = AuditLog & { source: AuditSource };

/** from and to are full date-times (ISO). Empty means "no limit". */
export interface AuditFilter { userName?: string; from?: string; to?: string; }
