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
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

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

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashForecast, setCashForecast] = useState<CashForecast>({
    currentBalance: 0,
    cashBufferTarget: 200000,
    daysUntilShortfall: 0,
    predictedShortfallDate: 'N/A',
    projectedRunwayDays: 0,
    shortfallAmount: 0,
    trend: [],
    forecastTimeline: []
  });
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [briefingMarkdown, setBriefingMarkdown] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore Snapshot Sync Listeners
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 5) {
        setLoading(false);
      }
    };

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      const list = snap.docs.map(d => d.data() as Invoice);
      list.sort((a, b) => b.id.localeCompare(a.id));
      setInvoices(list);
      checkLoaded();
    }, (err) => {
      console.error("Error listening to invoices:", err);
      checkLoaded();
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      const list = snap.docs.map(d => d.data() as Expense);
      list.sort((a, b) => b.date.localeCompare(a.date));
      setExpenses(list);
      checkLoaded();
    }, (err) => {
      console.error("Error listening to expenses:", err);
      checkLoaded();
    });

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
      const list = snap.docs.map(d => d.data() as LedgerTransaction);
      list.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(list);
      checkLoaded();
    }, (err) => {
      console.error("Error listening to transactions:", err);
      checkLoaded();
    });

    const unsubForecast = onSnapshot(doc(db, 'forecast', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setCashForecast(docSnap.data() as CashForecast);
      }
      checkLoaded();
    }, (err) => {
      console.error("Error listening to forecast:", err);
      checkLoaded();
    });

    const unsubTemplates = onSnapshot(collection(db, 'templates'), (snap) => {
      const list = snap.docs.map(d => d.data() as ReminderTemplate);
      setReminderTemplates(list);
      checkLoaded();
    }, (err) => {
      console.error("Error listening to templates:", err);
      checkLoaded();
    });

    const unsubLogs = onSnapshot(collection(db, 'logs'), (snap) => {
      const list = snap.docs.map(d => d.data() as ActivityLog);
      list.sort((a, b) => b.id.localeCompare(a.id));
      setActivityLogs(list);
    }, (err) => {
      console.error("Error listening to logs:", err);
    });

    return () => {
      unsubInvoices();
      unsubExpenses();
      unsubTransactions();
      unsubForecast();
      unsubTemplates();
      unsubLogs();
    };
  }, []);

  // Autopilot Mode Execution loop (runs background tasks automatically when active)
  useEffect(() => {
    if (!isAutopilotEnabled) return;

    const interval = setInterval(async () => {
      // 1. Check for auto-nudge candidates: Overdue unpaid invoices (>5 days overdue) that haven't been nudged today
      const autoNudgeInvoice = invoices.find(
        (inv) => inv.status === 'overdue' && inv.daysOverdue > 5 && !inv.lastReminderSent?.includes('Today')
      );

      if (autoNudgeInvoice) {
        await updateDoc(doc(db, 'invoices', autoNudgeInvoice.id), {
          lastReminderSent: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reminderCount: autoNudgeInvoice.reminderCount + 1,
          autopilotHandled: true,
        });

        const logId = `log-auto-${Date.now()}`;
        const newLog: ActivityLog = {
          id: logId,
          timestamp: 'Just now',
          type: 'autopilot_executed' as any,
          title: 'Autopilot: Payment Nudge Dispatched',
          description: `Dispatched collections reminder to ${autoNudgeInvoice.clientCompany} for Invoice #${autoNudgeInvoice.invoiceNumber} (${formatRupee(autoNudgeInvoice.amount)}).`,
          channel: 'nudge' as any,
          status: 'success',
        };
        await setDoc(doc(db, 'logs', logId), newLog);
        return; // Execute only one action per cycle for visible staggered execution
      }

      // 2. Check for auto-dispute candidates: Unreviewed flagged expenses (>3.5x average)
      const autoDisputeExpense = expenses.find(
        (exp) => exp.status === 'flagged' && !exp.reviewedByOwner && (exp.anomalyMultiplier || 0) > 3.5
      );

      if (autoDisputeExpense) {
        await updateDoc(doc(db, 'expenses', autoDisputeExpense.id), {
          status: 'disputed',
          reviewedByOwner: true,
          autopilotHandled: true
        });

        const logId = `log-auto-${Date.now()}`;
        const newLog: ActivityLog = {
          id: logId,
          timestamp: 'Just now',
          type: 'autopilot_executed' as any,
          title: 'Autopilot: Double-billing Dispute Filed',
          description: `Disputed anomalous charge at ${autoDisputeExpense.merchant} (${formatRupee(autoDisputeExpense.amount)}, ${autoDisputeExpense.anomalyMultiplier}x avg) with vendor.`,
          channel: 'dispute' as any,
          status: 'success',
        };
        await setDoc(doc(db, 'logs', logId), newLog);
      }
    }, 6000); // 6-second execution ticks for interactive visual confirmation

    return () => clearInterval(interval);
  }, [isAutopilotEnabled, invoices, expenses]);

  // Fetch AI Morning Briefing on load and on trigger
  const fetchAiBriefing = async (
    currentInvoices = invoices,
    currentExpenses = expenses,
    currentForecast = cashForecast,
    currentTransactions = transactions
  ) => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoices: currentInvoices,
          expenses: currentExpenses,
          cashForecast: currentForecast,
          transactions: currentTransactions
        }),
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
    if (!loading) {
      fetchAiBriefing();
    }
  }, [loading]);


  // Handle adding new ledger transaction
  const handleAddTransaction = async (newTxData: Omit<LedgerTransaction, 'id'>) => {
    const txId = `tx-${Date.now()}`;
    const newTx: LedgerTransaction = {
      ...newTxData,
      id: txId,
    };

    // 1. Save Transaction to Firestore
    await setDoc(doc(db, 'transactions', txId), newTx);

    // 2. Update Cash Balance in Firestore
    const change = newTx.type === 'income' ? newTx.amount : -newTx.amount;
    const newBalance = Math.max(0, cashForecast.currentBalance + change);
    await setDoc(doc(db, 'forecast', 'main'), {
      ...cashForecast,
      currentBalance: newBalance,
    });

    // 3. Add activity log in Firestore
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      timestamp: 'Just now',
      type: 'forecast_adjusted',
      title: `Recorded ${newTx.type === 'income' ? 'Money In' : 'Money Out'} Entry`,
      description: `${newTx.description} (${newTx.partyName || newTx.category}): ${newTx.type === 'income' ? '+' : '-'}${formatRupee(newTx.amount)}.`,
      status: 'success',
    };
    await setDoc(doc(db, 'logs', logId), newLog);
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
        // Update invoice in Firestore
        await updateDoc(doc(db, 'invoices', invoice.id), {
          lastReminderSent: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reminderCount: invoice.reminderCount + 1,
        });

        // Add to activity logs in Firestore
        const logId = `log-${Date.now()}`;
        const newLog: ActivityLog = {
          id: logId,
          timestamp: 'Just now',
          type: 'reminder_sent',
          title: `Sent Payment Reminder`,
          description: `Email delivered to ${invoice.clientCompany} (${invoice.clientEmail}) for Invoice #${invoice.invoiceNumber} (${formatRupee(invoice.amount)}).`,
          channel: 'email',
          status: 'success',
        };
        await setDoc(doc(db, 'logs', logId), newLog);
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    }
  };

  // Handle Mark Invoice Paid
  const handleMarkPaid = async (invoiceId: string) => {
    await updateDoc(doc(db, 'invoices', invoiceId), {
      status: 'paid',
      daysOverdue: 0
    });

    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      // Add transaction to money ledger automatically!
      await handleAddTransaction({
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

      const logId = `log-${Date.now()}`;
      const newLog: ActivityLog = {
        id: logId,
        timestamp: 'Just now',
        type: 'reminder_sent',
        title: 'Invoice Payment Received',
        description: `Invoice #${inv.invoiceNumber} from ${inv.clientCompany} (${formatRupee(inv.amount)}) marked as paid and cleared.`,
        status: 'success',
      };
      await setDoc(doc(db, 'logs', logId), newLog);
    }
  };

  // Handle Verify Expense
  const handleVerifyExpense = async (expenseId: string) => {
    await updateDoc(doc(db, 'expenses', expenseId), {
      status: 'verified',
      reviewedByOwner: true
    });

    const exp = expenses.find((e) => e.id === expenseId);
    if (exp) {
      const logId = `log-${Date.now()}`;
      const newLog: ActivityLog = {
        id: logId,
        timestamp: 'Just now',
        type: 'expense_verified',
        title: 'Expense Verified',
        description: `Verified ${formatRupee(exp.amount)} charge from ${exp.merchant} (${exp.category}).`,
        status: 'success',
      };
      await setDoc(doc(db, 'logs', logId), newLog);
    }
  };

  // Handle Dispute Expense
  const handleDisputeExpense = async (expenseId: string) => {
    await updateDoc(doc(db, 'expenses', expenseId), {
      status: 'disputed'
    });

    const exp = expenses.find((e) => e.id === expenseId);
    if (exp) {
      const logId = `log-${Date.now()}`;
      const newLog: ActivityLog = {
        id: logId,
        timestamp: 'Just now',
        type: 'expense_disputed',
        title: 'Expense Flagged for Dispute',
        description: `Dispute flagged for ${formatRupee(exp.amount)} charge from ${exp.merchant}. Vendor contact notified.`,
        status: 'success',
      };
      await setDoc(doc(db, 'logs', logId), newLog);
    }
  };

  // Handle Add Invoice
  const handleAddInvoice = async (newInv: Invoice) => {
    await setDoc(doc(db, 'invoices', newInv.id), newInv);
    fetchAiBriefing([newInv, ...invoices]);
  };

  // Handle Add Expense
  const handleAddExpense = async (newExp: Expense) => {
    await setDoc(doc(db, 'expenses', newExp.id), newExp);
    fetchAiBriefing(invoices, [newExp, ...expenses]);
  };

  // Handle Update Template
  const handleUpdateTemplate = async (updatedTemplate: ReminderTemplate) => {
    await setDoc(doc(db, 'templates', updatedTemplate.stage), updatedTemplate);
  };

  // Handle Company Financial Setup / Reset
  const handleSaveCompanySetup = async (
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
    const updatedForecast = {
      ...cashForecast,
      currentBalance: profile.startingBalance,
      monthlyBurnRate: profile.monthlyBudget,
      daysUntilShortfall:
        profile.monthlyBudget > 0
          ? Math.round((profile.startingBalance / profile.monthlyBudget) * 30)
          : 90,
    };
    await setDoc(doc(db, 'forecast', 'main'), updatedForecast);

    if (presetType === 'blank') {
      const invsSnap = await getDocs(collection(db, 'invoices'));
      for (const d of invsSnap.docs) {
        await deleteDoc(doc(db, 'invoices', d.id));
      }
      const expsSnap = await getDocs(collection(db, 'expenses'));
      for (const d of expsSnap.docs) {
        await deleteDoc(doc(db, 'expenses', d.id));
      }
      const txsSnap = await getDocs(collection(db, 'transactions'));
      for (const d of txsSnap.docs) {
        await deleteDoc(doc(db, 'transactions', d.id));
      }

      const initTx = {
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
      };
      await setDoc(doc(db, 'transactions', initTx.id), initTx);
    }

    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      timestamp: 'Just now',
      type: 'forecast_adjusted',
      title: 'Company Financial Profile Onboarded',
      description: `Loaded starting balance of ${formatRupee(
        profile.startingBalance
      )} and profile for ${profile.name}.`,
      status: 'success',
    };
    await setDoc(doc(db, 'logs', logId), newLog);
    setShowCompanySetup(false);
  };

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const anomalyCount = expenses.filter((e) => e.isAnomaly && e.status !== 'verified').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4 animate-duration-1000"></div>
        <p className="text-slate-400 font-medium">OpsPilot: Syncing with Firestore...</p>
      </div>
    );
  }

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
            isAutopilotEnabled={isAutopilotEnabled}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTracker
            expenses={expenses}
            onVerifyExpense={handleVerifyExpense}
            onDisputeExpense={handleDisputeExpense}
            onAddExpense={handleAddExpense}
            isAutopilotEnabled={isAutopilotEnabled}
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
