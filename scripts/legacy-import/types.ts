export type UserRole = "ADMIN" | "CUSTOMER";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED";
export type PaymentStatus =
  | "PENDING"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED";
export type SkuMatch = "exact" | "suffix" | "prefix" | "miss";

export type DumpUser = {
  oldId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  oldRole: string;
  passwordHash: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DumpAddress = {
  oldId: number;
  oldUserId: number;
  active: number;
  line1: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DumpOrder = {
  oldId: number;
  oldUserId: number | null;
  city: string | null;
  line1: string | null;
  phone: string | null;
  slotDate: string | null;
  slotTime: string | null;
  comment: string | null;
  totalAmount: number;
  status: string;
  createdAt: string | null;
  paymentMethod: string | null;
};

export type DumpOrderItem = {
  oldId: number;
  oldOrderId: number;
  oldProductId: number;
  titleJson: string;
  quantity: number;
  code: string;
  unitPrice: number;
};

export type NeonProduct = { id: string; sku: string };

export type NeonSnapshot = {
  host: string;
  usersByEmail: Map<string, string>;
  userIds: Set<string>;
  addressIds: Set<string>;
  orderNumbers: Set<string>;
  products: NeonProduct[];
};

export type AddressSnapshot = {
  recipientFirstName: string;
  recipientLastName: string;
  phone: string;
  countryCode: string;
  city: string;
  line1: string;
};

export type PlannedUser = {
  action: "insert" | "skip_email";
  oldId: number;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  passwordUpdatedAt: Date;
};

export type PlannedAddress = {
  action: "insert" | "skip_missing_user" | "skip_existing";
  oldId: number;
  id: string;
  userId: string | null;
  recipientFirstName: string;
  recipientLastName: string;
  phone: string;
  city: string;
  line1: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
};

export type PlannedOrder = {
  action: "insert" | "skip_existing";
  oldId: number;
  id: string;
  orderNumber: string;
  kind: "guest" | "registered";
  userId: string | null;
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  idempotencyScopeHash: string;
  idempotencyKeyHash: string;
  requestFingerprint: string;
  placedAt: Date;
  createdAt: Date;
  comment: string | null;
  slotDate: string | null;
  slotTime: string | null;
  paymentProvider: string;
  paymentMethod: string;
  oldPaymentMethod: string | null;
};

export type PlannedItem = {
  oldId: number;
  oldProductId: number;
  id: string;
  orderId: string;
  productId: string | null;
  productTitleSnapshot: string;
  productSkuSnapshot: string;
  quantity: number;
  unitAmount: number;
  lineTotalAmount: number;
  match: SkuMatch;
};

export type PlannedPayment = {
  id: string;
  orderId: string;
  provider: string;
  method: string;
  amount: number;
  status: PaymentStatus;
};

export type PlannedEvent = {
  id: string;
  orderId: string;
  payload: Record<string, string | null>;
};

export type ImportPlan = {
  users: PlannedUser[];
  addresses: PlannedAddress[];
  orders: PlannedOrder[];
  items: PlannedItem[];
  payments: PlannedPayment[];
  events: PlannedEvent[];
};
