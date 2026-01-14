
import React, { useState, useEffect } from 'react';
import { Therapist, PaymentType } from '../types';
import { Trash2, UserPlus, X, Phone, Mail, DollarSign, Edit2, CheckCircle } from 'lucide-react';

interface TherapistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  therapists: Therapist[];
  onAddTherapist: (therapist: Therapist) => void;
  onDeleteTherapist: (id: string) => void;
}

const COLOR_OPTIONS = [
  { label: 'ירוק', value: 'bg-emerald-100 border-emerald-500 text-emerald-800' },
  { label: 'כחול', value: 'bg-blue-100 border-blue-500 text-blue-800' },
  { label: 'סגול', value: 'bg-purple-100 border-purple-500 text-purple-800' },
  { label: 'כתום', value: 'bg-orange-100 border-orange-500 text-orange-800' },
  { label: 'ורוד', value: 'bg-rose-100 border-rose-500 text-rose-800' },
  { label: 'צהוב', value: 'bg-amber-100 border-amber-500 text-amber-800' },
  { label: 'אפור', value: 'bg-slate-100 border-slate-500 text-slate-800' },
  { label: 'ציאן', value: 'bg-cyan-100 border-cyan-500 text-cyan-800' },
];

export const TherapistManager: React.FC<TherapistManagerProps> = ({
  isOpen, onClose, therapists, onAddTherapist, onDeleteTherapist
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Therapist>>({
    color: COLOR_OPTIONS[0].value,
    paymentType: 'hourly',
    name: '',
    phone: '',
    email: '',
    fixedShiftRate: 0,
    oneOffRate: 0
  });

  const handleEdit = (therapist: Therapist) => {
    setEditingId(therapist.id);
    setFormData(therapist);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      color: COLOR_OPTIONS[0].value,
      paymentType: 'hourly',
      name: '',
      phone: '',
      email: '',
      fixedShiftRate: 0,
      oneOffRate: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    onAddTherapist({
      id: editingId || `th-${Date.now()}`,
      name: formData.name,
      color: formData.color || COLOR_OPTIONS[0].value,
      email: formData.email,
      phone: formData.phone,
      paymentType: formData.paymentType || 'hourly',
      fixedShiftRate: formData.fixedShiftRate || 0,
      oneOffRate: formData.oneOffRate || 0,
    } as Therapist);

    cancelEdit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="text-indigo-600" />
            {editingId ? 'עריכת פרטי מטפל' : 'ניהול מטפלים'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          <div className="w-full md:w-[350px] bg-gray-50 p-6 border-l overflow-y-auto">
            <h3 className="font-bold text-gray-700 mb-4">{editingId ? 'עדכון פרטים' : 'הוספת מטפל חדש'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">שם מלא</label>
                <input 
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="ישראל ישראלי"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">טלפון</label>
                    <input 
                      type="text" 
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="050..."
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">אימייל</label>
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="email@..."
                    />
                 </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">שיטת תשלום</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  {(['hourly', 'perShift', 'monthly'] as PaymentType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, paymentType: type})}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                        formData.paymentType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                      }`}
                    >
                      {type === 'hourly' ? 'לפי שעה' : type === 'perShift' ? 'לפי משמרת' : 'חודשי'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                   <div>
                      <label className="text-[10px] font-bold text-gray-400">תעריף קבוע (₪)</label>
                      <input 
                        type="number" 
                        value={formData.fixedShiftRate || ''}
                        onChange={e => setFormData({...formData, fixedShiftRate: Number(e.target.value)})}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-400">תעריף חריג (₪)</label>
                      <input 
                        type="number" 
                        value={formData.oneOffRate || ''}
                        onChange={e => setFormData({...formData, oneOffRate: Number(e.target.value)})}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={formData.paymentType === 'monthly'}
                      />
                   </div>
                </div>
                {formData.paymentType === 'monthly' && (
                  <p className="text-[10px] text-amber-600 font-medium">בתשלום חודשי, הרישום ביומן הוא למעקב בלבד.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">צבע זיהוי</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setFormData({...formData, color: opt.value})}
                      className={`h-10 rounded-xl border-2 transition-all ${opt.value.replace('text-', 'bg-').split(' ')[0]} ${
                        formData.color === opt.value ? 'border-gray-800 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  {editingId ? 'עדכן מטפל' : 'הוסף מטפל'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="px-4 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-100">
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
               רשימת מטפלים פעילים
               <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{therapists.length}</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {therapists.map(therapist => (
                <div key={therapist.id} className={`group p-4 rounded-2xl border flex flex-col justify-between relative bg-white shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300`}>
                  
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${therapist.color}`}>
                           {therapist.name.charAt(0)}
                        </div>
                        <div>
                           <div className="font-black text-gray-900 leading-tight">{therapist.name}</div>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">מזהה: {therapist.id.split('-')[1] || therapist.id}</span>
                             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                             <span className="text-[10px] font-extrabold text-indigo-500 uppercase">
                               {therapist.paymentType === 'hourly' ? 'שעתי' : therapist.paymentType === 'perShift' ? 'לפי משמרת' : 'חודשי'}
                             </span>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(therapist)} className="text-gray-400 hover:text-indigo-600 p-1.5 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => confirm('מחיקת מטפל תמחוק גם את כל השיבוצים שלו. להמשיך?') && onDeleteTherapist(therapist.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 border-t border-gray-50 pt-4">
                    <div className="flex items-center justify-between text-xs">
                       <div className="flex items-center gap-2 text-gray-500">
                          <Phone size={14} className="text-indigo-300" />
                          <span>{therapist.phone || '--'}</span>
                       </div>
                       <div className="flex items-center gap-2 text-gray-500">
                          <Mail size={14} className="text-indigo-300" />
                          <span className="max-w-[120px] truncate">{therapist.email || '--'}</span>
                       </div>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 bg-gray-50 rounded-xl p-2 border border-gray-100 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">תעריף קבוע</span>
                        <span className="text-sm font-black text-gray-700">{therapist.fixedShiftRate || 0}₪</span>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-2 border border-gray-100 flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">חריג / היעדרות</span>
                        <span className="text-sm font-black text-gray-700">
                          {therapist.paymentType === 'monthly' ? '--' : `${therapist.oneOffRate || 0}₪`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`absolute top-0 right-0 w-1 h-full rounded-l-full ${therapist.color.split(' ')[0]}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
