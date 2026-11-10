import apiClient from '@/lib/axios';

export interface BeverageOptions {
  categories: string[];
  activeShift: { id: string } | null;
}

export interface BeverageProduct {
  id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  volumeMl: number | null;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  status: 'ACTIVE' | 'INACTIVE';
  description: string | null;
  stockQuantity?: number;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface BeverageProductList {
  data: BeverageProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface BeverageStock {
  productId: string;
  productCode: string;
  productName: string;
  category: string | null;
  unit: string;
  minStock: number;
  stockQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface BeverageImportItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  batchNumber: string | null;
  expiryDate: string | null;
}

export interface BeverageImport {
  id: string;
  importId?: string;
  importCode?: string;
  code: string;
  supplierName: string | null;
  supplierPhone: string | null;
  importDate: string;
  status: string;
  subtotal: number;
  calculatedImportCost?: number;
  totalImportedQuantity?: number;
  productLineCount?: number;
  createdByName?: string | null;
  receivedByName?: string | null;
  receivedAt?: string | null;
  items: BeverageImportItem[];
}

export interface BeverageImportListItem {
  importId: string;
  importCode: string;
  supplierName: string | null;
  importDate: string;
  status: string;
  productLineCount: number;
  totalImportedQuantity: number;
  calculatedImportCost: number;
  createdByName: string | null;
  receivedByName: string | null;
}

export interface BeverageSale {
  id: string;
  code: string;
  saleCode?: string;
  saleId?: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  memberPhone?: string;
  staffName: string;
  shiftTitle?: string | null;
  saleDate: string;
  status: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  totalSoldQuantity?: number;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    lineTotal: number;
  }[];
}

export interface BeverageSaleSummary {
  saleId: string;
  saleCode: string;
  memberId: string;
  memberCode: string;
  memberName: string;
  staffId: string;
  staffName: string | null;
  staffShiftId: string | null;
  saleDate: string;
  status: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  recognizedRevenue: number;
  totalSoldQuantity: number;
  productLineCount: number;
}

export interface BeverageReport {
  summary: {
    salesRevenue: number;
    importCost: number;
    grossProfit: number;
    soldQuantity: number;
    importedQuantity: number;
    saleCount: number;
    importCount: number;
  };
  revenue: { label: string; revenue: number }[];
  topProducts: {
    productId: string;
    productCode: string;
    productName: string;
    soldQuantity: number;
    salesRevenue: number;
    grossProfit: number;
  }[];
  slowProducts: {
    productId: string;
    productCode: string;
    productName: string;
    soldQuantity: number;
    salesRevenue: number;
  }[];
  byStaff: { id: string; label: string; revenue: number; saleCount: number }[];
  byShift: { id: string | null; label: string; revenue: number; saleCount: number }[];
}

export interface BeverageFilters {
  productId?: string;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  includeInactive?: boolean;
}

export const beverageApi = {
  options: async (): Promise<BeverageOptions> => {
    const res = await apiClient.get<BeverageOptions>('/beverages/options');
    return res.data;
  },

  dashboard: async (params: BeverageFilters = {}) => {
    const res = await apiClient.get('/beverages/dashboard', { params });
    return res.data;
  },

  products: async (params: BeverageFilters = {}): Promise<BeverageProductList> => {
    const res = await apiClient.get<BeverageProductList>('/beverages/products', { params });
    return res.data;
  },

  product: async (id: string): Promise<BeverageProduct> => {
    const res = await apiClient.get<BeverageProduct>(`/beverages/products/${id}`);
    return res.data;
  },

  createProduct: async (payload: Record<string, unknown>): Promise<BeverageProduct> => {
    const res = await apiClient.post<BeverageProduct>('/beverages/products', payload);
    return res.data;
  },

  updateProduct: async (id: string, payload: Record<string, unknown>) => {
    const res = await apiClient.patch<BeverageProduct>(`/beverages/products/${id}`, payload);
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await apiClient.delete(`/beverages/products/${id}`);
    return res.data;
  },

  searchMembers: async (search: string) => {
    const res = await apiClient.get<
      { id: string; code: string; fullName: string; phone: string; email: string | null }[]
    >('/beverages/members', { params: { search } });
    return res.data;
  },

  imports: async (params: BeverageFilters = {}): Promise<BeverageImportListItem[]> => {
    const res = await apiClient.get<BeverageImportListItem[]>('/beverages/imports', { params });
    return res.data;
  },

  importDetail: async (id: string): Promise<BeverageImport> => {
    const res = await apiClient.get<BeverageImport>(`/beverages/imports/${id}`);
    return res.data;
  },

  createImport: async (payload: Record<string, unknown>): Promise<BeverageImport> => {
    const res = await apiClient.post<BeverageImport>('/beverages/imports', payload);
    return res.data;
  },

  receiveImport: async (id: string): Promise<BeverageImport> => {
    const res = await apiClient.post<BeverageImport>(`/beverages/imports/${id}/receive`);
    return res.data;
  },

  sales: async (params: BeverageFilters = {}): Promise<BeverageSaleSummary[]> => {
    const res = await apiClient.get<BeverageSaleSummary[]>('/beverages/sales', { params });
    return res.data;
  },

  saleDetail: async (id: string): Promise<BeverageSale> => {
    const res = await apiClient.get<BeverageSale>(`/beverages/sales/${id}`);
    return res.data;
  },

  createSale: async (payload: Record<string, unknown>): Promise<BeverageSale> => {
    const res = await apiClient.post<BeverageSale>('/beverages/sales', payload);
    return res.data;
  },

  stock: async (params: BeverageFilters = {}): Promise<BeverageStock[]> => {
    const res = await apiClient.get<BeverageStock[]>('/beverages/stock', { params });
    return res.data;
  },

  movements: async (params: BeverageFilters = {}) => {
    const res = await apiClient.get<
      {
        id: string;
        productCode: string;
        productName: string;
        movementType: string;
        quantityChange: number;
        createdAt: string;
        notes: string | null;
        createdByName: string | null;
      }[]
    >('/beverages/stock/movements', { params });
    return res.data;
  },

  adjustStock: async (payload: { productId: string; quantityChange: number; reason: string }) => {
    const res = await apiClient.post('/beverages/stock/adjustments', payload);
    return res.data;
  },

  report: async (params: BeverageFilters = {}): Promise<BeverageReport> => {
    const res = await apiClient.get<BeverageReport>('/beverages/reports', { params });
    return res.data;
  },

  mySales: async (params: BeverageFilters = {}) => {
    const res = await apiClient.get('/beverages/member/sales', { params });
    return res.data as Omit<BeverageSale, 'items'>[];
  },

  mySaleDetail: async (id: string): Promise<BeverageSale> => {
    const res = await apiClient.get<BeverageSale>(`/beverages/member/sales/${id}`);
    return res.data;
  },
};
