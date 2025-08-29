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
        setMessage(
          responseData.message || "Failed to submit feedback. Please try again."
        );
        setIsSuccess(false);
      }
    } catch (error: any) {
      setMessage("Network error. Please check your connection and try again.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl mx-auto flex flex-col items-center justify-center bg-card rounded-2xl shadow-2xl p-12"
        >
          <Heart className="w-12 h-12 text-primary mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-center">Thank You!</h1>
          <p className="text-lg text-muted-foreground text-center mb-2">
            {message || "Your feedback has been submitted successfully."}
          </p>
        </motion.div>
      ) : (
        <div className="relative max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-border/20 shadow-2xl">
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <Badge variant="outline" className="mb-4">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Share Your Experience
                  </Badge>
                </div>
                <CardTitle className="text-4xl font-bold text-foreground">
                  We Value Your Feedback
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Your insights help us create better experiences for everyone
                </CardDescription>
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
                    <div className="flex gap-3 justify-center p-6 bg-muted/40 rounded-2xl border border-border/50">
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
                                ? "text-yellow-400 fill-yellow-400"
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
                      {formData.feedback.length}/5000 characters (minimum 10 required)
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
                            ? "bg-muted/20 text-primary border-primary/30"
                            : "bg-muted/20 text-destructive border-destructive/30"
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
                    className="w-full text-lg shadow-xl"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <Send className="w-5 h-5" />
                        <span>Submit Feedback</span>
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
