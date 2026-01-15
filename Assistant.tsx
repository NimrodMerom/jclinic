
import { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Loader2, AlertCircle, ExternalLink, Key } from 'lucide-react';
import { FixedShift, OneOffBooking, Room, Therapist } from '../types';
import { mergeSchedules } from '../utils/schedulerLogic';

interface AssistantProps {
  rooms: Room[];
  therapists: Therapist[];
  fixedShifts: FixedShift[];
  oneOffBookings: OneOffBooking[];
  currentDate: Date;
}

const formatTime = (date: Date): string => {
  return date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0');
};

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Assistant: React.FC<AssistantProps> = ({ 
  rooms, therapists, fixedShifts, oneOffBookings, currentDate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    if (manualKey) {
      localStorage.setItem('gemini_api_key', manualKey);
    }
  }, [manualKey]);

  const getContext = () => {
    const events = mergeSchedules(rooms, fixedShifts, oneOffBookings, currentDate);
    const dateStr = formatIsoDate(currentDate);
    
    let contextStr = `Current Date View: ${dateStr}\n`;
    contextStr += `Rooms: ${rooms.map(r => r.name).join(', ')}\n`;
    contextStr += `Schedule for today:\n`;
    
    events.forEach(e => {
       const tName = therapists.find(t => t.id === e.therapistId)?.name || 'Unknown';
       const rName = rooms.find(r => r.id === e.roomId)?.name || 'Unknown';
       contextStr += `- ${formatTime(e.start)} to ${formatTime(e.end)}: ${tName} in ${rName} (${e.type})\n`;
    });

    return contextStr;
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    // Check both environment and manual entry
    const apiKey = (process.env.API_KEY && process.env.API_KEY.length > 5) ? process.env.API_KEY : manualKey;

    if (!apiKey || apiKey.length < 5) {
      setError("חסר מפתח API. כדי להפעיל את העוזר, יש להזין מפתח בתיבת ההגדרות (סמל המפתח).");
      setShowKeyInput(true);
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const context = getContext();
      
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          You are a professional assistant for a private clinic manager. 
          Language: Hebrew.
          Context: You have access to today's room schedule.
          Today's Data:
          ${context}
          
          Instructions:
          - Answer the manager's question accurately based on the data.
          - Be very concise and clear.
          - Answer in Hebrew.
          
          User Question: ${query}
        `,
      });

      if (!result.text) throw new Error("Empty response");
      setResponse(result.text);
    } catch (err: any) {
      console.error(err);
      setError("שגיאת תקשורת. ייתכן שמפתח ה-API לא תקין או שאין גישה לשירות.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-300 transition-all transform hover:scale-110 active:scale-95"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 md:w-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} />
              עוזר שיבוץ חכם
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowKeyInput(!showKeyInput)} 
                className={`p-1.5 rounded-lg hover:bg-indigo-500 transition-colors ${manualKey ? 'text-green-300' : 'text-white'}`}
                title="הגדרת מפתח"
              >
                <Key size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 rounded p-1">
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="p-4 h-80 overflow-y-auto bg-gray-50 text-sm space-y-3">
             {showKeyInput && (
               <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mb-2 animate-in fade-in duration-200">
                 <p className="text-[10px] font-black text-amber-800 mb-2 uppercase tracking-wider">הגדרת API Key (Gemini):</p>
                 <input 
                   type="password"
                   value={manualKey}
                   onChange={(e) => setManualKey(e.target.value)}
                   placeholder="הדביקי את המפתח כאן..."
                   className="w-full p-2.5 border border-amber-300 rounded-lg text-xs mb-3 outline-none focus:ring-2 focus:ring-amber-500"
                 />
                 <div className="flex justify-between items-center">
                   <button 
                    onClick={() => setShowKeyInput(false)}
                    className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-amber-700 transition-colors"
                   >
                     שמירה
                   </button>
                   <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    className="text-[10px] text-indigo-600 font-bold underline flex items-center gap-1"
                   >
                     לקבלת מפתח בחינם <ExternalLink size={10} />
                   </a>
                 </div>
               </div>
             )}

             {error && (
               <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-red-700 flex items-start gap-2 animate-in shake">
                 <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                 <p className="text-xs font-medium">{error}</p>
               </div>
             )}

             {response ? (
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-gray-800 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-1">
                 {response}
               </div>
             ) : !error && !showKeyInput && (
               <div className="text-gray-400 text-center mt-16 italic">
                 איך אוכל לעזור לך עם הלו"ז היום?
               </div>
             )}
             
             {loading && (
               <div className="flex justify-center py-6">
                 <Loader2 size={28} className="animate-spin text-indigo-500" />
               </div>
             )}
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="למשל: איזה חדר פנוי ב-16:00?"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button 
              onClick={handleAsk}
              disabled={loading || (!manualKey && (!process.env.API_KEY || process.env.API_KEY === ''))}
              className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-lg active:scale-90"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
