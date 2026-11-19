export type QuantityType = "number" | "kg";
export type UserRole = "admin" | "user";

export type AppUser = {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: UserRole;
  active: boolean;
};

export type CatalogItem = {
  id: string;
  name: string;
  smallImage: string;
  description: string;
  quantityType: QuantityType;
};

export type UserEntry = {
  quantity: number;
  cost: number;
};

export type WeeklyRow = {
  id: string;
  itemId: string;
  name: string;
  description: string;
  smallImage: string;
  quantityType: QuantityType;
  totalQuantity: number;
  totalAmount: number;
  rowNote: string;
  entries: Record<string, UserEntry>;
};

export type WeeklySnapshot = {
  id: string;
  weekLabel: string;
  archivedAt: string;
  comment: string;
  rows: WeeklyRow[];
  users: AppUser[];
};
