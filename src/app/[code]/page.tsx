"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";
import { StarIcon, Send, Heart, Sparkles, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedbackPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    name: "",
    feedback: "",
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Client-side validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage("Please enter your name");
      setIsSuccess(false);
      return false;
    }

    if (formData.name.trim().length < 2) {
      setMessage("Name must be at least 2 characters long");
      setIsSuccess(false);
      return false;
    }

    if (!formData.feedback.trim()) {
      setMessage("Please provide your feedback");
      setIsSuccess(false);
      return false;
    }

    if (formData.feedback.trim().length < 10) {
      setMessage("Feedback must be at least 10 characters long");
      setIsSuccess(false);
      return false;
    }

    if (formData.rating === 0) {
      setMessage("Please select a rating");
      setIsSuccess(false);
      return false;
    }

    if (!params.code) {
      setMessage("Invalid feedback code");
      setIsSuccess(false);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    // Client-side validation
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Debug log
    console.log("Submitting feedback:", {
      ...formData,
      code: params.code,
      codeLength: params.code?.toString().length,
      codeType: typeof params.code,
    });

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          feedback: formData.feedback.trim(),
          rating: formData.rating,
          code: params.code?.toString() || "",
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage(responseData.message || "Thank you for your feedback!");
        setFormData({ name: "", feedback: "", rating: 0 });
        setIsSuccess(true);
      } else {
        // Use the server's error message if available
        setMessage(
          responseData.message || "Failed to submit feedback. Please try again."
        );
        setIsSuccess(false);
        console.error("Server error:", responseData);
      }
    } catch (error: any) {
      console.error("Feedback form submission error:", error);
      setMessage("Network error. Please check your connection and try again.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 py-12 px-4 flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300 shadow-2xl hover:shadow-primary/10">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Badge variant="outline" className="mb-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Share Your Experience
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                We Value Your Feedback
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Your insights help us create better experiences for everyone
              </CardDescription>
              {/* Debug info in development */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Debug: Code = {params.code} (Length:{" "}
                  {params.code?.toString().length})
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    required
                    className="text-base h-12"
                    maxLength={100}
                  />
                  <div className="text-xs text-muted-foreground">
                    {formData.name.length}/100 characters
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    How would you rate your experience?
                  </Label>
                  <div className="flex gap-3 justify-center p-6 bg-gradient-to-r from-accent/10 to-primary/5 rounded-2xl border border-border/50">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, rating: star })
                        }
                        className="focus:outline-none group"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <StarIcon
                          className={`w-10 h-10 transition-all duration-200 ${
                            formData.rating >= star
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                              : "text-muted-foreground/40 hover:text-yellow-300 group-hover:scale-110"
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  {formData.rating > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <Badge
                        variant="outline"
                        className="text-primary border-primary/30"
                      >
                        {formData.rating === 5
                          ? "Excellent!"
                          : formData.rating === 4
                          ? "Great!"
                          : formData.rating === 3
                          ? "Good!"
                          : formData.rating === 2
                          ? "Fair"
                          : "Needs Improvement"}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="feedback" className="text-base font-semibold">
                    Tell us more about your experience
                  </Label>
                  <Textarea
                    id="feedback"
                    value={formData.feedback}
                    onChange={(e) =>
                      setFormData({ ...formData, feedback: e.target.value })
                    }
                    placeholder="Share your thoughts, suggestions, or any details about your experience..."
                    required
                    className="min-h-32 text-base resize-none"
                    maxLength={5000}
                  />
                  <div className="text-xs text-muted-foreground">
                    {formData.feedback.length}/5000 characters (minimum 10
                    required)
                  </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`p-6 rounded-2xl border ${
                        isSuccess
                          ? "bg-chart-1/10 text-chart-1 border-chart-1/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSuccess ? (
                          <Heart className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span className="font-medium">{message}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={isSubmitting || formData.rating === 0}
                  className="w-full text-lg shadow-xl hover:shadow-2xl hover:shadow-primary/25"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="flex items-center gap-3"
                    >
                      <Send className="w-5 h-5" />
                      <span>Submitting...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3"
                    >
                      <Send className="w-5 h-5" />
                      <span>Submit Feedback</span>
                    </motion.div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
