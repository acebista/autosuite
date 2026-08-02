import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, Package, Shield, Landmark, Truck, ClipboardList } from 'lucide-react';
import { AllotmentLetterModal } from './AllotmentLetterModal';

// ─── Shared Letterhead Configuration ──────────────────────────────────────────

export const LETTERHEAD = {
  company: 'APOLLO MOTORS PVT. LTD.',
  tagline: 'Authorized Distributor of Changan Vehicles',
  vat: 'VAT No: 623559039',
  address: 'Maharajgunj-4, Kathmandu, Nepal',
  tel: '+977-1-4412066 | Mob: +977-9851090652',
  email: 'info.apollomotors@gmail.com',
  rep: 'Urmila Bishwokarma',
  repTitle: 'Accounts Manager',
  repPhone: '+977-9712066053',
  accent: '#f26522',
};

const todayNP = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtNum = (n?: number | null) => n ? n.toLocaleString() : '0';

export const PRINT_STYLES = (areaId: string, portalId: string) => `
  @media print {
    @page {
      size: A4 portrait;
      margin: 0.5cm;
    }
    html, body {
      height: 100% !important;
      overflow: hidden !important;
    }
    body * { visibility: hidden !important; }
    #${portalId}, #${portalId} * { visibility: visible !important; }
    #${portalId} {
      position: absolute !important; left: 0 !important; top: 0 !important;
      width: 100% !important; margin: 0 !important; padding: 0 !important;
      overflow: hidden !important; background: white !important;
    }
    .print-hide, .print-hide * { display: none !important; }
    .portal-modal-content {
      border-radius: 0 !important; box-shadow: none !important;
      max-height: none !important; overflow: hidden !important;
      background: white !important; width: 100% !important; max-width: none !important;
    }
    #${areaId} {
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      position: absolute !important;
      left: 0 !important; top: 0 !important;
      width: 100% !important; max-width: 100% !important;
      height: 27.7cm !important;
      max-height: 27.7cm !important;
      margin: 0 !important;
      padding: 0.8cm 1cm !important;
      border: none !important;
      box-shadow: none !important; background: white !important;
      font-size: 9.5pt !important;
      box-sizing: border-box !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    #${areaId}.custom-template-active {
      padding-top: 3.4cm !important;
      padding-bottom: 2.2cm !important;
    }
    table {
      table-layout: fixed !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    th, td {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
    }
    .doc-editable {
      border-bottom: none !important;
      background-color: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      outline: none !important;
      box-shadow: none !important;
    }
  }
  .doc-editable {
    outline: none;
    border-bottom: 1px dashed #cbd5e1;
    background-color: transparent;
    padding: 1px 3px;
    border-radius: 2px;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: #0f172a;
    transition: all 0.15s ease-in-out;
    display: inline-block;
    cursor: text;
    word-break: break-word;
    white-space: normal;
  }
  .doc-editable:hover {
    background-color: #f8fafc;
    border-bottom-color: #94a3b8;
  }
  .doc-editable:focus {
    border-bottom: 1.5px solid #2563eb;
    background-color: #eff6ff;
  }
`;

export const EditableText: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className = '', placeholder = '' }) => {
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const val = e.currentTarget.textContent || '';
        setText(val);
        onChange(val);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`doc-editable ${className}`}
      data-placeholder={placeholder}
    >
      {text || placeholder}
    </span>
  );
};

// ─── Shared Letterhead Header & Footer ────────────────────────────────────────

export const DocHeader = () => (
  <div style={{ borderBottom: `2px solid ${LETTERHEAD.accent}` }} className="pb-3 mb-4 flex justify-between items-start">
    <div className="flex items-center gap-3">
      <img
        src="/logo3.png"
        alt="Apollo Motors"
        className="h-11 object-contain"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{LETTERHEAD.company}</h1>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{LETTERHEAD.tagline}</p>
      </div>
    </div>
    <div className="text-right text-[9.5px] text-slate-600 font-medium space-y-0.5">
      <p className="font-bold text-slate-900">{LETTERHEAD.vat}</p>
      <p>{LETTERHEAD.address}</p>
      <p>Tel: {LETTERHEAD.tel}</p>
      <p>Email: {LETTERHEAD.email}</p>
    </div>
  </div>
);

export const DocFooter = () => (
  <div
    style={{ backgroundColor: LETTERHEAD.accent }}
    className="mt-6 py-2.5 px-6 text-white flex flex-col justify-center items-center rounded-sm print-color-adjust-exact"
  >
    <div className="font-bold text-xs tracking-wide">{LETTERHEAD.company}</div>
    <div className="flex justify-center items-center gap-4 mt-0.5 text-[9.5px] text-white/90">
      <span>Email: {LETTERHEAD.email}</span>
      <span>•</span>
      <span>Address: {LETTERHEAD.address}</span>
      <span>•</span>
      <span>Tel: {LETTERHEAD.tel}</span>
    </div>
  </div>
);

