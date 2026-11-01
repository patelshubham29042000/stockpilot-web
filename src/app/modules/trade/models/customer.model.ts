export type CustomerType = 'Regular' | 'Member' | 'Wholesale' | 'Corporate';

export interface CustomerRow {
  id: number; code: string; name: string; mobile: string; email: string | null;
  dateOfBirth: string | null; customerType: CustomerType; gstNumber: string | null;
  addressLine1: string | null; addressLine2: string | null; city: string | null;
  district: string | null; state: string | null; country: string; pinCode: string | null;
  notes: string | null; isActive: boolean; createdAt: string;
}

export interface CustomerDto {
  name: string; mobile: string; email: string | null; dateOfBirth: string | null;
  customerType: CustomerType | null; gstNumber: string | null;
  addressLine1: string | null; addressLine2: string | null; city: string | null;
  district: string | null; state: string | null; country: string | null;
  pinCode: string | null; notes: string | null; isActive: boolean;
}

export interface CustomerFilter { search?: string; type?: CustomerType; active?: boolean; }

export const CUSTOMER_TYPES: CustomerType[] = ['Regular', 'Member', 'Wholesale', 'Corporate'];
