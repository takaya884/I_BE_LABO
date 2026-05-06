export type TrackingType = "individual" | "quantity";
export type ItemCategory = "coin" | "material" | "tool" | "finished";
export type ItemUnitStatus = "in_stock" | "reserved" | "consumed" | "lost";
export type UserRole = "tenant_admin" | "store_manager" | "staff";
export type MovementType =
  | "inbound"
  | "outbound"
  | "consume"
  | "adjustment"
  | "transfer_in"
  | "transfer_out";

export type Profile = {
  id: string;
  tenant_id: string;
  store_id: string | null;
  role: UserRole;
  display_name: string | null;
};

export type Store = {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
};

export type Item = {
  id: string;
  tenant_id: string;
  store_id: string;
  category: ItemCategory;
  tracking_type: TrackingType;
  name: string;
  sku: string | null;
  country: string | null;
  denomination: string | null;
  unit: string | null;
  reorder_point: number | null;
  unit_cost: number | null;
  notes: string | null;
  archived: boolean;
};

export type ItemUnit = {
  id: string;
  item_id: string;
  store_id: string;
  serial: string | null;
  year: number | null;
  condition: string | null;
  acquisition_cost: number | null;
  acquired_at: string | null;
  status: ItemUnitStatus;
  photo_url: string | null;
  notes: string | null;
};

export type ExperienceMenu = {
  id: string;
  tenant_id: string;
  store_id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  description: string | null;
  archived: boolean;
};

export type Bom = {
  id: string;
  menu_id: string;
  item_id: string;
  quantity: number;
  is_optional: boolean;
};

export type StockMovement = {
  id: string;
  store_id: string;
  item_id: string;
  item_unit_id: string | null;
  movement_type: MovementType;
  quantity: number;
  related_menu_id: string | null;
  occurred_at: string;
  note: string | null;
};

export const movementLabel: Record<MovementType, string> = {
  inbound: "入庫",
  outbound: "出庫",
  consume: "体験消費",
  adjustment: "棚卸調整",
  transfer_in: "移動受入",
  transfer_out: "移動出庫",
};

export const categoryLabel: Record<ItemCategory, string> = {
  coin: "コイン",
  material: "部材",
  tool: "工具",
  finished: "完成品",
};
