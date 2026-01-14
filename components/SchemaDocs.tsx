
import React from 'react';
import { SQL_SCHEMA_DOC } from '../constants';
import { Database, Copy, Check } from 'lucide-react';

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
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <Database size={20} />
          {isOpen ? 'הסתר סכמת מסד נתונים (SQL)' : 'הצג סכמת מסד נתונים (SQL)'}
        </button>

        {isOpen && (
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'הועתק!' : 'העתק קוד SQL'}
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="mt-4 bg-slate-900 rounded-lg p-4 overflow-x-auto text-left shadow-lg border border-slate-800" dir="ltr">
          <pre className="text-xs md:text-sm text-green-400 font-mono leading-relaxed">
            {SQL_SCHEMA_DOC.trim()}
          </pre>
          <div className="mt-3 p-3 bg-slate-800/50 rounded-md border-l-4 border-amber-500">
             <p className="text-amber-200 text-xs">
               <strong>חשוב:</strong> הרץ קוד זה ב-SQL Editor של Supabase כדי להכין את מסד הנתונים לסנכרון.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
