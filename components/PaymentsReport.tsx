
import React, { useMemo, useState } from 'react';
import { FixedShift, OneOffBooking, Room, Therapist, PaymentType } from '../types';
import { mergeSchedules } from '../utils/schedulerLogic';
import { X, Calculator, Download, ChevronLeft, ChevronRight, History, Info } from 'lucide-react';

interface PaymentsReportProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  therapists: Therapist[];
  fixedShifts: FixedShift[];
  oneOffBookings: OneOffBooking[];
  currentDate: Date;
}

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export const PaymentsReport: React.FC<PaymentsReportProps> = ({
  isOpen, onClose, rooms, therapists, fixedShifts, oneOffBookings, currentDate
}) => {
  const [reportDate, setReportDate] = useState(new Date(currentDate));

  const changeMonth = (offset: number) => {
    const newDate = new Date(reportDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setReportDate(newDate);
  };

  const reportData = useMemo(() => {
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth();
    
    const stats: Record<string, {
      name: string;
      paymentType: PaymentType;
      fixedHours: number;
      oneOffHours: number;
      absenceHours: number;
      fixedShiftCount: number;
      oneOffShiftCount: number;
      totalCost: number;
      color: string;
    }> = {};

    therapists.forEach(t => {
      stats[t.id] = {
        name: t.name,
        paymentType: t.paymentType || 'hourly',
        fixedHours: 0,
        oneOffHours: 0,
        absenceHours: 0,
        fixedShiftCount: 0,
        oneOffShiftCount: 0,
        totalCost: t.paymentType === 'monthly' ? (t.fixedShiftRate || 0) : 0,
        color: t.color
      };
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateIter = new Date(year, month, day);
      const dailyEvents = mergeSchedules(rooms, fixedShifts, oneOffBookings, dateIter);

      dailyEvents.forEach(event => {
        const therapist = stats[event.therapistId];
        const therapistConfig = therapists.find(t => t.id === event.therapistId);
        
        if (!therapist || !therapistConfig) return;

        const durationMs = event.end.getTime() - event.start.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        if (event.type === 'fixed') {
          therapist.fixedHours += durationHours;
          therapist.fixedShiftCount += 1;
          
          if (therapist.paymentType === 'hourly') {
            therapist.totalCost += durationHours * (therapistConfig.fixedShiftRate || 0);
          } else if (therapist.paymentType === 'perShift') {
            therapist.totalCost += (therapistConfig.fixedShiftRate || 0);
          }
          // Monthly rate is handled at initialization
        } else {
          // One-Off Handling
          if (event.subType === 'absence') {
            therapist.absenceHours += durationHours;
            // Absences are charged according to One-Off rate if hourly, or per shift
            if (therapist.paymentType === 'hourly') {
              therapist.totalCost += durationHours * (therapistConfig.oneOffRate || 0);
            } else if (therapist.paymentType === 'perShift') {
              therapist.totalCost += (therapistConfig.oneOffRate || 0);
            }
          } else {
            therapist.oneOffHours += durationHours;
            therapist.oneOffShiftCount += 1;
            if (therapist.paymentType === 'hourly') {
              therapist.totalCost += durationHours * (therapistConfig.oneOffRate || 0);
            } else if (therapist.paymentType === 'perShift') {
              therapist.totalCost += (therapistConfig.oneOffRate || 0);
            }
          }
        }
      });
    }

    return Object.values(stats);
  }, [reportDate, therapists, rooms, fixedShifts, oneOffBookings]);

  const totalMonthRevenue = reportData.reduce((acc, curr) => acc + curr.totalCost, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
               <Calculator size={28} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight">סיכום תשלומים חודשי</h2>
               <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                 <History size={14} className="text-indigo-400" />
                 <span>חישוב שעות ומשמרות לפי פרופיל מטפל</span>
               </div>
             </div>
          </div>
          <button onClick={onClose} className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-white border-b flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-full md:w-auto">
            <button onClick={() => changeMonth(-1)} className="p-2.5 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-gray-200 transition text-indigo-600">
              <ChevronRight size={20} />
            </button>
            <div className="flex flex-col items-center min-w-[160px]">
              <span className="font-black text-xl text-gray-800 leading-none">
                {MONTH_NAMES[reportDate.getMonth()]}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-widest">{reportDate.getFullYear()}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2.5 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-gray-200 transition text-indigo-600">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left hidden lg:block">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">סה"כ הוצאות חדרים</p>
              <p className="text-3xl font-black text-emerald-600">₪{totalMonthRevenue.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Download size={18} />
              ייצוא דוח PDF
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-100/80 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-200">
                <tr>
                  <th className="p-4">מטפל/ת</th>
                  <th className="p-4">שיטת תשלום</th>
                  <th className="p-4">שעות קבועות</th>
                  <th className="p-4">שעות חריגות</th>
                  <th className="p-4">היעדרויות</th>
                  <th className="p-4">סה"כ יחידות חיוב</th>
                  <th className="p-4 text-left">סה"כ לתשלום</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((row) => (
                  <tr key={row.name} className="hover:bg-white transition-colors bg-white/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${row.color}`}>
                           {row.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800">{row.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                        row.paymentType === 'hourly' ? 'bg-blue-50 text-blue-600' : 
                        row.paymentType === 'perShift' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {row.paymentType === 'hourly' ? 'שעתי' : row.paymentType === 'perShift' ? 'לפי משמרת' : 'גלובלי'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      {row.fixedHours.toFixed(1)} <span className="text-[10px] text-gray-400">ש'</span>
                    </td>
                    <td className="p-4 text-gray-600 font-medium">
                      {row.oneOffHours.toFixed(1)} <span className="text-[10px] text-gray-400">ש'</span>
                    </td>
                    <td className="p-4 text-red-400 font-bold">
                      {row.absenceHours > 0 ? `${row.absenceHours.toFixed(1)} ש'` : '-'}
                    </td>
                    <td className="p-4 font-bold text-gray-500">
                      {row.paymentType === 'hourly' 
                        ? `${(row.fixedHours + row.oneOffHours + row.absenceHours).toFixed(1)} ש'` 
                        : row.paymentType === 'perShift' 
                        ? `${(row.fixedShiftCount + row.oneOffShiftCount + (row.absenceHours > 0 ? 1 : 0))} משמרות`
                        : '1 יחידה'}
                    </td>
                    <td className="p-4 text-left font-black text-indigo-700 text-lg">
                      ₪{row.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
             <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
             <div className="text-xs text-blue-700 leading-relaxed">
               <strong>שים לב:</strong> החישובים מתבססים על ההגדרות הנוכחיות של כל מטפל. שינוי תעריף המטפל ישפיע רטרואקטיבית על כל הדוחות. מומלץ לוודא את נכונות התעריפים לפני הפקת הדוח הסופי.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
