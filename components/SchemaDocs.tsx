
import React from 'react';
import { SQL_SCHEMA_DOC } from '../constants';
import { Database, Copy, Check, AlertCircle } from 'lucide-react';

export const SchemaDocs: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_DOC.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm"
        >
          <Database size={20} />
          {isOpen ? 'הסתר סכמת מסד נתונים (SQL)' : 'הצג סכמת מסד נתונים (SQL)'}
        </button>

        {isOpen && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded">גרסה 2.2 מעודכנת</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-md shadow-indigo-100"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'הועתק!' : 'העתק קוד SQL'}
            </button>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="mt-4 bg-slate-900 rounded-xl p-6 overflow-x-auto text-left shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-2" dir="ltr">
          <div className="mb-4 flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle size={16} />
            נא להעתיק את כל הטקסט למטה ולהריץ ב-Supabase SQL Editor
          </div>
          <pre className="text-xs md:text-sm text-green-400 font-mono leading-relaxed opacity-90 hover:opacity-100 transition-opacity">
            {SQL_SCHEMA_DOC.trim()}
          </pre>
        </div>
      )}
    </div>
  );
};
