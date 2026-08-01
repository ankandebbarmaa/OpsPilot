import { Invoice, Expense, CashForecast, ReminderTemplate, ActivityLog, LedgerTransaction } from '../types';

export const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-07-30',
    description: 'Q3 Enterprise Consulting Retainer',
    type: 'income',
    category: 'Client Services',
    amount: 125000,
    partyName: 'Gamma Tech',
    paymentMethod: 'Bank Transfer (NEFT)',
    referenceNo: 'TXN-889021',
    status: 'cleared',
  },
  {
    id: 'tx-2',
    date: '2026-07-30',
    description: 'Bulk Furniture & Office Equipment',
    type: 'expense',
    category: 'Office & Supplies',
    amount: 48000,
    partyName: 'Office Supplies Inc.',
    paymentMethod: 'Corporate Credit Card',
    referenceNo: 'TXN-772109',
    status: 'cleared',
  },
  {
    id: 'tx-3',
    date: '2026-07-28',
    description: 'AWS Cloud Server Infrastructure',
    type: 'expense',
    category: 'Hosting & Software',
    amount: 14500,
    partyName: 'AWS Cloud Services',
    paymentMethod: 'Auto Debit',
    referenceNo: 'TXN-661023',
    status: 'cleared',
  },
  {
    id: 'tx-4',
    date: '2026-07-26',
    description: 'POS Integration Final Milestone Payment',
    type: 'income',
    category: 'Software Solutions',
    amount: 42000,
    partyName: 'Central Perk Retail',
    paymentMethod: 'UPI / IMPS',
    referenceNo: 'TXN-991204',
    status: 'cleared',
  },
  {
    id: 'tx-5',
    date: '2026-07-25',
    description: 'Q3 Restocking Freight & Customs Clearances',
    type: 'expense',
    category: 'Logistics',
    amount: 98000,
    partyName: 'Global Freight Express',
    paymentMethod: 'Wire Transfer',
    referenceNo: 'TXN-334192',
    status: 'cleared',
  },
  {
    id: 'tx-6',
    date: '2026-07-22',
    description: 'Workspace Coworking Desk Lease',
    type: 'expense',
    category: 'Rent & Space',
    amount: 32000,
    partyName: 'WeWork Coworking',
    paymentMethod: 'Bank ACH',
    referenceNo: 'TXN-110293',
    status: 'cleared',
  },
  {
    id: 'tx-7',
    date: '2026-07-15',
    description: 'Monthly Engineering Payroll Disbursement',
    type: 'expense',
    category: 'Payroll & Salaries',
    amount: 180000,
    partyName: 'HDFC Salary Batch',
    paymentMethod: 'Bank Direct Deposit',
    referenceNo: 'PAY-2026-07',
    status: 'cleared',
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-123',
    invoiceNumber: 'INV-123',
    clientName: 'Sarah Jenkins',
    clientCompany: 'ACME Corp',
    clientEmail: 's.jenkins@acme.com',
    clientPhone: '+91 98765 43210',
    amount: 50000,
    issueDate: '2026-07-01',
    dueDate: '2026-07-21',
    status: 'overdue',
    daysOverdue: 10,
    reminderStage: 'overdue_7',
    lastReminderSent: '2026-07-22',
    reminderCount: 2,
    items: [
      { description: 'Q3 Operations Strategy & Technical Consulting', quantity: 1, unitPrice: 50000, amount: 50000 }
    ],
    notes: 'Client mentioned Q3 budget clearance pending.'
  },
  {
    id: 'inv-456',
    invoiceNumber: 'INV-456',
    clientName: 'Marcus Vance',
    clientCompany: 'Beta LLC',
    clientEmail: 'marcus@betallc.io',
    clientPhone: '+91 91234 56789',
    amount: 30000,
    issueDate: '2026-07-14',
    dueDate: '2026-07-29',
    status: 'overdue',
    daysOverdue: 2,
    reminderStage: 'due_date',
    lastReminderSent: '2026-07-29',
    reminderCount: 1,
    items: [
      { description: 'Custom Analytics Dashboard Frontend Development', quantity: 1, unitPrice: 30000, amount: 30000 }
    ],
    notes: 'Payment queued for processing.'
  },
  {
    id: 'inv-789',
    invoiceNumber: 'INV-789',
    clientName: 'David Lee',
    clientCompany: 'Gamma Tech',
    clientEmail: 'david.l@gammatech.co',
    clientPhone: '+91 99887 76655',
    amount: 125000,
    issueDate: '2026-07-25',
    dueDate: '2026-08-07',
    status: 'pending',
    daysOverdue: 0,
    reminderStage: 'pre_due',
    reminderCount: 0,
    items: [
      { description: 'Enterprise Server Migration & Cloud Setup Phase 1', quantity: 1, unitPrice: 125000, amount: 125000 }
    ]
  },
  {
    id: 'inv-101',
    invoiceNumber: 'INV-101',
    clientName: 'Elena Rostova',
    clientCompany: 'Apex Logistics',
    clientEmail: 'elena@apexlogistics.com',
    clientPhone: '+91 97654 32109',
    amount: 84000,
    issueDate: '2026-06-15',
    dueDate: '2026-07-01',
    status: 'overdue',
    daysOverdue: 30,
    reminderStage: 'overdue_30',
    lastReminderSent: '2026-07-15',
    reminderCount: 3,
    items: [
      { description: 'Supply Chain Route Optimization & ERP Integration', quantity: 1, unitPrice: 84000, amount: 84000 }
    ],
    notes: 'Final 30-day escalation required.'
  },
  {
    id: 'inv-999',
    invoiceNumber: 'INV-999',
    clientName: 'Rachel Green',
    clientCompany: 'Central Perk Retail',
    clientEmail: 'rachel@centralperk.com',
    clientPhone: '+91 94567 89012',
    amount: 42000,
    issueDate: '2026-07-05',
    dueDate: '2026-07-20',
    status: 'paid',
    daysOverdue: 0,
    reminderStage: 'due_date',
    lastReminderSent: '2026-07-20',
    reminderCount: 1,
    items: [
      { description: 'Point of Sale Integration & Hardware Setup', quantity: 1, unitPrice: 42000, amount: 42000 }
    ]
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-101',
    date: '2026-07-30',
    merchant: 'Office Supplies Inc.',
    category: 'Office & Supplies',
    amount: 48000,
    normalAverage: 12000,
    isAnomaly: true,
    anomalyMultiplier: 4,
    anomalyReason: '4× higher than your monthly baseline spend of ₹12,000 on supplies.',
    status: 'flagged'
  },
  {
    id: 'exp-102',
    date: '2026-07-28',
    merchant: 'AWS Cloud Services',
    category: 'Hosting & Software',
    amount: 14500,
    normalAverage: 14000,
    isAnomaly: false,
    status: 'normal'
  },
  {
    id: 'exp-103',
    date: '2026-07-27',
    merchant: 'Global Freight Express',
    category: 'Logistics',
    amount: 98000,
    normalAverage: 24000,
    isAnomaly: true,
    anomalyMultiplier: 4.08,
    anomalyReason: 'Unusual spike in freight charges for Q3 restocking.',
    status: 'flagged'
  },
  {
    id: 'exp-104',
    date: '2026-07-25',
    merchant: 'Metropolitan Utilities',
    category: 'Utilities',
    amount: 6200,
    normalAverage: 6500,
    isAnomaly: false,
    status: 'normal'
  },
  {
    id: 'exp-105',
    date: '2026-07-22',
    merchant: 'WeWork Coworking',
    category: 'Rent & Workspace',
    amount: 32000,
    normalAverage: 32000,
    isAnomaly: false,
    status: 'verified'
  }
];

