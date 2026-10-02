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

export type PurchaseOrderLine = {
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
    line_count: number;
    fully_received_line_count: number;
    amount: string;
    paid_amount: string;
    refunded_amount: string;
    net_paid_amount: string;
  };
  payment_status: DerivedPaymentStatus;
  receipt_status: DerivedReceiptStatus;
  return_status: "NOT_RETURNED" | "PARTIAL" | "RETURNED";
  created_at: string;
  lines?: PurchaseOrderLine[];
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

export type PurchaseReceiptLine = {
  code: string;
  purchase_order_line_code: string;
  quantity: string;
};

export type PurchaseReceipt = {
  code: string;
  received_at: string;
  note: string | null;
  lines: PurchaseReceiptLine[];
};

export type PurchaseReturnLine = {
  code: string;
  purchase_receipt_line_code: string;
  quantity: string;
};

export type PurchaseReturn = {
  code: string;
  returned_at: string;
  reason: string | null;
  note: string | null;
  lines: PurchaseReturnLine[];
};
