import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CompanyDashboard } from './components/CompanyDashboard';
import { MoneyLedger } from './components/MoneyLedger';
import { InvoiceManager } from './components/InvoiceManager';
import { ExpenseTracker } from './components/ExpenseTracker';
import { CashflowForecast } from './components/CashflowForecast';
import { EmailTemplatesModal } from './components/EmailTemplatesModal';
import { DeveloperPlayground } from './components/DeveloperPlayground';
import { ActivityLogView } from './components/ActivityLogView';
import { CompanySetupModal } from './components/CompanySetupModal';
import { GlobalAiChatWidget } from './components/GlobalAiChatWidget';
import { MorningBriefing } from './components/MorningBriefing';

import {
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CASH_FORECAST,
  REMINDER_TEMPLATES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import { Invoice, Expense, CashForecast, ReminderTemplate, ActivityLog, LedgerTransaction, formatRupee } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'briefing' | 'transactions' | 'invoices' | 'expenses' | 'forecast' | 'templates' | 'playground' | 'logs'
  >('dashboard');

  const [companyName, setCompanyName] = useState<string>('Acme Digital Solutions Pvt Ltd');
  const [showCompanySetup, setShowCompanySetup] = useState<boolean>(false);

  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [cashForecast, setCashForecast] = useState<CashForecast>(INITIAL_CASH_FORECAST);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS);
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>(REMINDER_TEMPLATES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  const [briefingMarkdown, setBriefingMarkdown] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Fetch AI Morning Briefing on load and on trigger
  const fetchAiBriefing = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices, expenses, cashForecast, transactions }),
      });
      const data = await response.json();
      if (data.success && data.briefingMarkdown) {
        setBriefingMarkdown(data.briefingMarkdown);
      }
    } catch (err) {
      console.error('Failed to fetch AI briefing:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAiBriefing();
  }, []);

  // Handle adding new ledger transaction
  const handleAddTransaction = (newTxData: Omit<LedgerTransaction, 'id'>) => {
    const newTx: LedgerTransaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update Cash Balance dynamically
    setCashForecast((prev) => {
      const change = newTx.type === 'income' ? newTx.amount : -newTx.amount;
      const newBalance = Math.max(0, prev.currentBalance + change);
      return {
        ...prev,
        currentBalance: newBalance,
      };
    });

    // Add activity log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      type: 'forecast_adjusted',
      title: `Recorded ${newTx.type === 'income' ? 'Money In' : 'Money Out'} Entry`,
      description: `${newTx.description} (${newTx.partyName || newTx.category}): ${newTx.type === 'income' ? '+' : '-'}${formatRupee(newTx.amount)}.`,
      status: 'success',
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Handle sending escalating reminder email
  const handleSendReminder = async (invoice: Invoice, template?: ReminderTemplate) => {
    const tmpl = template || reminderTemplates.find((t) => t.stage === invoice.reminderStage) || reminderTemplates[0];
    try {
      const res = await fetch('/api/reminder/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice, stageTemplate: tmpl, channel: 'email' }),
      });
      const data = await res.json();

      if (data.success) {
        // Update invoice in state
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === invoice.id) {
              return {
                ...inv,
                lastReminderSent: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                reminderCount: inv.reminderCount + 1,
              };
            }
            return inv;
          })
        );

        // Add to activity logs
        const newLog: ActivityLog = {
          id: `log-${Date.now()}`,
          timestamp: 'Just now',
          type: 'reminder_sent',
          title: `Sent Payment Reminder`,
          description: `Email delivered to ${invoice.clientCompany} (${invoice.clientEmail}) for Invoice #${invoice.invoiceNumber} (${formatRupee(invoice.amount)}).`,
          channel: 'email',
          status: 'success',
        };
        setActivityLogs((prev) => [newLog, ...prev]);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    }
  };

  // Handle Mark Invoice Paid
  const handleMarkPaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'paid', daysOverdue: 0 } : inv))
    );

    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      // Add transaction to money ledger automatically!
      handleAddTransaction({
        date: new Date().toISOString().split('T')[0],
        description: `Invoice #${inv.invoiceNumber} Settlement`,
        type: 'income',
        category: 'Client Services',
        amount: inv.amount,
        partyName: inv.clientCompany,
        paymentMethod: 'Bank Clearance',
        referenceNo: `PAY-${inv.invoiceNumber}`,
        status: 'cleared',
      });

      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        type: 'reminder_sent',
        title: 'Invoice Payment Received',
        description: `Invoice #${inv.invoiceNumber} from ${inv.clientCompany} (${formatRupee(inv.amount)}) marked as paid and cleared.`,
        status: 'success',
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    }
  };

  // Handle Verify Expense
  const handleVerifyExpense = (expenseId: string) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === expenseId ? { ...exp, status: 'verified', reviewedByOwner: true } : exp))
    );

    const exp = expenses.find((e) => e.id === expenseId);
    if (exp) {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        type: 'expense_verified',
        title: 'Expense Verified',
        description: `Verified ${formatRupee(exp.amount)} charge from ${exp.merchant} (${exp.category}).`,
        status: 'success',
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    }
  };

  // Handle Dispute Expense
  const handleDisputeExpense = (expenseId: string) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === expenseId ? { ...exp, status: 'disputed' } : exp))
    );

    const exp = expenses.find((e) => e.id === expenseId);
    if (exp) {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        type: 'expense_disputed',
        title: 'Expense Flagged for Dispute',
        description: `Dispute flagged for ${formatRupee(exp.amount)} charge from ${exp.merchant}. Vendor contact notified.`,
        status: 'success',
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    }
  };

  // Handle Add Invoice
  const handleAddInvoice = (newInv: Invoice) => {
    setInvoices((prev) => [newInv, ...prev]);
    fetchAiBriefing();
  };

  // Handle Add Expense
  const handleAddExpense = (newExp: Expense) => {
    setExpenses((prev) => [newExp, ...prev]);
    fetchAiBriefing();
  };

  // Handle Update Template
  const handleUpdateTemplate = (updatedTemplate: ReminderTemplate) => {
    setReminderTemplates((prev) =>
      prev.map((t) => (t.stage === updatedTemplate.stage ? updatedTemplate : t))
    );
  };

  // Handle Company Financial Setup / Reset
  const handleSaveCompanySetup = (
    profile: {
      name: string;
      category: string;
      currency: string;
      startingBalance: number;
      monthlyBudget: number;
    },
    presetType: 'blank' | 'tech_startup' | 'agency' | 'retail' | 'current'
  ) => {
    setCompanyName(profile.name);
    setCashForecast((prev) => ({
      ...prev,
      currentBalance: profile.startingBalance,
      monthlyBurnRate: profile.monthlyBudget,
      daysUntilShortfall:
        profile.monthlyBudget > 0
          ? Math.round((profile.startingBalance / profile.monthlyBudget) * 30)
          : 90,
    }));

    if (presetType === 'blank') {
      setInvoices([]);
      setExpenses([]);
      setTransactions([
        {
          id: `tx-init-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: 'Starting Capital Injection',
          type: 'income',
          category: 'Capital Contribution',
          amount: profile.startingBalance,
          partyName: 'Founder Investment',
          paymentMethod: 'Bank Transfer',
          referenceNo: 'INIT-001',
          status: 'cleared',
        },
      ]);
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      type: 'forecast_adjusted',
      title: 'Company Financial Profile Onboarded',
      description: `Loaded starting balance of ${formatRupee(
        profile.startingBalance
      )} and profile for ${profile.name}.`,
      status: 'success',
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    setShowCompanySetup(false);
  };

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const anomalyCount = expenses.filter((e) => e.isAnomaly && e.status !== 'verified').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-slate-900 selection:text-white">
      {/* Left Vertical Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overdueCount={overdueCount}
        anomalyCount={anomalyCount}
        daysUntilShortfall={cashForecast.daysUntilShortfall}
        currentBalance={cashForecast.currentBalance}
        companyName={companyName}
        onRefreshBriefing={fetchAiBriefing}
        onOpenCompanySetup={() => setShowCompanySetup(true)}
        isRefreshing={isRefreshing}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <CompanyDashboard
            invoices={invoices}
            expenses={expenses}
            cashForecast={cashForecast}
            transactions={transactions}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSendReminder={(inv) => handleSendReminder(inv)}
            onVerifyExpense={handleVerifyExpense}
            onDisputeExpense={handleDisputeExpense}
          />
        )}

        {activeTab === 'briefing' && (
          <MorningBriefing
            invoices={invoices}
            expenses={expenses}
            cashForecast={cashForecast}
            reminderTemplates={reminderTemplates}
            briefingMarkdown={briefingMarkdown}
            isRefreshing={isRefreshing}
            onRefreshBriefing={fetchAiBriefing}
            onSendReminder={handleSendReminder}
            onVerifyExpense={handleVerifyExpense}
            onDisputeExpense={handleDisputeExpense}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'transactions' && (
          <MoneyLedger
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceManager
            invoices={invoices}
            reminderTemplates={reminderTemplates}
            companyName={companyName}
            onSendReminder={handleSendReminder}
            onMarkPaid={handleMarkPaid}
            onAddInvoice={handleAddInvoice}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTracker
            expenses={expenses}
            onVerifyExpense={handleVerifyExpense}
            onDisputeExpense={handleDisputeExpense}
            onAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'forecast' && <CashflowForecast cashForecast={cashForecast} />}

        {activeTab === 'templates' && (
          <EmailTemplatesModal templates={reminderTemplates} onUpdateTemplate={handleUpdateTemplate} />
        )}

        {activeTab === 'playground' && <DeveloperPlayground />}

        {activeTab === 'logs' && <ActivityLogView logs={activityLogs} />}
      </main>

      {/* Company Financial Setup Modal */}
      {showCompanySetup && (
        <CompanySetupModal
          onSaveCompany={handleSaveCompanySetup}
          onClose={() => setShowCompanySetup(false)}
        />
      )}

      {/* Floating AI Chat Assistant Available on Every Section */}
      <GlobalAiChatWidget
        invoices={invoices}
        expenses={expenses}
        cashForecast={cashForecast}
        transactions={transactions}
        activeTabTitle={
          activeTab === 'dashboard'
            ? 'Overview & Assistant'
            : activeTab === 'transactions'
            ? 'Income & Expenses Ledger'
            : activeTab === 'invoices'
            ? 'Client Invoices'
            : activeTab === 'expenses'
            ? 'Expense Audit'
            : activeTab === 'forecast'
            ? 'Cash Runway Forecast'
            : activeTab === 'templates'
            ? 'Payment Reminders'
            : activeTab === 'playground'
            ? 'OpsPilot AI'
            : 'Activity Audit Log'
        }
      />
    </div>
  );
}
