"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, RefreshCw, BarChart3, PieChart, Cloud, TrendingUp, Star, AlertCircle } from "lucide-react";
import { WordCloud } from "@/components/visualizations/WordCloud";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SentimentPieChart } from "../visualizations/SentimentPieChart";
import { RatingBarChart } from "../visualizations/RatingBarChart";
import { SummaryStats } from "../visualizations/SummaryStats";

interface InsightsTabProps {
  userCode: string;
}

interface VisualData {
  sentimentChart: Array<{ name: string; value: number; color: string }>;
  ratingTrends: Array<{ rating: number; count: number; percentage: number }>;
  wordCloud: Array<{ text: string; value: number }>;
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
}

export function InsightsTab({ userCode }: InsightsTabProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userCode) return;
    loadInsights(userCode);
  }, [userCode]);

  const loadInsights = async (code: string) => {
    // Guard: if code is an event, ignore
    if (typeof code === 'object' && code !== null && 'preventDefault' in code) {
      return;
    }
    setIsLoadingInsights(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCode: code,
          timeframe: 30
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to load insights: ${response.status}`);
      }
      const data = await response.json();
      // Defensive: ensure numbers are valid
      if (data && data.summary) {
        if (isNaN(data.summary.averageRating)) data.summary.averageRating = 0;
        if (isNaN(data.summary.totalFeedback)) data.summary.totalFeedback = 0;
        if (data.summary.sentiment) {
          if (isNaN(data.summary.sentiment.positive)) data.summary.sentiment.positive = 0;
          if (isNaN(data.summary.sentiment.neutral)) data.summary.sentiment.neutral = 0;
          if (isNaN(data.summary.sentiment.negative)) data.summary.sentiment.negative = 0;
          if (isNaN(data.summary.sentiment.positivePercentage)) data.summary.sentiment.positivePercentage = 0;
        }
      }
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
      let msg = 'Failed to load insights';
      if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as any).message === 'string') {
          msg = (err as any).message;
        } else if (err instanceof Event) {
          msg = 'An unexpected error occurred.';
        }
      }
      setError(msg);
    }
    setIsLoadingInsights(false);
  };

  const refreshInsights = (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    loadInsights(userCode);
  };

  if (isLoadingInsights) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-lg font-medium text-foreground">Generating AI Insights</p>
              <p className="text-sm text-muted-foreground text-center">
                Analyzing your feedback data and creating comprehensive recommendations
              </p>
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
              <Button onClick={refreshInsights} variant="outline" className="border-red-300">
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
              <Button onClick={refreshInsights}>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Insights</h1>
          <p className="text-muted-foreground">Comprehensive analysis of your feedback data</p>
        </div>
        <Button onClick={refreshInsights} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryStats
            totalFeedback={insights.summary.totalFeedback}
            averageRating={insights.summary.averageRating}
            sentiment={insights.summary.sentiment}
          />
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive insights generated by Gemini AI based on your feedback data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6">
            <MarkdownRenderer content={insights.insights} />
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Visualizations
          </CardTitle>
          <CardDescription>
            Interactive charts showing your feedback distribution and patterns
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
                <SentimentPieChart data={insights.visualData.sentimentChart} />
              </div>
            </TabsContent>

            <TabsContent value="ratings">
              <div className="bg-muted/30 p-4 rounded-lg">
                <RatingBarChart data={insights.visualData.ratingTrends} />
              </div>
            </TabsContent>

            <TabsContent value="words">
              <div className="bg-muted/30 p-4 rounded-lg">
                <WordCloud data={insights.visualData.wordCloud} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}