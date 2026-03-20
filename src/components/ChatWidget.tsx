"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, X, Minus, Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export default function ChatWidget() {
  const { t } = useLanguage();

  const mockResponses = useMemo(() => [
    t("chat.response1"),
    t("chat.response2"),
    t("chat.response3"),
  ], [t]);

  const quickReplies = useMemo(() => [
    t("chat.quickReply1"),
    t("chat.quickReply2"),
    t("chat.quickReply3"),
    t("chat.quickReply4"),
  ], [t]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "",
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

  useEffect(() => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length > 0 && updated[0].id === 1) {
        updated[0] = { ...updated[0], text: t("chat.welcomeMessage") };
      }
      return updated;
    });
  }, [t]);

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
        className="fixed bottom-6 left-6 w-12 h-12 bg-black hover:bg-stone-800 text-white rounded-sm flex items-center justify-center z-40 transition-all hover:scale-105"
        aria-label={t("chat.openChat")}
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 w-12 h-12 bg-black hover:bg-stone-800 text-white rounded-sm flex items-center justify-center z-40 transition-all hover:scale-105"
        aria-label={t("chat.openChat")}
      >
        <MessageCircle className="w-5 h-5" />
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
      <div className="w-[350px] h-[500px] bg-white rounded-sm flex flex-col overflow-hidden border border-stone-200 shadow-xl">
        {/* Header */}
        <div className="bg-black px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{t("chat.assistantName")}</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-secondary text-white rounded-sm font-bold tracking-wider uppercase">
                  AI
                </span>
              </div>
              <span className="text-white/50 text-xs">{t("chat.online")}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/10 rounded-sm transition-colors"
            >
              <Minus className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-sm transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-black text-white rounded-sm rounded-br-none"
                    : "bg-white text-stone-900 border border-stone-200 rounded-sm rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-stone-500 px-4 py-3 rounded-sm rounded-bl-none border border-stone-200">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-stone-300 text-stone-600 rounded-sm hover:bg-black hover:text-white hover:border-black transition-colors"
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
          className="flex items-center gap-2 p-3 border-t border-stone-200 bg-white flex-shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.inputPlaceholder")}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black placeholder-stone-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 bg-black hover:bg-stone-800 disabled:bg-stone-200 disabled:cursor-not-allowed text-white rounded-sm flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
