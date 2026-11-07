"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import ChatMessage, { MessageItem } from "./ChatMessage";
import {
  getChatbotResponse,
  WELCOME_MESSAGE,
} from "@/lib/chatbot-logic";
import { SUGGESTED_QUESTIONS } from "@/lib/bansi-knowledge";

function getFormattedTime(): string {
  try {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "Just now";
  }
}

export default function AskBansiChat() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [mobileHeight, setMobileHeight] = useState<number | null>(null);

  // Messages state
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Ensure client-side only mounting for hydration safety
  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        id: "welcome-init",
        sender: "bot",
        text: WELCOME_MESSAGE.text,
        timestamp: getFormattedTime(),
      },
    ]);
  }, []);

  // Adapt to Mobile Visual Viewport (Virtual Keyboard resize handler)
  useEffect(() => {
    if (!isOpen) {
      setMobileHeight(null);
      return;
    }

    const updateHeight = () => {
      if (window.innerWidth < 640) {
        // On mobile, use visualViewport if available, or innerHeight
        const vHeight = window.visualViewport
          ? window.visualViewport.height
          : window.innerHeight;
        setMobileHeight(vHeight);
      } else {
        setMobileHeight(null);
      }
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    }
    window.addEventListener("resize", updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
    };
  }, [isOpen]);

  // Lock background body scroll on mobile while chat is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => {
        scrollToBottom("auto");
        // On desktop, auto-focus input. On mobile, avoid auto-focusing on open so keyboard doesn't abruptly block view
        if (window.innerWidth >= 640) {
          inputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, scrollToBottom]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputMessage).trim();
      if (!text || isTyping) return;

      const userMsg: MessageItem = {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: getFormattedTime(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-6).map((m) => ({
              sender: m.sender,
              text: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const botMsg: MessageItem = {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: data.text,
            timestamp: getFormattedTime(),
            links: data.links,
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          const botAnswer = getChatbotResponse(text);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "bot",
              text: botAnswer.text,
              timestamp: getFormattedTime(),
              links: botAnswer.links,
            },
          ]);
        }
      } catch {
        const botAnswer = getChatbotResponse(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: botAnswer.text,
            timestamp: getFormattedTime(),
            links: botAnswer.links,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [inputMessage, isTyping, messages]
  );

  // Keydown handler for input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset conversation
  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: WELCOME_MESSAGE.text,
        timestamp: getFormattedTime(),
      },
    ]);
  };

  // When input is focused on mobile, scroll conversation up so user sees what they type
  const handleInputFocus = () => {
    setTimeout(() => {
      scrollToBottom("smooth");
    }, 280);
  };

  // Don't render until client mounted to prevent hydration mismatches
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Trigger Button (Hidden on mobile when chat is open so it never covers the input) */}
      <div
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] items-center ${
          isOpen ? "hidden sm:flex" : "flex"
        }`}
      >
        {/* Tooltip on hover (desktop only) */}
        {!isOpen && showTooltip && (
          <div
            role="tooltip"
            className="hidden sm:flex items-center gap-1.5 absolute right-16 px-3.5 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-medium rounded-full shadow-lg whitespace-nowrap animate-in fade-in duration-150"
          >
            <Sparkles className="w-3.5 h-3.5 text-coral-400 dark:text-coral-600" />
            <span>Ask me anything about Bansi</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl focus:outline-none focus:ring-4 focus:ring-coral-400/40 cursor-pointer pointer-events-auto ${
            isOpen
              ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900 rotate-90"
              : "bg-[#FF5757] hover:bg-[#E83E3E] text-white hover:scale-105 active:scale-95"
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close Ask Bansi chat" : "Open Ask Bansi chat"}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              {/* Notification dot */}
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#080B12]"></span>
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat Window Panel:
          - On Mobile: Edge-to-edge full screen, dynamically adapting to mobileHeight (keyboard safe)
          - On Desktop: Floating rounded card at bottom-[96px] right-6
      */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          role="dialog"
          aria-label="Ask Bansi Chat Assistant"
          style={mobileHeight ? { height: `${mobileHeight}px` } : undefined}
          className="fixed inset-0 sm:inset-auto sm:bottom-[96px] sm:right-6 z-[9999] w-full sm:w-[380px] h-full sm:h-[520px] sm:max-h-[calc(100dvh-110px)] bg-white dark:bg-[#0E1522] border-0 sm:border border-gray-200 dark:border-white/10 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in sm:slide-in-from-bottom-2 duration-200 pointer-events-auto"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-coral-500 via-[#FF5757] to-[#E83E3E] text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Mobile Back / Dismiss Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 -ml-1 text-white/90 hover:text-white rounded-lg active:scale-95 transition-transform cursor-pointer"
                aria-label="Close chat"
                title="Back"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/70 bg-white/20 shrink-0">
                <Image
                  src="/images/bansi-cutout.png"
                  alt="Bansi Jethava"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover object-top"
                />
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"
                  title="Online"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm tracking-wide">Ask Bansi</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full font-medium leading-none">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-white/90 leading-tight">
                  Bansi&apos;s AI Assistant • Powered by Gemini
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text bg-[#FAFAFA] dark:bg-[#0A0F1A] overscroll-contain">
            {/* Suggested Question Pills (Shown initially) */}
            {messages.length <= 2 && (
              <div className="mb-4 pt-1">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-coral-500" />
                  Suggested topics:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(question)}
                      className="text-xs text-left px-3 py-1.5 rounded-full bg-white dark:bg-[#141C2B] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:border-coral-400 dark:hover:border-coral-400 hover:text-coral-500 dark:hover:text-coral-400 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-coral-200 dark:border-white/15 bg-coral-50 dark:bg-[#1a2333] shadow-sm">
                  <Image
                    src="/images/bansi-cutout.png"
                    alt="Ask Bansi"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="bg-gray-100 dark:bg-[#131B2A] border border-gray-200/80 dark:border-white/10 px-3.5 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-coral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-coral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-coral-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer / Input Form */}
          <div className="p-3 bg-white dark:bg-[#0E1522] border-t border-gray-200 dark:border-white/10 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                placeholder="Ask something about Bansi..."
                aria-label="Ask something about Bansi"
                disabled={isTyping}
                className="flex-1 bg-gray-100 dark:bg-[#141C2B] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm px-3.5 py-2.5 rounded-full border border-transparent focus:border-coral-400 dark:focus:border-coral-400 focus:outline-none focus:bg-white dark:focus:bg-[#0E1522] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-[#FF5757] hover:bg-[#E83E3E] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-sm"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2">
              AI Assistant • Powered by Google Gemini
            </p>
          </div>
        </div>
      )}
    </>
  );
}
