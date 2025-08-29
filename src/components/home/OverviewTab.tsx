"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clipboard,
  Code,
  Users,
  MessageSquare,
  Star,
  TrendingUp,
  Zap,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

declare global {
  interface Window {
    sdomain?: string;
  }
}

interface OverviewTabProps {
  userCode: string;
}

interface DashboardStats {
  uniqueUsers: number;
  totalFeedback: number;
  averageRating: number;
  positivePercentage: number;
}

export function OverviewTab({ userCode }: OverviewTabProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackUrl, setFeedbackUrl] = useState("");
  const [copyConfirmation, setCopyConfirmation] = useState<string | null>(null);
  const [isEmbedCodeOpen, setIsEmbedCodeOpen] = useState(false);

  useEffect(() => {
    if (!userCode) return;
  setFeedbackUrl(`${window.location.origin}/${userCode}`);
  loadStats(userCode);
  }, [userCode]);

  const loadStats = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard-stats?code=${code}`);
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      } else {
        const err = await response.json();
        setError(err?.error || "Failed to load dashboard stats");
        setStats(null);
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (e?: React.SyntheticEvent) => {
    if (e && typeof (e as any).preventDefault === "function")
      e.preventDefault();
    navigator.clipboard.writeText(feedbackUrl);
    setCopyConfirmation("url");
    setTimeout(() => setCopyConfirmation(null), 2000);
  };

  const handleOpenEmbedCode = (e?: React.SyntheticEvent) => {
    if (e && typeof (e as any).preventDefault === "function")
      e.preventDefault();
    setIsEmbedCodeOpen(true);
    window.dispatchEvent(
      new CustomEvent("openEmbedDialog", { detail: { userCode, isOpen: true } })
    );
  };

  if (!stats) {
    if (loading) {
      return (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="p-2 rounded-lg bg-muted">
                    <div className="h-5 w-5 bg-muted-foreground/20 rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="space-y-8">
          <div className="text-center text-destructive font-semibold py-8">
            {error}
          </div>
        </div>
      );
    }
    // No stats, not loading, no error
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border-primary/10 hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Unique Users
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.uniqueUsers}
              </div>
              <div className="text-sm text-muted-foreground">
                Active contributors
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="group hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:-translate-y-1 border-accent/10 hover:border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Total Feedback
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 group-hover:from-accent/30 group-hover:to-accent/20 transition-all">
                <MessageSquare className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalFeedback}
              </div>
              <div className="text-sm text-muted-foreground">
                Total responses
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="group hover:shadow-xl hover:shadow-chart-1/10 transition-all duration-300 hover:-translate-y-1 border-chart-1/10 hover:border-chart-1/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Average Rating
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-400/10 group-hover:from-yellow-400/30 group-hover:to-yellow-400/20 transition-all">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(stats.averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="group hover:shadow-xl hover:shadow-chart-1/10 transition-all duration-300 hover:-translate-y-1 border-chart-1/10 hover:border-chart-1/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Sentiment Score
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-1/10 group-hover:from-chart-1/30 group-hover:to-chart-1/20 transition-all">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.positivePercentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                Positive feedback
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Share Feedback Form</CardTitle>
              <CardDescription className="text-base">
                Share this URL with your users to collect feedback or embed the
                feedback form on your website to gather testimonials seamlessly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <Input
              type="text"
              value={feedbackUrl}
              readOnly
              className="font-mono text-sm bg-muted/50 border-border/50"
            />
            <Button onClick={handleCopyUrl} size="lg">
              <Clipboard className="w-4 h-4 mr-2" />
              {copyConfirmation === "url" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
