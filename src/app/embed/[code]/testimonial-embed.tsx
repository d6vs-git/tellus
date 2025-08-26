"use client"

import { useState, useEffect } from "react"
import { Star, Quote, ChevronLeft, ChevronRight, Sparkles, Shield, Play, Pause } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Feedback = {
  id: string
  name: string
  feedback: string
  rating: number
  createdAt: string
}

type TestimonialEmbedProps = {
  feedback: Feedback[]
  businessName: string
}

export function TestimonialEmbed({ feedback, businessName }: TestimonialEmbedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying || feedback.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feedback.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [feedback.length, isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % feedback.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + feedback.length) % feedback.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  if (feedback.length === 0) {
    return (
      <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center rounded-2xl border border-border/50 shadow-2xl">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:40px_40px] rounded-2xl" />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/20 rounded-full blur-2xl animate-pulse delay-1000" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center p-12 max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4 text-balance">
            Share Your Experience with {businessName}
          </h3>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Be the first to leave a testimonial and help others discover this amazing service!
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Tellus</span>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentTestimonial = feedback[currentIndex]
  const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-background via-accent/5 to-primary/5 p-8 rounded-2xl shadow-2xl border border-border/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:40px_40px] rounded-2xl" />
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative max-w-5xl mx-auto h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              What Our Customers Say
            </h2>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">{averageRating.toFixed(1)}</span>
          </div>

          <p className="text-muted-foreground font-medium">Based on {feedback.length} verified reviews</p>
        </motion.div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="bg-card/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-border/50 hover:shadow-primary/10 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-6 left-6 w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                  <Quote className="w-6 h-6 text-primary" />
                </div>

                <div className="pl-16">
                  <p className="text-foreground text-xl leading-relaxed mb-8 font-medium text-balance">
                    "{currentTestimonial.feedback}"
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < currentTestimonial.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-semibold text-muted-foreground">
                          {currentTestimonial.rating}/5
                        </span>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{currentTestimonial.name}</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {new Date(currentTestimonial.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="bg-gradient-to-r from-chart-1/20 to-chart-1/10 text-chart-1 px-4 py-2 rounded-full text-sm font-semibold border border-chart-1/20 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Verified Review
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {feedback.length > 1 && (
              <>
                <motion.button
                  onClick={prevTestimonial}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-card/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border/50 hover:border-primary/30 hover:bg-primary/5 group"
                  aria-label="Previous testimonial"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>

                <motion.button
                  onClick={nextTestimonial}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-card/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border/50 hover:border-primary/30 hover:bg-primary/5 group"
                  aria-label="Next testimonial"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {feedback.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-3 mt-8"
          >
            {feedback.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary shadow-lg scale-125"
                    : "bg-muted-foreground/30 hover:bg-primary/50 hover:scale-110"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </motion.div>
        )}

        {feedback.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium px-4 py-2 rounded-full hover:bg-primary/5"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause Auto-rotate
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume Auto-rotate
                </>
              )}
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 pt-6 border-t border-border/50"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-primary text-sm">Tellus</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
