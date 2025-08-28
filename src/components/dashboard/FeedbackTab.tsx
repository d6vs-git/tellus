"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronUp, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";


interface FeedbackTabProps {
  userCode: string;
}

export function FeedbackTab({ userCode }: FeedbackTabProps) {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!userCode) return;
    loadFeedback(userCode);
  }, [userCode]);

  const loadFeedback = async (code: string) => {
    try {
      const response = await fetch(`/api/feedback?code=${code}`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (error) {
      console.error("Failed to load feedback:", error);
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    const matchesRating = ratingFilter === null || Math.floor(item.rating) === ratingFilter;
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "recent" && new Date(item.createdAt || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return matchesRating && matchesDate;
  });

  const clearFilters = () => {
    setRatingFilter(null);
    setDateFilter("all");
  };

  return (
    <div className="space-y-8">
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-xl">Filter Feedback</CardTitle>
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
              >
                All Time
              </Button>
              <Button
                size="sm"
                variant={dateFilter === "recent" ? "default" : "outline"}
                onClick={() => setDateFilter("recent")}
              >
                Last 7 Days
              </Button>
            </div>
            {(ratingFilter !== null || dateFilter !== "all") && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
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

        <div className="grid gap-6">
          {filteredFeedback.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Card className="hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-primary/10 hover:border-primary/30">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-3">
                        <div className="flex">
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
                    className="hover:bg-primary/10"
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
                        <p className="text-muted-foreground leading-relaxed text-base">{item.feedback}</p>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
