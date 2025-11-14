import { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ThemeToggle } from './components/ThemeToggle';
import { ApiSelector } from './components/ApiSelector';
import { Message } from './types/chat';
import { useApiProvider } from './contexts/ApiContext';
import { sendMessageToGemini } from './services/gemini';
import { sendMessageToOpenAI } from './services/openai';

// Genshin-focused personas and quick prompts
const PERSONAS = {
  default: {
    id: 'default',
    title: 'General Assistant',
    description: 'Helpful assistant for general questions.',
    prompt: 'You are a helpful assistant.'
  },
  genshin_expert: {
    id: 'genshin_expert',
    title: 'Genshin Impact Expert',
    description: 'Specializes in character builds, team comps, artifact recommendations, and event tips for Genshin Impact. When possible, cite game mechanics and offer practical rotation suggestions.',
    prompt: `You are a friendly and highly knowledgeable Genshin Impact expert. Answer the user with clear, game-focused advice: character roles, artifact sets and stats, weapon choices, constellations impact, team synergy and suggested rotations. Prefer concise bullets for build recommendations and always ask a follow-up question when the user’s request is ambiguous.`
  }
};

const QUICK_PROMPTS = [
  { id: 'build', label: 'Character Build', text: 'How should I build <character> for main DPS/support? Include artifacts, weapon, stats priority, and rotation.' },
  { id: 'team', label: 'Team Composer', text: 'Recommend a 4-person team around <character> for Spiral Abyss and explain roles.' },
  { id: 'artifacts', label: 'Artifact Tips', text: 'Best artifact set and stat priority for <character> with an emphasis on endgame play.' },
  { id: 'domains', label: 'Daily Domains', text: 'What domains should I run this week for artifacts and talent books?' }
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState(PERSONAS.genshin_expert.id);
  const [systemContextEnabled, setSystemContextEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { provider } = useApiProvider();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add a gentle welcome message tailored to persona
  useEffect(() => {
    const welcome = {
      id: 'welcome',
      role: 'assistant',
      content: persona === PERSONAS.genshin_expert.id
        ? 'Hey Traveler! I'm your Genshin Impact expert — I can help with builds, teams, artifact farming, and strategy. Try: "Build Hu Tao for main DPS" or use the quick prompt buttons below.'
        : 'Hello! Ask me anything.' ,
      timestamp: new Date()
    } as Message;

    // only show welcome once on load
    setMessages(prev => (prev.length === 0 ? [welcome] : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPersonaPrompt = () => {
    return systemContextEnabled ? PERSONAS[persona].prompt : '';
  };

  // Helper to create message id
  const makeId = (suffix = 0) => (Date.now() + suffix).toString();

  const handleSendMessage = async (content: string) => {
    // quick command handling (e.g. /build "Xiao")
    if (content.trim().startsWith('/')) {
      const parts = content.trim().split(' ');
      const cmd = parts[0].slice(1).toLowerCase();
      const arg = parts.slice(1).join(' ');

      if (cmd === 'build') {
        content = `Give a detailed build for ${arg || '<character>'} including artifacts, weapon, main stats, substat priority, and a short rotation.`;
      } else if (cmd === 'team') {
        content = `Create a 4-person team around ${arg || '<character>'} for high-floor Spiral Abyss play and explain each role.`;
      }
      // fallthrough for other commands
    }

    const userMessage: Message = {
      id: makeId(0),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Inject persona/system prompt to the start of the user content if systemContextEnabled
      const systemPrompt = getPersonaPrompt();
      const finalPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${content}` : content;

      // call the appropriate API service; both services are expected to accept a single prompt string.
      const apiCall = provider === 'gemini'
        ? sendMessageToGemini(finalPrompt)
        : sendMessageToOpenAI(finalPrompt);

      const response = await apiCall;

      const assistantMessage: Message = {
        id: makeId(1),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: Message = {
        id: makeId(1),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (template: string) => {
    // Open a small modal or just send a templated prompt to the input (we will auto-send here for convenience)
    const filled = template.replace('<character>', 'Kazuha');
    handleSendMessage(filled);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 dark:bg-emerald-600 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Genshin Chat Assistant
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Persona: <span className="font-medium">{PERSONAS[persona].title}</span> — {PERSONAS[persona].description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ApiSelector />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex gap-2">
              <button
                onClick={() => setPersona(PERSONAS.genshin_expert.id)}
                className={`px-3 py-1 rounded-lg ${persona === PERSONAS.genshin_expert.id ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                Genshin Expert
              </button>
              <button
                onClick={() => setPersona(PERSONAS.default.id)}
                className={`px-3 py-1 rounded-lg ${persona === PERSONAS.default.id ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                General
              </button>
            </div>

            <label className="ml-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={systemContextEnabled} onChange={() => setSystemContextEnabled(s => !s)} />
              Use persona context
            </label>

            <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">Quick prompts:</div>
            <div className="flex gap-2 ml-2">
              {QUICK_PROMPTS.map(q => (
                <button key={q.id} onClick={() => handleQuickPrompt(q.text)} className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full inline-block mb-4">
                  <MessageSquare className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Start a conversation
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Ask about builds, teams, or domain recommendations to receive game-focused guidance.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-300 dark:bg-slate-600">
                    <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                  </div>
                  <div className="flex items-center gap-1 px-4 py-2.5 bg-white dark:bg-slate-700 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-600">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

export default App;
