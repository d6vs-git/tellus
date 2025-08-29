"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  Cloud, 
  TrendingUp, 
  Star, 
  AlertCircle,
  Download,
  Mail,
  Search,
  FileText,
  Database,
  Zap,
  CheckCircle,
  Clock,
  Send
} from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import ProfessionalPDFDocument from '../pdfreport/ProfessionalPDFDocument';
import { SentimentPieChart } from "@/components/visualizations/SentimentPieChart";
import { RatingBarChart } from "@/components/visualizations/RatingBarChart";
import { WordCloud } from "@/components/visualizations/WordCloud";


interface InsightsTabProps {
  userCode: string;
}

interface AIInsights {
  insights: string;
  summary: {
    totalFeedback: number;
    averageRating: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
      positivePercentage: number;
    };
    ratingDistribution: Record<number, number>;
  };
  visualData: VisualData;
  searchResults?: SearchResult[];
  metadata?: {
    processedAt: string;
    timeframe: string;
    searchQuery: string | null;
    pdfGenerated?: boolean;
    emailSent?: boolean;
  };
}

interface SearchResult {
  feedback: string;
  similarity: number;
  rating: number;
  name: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  icon: React.ReactNode;
}

interface VisualData {
  sentimentChart: Array<{ name: string; value: number; color: string }>;
  ratingTrends: Array<{ rating: number; count: number; percentage: number }>;
  wordCloud: Array<{ text: string; value: number }>;
}

