
import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
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
    
    // Removed manual API key checks as it is handled externally and injected via process.env.API_KEY

    setLoading(true);
    setResponse(null);

    try {
      // Use process.env.API_KEY directly in the named parameter constructor
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = getContext();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          You are a helpful assistant for a clinic manager. 
          Language: Hebrew.
          Context Data (Today's Schedule):
          ${context}
          
          User Question: ${query}
          
          Answer based strictly on the schedule data provided above. 
          Keep it very concise.
        `,
      });

      setResponse(response.text || "לא התקבלה תשובה מהמודל.");
    } catch (error) {
      console.error(error);
      setResponse("מצטערים, אירעה שגיאה בעיבוד הבקשה.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-300 transition-all transform hover:scale-105"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 md:w-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} />
              עוזר שיבוץ חכם
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 rounded p-1">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4 h-64 overflow-y-auto bg-gray-50 text-sm space-y-3">
             {response ? (
               <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                 {response}
               </div>
             ) : (
               <div className="text-gray-500 text-center mt-10">
                 שאל אותי שאלות על הלו"ז היומי.<br/>למשל: "מי נמצא בחדר 1 בבוקר?"
               </div>
             )}
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="שאל משהו..."
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAsk}
              disabled={loading}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
