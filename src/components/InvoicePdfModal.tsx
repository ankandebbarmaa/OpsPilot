import React, { useState } from 'react';
import { Invoice, formatRupee } from '../types';
import { OpsPilotLogo } from './OpsPilotLogo';
import { FileText, Printer, Download, X, CheckCircle2, ShieldAlert, Mail, Send, AlertCircle } from 'lucide-react';

interface InvoicePdfModalProps {
  invoice: Invoice | null;
  companyName: string;
  onClose: () => void;
  onSendEmail?: (invoice: Invoice) => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  invoice,
  companyName,
  onClose,
  onSendEmail,
}) => {
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFormattedHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoice.invoiceNumber} - ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
    .logo-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .inv-no { font-size: 20px; font-weight: 800; font-family: monospace; color: #1e293b; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 6px; }
    .paid { background: #dcfce7; color: #166534; }
    .overdue { background: #ffe4e6; color: #991b1b; }
    .pending { background: #fef3c7; color: #92400e; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: #f8fafc; padding: 20px; border-radius: 12px; font-size: 13px; margin-bottom: 24px; }
    .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 280px; margin-left: auto; margin-top: 24px; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand-total { border-top: 2px solid #0f172a; padding-top: 10px; font-weight: 800; font-size: 16px; color: #2563eb; }
    .footer { margin-top: 32px; background: #f8fafc; padding: 16px; border-radius: 12px; font-size: 12px; color: #475569; }
    @media print { body { background: #fff; padding: 0; } .invoice-card { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="logo-title">${companyName}</h1>
        <p class="subtitle">Official Commercial Tax Invoice • Powered by OpsPilot</p>
      </div>
      <div style="text-align: right;">
        <div class="label">INVOICE NUMBER</div>
        <div class="inv-no">#${invoice.invoiceNumber}</div>
        <div class="status-badge ${invoice.status}">${invoice.status}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="label">BILLED TO</div>
        <strong>${invoice.clientCompany}</strong><br>
        Attn: ${invoice.clientName}<br>
        Email: ${invoice.clientEmail}<br>
        Phone: ${invoice.clientPhone}
      </div>
      <div style="text-align: right;">
        <div class="label">INVOICE DETAILS</div>
        Issue Date: <strong>${invoice.issueDate}</strong><br>
        Due Date: <strong>${invoice.dueDate}</strong><br>
        Payment Type: <strong>${(invoice.paymentType || 'full').toUpperCase()}</strong>
      </div>
    </div>

    ${invoice.notes ? `<div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 12px; border-radius: 6px; font-size: 12px; color: #0369a1; margin-bottom: 24px;"><strong>Invoice Description & Payment Notes:</strong><br>${invoice.notes}</div>` : ''}

    <div class="label">BILLED ITEMS / SERVICES</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price (₹)</th>
          <th style="text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
          <tr>
            <td><strong>${item.description}</strong></td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
            <td style="text-align: right;"><strong>₹${item.amount.toLocaleString('en-IN')}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal:</span><strong>₹${invoice.amount.toLocaleString('en-IN')}</strong></div>
      <div class="totals-row"><span>Taxes:</span><strong>₹0</strong></div>
      <div class="totals-row grand-total"><span>Total Due:</span><span>₹${invoice.amount.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="footer">
      <strong>Remittance & Bank Details:</strong><br>
      Account Name: ${companyName} Primary Operating Account<br>
      Bank: HDFC Bank India · Account No: XXXX-XXXX-4892 · IFSC: HDFC0001234
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.invoiceNumber}_${invoice.clientCompany.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerEmailSend = async () => {
    if (onSendEmail) {
      onSendEmail(invoice);
      return;
    }

    setIsEmailing(true);
    setEmailSuccess(null);
    try {
      const res = await fetch('/api/resend/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice,
          customMessage: `Invoice #${invoice.invoiceNumber} attached for payment clearance.`,
          recipientEmail: invoice.clientEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccess(`Email dispatched to ${invoice.clientEmail}!`);
      } else {
        setEmailSuccess(`Email status: ${data.message || 'Queued'}`);
      }
    } catch (e: any) {
      setEmailSuccess('Email request processed.');
    } finally {
      setIsEmailing(false);
    }
  };

  const getPaymentTypeLabel = (type?: string) => {
    switch (type) {
      case 'advance':
        return { label: 'Advance Deposit', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'final':
        return { label: 'Final Settlement', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'milestone':
        return { label: 'Milestone Payment', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'retainer':
        return { label: 'Monthly Retainer', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
      default:
        return { label: 'Full Payment (100%)', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const payTypeBadge = getPaymentTypeLabel(invoice.paymentType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Modal Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm text-white">
                Invoice PDF Preview (#{invoice.invoiceNumber})
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                Download printable tax document or send email directly
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadFormattedHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              title="Download Formatted Printable HTML/PDF Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleTriggerEmailSend}
              disabled={isEmailing}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              title="Send invoice to client email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isEmailing ? 'Sending...' : 'Email Invoice'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {emailSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-2.5 px-4 text-xs font-bold text-emerald-800 flex items-center justify-between shrink-0">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              {emailSuccess}
            </span>
            <button onClick={() => setEmailSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
          </div>
        )}

        {/* Printable Invoice Document Body */}
        <div className="p-8 overflow-y-auto font-sans text-slate-900 bg-white space-y-6" id="printable-invoice">
          {/* Document Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center space-x-2.5">
                <OpsPilotLogo size={36} />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {companyName}
                  </h1>
                  <p className="text-xs text-slate-500">Official Commercial Tax Invoice • Powered by OpsPilot</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                INVOICE
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                #{invoice.invoiceNumber}
              </span>
              <div className="mt-1 flex flex-col items-end space-y-1">
                {invoice.status === 'paid' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> PAID
                  </span>
                )}
                {invoice.status === 'overdue' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <ShieldAlert className="w-3 h-3 mr-1" /> OVERDUE ({invoice.daysOverdue} days)
                  </span>
                )}
                {invoice.status === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    PENDING PAYMENT
                  </span>
                )}
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${payTypeBadge.bg}`}>
                  {payTypeBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Client Information */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Billed To (Client):
              </p>
              <p className="font-bold text-slate-900 text-sm">{invoice.clientCompany}</p>
              <p className="text-slate-600 font-medium">Attn: {invoice.clientName}</p>
              <p className="text-slate-500">{invoice.clientEmail}</p>
              <p className="text-slate-500">{invoice.clientPhone}</p>
            </div>

            <div className="text-right space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Invoice Details:
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Issued On:</span> <strong className="font-semibold text-slate-900">{invoice.issueDate}</strong>
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Payment Due:</span> <strong className="font-semibold text-rose-700">{invoice.dueDate}</strong>
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Payment Structure:</span> <strong className="font-semibold text-indigo-700">{payTypeBadge.label}</strong>
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Currency:</span> <strong className="font-semibold text-slate-900">INR (₹)</strong>
              </p>
            </div>
          </div>

          {/* Invoice Description / Terms callout */}
          {invoice.notes && (
            <div className="bg-sky-50 border-l-4 border-sky-500 p-3.5 rounded-r-xl text-xs text-sky-900 space-y-0.5">
              <p className="font-bold text-sky-950 uppercase tracking-wider text-[10px]">Invoice Description & Scope / Payment Notes:</p>
              <p className="font-medium text-sky-900 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Billed Items / Services
            </p>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-normal">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatRupee(item.unitPrice)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatRupee(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatRupee(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (GST 0% / Included):</span>
                <span className="font-semibold text-slate-900">₹0</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-900 pt-2 text-slate-900">
                <span>Total Amount Due:</span>
                <span className="text-indigo-700">{formatRupee(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Remittance & Bank Footnote */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Remittance & Bank Transfer Details:</p>
            <p>Account Name: <strong className="text-slate-800">{companyName} Primary Operating Account</strong></p>
            <p>Bank: HDFC Bank India · Account No: XXXX-XXXX-4892 · IFSC: HDFC0001234</p>
            <p className="text-[11px] text-slate-400 mt-2">
              If you have any questions regarding this invoice, please reach out to accounts@{companyName.toLowerCase().replace(/\s+/g, '')}.com
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>Client Email: <strong className="text-slate-700">{invoice.clientEmail}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerEmailSend}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Invoice Email</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

