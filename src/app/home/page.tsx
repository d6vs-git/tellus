import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/home/OverviewTab";
import { SearchTab } from "@/components/home/SearchTab";
import InsightsTab from "@/components/home/InsightsTab";
import { AIChatTab } from "@/components/home/AIChatTab";
import { FeedbackTab } from "@/components/home/FeedbackTab";
import { MessageSquare, Search, Brain, Sparkles, Target } from "lucide-react";
import { findUserByEmail } from "@/db/user";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect("/api/auth/signin");
  }

  // Get user data from database using plain SQL
  let userCode: string;
  try {
    const user = await findUserByEmail(session.user.email);
    if (!user) {
      // User not found in database, redirect to sign in
      redirect("/");
    }
    userCode = user.code;
  } catch (error) {
    console.error("Error fetching user data:", error);
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Navbar />

      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative pt-24 pb-12">
        <div className="container mx-auto p-6 max-w-7xl">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg h-14">
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
                value="ai-chat"
                className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Chat
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
              <OverviewTab userCode={userCode} />
            </TabsContent>

            <TabsContent value="search" className="space-y-8">
              <SearchTab userCode={userCode} />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <InsightsTab userCode={userCode} />
            </TabsContent>

            <TabsContent value="ai-chat" className="space-y-6">
              <AIChatTab userCode={userCode} />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-8">
              <FeedbackTab userCode={userCode} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
