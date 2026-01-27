
import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Loader2, AlertCircle } from 'lucide-react';
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
    
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      // Use process.env.API_KEY directly. Assume it is pre-configured and valid.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      setError("שגיאת תקשורת. ייתכן שאין גישה לשירות ברגע זה.");
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
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 rounded p-1">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4 h-80 overflow-y-auto bg-gray-50 text-sm space-y-3">
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
             ) : !error && (
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
              disabled={loading}
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
