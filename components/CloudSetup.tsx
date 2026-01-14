
import { useState, useEffect } from 'react';
import { Cloud, Check, AlertCircle, X, Database, Share2, Copy, Smartphone, Key, Info, ShieldCheck, HelpCircle, ExternalLink, Download, Github, Globe } from 'lucide-react';
import { initSupabase, getSupabaseConfig } from '../services/supabase';

interface CloudSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const CloudSetup: React.FC<CloudSetupProps> = ({ isOpen, onClose, onConnected }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showVercelGuide, setShowVercelGuide] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.url) setUrl(config.url);
    if (config.key) setKey(config.key);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = () => {
    if (!url || !key) {
      setError('יש להזין פרטי Supabase לסנכרון');
      return;
    }
    initSupabase(url, key);
    onConnected();
    onClose();
  };

  const getMagicLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (url && key) {
      params.set('sb_url', url);
      params.set('sb_key', key);
    }
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-right">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Globe size={28} />
            <h2 className="text-xl font-bold">לינק קבוע וסנכרון</h2>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-500 rounded p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Section 1: Magic Link (The "Quick" Permanent link) */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Share2 size={16} />
              1. לינק מהיר לטלפון ולמחשבים אחרים
            </h3>
            <p className="text-[11px] text-indigo-700">
              העתיקי את הלינק הזה ופתחי אותו בכל מכשיר. הוא יחבר אותך אוטומטית לנתונים שלך.
            </p>
            <div className="flex gap-2">
              <input readOnly value={getMagicLink()} className="flex-1 bg-white border border-indigo-200 rounded p-2 text-[10px] font-mono truncate outline-none" dir="ltr" />
              <button 
                onClick={() => { navigator.clipboard.writeText(getMagicLink()); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
              >
                {copiedLink ? <Check size={14} /> : 'העתקי'}
              </button>
            </div>
          </div>

          {/* Section 2: Vercel Guide (The "Real" Permanent Solution) */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button 
              onClick={() => setShowVercelGuide(!showVercelGuide)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700"
            >
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-green-600" />
                איך לקבל לינק קבוע בחינם (בלי גוגל)?
              </div>
              <span className="text-xs text-indigo-600 underline">הסבר</span>
            </button>
            
            {showVercelGuide && (
              <div className="p-4 bg-white space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-gray-600 leading-relaxed">
                  הלינק של AI Studio הוא סביבת עבודה. כדי לקבל את האפליקציה בכתובת קבועה משלך (כמו <strong>yael-clinic.vercel.app</strong>) בחינם:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-xs">
                    <div className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <p>לחצי על כפתור <strong>Download</strong> בתחתית ה-Editor (מוריד קובץ Zip).</p>
                  </div>
                  <div className="flex items-start gap-3 text-xs">
                    <div className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <p>פתחי חשבון ב-<strong>GitHub.com</strong> (חינם) והעלי לשם את התיקייה.</p>
                  </div>
                  <div className="flex items-start gap-3 text-xs">
                    <div className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <p>חברי את GitHub ל-<strong>Vercel.com</strong>. הכתובת שתקבלי שם היא קבועה בחינם לנצח.</p>
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-[11px] text-amber-800">
                  <strong>טיפ:</strong> הכתובת של Vercel לא תבקש ממך תשלום לעולם, בניגוד לכתובת של גוגל.
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Supabase Settings */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Database size={16} className="text-indigo-500" />
              הגדרות בסיס נתונים (סנכרון)
            </h3>
            <div className="space-y-2">
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Supabase URL" className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-none" dir="ltr" />
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Supabase API Key" className="w-full border border-gray-200 rounded-lg p-2.5 text-xs outline-none" dir="ltr" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={handleConnect} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              שמור והתחבר
            </button>
            <button onClick={onClose} className="px-6 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all">
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
