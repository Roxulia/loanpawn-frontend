export type SupplierType = "INDIVIDUAL" | "SUPPLIER" | "SHOP" | "ONLINE_STORE";
export type PurchaseTrackingMode = "UNIQUE" | "SERIALIZED" | "QUANTITY";
export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type DerivedPaymentStatus = "UNPAID" | "PARTIAL" | "PAID";
export type DerivedReceiptStatus = "NOT_RECEIVED" | "PARTIAL" | "RECEIVED";

export type PurchaseSupplier = {
  code: string;
  type: SupplierType;
  name: string;
  customer_code: string | null;
  lender_code: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  is_active: boolean;
};

export type PurchaseOrderItem = {
  code: string;
  catalog_item_code: string | null;
  item_description: string;
  tracking_mode: PurchaseTrackingMode;
  unit_label: string;
  ordered_quantity: string;
  received_quantity: string;
  incoming_quantity: string;
  unit_price: string;
};

export type PurchaseOrder = {
  code: string;
  supplier: PurchaseSupplier;
  status: PurchaseOrderStatus;
  currency_code: string;
  ordered_at: string | null;
  note: string | null;
  totals: {
    item_count: number;
    fully_received_item_count: number;
    amount: string;
    paid_amount: string;
    refunded_amount: string;
    net_paid_amount: string;
  };
  payment_status: DerivedPaymentStatus;
  receipt_status: DerivedReceiptStatus;
  return_status: "NOT_RETURNED" | "PARTIAL" | "RETURNED";
  created_at: string;
  items?: PurchaseOrderItem[];
};

export type PurchaseRefund = {
  code: string;
  refunded_at: string;
  amount: string;
  reference: string | null;
  note: string | null;
};

export type PurchasePayment = {
  code: string;
  paid_at: string;
  amount: string;
  reference: string | null;
  note: string | null;
  refunded_amount: string;
  refund_status: "NOT_REFUNDED" | "PARTIAL" | "REFUNDED";
  refunds: PurchaseRefund[];
};

export type PurchaseReceiptItem = {
  code: string;
  purchase_order_item_code: string;
  quantity: string;
  inventory_item_code: string;
  inventory_unit_codes: string[];
  location_code: string;
  acquisition_lot_code: string | null;
  received_value: string;
  tracking_mode: PurchaseTrackingMode;
};

export type PurchaseReceipt = {
  code: string;
  received_at: string;
  note: string | null;
  supplier_payable_code: string | null;
  supplier_credit_applied_amount: string;
  items: PurchaseReceiptItem[];
};

export type PurchaseReturnItem = {
  code: string;
  purchase_receipt_item_code: string;
  quantity: string;
  supplier_credit_code: string | null;
  supplier_credit_amount: string;
  supplier_payable_adjusted_amount: string;
  inventory_unit_codes: string[];
  cash_refund_amount: string;
};
export type PurchaseReturn = {
  code: string;
  returned_at: string;
  reason: string | null;
  note: string | null;
  items: PurchaseReturnItem[];
};

export type SupplierPayable = {
  code: string;
  kind: "SUPPLIER_PAYABLE";
  supplier_code: string | null;
  supplier_name: string | null;
  purchase_order_code: string | null;
  purchase_receipt_code: string | null;
  currency_code: string | null;
  original_amount: string;
  balance_amount: string;
  status: "OPEN" | "PARTIAL" | "SETTLED";
  payments: Array<{ code: string; paid_at: string | null; amount: string }>;
};