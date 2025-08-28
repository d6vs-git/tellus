"use client"

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, User, Bot, Download, TrendingUp, Mail, AlertCircle } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface AIChatTabProps {
  userCode: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relevantFeedback?: any[];
  suggestedActions?: string[];
}

export function AIChatTab({ userCode }: AIChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi there! 👋 I'm your Feedback Analysis Assistant. I can help you explore and understand your customer feedback data. You can ask me things like:\n\n• \"What are the main complaints from customers?\"\n• \"Show me positive feedback about the new feature\"\n• \"What's the average rating this month?\"\n• \"Analyze feedback about customer service\"\n\nWhat would you like to know about your feedback?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.SyntheticEvent) => {
    // Guard: if called as an event handler, prevent default and ignore event
    if (e && typeof (e as any).preventDefault === 'function') {
      e.preventDefault();
    }
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode,
          message: inputMessage.trim(),
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        relevantFeedback: data.relevantFeedback,
        suggestedActions: data.suggestedActions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting to the analysis service. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'EXPORT_CSV':
        // Implement export functionality
        break;
      case 'CREATE_FOLLOWUP_TASK':
        // Implement task creation
        break;
      case 'GENERATE_REPORT':
        // Implement report generation
        break;
    }
  };

  const renderSuggestedActions = (actions: string[] = []) => {
    if (actions.length === 0) return null;

    const actionConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      'EXPORT_CSV': { icon: <Download className="w-4 h-4" />, label: 'Export CSV', color: 'blue' },
      'EXPORT_PDF': { icon: <Download className="w-4 h-4" />, label: 'Export PDF', color: 'purple' },
      'CREATE_FOLLOWUP_TASK': { icon: <Mail className="w-4 h-4" />, label: 'Create Follow-up', color: 'green' },
      'GENERATE_REPORT': { icon: <TrendingUp className="w-4 h-4" />, label: 'Generate Report', color: 'orange' },
      'REVIEW_CRITICAL_FEEDBACK': { icon: <AlertCircle className="w-4 h-4" />, label: 'Review Critical', color: 'red' },
      'HIGHLIGHT_POSITIVE_FEEDBACK': { icon: '⭐', label: 'Highlight Positive', color: 'yellow' }
    };

    return (
      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-2">Suggested Actions:</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => {
            const config = actionConfig[action];
            if (!config) return null;
            
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`text-xs border-${config.color}-300 bg-${config.color}-50 hover:bg-${config.color}-100`}
                onClick={() => handleAction(action)}
              >
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Feedback Analysis Assistant
        </CardTitle>
        <CardDescription>
          Chat with AI to explore and understand your customer feedback data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md p-4 rounded-2xl ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm">
                  <MarkdownRenderer content={message.content} />
                </div>

                {message.relevantFeedback && message.relevantFeedback.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs font-medium mb-2">📋 Relevant Feedback:</p>
                    <div className="space-y-2">
                      {message.relevantFeedback.slice(0, 3).map((feedback: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-black/20 rounded">
                          <div className="font-medium">{feedback.name}</div>
                          <div className="opacity-80">"{feedback.feedback}"</div>
                          <div className="text-xs opacity-60">{feedback.rating}/5 stars</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {renderSuggestedActions(message.suggestedActions)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-4 rounded-2xl max-w-xs lg:max-w-md">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs opacity-70">Thinking...</span>
                </div>
                <div className="flex space-x-1 mt-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask about your feedback data..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className="h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2">
          {[
            "What are the main complaints?",
            "Show positive feedback",
            "Average rating this month?",
            "Analyze customer service feedback"
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setInputMessage(suggestion)}
              disabled={isLoading}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}