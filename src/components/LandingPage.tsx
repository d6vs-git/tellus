"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Star,
  MessageCircle,
  Code2Icon,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Brain,
  BarChart3,
  Globe,
  Users,
  Target,
  Lightbulb,
  CheckCircle,
  Play,
} from "lucide-react"
import logo from "@/assets/logo.png"
import { useRouter } from "next/navigation"
import { Navbar } from "./Navbar"

export function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navbar />

      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Enhanced logo section */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <div className="relative h-40 w-40 overflow-hidden rounded-full bg-gradient-to-tr from-primary via-primary/80 to-accent p-1 shadow-2xl hover:shadow-primary/25 transition-all duration-500 hover:scale-110">
                  <Image
                    src={logo || "/placeholder.svg"}
                    alt="Tellus Logo"
                    className="h-full w-full rounded-full object-cover bg-background p-2"
                  />
                </div>
              </div>

              <div className="space-y-6 max-w-4xl">
                <Badge variant="outline" className="text-primary border-primary/30 hover:bg-primary/5">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Customer Feedback Platform
                </Badge>

                <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl text-balance">
                  Transform Customer{" "}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                    Feedback
                  </span>{" "}
                  Into Growth
                </h1>

                <p className="text-xl leading-relaxed text-muted-foreground max-w-3xl text-balance">
                  Collect, analyze, and showcase customer testimonials with AI-powered insights. Get semantic search,
                  sentiment analysis, and beautiful embeddable widgets that convert visitors into customers.
                </p>
              </div>

              {/* Enhanced CTA section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-8">
                <Button
                  className="group shadow-2xl hover:shadow-primary/25 text-lg px-12"
                  onClick={() => router.push("/api/auth/signin")}
                >
                  <Zap className="mr-3 h-5 w-5" />
                  Start Collecting Feedback
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Button>

                <Button
                  variant="outline"
                  className="text-lg px-8 hover:bg-primary/5 hover:border-primary/50 bg-transparent"
                  onClick={() => window.open("https://tellus.abhiramverse.tech/embed/demo", "_blank")}
                >
                  <Play className="mr-2 h-5 w-5" />
                  View Live Demo
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-8 pt-12 text-muted-foreground flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium">Enterprise Security</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="ml-2 font-medium">5.0 Rating</span>
                </div>
                <div className="font-medium">10,000+ Testimonials Collected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-24 bg-gradient-to-b from-transparent to-accent/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Target className="w-4 h-4 mr-2" />
              How Tellus Works
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">
              Three Simple Steps to Customer Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              From feedback collection to AI insights to website integration - all in one powerful platform
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-20">
            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border-primary/10 hover:border-primary/30 relative">
              <div className="absolute -top-4 left-6 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                1
              </div>
              <CardHeader className="text-center pt-8">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-balance">Collect Feedback</CardTitle>
                <CardDescription className="text-base">
                  Share your unique feedback URL with customers. They leave reviews with star ratings and detailed
                  comments through our beautiful, responsive forms.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 hover:-translate-y-2 border-accent/10 hover:border-accent/30 relative">
              <div className="absolute -top-4 left-6 bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                2
              </div>
              <CardHeader className="text-center pt-8">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-balance">AI-Powered Analytics</CardTitle>
                <CardDescription className="text-base">
                  Get semantic search, sentiment analysis, and custom AI insights. Ask questions like "What do customers
                  say about pricing?" and get intelligent answers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-chart-1/10 transition-all duration-500 hover:-translate-y-2 border-chart-1/10 hover:border-chart-1/30 relative">
              <div className="absolute -top-4 left-6 bg-chart-1 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                3
              </div>
              <CardHeader className="text-center pt-8">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-1 to-chart-1/60 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 mb-4">
                  <Code2Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-balance">Embed & Convert</CardTitle>
                <CardDescription className="text-base">
                  Get one-click embed code to display rotating testimonials on your website. Beautiful, responsive
                  widgets that build trust and convert visitors.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">
              Everything You Need for Customer Success
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Real-Time Dashboard</CardTitle>
                </div>
                <CardDescription>
                  Monitor feedback trends, average ratings, and customer sentiment with beautiful charts and analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10">
                    <Brain className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-lg">Semantic Search</CardTitle>
                </div>
                <CardDescription>
                  Find feedback based on meaning, not just keywords. Search for "customer service issues" and get
                  relevant results.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-1/10">
                    <TrendingUp className="h-5 w-5 text-chart-1" />
                  </div>
                  <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
                </div>
                <CardDescription>
                  Automatically categorize feedback as positive, neutral, or negative with AI-powered sentiment
                  detection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-chart-2/20 to-chart-2/10">
                    <Globe className="h-5 w-5 text-chart-2" />
                  </div>
                  <CardTitle className="text-lg">Embeddable Widgets</CardTitle>
                </div>
                <CardDescription>
                  Beautiful, responsive testimonial carousels that integrate seamlessly with any website or platform.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-chart-3/20 to-chart-3/10">
                    <Lightbulb className="h-5 w-5 text-chart-3" />
                  </div>
                  <CardTitle className="text-lg">Custom AI Insights</CardTitle>
                </div>
                <CardDescription>
                  Ask specific questions about your feedback data and get intelligent, actionable insights powered by
                  AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-chart-4/20 to-chart-4/10">
                    <Users className="h-5 w-5 text-chart-4" />
                  </div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                </div>
                <CardDescription>
                  Track unique customers, manage feedback sources, and organize testimonials with powerful filtering
                  tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <div className="relative py-20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Trusted by Growing Businesses</h3>
            <p className="text-lg text-muted-foreground">
              Join thousands of companies using Tellus to grow through customer feedback
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50M+</div>
              <div className="text-muted-foreground font-medium">Feedback Collected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground font-medium">Active Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-muted-foreground font-medium">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground font-medium">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-12 border border-primary/20">
            <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">
              Ready to Transform Your Customer Feedback?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Start collecting, analyzing, and showcasing customer testimonials in minutes. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-chart-1" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-chart-1" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-chart-1" />
                <span>No technical skills needed</span>
              </div>
            </div>

            <Button
              className="group shadow-2xl hover:shadow-primary/25 text-lg px-12"
              onClick={() => router.push("/api/auth/signin")}
            >
              <Zap className="mr-3 h-5 w-5" />
              Get Started Free
              <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
