"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clipboard,
  Star,
  Code,
  ChevronUp,
  ChevronDown,
  Users,
  MessageSquare,
  Search,
  Brain,
  TrendingUp,
  Filter,
  Sparkles,
  BarChart3,
  Zap,
  Target,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { Navbar } from "@/components/Navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

type Feedback = {
  id: string
  name: string
  feedback: string
  rating: number
  createdAt?: string
  similarity_score?: number
}

type Insights = {
  insights: string
  summary: {
    totalFeedback: number
    averageRating: number
    ratingDistribution: Record<number, number>
    sentiment: {
      positive: number
      neutral: number
      negative: number
      positivePercentage: number
    }
    trends: {
      recent_average: number
      improving: boolean
      declining: boolean
    }
  }
  topFeedback: {
    highest: Feedback[]
    lowest: Feedback[]
  }
}

type DashboardClientProps = {
  feedbackUrl: string
  feedback: Feedback[]
  userCode: string
}

export function DashboardClient({ feedbackUrl, feedback, userCode }: DashboardClientProps) {
  const [isEmbedCodeOpen, setIsEmbedCodeOpen] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [copyConfirmation, setCopyConfirmation] = useState<string | null>(null)

  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{
    vectorSearch: Feedback[]
    textSearch: Feedback[]
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // AI Insights states
  const [insights, setInsights] = useState<Insights | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [customQuery, setCustomQuery] = useState("")
  const [customInsights, setCustomInsights] = useState<any>(null)

  // Filter states
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState<string>("all")

  const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length || 0

  // Load AI insights on component mount
  useEffect(() => {
    loadInsights()
  }, [userCode])

  const loadInsights = async () => {
    if (feedback.length === 0) return

    setIsLoadingInsights(true)
    try {
      const response = await fetch(`/api/insights?code=${userCode}&timeframe=30`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error("Failed to load insights:", error)
    }
    setIsLoadingInsights(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userCode,
          limit: 10,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error("Search failed:", error)
    }
    setIsSearching(false)
  }

  const handleCustomInsights = async () => {
    if (!customQuery.trim()) return

    setIsLoadingInsights(true)
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCode,
          customQuery,
          timeframe: 30,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCustomInsights(data)
      }
    } catch (error) {
      console.error("Custom insights failed:", error)
    }
    setIsLoadingInsights(false)
  }

  const filteredFeedback = feedback.filter((item) => {
    const matchesRating = ratingFilter === null || Math.floor(item.rating) === ratingFilter
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "recent" && new Date(item.createdAt || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    return matchesRating && matchesDate
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navbar />

      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative pt-24 pb-12">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-primary to-primary/60 shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Revolutionary insights and analytics for your customer feedback
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg h-14">
              <TabsTrigger
                value="overview"
                className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Target className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Search className="w-4 h-4 mr-2" />
                Smart Search
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border-primary/10 hover:border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">Unique Users</CardTitle>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {new Set(feedback.map((f) => f.name)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">Active contributors</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="group hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:-translate-y-1 border-accent/10 hover:border-accent/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">Total Feedback</CardTitle>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 group-hover:from-accent/30 group-hover:to-accent/20 transition-all">
                        <MessageSquare className="h-5 w-5 text-accent-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-1">{feedback.length}</div>
                      <div className="text-sm text-muted-foreground">Total responses</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="group hover:shadow-xl hover:shadow-chart-1/10 transition-all duration-300 hover:-translate-y-1 border-chart-1/10 hover:border-chart-1/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">Average Rating</CardTitle>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-400/10 group-hover:from-yellow-400/30 group-hover:to-yellow-400/20 transition-all">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-2">{averageRating.toFixed(1)}</div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(averageRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="group hover:shadow-xl hover:shadow-chart-1/10 transition-all duration-300 hover:-translate-y-1 border-chart-1/10 hover:border-chart-1/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">Sentiment Score</CardTitle>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-1/10 group-hover:from-chart-1/30 group-hover:to-chart-1/20 transition-all">
                        <TrendingUp className="h-5 w-5 text-chart-1" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {insights ? `${insights.summary.sentiment.positivePercentage}%` : "Loading..."}
                      </div>
                      <div className="text-sm text-muted-foreground">Positive feedback</div>
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
                        Share this URL with your users to collect feedback or embed the feedback form on your website to
                        gather testimonials seamlessly.
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
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(feedbackUrl)
                        setCopyConfirmation("url")
                        setTimeout(() => setCopyConfirmation(null), 2000)
                      }}
                      size="lg"
                    >
                      <Clipboard className="w-4 h-4 mr-2" />
                      {copyConfirmation === "url" ? "Copied!" : "Copy"}
                    </Button>
                  </div>

                  <Button
                    onClick={() => setIsEmbedCodeOpen(true)}
                    variant="outline"
                    size="lg"
                    className="hover:bg-primary/5 hover:border-primary/50"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Get Embed Code
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-8">
              <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Smart Feedback Search</CardTitle>
                      <CardDescription className="text-base">
                        Use AI-powered semantic search to find relevant feedback based on meaning, not just keywords.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Search for feedback about features, issues, or sentiments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="text-base"
                    />
                    <Button onClick={handleSearch} disabled={isSearching}size="lg">
                      {isSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  {searchResults && (
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="text-xl font-bold">AI Semantic Search Results</h3>
                          <Badge>{searchResults.vectorSearch.length} results</Badge>
                        </div>
                        {searchResults.vectorSearch.length > 0 ? (
                          <div className="grid gap-4">
                            {searchResults.vectorSearch.map((item: any) => (
                              <Card
                                key={item.id}
                                className="hover:shadow-lg transition-all duration-300 border-primary/10"
                              >
                                <CardContent className="pt-6">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="font-semibold text-lg">{item.name}</div>
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline">
                                        {(1 - item.similarity_score).toFixed(2)} similarity
                                      </Badge>
                                      <div className="flex">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < item.rating
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-muted-foreground/30"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed">{item.feedback}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No semantically similar feedback found.
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <Filter className="h-5 w-5 text-accent-foreground" />
                          <h3 className="text-xl font-bold">Keyword Search Results</h3>
                          <Badge variant="secondary">{searchResults.textSearch.length} results</Badge>
                        </div>
                        {searchResults.textSearch.length > 0 ? (
                          <div className="grid gap-4">
                            {searchResults.textSearch.map((item) => (
                              <Card key={item.id} className="bg-white/30">
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < item.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground">{item.feedback}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No keyword matches found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* General AI Insights */}
                <Card className="bg-white/50 backdrop-blur-sm lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI-Generated Insights
                    </CardTitle>
                    <CardDescription>
                      AI analysis of your feedback patterns, trends, and actionable recommendations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingInsights ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-darkGray"></div>
                      </div>
                    ) : insights ? (
                      <div className="space-y-4">
                        <div className="prose max-w-none bg-white/30 p-4 rounded-lg text-sm">
                          <ReactMarkdown>{insights.insights}</ReactMarkdown>
                        </div>

                        {insights.summary && (
                          <div className="grid gap-4 md:grid-cols-3 mt-6">
                            <Card className="bg-white/30">
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {insights.summary.sentiment.positive}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Positive Reviews</div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-white/30">
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-yellow-600">
                                    {insights.summary.sentiment.neutral}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Neutral Reviews</div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-white/30">
                              <CardContent className="pt-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {insights.summary.sentiment.negative}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Critical Reviews</div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No feedback available for AI analysis
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Custom Query Insights */}
                <Card className="bg-white/50 backdrop-blur-sm lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Custom AI Analysis</CardTitle>
                    <CardDescription>
                      Ask specific questions about your feedback data and get AI-powered insights.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask about specific topics like 'customer service issues' or 'product features mentioned'..."
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button onClick={handleCustomInsights} disabled={isLoadingInsights}>
                        <Brain className="w-4 h-4 mr-2" />
                        Analyze
                      </Button>
                    </div>

                    {customInsights && (
                      <div className="space-y-4">
                        <div className="bg-white/30 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Analysis Results:</h4>
                          <div className="text-sm prose">
                            <ReactMarkdown>{customInsights.insights}</ReactMarkdown>
                          </div>
                        </div>

                        {customInsights.relevantFeedback && customInsights.relevantFeedback.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Most Relevant Feedback:</h4>
                            <div className="space-y-2">
                              {customInsights.relevantFeedback.map((item: any) => (
                                <div key={item.id} className="bg-white/20 p-3 rounded text-sm">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-muted-foreground">{item.feedback}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-8">
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRatingFilter(null)
                          setDateFilter("all")
                        }}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isEmbedCodeOpen} onOpenChange={setIsEmbedCodeOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Embed Testimonials</DialogTitle>
            <DialogDescription className="text-base">
              Copy and paste the following code into your website to embed the feedback testimonials. This code
              dynamically fetches testimonials associated with your unique code and displays them beautifully on your
              site.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-6 rounded-xl border border-border/50">
            <code className="text-sm break-all font-mono text-foreground">
              {`<iframe src="https://tellus.abhiramverse.tech/embed/${userCode}" height="500px" width="1000px"></iframe>`}
            </code>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(
                `<iframe src="https://tellus.abhiramverse.tech/embed/${userCode}" height="500px" width="1000px"></iframe>`,
              )
              setCopyConfirmation("embed")
              setTimeout(() => setCopyConfirmation(null), 2000)
            }}
            size="lg"
          >
            <Clipboard className="w-4 h-4 mr-2" />
            {copyConfirmation === "embed" ? "Copied!" : "Copy Code"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Preview your testimonials at:{" "}
            <a
              href={`https://tellus.abhiramverse.tech/embed/${userCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {`https://tellus.abhiramverse.tech/embed/${userCode}`}
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
