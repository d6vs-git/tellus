// LandingPage.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Sparkles, MessageCircle, BarChart3, Brain, TrendingUp, Lightbulb, Users, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navbar />

      <div
  className="relative flexflex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-0 min-h-[calc(100vh-72px)]"
>

        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative flex flex-col-reverse lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-72px)]">
          <div className="flex-1 flex flex-col items-start justify-center space-y-6 lg:space-y-8 py-12 lg:py-0 text-left">
            <Badge variant="outline" className="text-primary border-primary/30 hover:bg-primary/5 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Customer Feedback Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-foreground text-balance">
              Transform Customer{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Feedback
              </span>{" "}
              Into Growth
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-6">
              <Button className="group shadow-2xl hover:shadow-primary/25 text-lg sm:text-xl px-8 sm:px-12 py-3 sm:py-4" onClick={() => router.push("/api/auth/signin")}>
                <Zap className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                Start Collecting Feedback
                <ArrowRight className="ml-2 sm:ml-3 h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:translate-x-2" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center lg:justify-end mb-12 lg:mb-0">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative h-48 w-48 sm:h-60 sm:w-60 overflow-hidden rounded-full bg-gradient-to-tr from-primary via-primary/80 to-accent p-1 shadow-2xl hover:shadow-primary/25 transition-all duration-500 hover:scale-110">
                <Image src={logo || "/placeholder.svg"} alt="Tellus Logo" className="h-full w-full rounded-full object-cover bg-background p-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative py-16 sm:py-24 bg-gradient-to-b from-transparent to-accent/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <Badge variant="outline" className="mb-4 inline-flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Powerful Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
                Everything You Need for Customer Success
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Cards repeated */}
              {[{
                icon: MessageCircle,
                title: "Collect Feedback",
                desc: "Share a unique feedback link with your customers. Collect star ratings and detailed comments through beautiful, responsive forms.",
                bg: "from-primary/20 to-primary/10",
                color: "text-primary"
              },{
                icon: BarChart3,
                title: "Real-Time Dashboard",
                desc: "Monitor feedback trends, average ratings, and customer sentiment with beautiful charts and analytics.",
                bg: "from-primary/20 to-primary/10",
                color: "text-primary"
              },{
                icon: Brain,
                title: "Semantic Search",
                desc: "Find feedback based on meaning, not just keywords. Search for 'customer service issues' and get relevant results.",
                bg: "from-accent/20 to-accent/10",
                color: "text-accent-foreground"
              },{
                icon: TrendingUp,
                title: "Sentiment Analysis",
                desc: "Automatically categorize feedback as positive, neutral, or negative with AI-powered sentiment detection.",
                bg: "from-chart-1/20 to-chart-1/10",
                color: "text-chart-1"
              },{
                icon: Lightbulb,
                title: "Custom AI Insights",
                desc: "Ask specific questions about your feedback data and get intelligent, actionable insights powered by AI.",
                bg: "from-chart-3/20 to-chart-3/10",
                color: "text-chart-3"
              },{
                icon: Users,
                title: "User Management",
                desc: "Track unique customers, manage feedback sources, and organize testimonials with powerful filtering tools.",
                bg: "from-chart-4/20 to-chart-4/10",
                color: "text-chart-4"
              }].map((f, idx) => (
                <Card key={idx} className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${f.bg}`}>
                        <f.icon className={`h-5 w-5 ${f.color}`} />
                      </div>
                      <CardTitle className="text-lg sm:text-xl">{f.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm sm:text-base">{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-8 sm:p-12 border border-primary/20">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6 text-balance">
                Ready to Transform Your Customer Feedback?
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto text-balance">
                Start collecting, analyzing, and showcasing customer testimonials in minutes. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                {[ "Free to start", "Setup in a minute", "No technical skills needed"].map((txt, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-chart-1" />
                    <span>{txt}</span>
                  </div>
                ))}
              </div>
              <Button className="group shadow-2xl hover:shadow-primary/25 text-lg sm:text-xl px-8 sm:px-12 py-3 sm:py-4" onClick={() => router.push("/api/auth/signin")}>
                <Zap className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                Get Started Free
                <ArrowRight className="ml-2 sm:ml-3 h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:translate-x-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
