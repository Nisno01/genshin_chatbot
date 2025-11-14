import { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ThemeToggle } from './components/ThemeToggle';
import { Message } from './types/chat';
import { sendMessageToGemini } from './services/gemini'; // FORCED Gemini only

// Genshin Expert Persona
const PERSONA_PROMPT = `You are a friendly and highly knowledgeable Genshin Impact expert.
Provide accurate, concise, game-focused advice about:
- character builds
- team compositions
- artifact sets & stat priorities
- weapon rankings
- constellations impact
- synergy & rotations

Always format builds clearly in bullet points and provide short explanations.`;

// Quick prompts
const QUICK_PROMPTS = [
  { id: 'build', label: 'Character Build', text: 'How should I build <character> for main DPS/support? Include artifacts, weapon, stats priority, and rotation.' },
  { id: 'team', label: 'Team Composer', text: 'Recommend a 4-person team around <character> for Spiral Abyss and explain roles.' },
  { id: 'artifacts', label: 'Artifact Tips', text: 'Best artifact set and stat priority for <character> with an emphasis on endgame play.' },
  { id: 'domains', label: 'Daily Domains', text: 'What domains should I run this week for artifacts and talent books?' }
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    const welcome: Message = {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey Traveler! I'm your Genshin Assistant — I can help with builds, team comps, artifact farming, optimization, and meta recommendations.",
      timestamp: new Date(),
    };

    setMessages(prev => (prev.length === 0 ? [welcome] : prev));
  }, []);

  const makeId = (suffix = 0) => (Date.now() + suffix).toString();

  const handleSendMessage = async (content: string) => {
    // command shortcuts
    if (content.startsWith('/')) {
      const parts = content.split(' ');
      const cmd = parts[0].substring(1);
      const arg = parts.slice(1).join(' ');

      if (cmd === 'build') content = `Give a complete build guide for ${arg}.`;
      if (cmd === 'team') content = `Create a full team around ${arg}.`;
    }

    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const finalPrompt = `${PERSONA_PROMPT}

User: ${content}`;
      const response = await sendMessageToGemini(finalPrompt);

      const assistantMessage: Message = {
        id: makeId(1),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: makeId(1),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (template: string) => {
    const filled = template.replace('<character>', 'Kazuha');
    handleSendMessage(filled);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 dark:bg-emerald-600 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Genshin Assistant Chatbot
              </h1>
            </div>

            <ThemeToggle />
          </div>

          {/* QUICK PROMPTS */}
          <div className="flex items-center gap-3 mt-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">Quick prompts:</div>
            <div className="flex gap-2 ml-2">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q.id}
                  onClick={() => handleQuickPrompt(q.text)}
                  className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* CHAT WINDOW */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.map(m => (
            <ChatMessage key={m.id} message={m} />
          ))}

          {isLoading && (
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-300 dark:bg-slate-600">
                <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="flex items-center gap-1 px-4 py-2.5 bg-white dark:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600">
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}

export default App;
