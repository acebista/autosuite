import React from 'react';
import { AlertCircle } from 'lucide-react';

interface PendingAlert {
  field: string;
  label: string;
  currentValue: string;
  onUpdate: (val: string) => void;
}

interface PendingAlertsProps {
  selectedItem: any;
  insuranceNo: string;
  setInsuranceNo: (v: string) => void;
  registrationNo: string;
  setRegistrationNo: (v: string) => void;
}

export const PendingAlerts: React.FC<PendingAlertsProps> = ({
  selectedItem, insuranceNo, setInsuranceNo, registrationNo, setRegistrationNo
}) => {
  const alerts: PendingAlert[] = [];

  if (
    selectedItem.state === 'INSURANCE_ACTIVATION' &&
    (!selectedItem.rawDeal?.insurancePolicyNo || selectedItem.rawDeal?.insurancePolicyNo === 'PENDING_EMAIL_SENT')
  ) {
    alerts.push({
      field: 'insurance_policy_no',
      label: 'Insurance Policy No. pending',
      currentValue: insuranceNo,
      onUpdate: setInsuranceNo,
    });
  }

  const existingRegNo = selectedItem.registrationNo || selectedItem.rawDeal?.registrationNo || selectedItem.rawVehicle?.registrationNo || selectedItem.rawVehicle?.registration_no;
  if (!existingRegNo) {
    alerts.push({
      field: 'registration_no',
      label: 'Vehicle Registration / Plate No. missing',
      currentValue: registrationNo,
      onUpdate: setRegistrationNo,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mx-6 mt-4">
      {alerts.map(alert => (
        <div key={alert.field} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-700 flex-1">{alert.label}</p>
          <input
            type="text"
            placeholder="Update now…"
            value={alert.currentValue}
            onChange={e => alert.onUpdate(e.target.value)}
            className="text-xs border border-amber-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 w-36 font-mono"
          />
        </div>
      ))}
    </div>
  );
};
