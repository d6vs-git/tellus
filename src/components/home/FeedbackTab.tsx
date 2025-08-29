"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronUp, ChevronDown, Loader2, AlertCircle, FilterX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  name: string;
  feedback: string;
  rating: number;
  createdAt: string;
}

interface FeedbackTabProps {
  userCode: string;
}

type DateFilterType = "all" | "recent";

export function FeedbackTab({ userCode }: FeedbackTabProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = useCallback(async (code: string) => {
    if (!code) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/feedback?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      console.error("Failed to load feedback:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback(userCode);
  }, [userCode, loadFeedback]);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesRating = ratingFilter === null || Math.floor(item.rating) === ratingFilter;
      
      let matchesDate = true;
      if (dateFilter === "recent") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchesDate = new Date(item.createdAt) > oneWeekAgo;
      }
      
      return matchesRating && matchesDate;
    });
  }, [feedback, ratingFilter, dateFilter]);

  const clearFilters = () => {
    setRatingFilter(null);
    setDateFilter("all");
  };

  const retryLoadFeedback = () => {
    loadFeedback(userCode);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Failed to load feedback</h3>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={retryLoadFeedback} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <FilterX className="h-5 w-5" />
            Filter Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Rating:</span>
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  size="sm"
                  variant={ratingFilter === rating ? "default" : "outline"}
                  onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                  className="hover:scale-105 transition-transform"
                  aria-pressed={ratingFilter === rating}
                  aria-label={`Filter by ${rating} star rating`}
                >
                  {rating}⭐
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Time:</span>
              <Button
                size="sm"
                variant={dateFilter === "all" ? "default" : "outline"}
                onClick={() => setDateFilter("all")}
                aria-pressed={dateFilter === "all"}
              >
                All Time
              </Button>
              <Button
                size="sm"
                variant={dateFilter === "recent" ? "default" : "outline"}
                onClick={() => setDateFilter("recent")}
                aria-pressed={dateFilter === "recent"}
              >
                Last 7 Days
              </Button>
            </div>
            {(ratingFilter !== null || dateFilter !== "all") && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={clearFilters}
                aria-label="Clear all filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Recent Feedback ({filteredFeedback.length})
          </h2>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="text-center text-muted-foreground">
              {feedback.length === 0 
                ? "No feedback available yet." 
                : "No feedback matches your filters."}
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredFeedback.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  layout
                  className="group"
                >
                  <Card className="hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-primary/10 hover:border-primary/30">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-xl line-clamp-1">{item.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex" aria-label={`Rated ${item.rating} out of 5 stars`}>
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={`w-5 h-5 ${
                                    index < item.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            {item.createdAt && (
                              <span className="text-sm text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedFeedback(expandedFeedback === item.id ? null : item.id)}
                        className="hover:bg-primary/10 shrink-0"
                        aria-label={expandedFeedback === item.id ? "Collapse feedback" : "Expand feedback"}
                      >
                        {expandedFeedback === item.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </CardHeader>
                    <AnimatePresence>
                      {expandedFeedback === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent>
                            <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                              {item.feedback}
                            </p>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}