'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user' as 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setCurrentStreamingMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        fullMessage += text;
        setCurrentStreamingMessage(fullMessage);
      }

      // Add the complete message to the messages array
      setMessages(prev => [...prev, { role: 'assistant' as 'assistant', content: fullMessage }]);
      setCurrentStreamingMessage('');
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant' as 'assistant', content: 'I apologize, but I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 relative rounded-xl overflow-hidden">
              <Image
                src="/perplexity-ai-icon.webp"
                alt="Perplexity AI"
                fill
                className="object-cover transform hover:scale-110 transition-transform duration-200"
                priority
              />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Perplexity Clone
            </span>
          </div>
          <nav className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative group"
              aria-label="Toggle theme"
            >
              {/* Sun icon */}
              <svg
                className={`w-5 h-5 transition-all ${
                  theme === 'light' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'
                } absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-gray-600 dark:text-gray-400`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {/* Moon icon */}
              <svg
                className={`w-5 h-5 transition-all ${
                  theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
                } absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-gray-600 dark:text-gray-400`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              Sign In
            </button>
            <a href="/signup" className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              Sign Up
            </a>
            <button className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-all duration-200">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 pt-28 pb-24 flex flex-col max-w-4xl">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-6 animate-fade-in">
            <div className="w-24 h-24 relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 p-[1px]">
              <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-3xl m-[1px]"></div>
              <div className="relative w-full h-full rounded-3xl overflow-hidden">
                <Image
                  src="/perplexity-ai-icon.webp"
                  alt="Perplexity AI"
                  fill
                  className="object-fill transform hover:scale-110 transition-transform duration-200"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
              Welcome to Perplexity Clone
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Ask anything and get accurate, up-to-date answers powered by AI
            </p>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'
                }`}
              >
                <div 
                  className="leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2 mt-1">$1</h2>')
                      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2 mt-1">$1</h3>')
                  }}
                />
              </div>
            </div>
          ))}
          {currentStreamingMessage && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] p-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 shadow-sm">
                <div 
                  className="leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentStreamingMessage
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2 mt-1">$1</h2>')
                      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2 mt-1">$1</h3>')
                  }}
                />
              </div>
            </div>
          )}
          {isLoading && !currentStreamingMessage && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-gray-900/70 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-lg p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="w-full px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
                  isLoading || !query.trim()
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
