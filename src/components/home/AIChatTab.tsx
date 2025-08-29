"use client"

import React, { useState, useEffect, useRef } from "react";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, Send, User, Bot, Download, TrendingUp, Mail, 
  BarChart3, Calendar, FileText, Star, MessageSquare, Clock 
} from "lucide-react";
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
  analytics?: any;
  insights?: any[];
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function AIChatTab({ userCode }: AIChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "**Hello! I'm your Feedback Analysis Assistant**\n\nI can help you analyze customer feedback data. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick suggestions for semantic search


  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'assistant' && latestMessage.analytics) {
      const stats = latestMessage.analytics;
      const safeToFixed = (value: any, decimals: number = 1): string => {
        if (value === null || value === undefined || value === '') return "N/A";
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? "N/A" : num.toFixed(decimals);
      };
      setQuickStats([
        {
          label: "Feedback",
          value: stats.feedback_count || 0,
          icon: <MessageSquare className="w-3 h-3" />
        },
        {
          label: "Avg Rating",
          value: stats.avg_rating ? `${safeToFixed(stats.avg_rating)}/5` : "N/A",
          icon: <Star className="w-3 h-3" />
        },
        {
          label: "Today",
          value: stats.today_feedback || 0,
          icon: <Clock className="w-3 h-3" />
        },
        {
          label: "Week",
          value: stats.week_feedback || 0,
          icon: <TrendingUp className="w-3 h-3" />
        }
      ]);
    }
  }, [messages]);

  const handleSendMessage = async () => {
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
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      // Create assistant message with only the natural response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message, // Only show the natural language response
        timestamp: new Date(),
        relevantFeedback: data.relevantFeedback,
        analytics: data.analytics
        // Don't include technical details like query or raw results
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
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
    const actionMessages: Record<string, string> = {
      'EXPORT_CSV': 'Export to CSV',
      'EXPORT_PDF': 'Generate PDF report',
      'CREATE_FOLLOWUP_TASK': 'Create follow-up task'
    };
    setInputMessage(actionMessages[action] || action);
  };


  const renderInsights = (insights: any[] = []) => {
    if (!insights || insights.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Key Insights:</p>
        <div className="space-y-1">
          {insights.slice(0, 2).map((insight, index) => (
            <div key={index} className="text-xs">
              • {insight.title}: {insight.value}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSuggestedActions = (actions: string[] = []) => {
    if (!actions || actions.length === 0) return null;

    const actionConfig: Record<string, { icon: React.ReactNode; label: string }> = {
      'EXPORT_CSV': { icon: <Download className="w-3 h-3" />, label: 'Export CSV' },
      'EXPORT_PDF': { icon: <FileText className="w-3 h-3" />, label: 'PDF Report' },
      'CREATE_FOLLOWUP_TASK': { icon: <Mail className="w-3 h-3" />, label: 'Follow-up' },
      'GENERATE_DETAILED_REPORT': { icon: <BarChart3 className="w-3 h-3" />, label: 'Detailed Report' },
      'SCHEDULE_REVIEW_MEETING': { icon: <Calendar className="w-3 h-3" />, label: 'Schedule Meeting' }
    };

    return (
      <div className="mt-3 p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Suggested Actions:</p>
        <div className="flex flex-wrap gap-1">
          {actions.slice(0, 3).map((action, index) => {
            const config = actionConfig[action];
            if (!config) return null;
            
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
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

  const renderRelevantFeedback = (feedback: any[] = []) => {
    if (!feedback || feedback.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs font-medium mb-2">Relevant Feedback ({feedback.length}):</p>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {feedback.slice(0, 2).map((item: any, index: number) => {
            const name = item?.name || 'Anonymous';
            const feedbackText = item?.feedback || '';
            const rating = item?.rating ? Number(item.rating) : 0;
            
            return (
              <div key={index} className="text-xs p-2 bg-muted rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-muted-foreground" />
                    <span>{rating}/5</span>
                  </div>
                </div>
                <p className="line-clamp-2">"{feedbackText.substring(0, 100)}{feedbackText.length > 100 ? '...' : ''}"</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Feedback Analysis
        </CardTitle>
        <CardDescription>
          Ask questions about your customer feedback data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-80 overflow-y-auto space-y-4 p-2 border rounded-lg">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg shadow-sm border ${
                message.role === 'user' 
                  ? 'bg-white text-black border-primary/40' 
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'user' ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                  <span className={`text-xs opacity-70 ${message.role === 'user' ? 'text-black' : 'text-black'}`}> 
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className={`text-sm ${message.role === 'user' ? 'text-black' : 'text-primary'}`}> 
                  <MarkdownRenderer content={message.content} />
                </div>

                {message.role === 'assistant' && renderInsights(message.insights)}
                {message.role === 'assistant' && renderRelevantFeedback(message.relevantFeedback)}
                {message.role === 'assistant' && renderSuggestedActions(message.suggestedActions)}
              </div>
            </div>
          ))}
          {isLoading && <LoadingOverlay />}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Area */}
        <div className="space-y-3">
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
              className="h-auto rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}