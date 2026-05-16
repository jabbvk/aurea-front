export interface CashTransferRequest {
  fromAccountId: string; // UUID de la cuenta origen
  toAccountId: string;   // UUID de la cuenta destino
  amount: number;        // Cantidad mayor a 0
}

export interface CashAccount {
  id: string; // Antes era number, ahora es UUID string
  name: string;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isEmergencyFund: boolean;
}

export interface CashMovement {
  id: string;
  type: string;        // INCOME, EXPENSE, TRANSFER, ASSET_PURCHASE, etc.
  amount: number;      // Vendrá con signo (+/-) según sea entrada o salida
  description: string;
  date: string;        // ISO format
  accountName: string;
}

export interface CashHistoryPageResponse {
  content: CashMovement[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
