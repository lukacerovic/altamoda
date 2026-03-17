"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Minus, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const mockResponses = [
  "Hvala vam na pitanju! Na osnovu vaših potreba, preporučujem L'Oreal Majirel liniju boja za kosu. Izuzetno je kvalitetna i daje dugotrajne rezultate. Možete pogledati celu kolekciju u sekciji Boje za kosu.",
  "Vaša porudžbina je trenutno u procesu obrade. Očekivana isporuka je u roku od 2-3 radna dana. Za detaljnije informacije, možete proveriti status u sekciji Moj Nalog.",
  "Dostava je besplatna za sve porudžbine iznad 5.000 RSD. Za porudžbine ispod tog iznosa, cena dostave je 350 RSD. Isporuka se vrši putem kurirske službe u roku od 1-3 radna dana.",
];

const quickReplies = [
  "Preporuči proizvod",
  "Status porudžbine",
  "Dostava info",
  "Razgovor sa agentom",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Zdravo! \u{1F44B} Kako vam mogu pomoći? Pitajte me o proizvodima, dostavi, ili bilo čemu drugom.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [responseIndex, setResponseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response after delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        text: mockResponses[responseIndex % mockResponses.length],
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMsg]);
      setResponseIndex((prev) => prev + 1);
      setIsTyping(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110 animate-pulse-gold"
        aria-label="Otvorite chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
        aria-label="Otvorite chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 left-6 z-40"
      style={{
        animation: "slideUp 0.3s ease-out forwards",
      }}
    >
      <div className="w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-[#1a1a1a] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c8a96e]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#c8a96e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">Alta Moda Asistent</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-[#c8a96e] text-white rounded font-medium">
                  AI
                </span>
              </div>
              <span className="text-white/50 text-xs">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <Minus className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafafa]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#c8a96e] text-white rounded-br-sm"
                    : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-500 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

          {/* Quick replies - show only when there's just the welcome message */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1.5 text-xs font-medium border border-[#c8a96e] text-[#c8a96e] rounded-full hover:bg-[#c8a96e] hover:text-white transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white flex-shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Unesite poruku..."
            className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-1 focus:ring-[#c8a96e] placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 bg-[#c8a96e] hover:bg-[#a8894e] disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