export const INITIAL_CASH_FORECAST: CashForecast = {
  currentBalance: 185000,
  cashBufferTarget: 200000,
  daysUntilShortfall: 11,
  predictedShortfallDate: '2026-08-11',
  projectedRunwayDays: 11,
  shortfallAmount: 42000,
  trend: [
    { date: 'Jul 31', projectedBalance: 185000, expectedInflows: 0, expectedOutflows: 8000, inflow: 0, outflow: 8000 },
    { date: 'Aug 02', projectedBalance: 177000, expectedInflows: 0, expectedOutflows: 15000, inflow: 0, outflow: 15000 },
    { date: 'Aug 04', projectedBalance: 162000, expectedInflows: 30000, expectedOutflows: 21000, inflow: 30000, outflow: 21000 },
    { date: 'Aug 06', projectedBalance: 171000, expectedInflows: 0, expectedOutflows: 45000, inflow: 0, outflow: 45000 },
    { date: 'Aug 08', projectedBalance: 126000, expectedInflows: 50000, expectedOutflows: 62000, inflow: 50000, outflow: 62000 },
    { date: 'Aug 10', projectedBalance: 114000, expectedInflows: 0, expectedOutflows: 85000, inflow: 0, outflow: 85000 },
    { date: 'Aug 11', projectedBalance: 29000, expectedInflows: 0, expectedOutflows: 32000, isShortfall: true, inflow: 0, outflow: 32000 },
    { date: 'Aug 13', projectedBalance: -3000, expectedInflows: 0, expectedOutflows: 12000, isShortfall: true, inflow: 0, outflow: 12000 },
    { date: 'Aug 15', projectedBalance: 122000, expectedInflows: 125000, expectedOutflows: 0, inflow: 125000, outflow: 0 }
  ],
  forecastTimeline: [
    { date: 'Jul 31', projectedBalance: 185000, expectedInflows: 0, expectedOutflows: 8000, inflow: 0, outflow: 8000 },
    { date: 'Aug 02', projectedBalance: 177000, expectedInflows: 0, expectedOutflows: 15000, inflow: 0, outflow: 15000 },
    { date: 'Aug 04', projectedBalance: 162000, expectedInflows: 30000, expectedOutflows: 21000, inflow: 30000, outflow: 21000 },
    { date: 'Aug 06', projectedBalance: 171000, expectedInflows: 0, expectedOutflows: 45000, inflow: 0, outflow: 45000 },
    { date: 'Aug 08', projectedBalance: 126000, expectedInflows: 50000, expectedOutflows: 62000, inflow: 50000, outflow: 62000 },
    { date: 'Aug 10', projectedBalance: 114000, expectedInflows: 0, expectedOutflows: 85000, inflow: 0, outflow: 85000 },
    { date: 'Aug 11', projectedBalance: 29000, expectedInflows: 0, expectedOutflows: 32000, isShortfall: true, inflow: 0, outflow: 32000 },
    { date: 'Aug 13', projectedBalance: -3000, expectedInflows: 0, expectedOutflows: 12000, isShortfall: true, inflow: 0, outflow: 12000 },
    { date: 'Aug 15', projectedBalance: 122000, expectedInflows: 125000, expectedOutflows: 0, inflow: 125000, outflow: 0 }
  ]
};

