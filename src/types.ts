export interface CompanyProfile {
  name: string;
  category: string;
  currency: string;
  startingBalance: number;
  monthlyBudget: number;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type ReminderStage = 'pre_due' | 'due_date' | 'overdue_7' | 'overdue_30';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type PaymentType = 'full' | 'advance' | 'final' | 'milestone' | 'retainer';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  daysOverdue: number; // 0 if not overdue, >0 if overdue
  reminderStage: ReminderStage;
  lastReminderSent?: string;
  reminderCount: number;
  items: InvoiceItem[];
  notes?: string;
  paymentType?: PaymentType;
  paymentTerms?: string;
}

export type ExpenseStatus = 'normal' | 'flagged' | 'verified' | 'disputed';

export interface Expense {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  normalAverage: number;
  isAnomaly: boolean;
  anomalyMultiplier?: number; // e.g. 4 for 4x normal spend
  anomalyReason?: string;
  status: ExpenseStatus;
  reviewedByOwner?: boolean;
}

export interface CashflowPoint {
  date: string;
  projectedBalance: number;
  expectedInflows?: number;
  expectedOutflows?: number;
  inflow?: number;
  outflow?: number;
  isShortfall?: boolean;
}

export interface CashForecast {
  currentBalance: number;
  cashBufferTarget: number;
  daysUntilShortfall: number;
  predictedShortfallDate?: string;
  projectedRunwayDays: number;
  shortfallAmount?: number;
  trend: CashflowPoint[];
  forecastTimeline?: CashflowPoint[];
}

export type BriefingItemType = 'invoice_overdue' | 'unusual_expense' | 'cash_forecast' | 'action_done';
export type BriefingPriority = 'critical' | 'warning' | 'info';

export interface BriefingItem {
  id: string;
  type: BriefingItemType;
  priority: BriefingPriority;
  title: string;
  summary: string;
  detail: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  invoiceId?: string;
  expenseId?: string;
  timestamp: string;
  resolved?: boolean;
  resolvedAction?: string;
}

export interface ReminderTemplate {
  stage: ReminderStage;
  stageName: string;
  triggerDescription: string;
  subject: string;
  body: string;
  tone: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'reminder_sent' | 'expense_verified' | 'expense_disputed' | 'forecast_adjusted' | 'ai_briefing_generated';
  title: string;
  description: string;
  channel?: 'email' | 'sms' | 'system';
  status: 'success' | 'pending';
}

export interface ScenarioSetting {
  delayBillId?: string;
  postponeAmount: number;
  accelerateInvoiceId?: string;
  accelerateAmount: number;
}

export type TransactionType = 'income' | 'expense';

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  amount: number;
  partyName?: string;
  paymentMethod?: string;
  referenceNo?: string;
  status: 'cleared' | 'pending';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function formatRupee(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN');
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

