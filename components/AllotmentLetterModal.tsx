import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import { Button } from '../UI';
import { LETTERHEAD, DocHeader, DocFooter, DocSignature, PRINT_STYLES, EditableText } from './DocumentsVault';
import { resolveR2Url } from '../services/r2Upload';

interface AllotmentLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: any;
}

export const AllotmentLetterModal: React.FC<AllotmentLetterModalProps> = ({ isOpen, onClose, deal }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [doRefNo, setDoRefNo] = useState('DO-NABIL-2026-9081');
  const [doDate, setDoDate] = useState('15 May 2026');
  const [customerName, setCustomerName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [vin, setVin] = useState('');
  const [motorNo, setMotorNo] = useState('');
  const [color, setColor] = useState('');
  const [makeYear, setMakeYear] = useState('2026');
  const [repName, setRepName] = useState('Ram Lakhan Sah');
  const [repPhone, setRepPhone] = useState('+977-9851090652');

  const [templateMode, setTemplateMode] = useState<'generated' | 'custom'>(() => {
    return localStorage.getItem('autosuite_letterhead_bg') ? 'custom' : 'generated';
  });
  const [customBg, setCustomBg] = useState<string>(() => localStorage.getItem('autosuite_letterhead_bg') || '');

  useEffect(() => {
    const storedBg = localStorage.getItem('autosuite_letterhead_bg') || '';
    if (storedBg) {
      resolveR2Url(storedBg).then(url => {
        if (url) {
          setCustomBg(url);
          setTemplateMode('custom');
        }
      });
    }
  }, []);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    setCurrentDate(formattedDate);

    if (deal) {
      setBankName(deal.bankName || '[Enter Bank Name]');
      setBankBranch(deal.bankBranch || '[Enter Bank Branch]');
      setCustomerName(deal.customer?.name || '[Enter Customer Name]');
      setVehicleModel(deal.vehicle?.model || 'Deepal S05');
      setRegistrationNo(deal.vehicle?.registrationNo || deal.registrationNo || '[Enter Registration Number]');
      setVin(deal.vehicle?.vin || '[Enter Chassis Number]');
      setMotorNo(deal.vehicle?.motorNo || '[Enter Motor Number]');
      setColor(deal.vehicle?.color || '[Enter Color]');
      setMakeYear(deal.vehicle?.year?.toString() || '2026');
      
      if (deal.deliveryOrderUrl) {
        setDoRefNo(`DO-${deal.bankName?.toUpperCase()}-${deal.id?.slice(-4)}`);
      } else {
        setDoRefNo('[Enter DO Reference Number]');
      }
    } else {
      setBankName('[Enter Bank Name]');
      setBankBranch('[Enter Bank Branch]');
      setCustomerName('[Enter Customer Name]');
      setVehicleModel('Deepal S05');
      setRegistrationNo('[Enter Registration Number]');
      setVin('[Enter Chassis Number]');
      setMotorNo('[Enter Motor Number]');
      setColor('[Enter Color]');
      setMakeYear('2026');
      setDoRefNo('[Enter DO Reference Number]');
    }
  }, [deal]);

  if (!isOpen) return null;

  return createPortal(
    <div id="allotment-preview-portal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto print-bg-white">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-slate-700 portal-modal-content">
        {/* Header Controls */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print-hide">
          <div>
            <h3 className="text-lg font-black">Preview Bank Allotment Letter</h3>
            <p className="text-slate-400 text-xs">Edit any fields inline in the letter before printing</p>
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

            <Button 
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 border-none cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={16} /> Print / Save PDF
            </Button>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white border-none bg-transparent"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Content Canvas */}
        <div className="p-6 md:p-12 overflow-y-auto flex-1 flex justify-center bg-slate-200 print-bg-white print:p-0">
          <div 
            id="printable-allotment-area" 
            className={`bg-white text-black w-[21cm] max-w-full min-h-[28cm] max-h-[29.7cm] p-[1.5cm] shadow-lg font-serif leading-relaxed text-sm relative border border-slate-300 flex flex-col justify-between box-sizing-border overflow-hidden ${templateMode === 'custom' ? 'custom-template-active' : ''}`}
          >
            {/* Print Stylesheet */}
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES('printable-allotment-area', 'allotment-preview-portal') }} />

            {/* Custom Letterhead Background Image */}
            {templateMode === 'custom' && customBg ? (
              <img
                src={customBg}
                alt="Letterhead Template Background"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
              />
            ) : null}

            <div className={`relative z-10 ${templateMode === 'custom' ? 'pt-20 pb-8' : ''}`}>
              {/* Official Letterhead Header */}
              {templateMode === 'generated' && <DocHeader />}

              {/* Document Content */}
              <div className="space-y-4 text-slate-900 font-serif pt-1 text-xs">
                {/* Date */}
                <div>
                  <span className="font-bold">Date: </span>
                  <EditableText 
                    value={currentDate}
                    onChange={setCurrentDate}
                    className="font-bold"
                    placeholder="Date"
                  />
                </div>

                {/* Recipient */}
                <div className="space-y-0.5 font-bold text-xs">
                  <p>To,</p>
                  <p>The Manager</p>
                  <p>
                    <EditableText 
                      value={bankName}
                      onChange={setBankName}
                      className="font-bold"
                      placeholder="Bank Name"
                    />
                  </p>
                  <p>
                    <EditableText 
                      value={bankBranch}
                      onChange={setBankBranch}
                      className="font-bold"
                      placeholder="Branch Name"
                    />
                  </p>
                </div>

                {/* Subject */}
                <div className="pt-1">
                  <h3 className="font-black text-xs uppercase underline">Subject: Request for Vehicle Registration</h3>
                </div>

                {/* Greeting */}
                <div>
                  <p className="font-bold">Dear Sir,</p>
                </div>

                {/* Body Paragraph 1 */}
                <p className="text-justify leading-relaxed">
                  This is about your letter ref no.{' '}
                  <EditableText 
                    value={doRefNo}
                    onChange={setDoRefNo}
                    className="font-bold"
                    placeholder="DO reference number"
                  />{' '}
                  dated{' '}
                  <EditableText 
                    value={doDate}
                    onChange={setDoDate}
                    className="font-bold"
                    placeholder="DO Date"
                  />{' '}
                  issued for the financing of the 1 unit of Deepal S05 vehicle by{' '}
                  <EditableText 
                    value={customerName}
                    onChange={setCustomerName}
                    className="font-bold"
                    placeholder="Customer Name"
                  />. We would like to request you to send the representative for Vehicle registration of the below-mentioned vehicle in the name of your Bank at the Department of Transport Management Office, Ekantakuna.
                </p>

                {/* Vehicle Specifications Table */}
                <div className="pl-4 py-1 space-y-1 text-xs font-semibold">
                  <p className="font-bold underline text-[11px] uppercase mb-2 text-slate-500">Details of the Vehicle</p>
                  <div className="grid grid-cols-3 gap-y-1 max-w-md">
                    <span className="text-slate-500 font-bold">Brand:</span>
                    <span className="col-span-2 font-bold text-slate-900">Changan</span>

                    <span className="text-slate-500 font-bold">Vehicle Model:</span>
                    <span className="col-span-2">
                      <EditableText 
                        value={vehicleModel}
                        onChange={setVehicleModel}
                        className="font-bold"
                      />
                    </span>

                    <span className="text-slate-500 font-bold">Regd. No:</span>
                    <span className="col-span-2">
                      <EditableText 
                        value={registrationNo}
                        onChange={setRegistrationNo}
                        className="font-bold"
                      />
                    </span>

                    <span className="text-slate-500 font-bold">Chassis No:</span>
                    <span className="col-span-2 font-mono">
                      <EditableText 
                        value={vin}
                        onChange={setVin}
                        className="font-mono font-bold"
                      />
                    </span>

                    <span className="text-slate-500 font-bold">Engine No:</span>
                    <span className="col-span-2 font-mono">
                      <EditableText 
                        value={motorNo}
                        onChange={setMotorNo}
                        className="font-mono font-bold"
                      />
                    </span>

                    <span className="text-slate-500 font-bold">Color:</span>
                    <span className="col-span-2">
                      <EditableText 
                        value={color}
                        onChange={setColor}
                        className="font-bold"
                      />
                    </span>

                    <span className="text-slate-500 font-bold">Horse Power:</span>
                    <span className="col-span-2 font-bold text-slate-900">99 KW</span>

                    <span className="text-slate-500 font-bold">Model:</span>
                    <span className="col-span-2">
                      <EditableText 
                        value={makeYear}
                        onChange={setMakeYear}
                        className="font-bold"
                      />
                    </span>
                  </div>
                </div>

                {/* Body Paragraph 2 */}
                <p className="text-justify leading-relaxed">
                  Please get in touch with{' '}
                  <EditableText 
                    value={repName}
                    onChange={setRepName}
                    className="font-bold"
                  />{' '}
                  - ({' '}
                  <EditableText 
                    value={repPhone}
                    onChange={setRepPhone}
                    className="font-bold"
                  />{' '}
                  ) at Yatayat Karyalaya-Ekantakuna for the vehicle registration process. Thank you in advance for your kind co-operation.
                </p>

                {/* Signature Block */}
                <DocSignature />
              </div>
            </div>

            {/* Official Letterhead Footer */}
            {templateMode === 'generated' && <DocFooter />}

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