export const DocSignature = ({ name = LETTERHEAD.rep, title = LETTERHEAD.repTitle }: { name?: string; title?: string }) => (
  <div className="pt-4 text-right space-y-1 text-xs">
    <p className="font-bold text-slate-400">......................................</p>
    <p className="font-bold text-slate-900 text-xs">Regards, With Official Stamp</p>
    <p className="font-black text-slate-900 pt-1 text-xs">{name}</p>
    <p className="font-bold text-slate-600 text-[11px]">{title}</p>
    <p className="font-bold text-slate-800 text-[11px]">{LETTERHEAD.company}</p>
  </div>
);

interface DocShellProps {
  portalId: string;
  areaId: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  hideHeaderFooter?: boolean;
}

const DocShell: React.FC<DocShellProps> = ({ portalId, areaId, title, onClose, children, hideHeaderFooter = false }) => {
  const [templateMode, setTemplateMode] = useState<'generated' | 'custom'>(() => {
    return localStorage.getItem('autosuite_letterhead_bg') ? 'custom' : 'generated';
  });
  const [customBg, setCustomBg] = useState<string>(() => localStorage.getItem('autosuite_letterhead_bg') || '');

  useEffect(() => {
    const storedBg = localStorage.getItem('autosuite_letterhead_bg') || '';
    setCustomBg(storedBg);
    if (storedBg && templateMode === 'generated') {
      setTemplateMode('custom');
    }
  }, []);

  return createPortal(
    <div id={portalId} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-slate-700 portal-modal-content">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print-hide">
          <div>
            <h3 className="text-lg font-black">{title}</h3>
            <p className="text-slate-400 text-xs">Edit any field inline before printing or saving to PDF</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Template Selector Button Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTemplateMode('generated')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${templateMode === 'generated' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-transparent'}`}
              >
                Standard Header
              </button>
              <button
                type="button"
                onClick={() => setTemplateMode('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${templateMode === 'custom' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-transparent'}`}
              >
                Custom Letterhead Template {customBg ? '✓' : ''}
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white border-none bg-transparent"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 md:p-12 overflow-y-auto flex-1 flex justify-center bg-slate-200">
          <div
            id={areaId}
            className={`bg-white text-black w-[21cm] max-w-full min-h-[28cm] max-h-[29.7cm] p-[1.5cm] shadow-lg font-serif leading-relaxed text-sm relative border border-slate-300 flex flex-col justify-between box-sizing-border overflow-hidden ${templateMode === 'custom' ? 'custom-template-active' : ''}`}
          >
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES(areaId, portalId) }} />

            {/* Render custom PDF background image if in custom template mode */}
            {templateMode === 'custom' && customBg ? (
              <img
                src={customBg}
                alt="Letterhead Template"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
              />
            ) : null}

            <div className={`relative z-10 ${templateMode === 'custom' ? 'pt-20 pb-8' : ''}`}>
              {templateMode === 'generated' && !hideHeaderFooter && <DocHeader />}
              {children}
            </div>
            {templateMode === 'generated' && !hideHeaderFooter && <DocFooter />}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── 1. GOODS RECEIVED NOTE (GRN) ─────────────────────────────────────────────

interface GRNDocProps { isOpen: boolean; onClose: () => void; vehicle: any; pi: any; }

export const GRNDocument: React.FC<GRNDocProps> = ({ isOpen, onClose, vehicle, pi }) => {
  const [date, setDate] = useState('21st May 2026');
  const [toCompany, setToCompany] = useState('MAW VRIDDHI AUTOCORP PVT LTD');
  const [toAddress, setToAddress] = useState('NAXAL, KATHMANDU');
  const [piNo, setPiNo] = useState('MV-KTM-083-001');
  const [piDate, setPiDate] = useState('May 13, 2026');
  const [supplierName, setSupplierName] = useState('M.A.W. VRIDDHI AUTOCORP PVT. LTD.');
  const [supplierVat, setSupplierVat] = useState('610014662');
  const [lcNo, setLcNo] = useState('26DCD2NPR077149');
  const [lcDate, setLcDate] = useState('May 15, 2026');
  const [lcBank, setLcBank] = useState('NABIL BANK');
  const [buyerName, setBuyerName] = useState('Apollo Motors Pvt. Ltd.');
  const [buyerVat, setBuyerVat] = useState('623559039');
  
  // Table row inputs
  const [model, setModel] = useState('Deepal S05 MAX');
  const [motorNo, setMotorNo] = useState('XTDM70SKEAA000883');
  const [vin, setVin] = useState('LS6CMEON4TC911101');
  const [color, setColor] = useState('Deep Space Black');
  const [receivedDate, setReceivedDate] = useState('21/05/2026');
  const [amount, setAmount] = useState('5,599,000');
  
  // Signatures
  const [signName, setSignName] = useState('Urmila Bishwokarma');
  const [signTitle, setSignTitle] = useState('Accounts Manager');

  useEffect(() => {
    if (vehicle) {
      setModel(vehicle.model || 'Deepal S05 MAX');
      setVin(vehicle.vin || vehicle.chassisNo || 'LS6CMEON4TC911101');
      setMotorNo(vehicle.motorNo || 'XTDM70SKEAA000883');
      setColor(vehicle.color || 'Deep Space Black');
      if (vehicle.receivedAt) {
        setReceivedDate(new Date(vehicle.receivedAt).toLocaleDateString('en-GB'));
      }
      if (vehicle.cost) {
        setAmount(`${vehicle.cost.toLocaleString()}`);
      } else if (vehicle.price) {
        setAmount(`${vehicle.price.toLocaleString()}`);
      }
    }
    if (pi) {
      setPiNo(pi.piNumber || 'MV-KTM-083-001');
      if (pi.issueDate) {
        setPiDate(new Date(pi.issueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
      }
      setSupplierName(pi.supplier === 'MAW' ? 'M.A.W. VRIDDHI AUTOCORP PVT. LTD.' : pi.supplier || 'M.A.W. VRIDDHI AUTOCORP PVT. LTD.');
      if (pi.lc) {
        setLcNo(pi.lc.lcNumber || '26DCD2NPR077149');
        if (pi.lc.openingDate) {
          setLcDate(new Date(pi.lc.openingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
        }
        setLcBank((pi.lc.bankName || 'NABIL BANK').toUpperCase());
      }
    }
  }, [vehicle, pi]);

  if (!isOpen) return null;

  return (
    <DocShell portalId="grn-portal" areaId="printable-grn" title="Goods Received Note (GRN)" onClose={onClose}>
      <div className="text-slate-900 text-xs font-serif space-y-4 pt-1">
        
        {/* Date block */}
        <div className="font-bold text-xs">
          Date: - <EditableText value={date} onChange={setDate} className="font-bold text-slate-900" />
        </div>

        {/* Recipient */}
        <div className="space-y-0.5 font-bold uppercase text-xs">
          <p>TO,</p>
          <p><EditableText value={toCompany} onChange={setToCompany} className="font-bold" /></p>
          <p><EditableText value={toAddress} onChange={setToAddress} className="font-bold" /></p>
        </div>

        {/* Center Subject */}
        <div className="text-center font-bold text-sm py-2">
          <span className="underline uppercase tracking-wide">
            SUBJECT: - GOODS RECEIVED NOTE (GRN)
          </span>
        </div>

        {/* Certify Paragraph */}
        <p className="leading-relaxed text-justify text-xs">
          This is to certify that we have received the below mentioned vehicles as per the pro forma invoice number{' '}
          <EditableText value={piNo} onChange={setPiNo} className="font-bold text-slate-900" /> Dated on{' '}
          <EditableText value={piDate} onChange={setPiDate} className="font-bold text-slate-900" /> from{' '}
          <EditableText value={supplierName} onChange={setSupplierName} className="font-bold text-slate-900" /> (VAT No:{' '}
          <EditableText value={supplierVat} onChange={setSupplierVat} className="font-bold text-slate-900" />) under the LC no.{' '}
          <EditableText value={lcNo} onChange={setLcNo} className="font-bold text-slate-900" /> dated{' '}
          <EditableText value={lcDate} onChange={setLcDate} className="font-bold text-slate-900" /> of{' '}
          <EditableText value={lcBank} onChange={setLcBank} className="font-bold text-slate-900" /> on account of{' '}
          <EditableText value={buyerName} onChange={setBuyerName} className="font-bold text-slate-900" /> (VAT No:{' '}
          <EditableText value={buyerVat} onChange={setBuyerVat} className="font-bold text-slate-900" />)
        </p>

        {/* Declaration Paragraph */}
        <p className="font-bold text-xs">
          Further we have declared that the vehicle was received on good condition and freight as prepaid.
        </p>

        {/* Table fixed layout */}
        <table className="w-full table-fixed border-collapse border border-slate-900 text-[11px] font-semibold mt-3">
          <thead>
            <tr className="border-b border-slate-900 text-center font-bold bg-slate-50">
              <th className="border border-slate-900 p-1.5 w-[5%] text-center">S.No.</th>
              <th className="border border-slate-900 p-1.5 w-[18%] text-center">Vehicle Model</th>
              <th className="border border-slate-900 p-1.5 w-[21%] text-center">Motor No</th>
              <th className="border border-slate-900 p-1.5 w-[23%] text-center">Chassis No</th>
              <th className="border border-slate-900 p-1.5 w-[10%] text-center">Color</th>
              <th className="border border-slate-900 p-1.5 w-[11.5%] text-center">Received Date</th>
              <th className="border border-slate-900 p-1.5 w-[11.5%] text-center">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center font-bold">
              <td className="border border-slate-900 p-1.5 text-center">1</td>
              <td className="border border-slate-900 p-1.5 text-left leading-tight">
                <EditableText value={model} onChange={setModel} className="font-bold" />
              </td>
              <td className="border border-slate-900 p-1.5 text-center">
                <EditableText value={motorNo} onChange={setMotorNo} className="font-mono font-bold text-[9px] break-all leading-tight" />
              </td>
              <td className="border border-slate-900 p-1.5 text-center">
                <EditableText value={vin} onChange={setVin} className="font-mono font-bold text-[9px] break-all leading-tight" />
              </td>
              <td className="border border-slate-900 p-1.5 text-center leading-tight">
                <EditableText value={color} onChange={setColor} className="font-bold text-[9.5px]" />
              </td>
              <td className="border border-slate-900 p-1.5 text-center text-[9.5px] leading-tight whitespace-nowrap">
                <EditableText value={receivedDate} onChange={setReceivedDate} className="font-bold" />
              </td>
              <td className="border border-slate-900 p-1.5 text-center text-[9.5px] leading-tight whitespace-nowrap">
                <EditableText value={amount} onChange={setAmount} className="font-mono font-bold" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures block */}
        <div className="flex justify-end pt-4">
          <DocSignature name={signName} title={signTitle} />
        </div>

      </div>
    </DocShell>
  );
};

// ─── 2. INSURANCE ACTIVATION LETTER ───────────────────────────────────────────

interface InsuranceLetterProps { isOpen: boolean; onClose: () => void; deal: any; vehicle: any; }

export const InsuranceActivationLetter: React.FC<InsuranceLetterProps> = ({ isOpen, onClose, deal, vehicle }) => {
  const [date, setDate] = useState(todayNP());
  const [policyNo, setPolicyNo] = useState('');
  const [insurer, setInsurer] = useState('NIL Insurance Co. Ltd.');
  const [customerName, setCustomerName] = useState('');
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [motorNo, setMotorNo] = useState('');
  const [regNo, setRegNo] = useState('');
  const [color, setColor] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayNP());
  const [expiryDate, setExpiryDate] = useState('');
  const [sumInsured, setSumInsured] = useState('');

  useEffect(() => {
    if (deal) {
      setCustomerName(deal.customer?.name || '');
      setPolicyNo(deal.insurancePolicyNo || '');
      setRegNo(deal.registrationNo || vehicle?.registrationNo || '');
      setSumInsured(deal.salePrice ? fmtNum(deal.salePrice) : '');
    }
    if (vehicle) {
      setModel(`${vehicle.model || ''} ${vehicle.variant || ''}`.trim());
      setVin(vehicle.vin || vehicle.chassisNo || '');
      setMotorNo(vehicle.motorNo || '');
      setColor(vehicle.color || '');
    }
  }, [deal, vehicle]);

  if (!isOpen) return null;

  return (
    <DocShell portalId="insurance-portal" areaId="printable-insurance" title="Insurance Activation Letter" onClose={onClose}>
      <div className="space-y-4 text-slate-900 font-serif text-xs">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">Date: <EditableText value={date} onChange={setDate} className="font-bold" /></p>
          </div>
          <div className="text-right text-[11px]">
            <p>Ref: <EditableText value={policyNo} onChange={setPolicyNo} className="font-bold font-mono" placeholder="Policy No." /></p>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="font-bold">To,</p>
          <p className="font-bold">The Branch Manager,</p>
          <p className="font-bold"><EditableText value={insurer} onChange={setInsurer} className="font-bold" placeholder="Insurance Company Name" /></p>
        </div>

        <div className="mt-2">
          <h3 className="font-black text-xs uppercase underline">Subject: Request for Vehicle Insurance Activation</h3>
        </div>

        <p className="font-bold">Dear Sir/Madam,</p>

        <p className="text-justify leading-relaxed">
          We hereby request activation of motor vehicle insurance for the following vehicle purchased by our customer{' '}
          <EditableText value={customerName} onChange={setCustomerName} className="font-bold" placeholder="Customer Name" />.
          All compliance checks, vehicle handover, and ownership records have been duly finalized.
        </p>

        <table className="w-full table-fixed border-collapse border border-slate-900 text-xs">
          <tbody>
            {[
              ['Customer Name', customerName, setCustomerName],
              ['Vehicle Model', model, setModel],
              ['Chassis / VIN', vin, setVin],
              ['Motor / Engine No.', motorNo, setMotorNo],
              ['Color', color, setColor],
              ['Registration No.', regNo, setRegNo],
              ['Insurance Policy No.', policyNo, setPolicyNo],
              ['Effective Date', effectiveDate, setEffectiveDate],
              ['Expiry Date', expiryDate, setExpiryDate],
              ['Sum Insured (NPR)', `NPR ${sumInsured}`, null],
            ].map(([label, value, setter], i) => (
              <tr key={i}>
                <td className="border border-slate-900 px-3 py-1.5 font-bold bg-slate-50 w-[40%]">{label as string}</td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold font-mono w-[60%]">
                  {setter ? (
                    <EditableText value={value as string} onChange={setter as any} className="font-bold w-full" />
                  ) : (
                    <span>{value as string}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-justify leading-relaxed">
          Please process the insurance activation at your earliest convenience and issue the insurance certificate accordingly.
        </p>

        <DocSignature />
      </div>
    </DocShell>
  );
};

function indianNumberToWords(num: number): string {
  if (isNaN(num) || num === 0) return '';
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensMultiple = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const unitLabels = ["Thousand", "Lakh", "Crore"];
  
  const convertChunk = (n: number): string => {
    let res = "";
    if (n >= 100) {
      res += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      res += doubleDigits[n - 10 + 1] + " ";
    } else if (n >= 20) {
      res += tensMultiple[Math.floor(n / 10)] + " " + singleDigits[n % 10] + " ";
    } else if (n > 0) {
      res += singleDigits[n] + " ";
    }
    return res.trim();
  };

  let words = "";
  let hundreds = num % 1000;
  words = convertChunk(hundreds);
  num = Math.floor(num / 1000);
  
  const divisors = [100, 100, 100];
  
  for (let i = 0; i < 3; i++) {
    if (num <= 0) break;
    let currentPart = num % divisors[i];
    if (currentPart > 0) {
      words = convertChunk(currentPart) + " " + unitLabels[i] + " " + words;
    }
    num = Math.floor(num / divisors[i]);
  }
  
  return words.trim();
}

// ─── 3. DISBURSEMENT LETTER ───────────────────────────────────────────────────

interface DisbursementLetterProps { isOpen: boolean; onClose: () => void; deal: any; vehicle: any; }

export const DisbursementLetter: React.FC<DisbursementLetterProps> = ({ isOpen, onClose, deal, vehicle }) => {
  const [date, setDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [financedAmount, setFinancedAmount] = useState('');
  const [financedAmountInWords, setFinancedAmountInWords] = useState('');
  const [doRefNo, setDoRefNo] = useState('DO-NABIL-2026-9081');
  const [doDate, setDoDate] = useState('May 15, 2026');
  const [model, setModel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [transferDate, setTransferDate] = useState('May 21, 2026');

  useEffect(() => {
    const today = new Date();
    setDate(today.toLocaleDateString('en-GB'));
    
    if (deal) {
      setBankName(deal.bankName || '[Enter Bank Name]');
      setBankBranch(deal.bankBranch || '[Enter Bank Branch]');
      setCustomerName(deal.customer?.name || '[Enter Customer Name]');
      setRegNo(deal.registrationNo || vehicle?.registrationNo || '[Enter Registration Number]');
      
      const loanAmt = deal.approvedLoan || 0;
      setFinancedAmount(loanAmt.toLocaleString());
      setFinancedAmountInWords(indianNumberToWords(loanAmt) || '[Enter Financed Amount in Words]');
    } else {
      setBankName('[Enter Bank Name]');
      setBankBranch('[Enter Bank Branch]');
      setCustomerName('[Enter Customer Name]');
      setRegNo('[Enter Registration Number]');
      setFinancedAmount('[Enter Financed Amount]');
      setFinancedAmountInWords('[Enter Financed Amount in Words]');
    }
    
    if (vehicle) {
      setModel(vehicle.model || 'S05');
    } else {
      setModel('[Enter Vehicle Model]');
    }
  }, [deal, vehicle]);

  if (!isOpen) return null;

  return (
    <DocShell portalId="disbursement-portal" areaId="printable-disbursement" title="Bank Disbursement Request Letter" onClose={onClose}>
      <div className="text-slate-900 text-xs font-serif space-y-4 pt-1">
        
        {/* Date */}
        <div>
          <span className="font-bold">Date: </span>
          <EditableText value={date} onChange={setDate} className="font-bold" />
        </div>

        {/* Recipient */}
        <div className="space-y-0.5 font-bold">
          <p>To,</p>
          <p>The Manager</p>
          <p>Credit Department</p>
          <p><EditableText value={bankName} onChange={setBankName} className="font-bold" /></p>
          <p><EditableText value={bankBranch} onChange={setBankBranch} className="font-bold" /></p>
        </div>

        {/* Subject */}
        <div className="pt-1">
          <span className="font-bold underline uppercase text-xs">
            Subject: Request for payment of Rs <EditableText value={financedAmount} onChange={setFinancedAmount} className="font-bold" />
          </span>
        </div>

        {/* Salutation */}
        <div>
          <p className="font-bold">Dear Sir,</p>
        </div>

        {/* Body Paragraph 1 */}
        <p className="leading-relaxed text-justify">
          This is in reference to your Delivery Order Letter Ref No:{' '}
          <EditableText value={doRefNo} onChange={setDoRefNo} className="font-bold" /> dated on{' '}
          <EditableText value={doDate} onChange={setDoDate} className="font-bold" /> issued for the financing of 1-unit Deepal{' '}
          <EditableText value={model} onChange={setModel} className="font-bold" />. Thus, kindly make us the payment of the approved loan of M/S{' '}
          <EditableText value={customerName} onChange={setCustomerName} className="font-bold" /> Amounting Rs{' '}
          <EditableText value={financedAmount} onChange={setFinancedAmount} className="font-bold font-mono" /> (In Words{' '}
          <EditableText value={financedAmountInWords} onChange={setFinancedAmountInWords} className="font-bold" /> only) to Apollo Motors Pvt. Ltd. You are also requested to arrange a Managers Cheque or IPS Transfer for said amount on below details account.
        </p>

        {/* Account Details Block */}
        <div className="pl-4 py-1 space-y-1 text-xs font-semibold max-w-lg">
          <div className="grid grid-cols-3 gap-y-1">
            <span className="text-slate-500 font-bold">Company Name:</span>
            <span className="col-span-2 font-bold text-slate-900">Apollo Motors Pvt. Ltd.</span>
            
            <span className="text-slate-500 font-bold">Bank Name:</span>
            <span className="col-span-2 font-bold text-slate-900">Nabil Bank Limited-Bhatbhateni Branch</span>
            
            <span className="text-slate-500 font-bold">Account Number:</span>
            <span className="col-span-2 font-mono font-bold text-slate-900">13201017500743</span>
          </div>
        </div>

        {/* Body Paragraph 2 */}
        <p className="leading-relaxed text-justify">
          Please be informed that the ownership of vehicle{' '}
          <EditableText value={regNo} onChange={setRegNo} className="font-bold" /> has been transferred in the name of{' '}
          <EditableText value={bankName} onChange={setBankName} className="font-bold" /> dated{' '}
          <EditableText value={transferDate} onChange={setTransferDate} className="font-bold" />.
        </p>

        {/* Body Paragraph 3 */}
        <p className="leading-relaxed text-justify">
          The vehicle registration certificate (Bluebook) and Insurance Copy are provided herewith. Your earliest action in this regard will be highly appreciated.
        </p>

        {/* Signature */}
        <DocSignature />

      </div>
    </DocShell>
  );
};

// ─── 4. DELIVERY NOTE ─────────────────────────────────────────────────────────

interface DeliveryNoteProps { isOpen: boolean; onClose: () => void; deal: any; vehicle: any; }

export const DeliveryNote: React.FC<DeliveryNoteProps> = ({ isOpen, onClose, deal, vehicle }) => {
  const [date, setDate] = useState(todayNP());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddr, setCustomerAddr] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [motorNo, setMotorNo] = useState('');
  const [regNo, setRegNo] = useState('');
  const [deliveredBy, setDeliveredBy] = useState(LETTERHEAD.rep);
  const [odometer, setOdometer] = useState('15');
  const [fuelLevel, setFuelLevel] = useState('Full');
  const [accessories, setAccessories] = useState('Owner manual, 2 keys, Warranty card, Service booklet, Tool kit');

  useEffect(() => {
    if (deal) {
      setCustomerName(deal.customer?.name || '');
      setCustomerPhone(deal.customer?.phone || '');
      setCustomerAddr(deal.customer?.address || '');
      setRegNo(deal.registrationNo || vehicle?.registrationNo || '');
    }
    if (vehicle) {
      setModel(`${vehicle.model || ''} ${vehicle.variant || ''}`.trim());
      setColor(vehicle.color || '');
      setVin(vehicle.vin || vehicle.chassisNo || '');
      setMotorNo(vehicle.motorNo || '');
    }
  }, [deal, vehicle]);

  if (!isOpen) return null;

  return (
    <DocShell portalId="delivery-portal" areaId="printable-delivery" title="Delivery Note / Gate Pass" onClose={onClose}>
      <div className="space-y-4 text-slate-900 font-serif text-xs">
        <div className="flex justify-between items-start">
          <h3 className="font-black text-sm uppercase underline">Vehicle Delivery Note</h3>
          <p className="font-bold text-[11px]">Date: <EditableText value={date} onChange={setDate} className="font-bold" /></p>
        </div>

        <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs space-y-1.5">
          <p className="font-black text-xs text-slate-900 uppercase tracking-wide">Customer Details</p>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-bold">Name: </span><EditableText value={customerName} onChange={setCustomerName} className="font-bold" /></div>
            <div><span className="font-bold">Phone: </span><EditableText value={customerPhone} onChange={setCustomerPhone} className="font-bold" /></div>
            <div className="col-span-2"><span className="font-bold">Address: </span><EditableText value={customerAddr} onChange={setCustomerAddr} className="font-bold" /></div>
          </div>
        </div>

        <h4 className="font-bold underline text-xs uppercase">Vehicle Details at Handover</h4>
        <table className="w-full table-fixed border-collapse border border-slate-900 text-xs">
          <tbody>
            {[
              ['Model & Variant', model, setModel],
              ['Color', color, setColor],
              ['Chassis / VIN', vin, setVin],
              ['Motor / Engine No.', motorNo, setMotorNo],
              ['Registration Number', regNo, setRegNo],
              ['Odometer Reading (km)', odometer, setOdometer],
              ['Fuel Level', fuelLevel, setFuelLevel],
            ].map(([label, value, setter], i) => (
              <tr key={i}>
                <td className="border border-slate-900 px-3 py-1.5 font-bold bg-slate-50 w-[40%]">{label as string}</td>
                <td className="border border-slate-900 px-3 py-1.5 font-bold w-[60%]">
                  <EditableText value={value as string} onChange={setter as any} className="font-bold w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div>
          <p className="text-xs font-bold mb-1">Accessories & Documents Handed Over:</p>
          <EditableText value={accessories} onChange={setAccessories} className="font-bold w-full text-xs" />
        </div>

        <div className="bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-xs">
          <p className="font-bold text-slate-900">Customer Acknowledgment</p>
          <p className="mt-0.5">I, the undersigned, hereby confirm receipt of the above vehicle in good condition along with the listed accessories and documents.</p>
        </div>

        <div className="grid grid-cols-2 gap-12 pt-4">
          <div className="text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Customer Signature</p>
              <p className="mt-4 font-bold">{customerName}</p>
              <p className="text-slate-500">{customerPhone}</p>
            </div>
          </div>
          <div className="text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Delivered By</p>
              <EditableText value={deliveredBy} onChange={setDeliveredBy} className="font-bold text-center mt-4" />
              <p className="text-slate-500">{LETTERHEAD.company}</p>
            </div>
          </div>
        </div>
      </div>
    </DocShell>
  );
};

// ─── 5. PDI / VEHICLE HANDOVER CHECKLIST ─────────────────────────────────────

interface PDIChecklistProps { isOpen: boolean; onClose: () => void; deal: any; vehicle: any; }

export const PDIChecklist: React.FC<PDIChecklistProps> = ({ isOpen, onClose, deal, vehicle }) => {
  const [date, setDate] = useState(todayNP());
  const [model, setModel] = useState('');
  const [vin, setVin] = useState('');
  const [color, setColor] = useState('');
  const [inspectedBy, setInspectedBy] = useState('PDI Specialist');

  const CHECKLIST_ITEMS = [
    { section: 'Exterior', items: ['Body paint — no scratches/dents', 'All glass intact', 'All lights functional', 'Tyres — no cuts, correct pressure', 'Alloy wheels undamaged', 'Mirrors operational'] },
    { section: 'Interior', items: ['Dashboard — no damage', 'Seats — no tears/stains', 'Seatbelts functional', 'Air conditioning working', 'All windows operational', 'Infotainment/display working'] },
    { section: 'Mechanical', items: ['Engine starts normally', 'No oil/coolant leaks', 'Brake pedal firm', 'Handbrake working', 'Steering smooth', 'Battery fully charged'] },
    { section: 'Electrical / Safety', items: ['Airbags — no warning lights', 'ABS light off', 'TPMS normal', 'EV battery SoC > 80%', 'All sensors operational', 'ADAS calibrated'] },
    { section: 'Documents', items: ['Registration certificate', 'Insurance policy', 'Warranty card', 'Service booklet', 'Owner\'s manual', '2× spare keys'] },
  ];

  useEffect(() => {
    if (vehicle) {
      setModel(`${vehicle.model || ''} ${vehicle.variant || ''}`.trim());
      setVin(vehicle.vin || vehicle.chassisNo || '');
      setColor(vehicle.color || '');
    }
  }, [vehicle]);

  if (!isOpen) return null;

  return (
    <DocShell portalId="pdi-portal" areaId="printable-pdi" title="PDI / Pre-Delivery Inspection Checklist" onClose={onClose}>
      <div className="space-y-3 text-slate-900 font-serif text-xs">
        <div className="flex justify-between items-start">
          <h3 className="font-black text-sm uppercase underline">Pre-Delivery Inspection (PDI) Report</h3>
          <p className="font-bold text-[11px]">Date: <EditableText value={date} onChange={setDate} className="font-bold" /></p>
        </div>

        <div className="flex gap-4 text-xs">
          <span className="font-bold">Model: <EditableText value={model} onChange={setModel} className="font-bold" /></span>
          <span className="font-bold">VIN: <EditableText value={vin} onChange={setVin} className="font-mono font-bold" /></span>
          <span className="font-bold">Color: <EditableText value={color} onChange={setColor} className="font-bold" /></span>
        </div>

        {CHECKLIST_ITEMS.map(section => (
          <div key={section.section}>
            <p className="font-black text-[10px] uppercase bg-slate-800 text-white px-2 py-0.5 rounded-sm">{section.section}</p>
            <table className="w-full table-fixed border-collapse border border-slate-900 text-[10px] mt-0.5">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-900 px-2 py-1 text-left font-bold w-[50%]">Check Item</th>
                  <th className="border border-slate-900 px-2 py-1 text-center font-bold w-[12%]">OK</th>
                  <th className="border border-slate-900 px-2 py-1 text-center font-bold w-[12%]">Fail</th>
                  <th className="border border-slate-900 px-2 py-1 text-left font-bold w-[26%]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="border border-slate-900 px-2 py-0.5">{item}</td>
                    <td className="border border-slate-900 px-2 py-0.5 text-center font-bold text-emerald-700">✓</td>
                    <td className="border border-slate-900 px-2 py-0.5 text-center"></td>
                    <td className="border border-slate-900 px-2 py-0.5 text-slate-500 font-medium text-[9px]">Verified</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-12 pt-2">
          <div className="text-center text-xs">
            <div className="border-t border-slate-400 pt-1">
              <p className="font-bold">Inspected By (Technician)</p>
              <EditableText value={inspectedBy} onChange={setInspectedBy} className="font-bold text-center mt-2" placeholder="Name" />
            </div>
          </div>
          <div className="text-center text-xs">
            <div className="border-t border-slate-400 pt-1">
              <p className="font-bold">Approved By (Showroom Manager)</p>
              <p className="mt-2 font-bold">{LETTERHEAD.rep}</p>
            </div>
          </div>
        </div>
      </div>
    </DocShell>
  );
};

// ─── DOCUMENTS VAULT PANEL (embedded in drawer) ───────────────────────────────

interface DocumentsVaultProps {
  selectedItem: any;
  pi: any;
}

type DocKey = 'grn' | 'insurance' | 'allotment' | 'disbursement' | 'delivery' | 'pdi';

export const DocumentsVault: React.FC<DocumentsVaultProps> = ({ selectedItem, pi }) => {
  const [openDoc, setOpenDoc] = useState<DocKey | null>(null);

  const vehicle = selectedItem?.rawVehicle;
  const deal = selectedItem?.rawDeal;

  const docs: { key: DocKey; label: string; icon: React.ReactNode; available: boolean; hint?: string }[] = [
    {
      key: 'grn',
      label: 'Goods Received Note',
      icon: <Package size={14} />,
      available: true,
      hint: 'Generate Goods Received Note',
    },
    {
      key: 'allotment',
      label: 'Allotment Letter',
      icon: <Landmark size={14} />,
      available: true,
      hint: 'Generate Allotment Letter',
    },
    {
      key: 'insurance',
      label: 'Insurance Activation Letter',
      icon: <Shield size={14} />,
      available: true,
      hint: 'Generate Insurance Activation Letter',
    },
    {
      key: 'disbursement',
      label: 'Disbursement Request Letter',
      icon: <Landmark size={14} />,
      available: true,
      hint: 'Generate Disbursement Request Letter',
    },
    {
      key: 'pdi',
      label: 'PDI Checklist',
      icon: <ClipboardList size={14} />,
      available: true,
      hint: 'Generate PDI Checklist',
    },
    {
      key: 'delivery',
      label: 'Delivery Note / Gate Pass',
      icon: <Truck size={14} />,
      available: true,
      hint: 'Generate Delivery Note / Gate Pass',
    },
  ];

  return (
    <>
      <div className="border-t border-surface-200 pt-6">
        <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <FileText size={14} className="text-deepal-600" /> Document Center
        </h4>

        <div className="mb-3 bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
          <span className="font-bold">💡 Document Vault:</span> All official letterhead documents can be edited inline and printed as a single-page PDF with custom letterhead template support.
        </div>

        <div className="grid grid-cols-2 gap-2">
          {docs.map(doc => (
            <button
              key={doc.key}
              onClick={() => setOpenDoc(doc.key)}
              title={`Generate ${doc.label}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-semibold w-full bg-white border-surface-200 hover:border-deepal-400 hover:bg-deepal-50/50 text-surface-800 cursor-pointer hover:shadow-sm"
            >
              <span className="text-deepal-600">
                {doc.icon}
              </span>
              <span className="flex-1 leading-tight">{doc.label}</span>
              <span className="text-[9px] text-deepal-500 font-bold uppercase">Print</span>
            </button>
          ))}
        </div>

        {deal?.deliveryOrderUrl && (
          <div className="mt-2">
            <a
              href={deal.deliveryOrderUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 w-full transition-all hover:shadow-sm"
            >
              <span className="text-blue-500">📑</span>
              <span className="flex-1">Bank Delivery Order (DO)</span>
              <span className="text-[9px] text-blue-500 font-bold uppercase">View ↗</span>
            </a>
          </div>
        )}
      </div>

      {/* Document Modals */}
      <GRNDocument isOpen={openDoc === 'grn'} onClose={() => setOpenDoc(null)} vehicle={vehicle} pi={pi} />
      <InsuranceActivationLetter isOpen={openDoc === 'insurance'} onClose={() => setOpenDoc(null)} deal={deal} vehicle={vehicle} />
      <DisbursementLetter isOpen={openDoc === 'disbursement'} onClose={() => setOpenDoc(null)} deal={deal} vehicle={vehicle} />
      <DeliveryNote isOpen={openDoc === 'delivery'} onClose={() => setOpenDoc(null)} deal={deal} vehicle={vehicle} />
      <PDIChecklist isOpen={openDoc === 'pdi'} onClose={() => setOpenDoc(null)} deal={deal} vehicle={vehicle} />
      <AllotmentLetterModal
        isOpen={openDoc === 'allotment'}
        onClose={() => setOpenDoc(null)}
        deal={{
          ...deal,
          vehicle: vehicle,
          bankName: deal?.bankName,
          bankBranch: deal?.bankBranch,
          customer: deal?.customer,
          salePrice: deal?.salePrice,
          bookingAmount: deal?.bookingAmount,
          approvedLoan: deal?.approvedLoan,
          registrationNo: deal?.registrationNo || vehicle?.registrationNo,
        }}
      />
    </>
  );
};