export default function InsightsTab({ userCode }: InsightsTabProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for enhanced features
  const [searchQuery, setSearchQuery] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const initializeSteps = (): ProcessingStep[] => [
    { id: 'data', label: 'Ingesting & Indexing Data', status: 'pending', icon: <Database className="h-4 w-4" /> },
    { id: 'search', label: 'Searching Your Data', status: 'pending', icon: <Search className="h-4 w-4" /> },
    { id: 'llm', label: 'Chaining LLM Calls', status: 'pending', icon: <Brain className="h-4 w-4" /> },
    { id: 'analysis', label: 'Generating Analysis', status: 'pending', icon: <Zap className="h-4 w-4" /> },
    { id: 'complete', label: 'Process Complete', status: 'pending', icon: <CheckCircle className="h-4 w-4" /> }
  ];

  useEffect(() => {
    if (!userCode) return;
    loadInsights();
  }, [userCode]);

  // Helper to generate email text
  const generateEmailText = (summary: AIInsights['summary']) => {
    return `Dear User,

Please find attached your comprehensive AI-generated feedback analysis report.

Summary:
- Total Feedback: ${summary.totalFeedback}
- Average Rating: ${summary.averageRating}/5
- Positive Sentiment: ${summary.sentiment.positivePercentage}%

This report includes detailed insights, trends analysis, and actionable recommendations based on your feedback data.

Best regards,
Feedback Analytics Team`;
  };

  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setProcessingSteps((prev: ProcessingStep[]) => 
      prev.map((step: ProcessingStep) => step.id === stepId ? { ...step, status } : step)
    );
  };


  // Animate step-by-step progress regardless of backend speed
  const loadInsights = async (options: { search?: string } = {}) => {
    if (typeof options === 'object' && options !== null && 'preventDefault' in options) return;
    if (!userCode || typeof userCode !== 'string') {
      setError('Invalid user code provided');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEmailSuccess(null);
    setProcessingSteps(initializeSteps());

    // Step order for animation
    const stepOrder = ['data', 'search', 'llm', 'analysis', 'complete'];
    const minStepTime = 700; // ms per step

    try {
      // Start all steps as pending
      let stepIdx = 0;
      const animateStep = (id: string, status: ProcessingStep['status']) => {
        updateStepStatus(id, status);
      };

      // Start first step
      animateStep(stepOrder[0], 'processing');

      // Start backend fetch in parallel
      const requestBody = {
        userCode: userCode,
        timeframe: 30,
        searchQuery: options.search || searchQuery,
      };
      const fetchPromise = fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Animate each step in sequence
      for (let i = 0; i < stepOrder.length; i++) {
        if (i > 0) {
          // Complete previous step
          animateStep(stepOrder[i - 1], 'completed');
          // Start current step
          animateStep(stepOrder[i], 'processing');
        }
        // Wait for minStepTime before next step
        // If last step, break early to wait for backend
        if (i < stepOrder.length - 1) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise(res => setTimeout(res, minStepTime));
        }
      }

      // Wait for backend to finish (if not already)
      const response = await fetchPromise;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Complete all steps
      stepOrder.forEach(id => animateStep(id, 'completed'));
      setInsights(data);
    } catch (err: any) {
      console.error('Failed to load insights:', err);
      setError(err.message || 'Failed to load AI insights. Please try again.');
      // Update failed step
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) updateStepStatus(currentStep.id, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // PDF Download Handler
  const handlePDFDownload = async () => {
    if (!insights) {
      setError('No insights available to download');
      return;
    }
    
    setIsGeneratingPDF(true);
    setError(null);
    
    try {
      const doc = (
        <ProfessionalPDFDocument 
          insightsData={insights.insights} 
          summaryData={insights.summary} 
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-insights-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEmailReport = async () => {
    if (!insights) {
      setError('No insights available to email');
      return;
    }
    
    if (!emailAddress.trim()) {
      setError('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSendingEmail(true);
    setError(null);
    setEmailSuccess(null);
    
    try {
      const doc = (
        <ProfessionalPDFDocument 
          insightsData={insights.insights} 
          summaryData={insights.summary} 
        />
      );
      const blob = await pdf(doc).toBlob();
      
      const formData = new FormData();
      formData.append('action', 'send_email');
      formData.append('email', emailAddress.trim());
      formData.append('subject', `AI Insights Report - ${new Date().toLocaleDateString()}`);
      formData.append('text', generateEmailText(insights.summary));
      formData.append('pdf', blob, `insights-report-${new Date().toISOString().split('T')[0]}.pdf`);

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to send email: ${response.status}`);
      }

      setEmailSuccess(`Report sent successfully to ${emailAddress}`);
      setEmailAddress(''); // Clear the input on success
      
    } catch (err: any) {
      console.error('Email sending failed:', err);
      setError(err.message || 'Failed to send email report. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const StepIndicator = ({ step }: { step: ProcessingStep }) => (
    <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full border-2
        ${step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' :
          step.status === 'processing' ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse' :
          step.status === 'error' ? 'bg-red-100 border-red-500 text-red-600' :
          'bg-gray-100 border-gray-300 text-gray-400'
        }
      `}>
        {step.status === 'processing' ? (
          <Clock className="h-4 w-4 animate-spin" />
        ) : (
          step.icon
        )}
      </div>
      <span className={`text-sm font-medium ${
        step.status === 'completed' ? 'text-green-600' :
        step.status === 'processing' ? 'text-blue-600' :
        step.status === 'error' ? 'text-red-600' :
        'text-gray-500'
      }`}>
        {step.label}
      </span>
      {step.status === 'completed' && (
        <CheckCircle className="h-4 w-4 text-green-500" />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-medium text-foreground mb-2">Processing AI Insights</p>
                <p className="text-sm text-muted-foreground">Following multi-step analysis workflow</p>
              </div>
              
              {/* Processing Steps */}
              <div className="space-y-2">
                {processingSteps.map((step) => (
                  <StepIndicator key={step.id} step={step} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-red-700 mb-2">Error Loading Insights</p>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button onClick={() => loadInsights()} variant="outline" className="border-red-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No Insights Available</p>
              <p className="text-sm text-muted-foreground mb-4">
                Collect some feedback to generate comprehensive AI analysis
              </p>
              <Button onClick={() => loadInsights()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced AI Insights</h1>
          <p className="text-muted-foreground">Multi-step AI analysis with vector search and comprehensive reporting</p>
          {insights.metadata && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Processed: {new Date(insights.metadata.processedAt).toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Timeframe: {insights.metadata.timeframe}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => loadInsights()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Messages */}
      {emailSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">{emailSuccess}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {insights.searchResults && insights.searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Similar Feedback Found
            </CardTitle>
            <CardDescription>
              AI-discovered patterns matching your search query
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.searchResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {result.rating}/5 ⭐
                      </Badge>
                      <span className="text-xs text-muted-foreground">by {result.name}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{result.feedback}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {insights.summary.totalFeedback}
              </div>
              <div className="text-sm text-muted-foreground">Total Feedback</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {insights.summary.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {insights.summary.sentiment.positivePercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Positive</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {insights.summary.sentiment.positive}
              </div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced AI Analysis
            </CardTitle>
          <CardDescription>
            Multi-step AI reasoning with strategic business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: insights.insights
                .replace(/#{1,6}\s/g, '<h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>')
                .replace(/<p><h3>/g, '<h3>')
                .replace(/<\/h3><\/p>/g, '</h3>')
            }} />
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Interactive Visualizations
          </CardTitle>
          <CardDescription>
            Comprehensive data visualization and trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sentiment" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="sentiment" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Sentiment
              </TabsTrigger>
              <TabsTrigger value="ratings" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Ratings
              </TabsTrigger>
              <TabsTrigger value="words" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Keywords
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sentiment">
              <div className="bg-muted/30 p-4 rounded-lg">
                <SentimentPieChart data={insights.visualData?.sentimentChart || []} />
              </div>
            </TabsContent>

            <TabsContent value="ratings">
              <div className="bg-muted/30 p-4 rounded-lg">
                <RatingBarChart data={insights.visualData?.ratingTrends || []} />
              </div>
            </TabsContent>

            <TabsContent value="words">
              <div className="bg-muted/30 p-4 rounded-lg">
                <WordCloud data={insights.visualData?.wordCloud?.slice(0, 15) || []} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions at bottom */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Report
              </CardTitle>
              <CardDescription>
                Generate and download professional PDF report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handlePDFDownload} 
                size="sm" 
                className="w-full"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isGeneratingPDF ? 'Generating PDF...' : 'Download Professional PDF'}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Report
              </CardTitle>
              <CardDescription>
                Send comprehensive analysis report with PDF attachment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="email"
                placeholder="Enter email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
              <Button 
                onClick={handleEmailReport} 
                size="sm" 
                className="w-full"
                disabled={!emailAddress.trim() || isSendingEmail}
              >
                {isSendingEmail ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isSendingEmail ? 'Sending Email...' : 'Send Report'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}