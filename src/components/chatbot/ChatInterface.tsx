'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { answerTravelQuestions } from '@/ai/flows/answer-travel-questions'; // Ensure correct path
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Add an initial greeting message from the bot
    setMessages([
      {
        id: 'greeting-' + Date.now(),
        text: "Hello! I'm your Hanoi travel assistant. How can I help you plan your trip or answer your questions today?",
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await answerTravelQuestions({ question: userMessage.text });
      const botMessage: Message = {
        id: 'bot-' + Date.now(),
        text: response.answer,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling GenAI flow:", error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        text: "I'm sorry, I encountered an issue trying to respond. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-3 max-w-[85%] md:max-w-[75%]",
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <Avatar className="h-8 w-8">
                {/* Placeholder images or actual user/bot images */}
                <AvatarImage src={msg.sender === 'user' ? 'https://placehold.co/40x40.png?text=U' : 'https://placehold.co/40x40.png?text=B'} />
                <AvatarFallback>{msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "p-3 rounded-xl shadow-md",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-card-foreground rounded-bl-none border'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={cn(
                    "text-xs mt-1.5",
                     msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'
                )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
           {isLoading && (
             <div className="flex items-end gap-3 max-w-[85%] md:max-w-[75%] mr-auto">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png?text=B" />
                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-xl shadow-md bg-card text-card-foreground rounded-bl-none border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
             </div>
           )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="border-t p-4 md:p-6 bg-background">
        <div className="flex items-center gap-3">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow text-base"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