export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    stage: 'pre_due',
    stageName: '7 Days Before Due Date',
    triggerDescription: 'Sent automatically 7 days prior to due date as a gentle nudge.',
    tone: 'Polite & Helpful',
    subject: 'Friendly Reminder – Invoice #[InvoiceNumber] due soon',
    body: `Hi [ClientName],

Just a friendly heads-up that Invoice #[InvoiceNumber] for [Amount] is due on [DueDate].

You can easily review and settle the payment online here: [PaymentLink]

If you have any questions or need purchase order adjustments, please let us know.

Best regards,
[CompanyName] Operations Team`
  },
  {
    stage: 'due_date',
    stageName: 'On Due Date',
    triggerDescription: 'Sent on the invoice due date to encourage on-time clearance.',
    tone: 'Professional & Direct',
    subject: 'Invoice #[InvoiceNumber] is due today',
    body: `Hi [ClientName],

This is a quick notification that Invoice #[InvoiceNumber] for [Amount] is due today ([DueDate]).

Link to pay or view invoice details: [PaymentLink]

Thank you for your prompt payment!

Best regards,
[CompanyName] Accounts Receivable`
  },
  {
    stage: 'overdue_7',
    stageName: '7 Days Overdue',
    triggerDescription: 'Sent 7 days past due date to escalate payment chase.',
    tone: 'Firm & Clear',
    subject: 'Subject: Invoice #[InvoiceNumber] is now overdue',
    body: `Hi [ClientName],

Our records show that Invoice #[InvoiceNumber] due on [DueDate] (Amount: [Amount]) is now 7 days overdue.

We kindly request that you settle this invoice at your earliest convenience:
[PaymentLink]

Please reply to confirm when we can expect payment or if you need another copy of the invoice.

Best regards,
[CompanyName] Finance Department`
  },
  {
    stage: 'overdue_30',
    stageName: '30 Days Overdue (Final Notice)',
    triggerDescription: 'Sent 30 days past due date for critical, high-urgency recovery.',
    tone: 'URGENT & Escalated',
    subject: 'URGENT: Invoice #[InvoiceNumber] is 30 days overdue',
    body: `Hi [ClientName],

This invoice is significantly overdue. Invoice #[InvoiceNumber] for [Amount] was due on [DueDate] and remains unpaid after multiple reminders.

Please settle [Amount] by [EscalationDate] to maintain account standing and avoid further action:
[PaymentLink]

If payment has already been processed, please reply with remittance advice.

Sincerely,
[CompanyName] Executive Office`
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: 'Today, 08:30 AM',
    type: 'ai_briefing_generated',
    title: 'Daily Morning Briefing Generated',
    description: 'OpsPilot analyzed 5 invoices, 5 expenses, and 14-day cash runway.',
    status: 'success'
  },
  {
    id: 'log-2',
    timestamp: 'Yesterday, 04:15 PM',
    type: 'reminder_sent',
    title: '7-Day Overdue Reminder Sent',
    description: 'Sent email to ACME Corp (Sarah Jenkins) for Invoice #INV-123 (₹50,000).',
    channel: 'email',
    status: 'success'
  },
  {
    id: 'log-3',
    timestamp: 'Jul 28, 02:00 PM',
    type: 'expense_verified',
    title: 'Expense Verified',
    description: 'Verified ₹32,000 WeWork Coworking space lease payment.',
    status: 'success'
  }
];
