import { useApiProvider } from '../contexts/ApiContext';

export function ApiSelector() {
  const { provider, setProvider } = useApiProvider();

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      <button
        onClick={() => setProvider('gemini')}
        className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
          provider === 'gemini'
            ? 'bg-emerald-500 text-white'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        Gemini
      </button>
      <button
        onClick={() => setProvider('openai')}
        className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${
          provider === 'openai'
            ? 'bg-emerald-500 text-white'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        OpenAI
      </button>
    </div>
  );
}
