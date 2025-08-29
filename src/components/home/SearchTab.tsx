"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Filter, Star, AlertCircle } from "lucide-react";

interface SearchTabProps {
  userCode: string;
}

export function SearchTab({ userCode }: SearchTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.SyntheticEvent) => {
    if (e && typeof (e as any).preventDefault === "function") {
      e.preventDefault();
    }
    if (!searchQuery.trim() || !userCode) return;
    setIsSearching(true);
    setError(null);
    setSearchResults(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          userCode,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        const err = await response.json();
        setError(err?.error || "Search failed. Please try again.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Helper to render stars
  const renderStars = (rating: number) => (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );

  return (
    <Card className="border-border/20 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/40">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Smart Feedback Search</CardTitle>
            <CardDescription className="text-base">
              AI-powered semantic and keyword search to find relevant feedback.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Search for feedback about features, issues, or sentiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
            className="text-base flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching} size="lg">
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Searching...</span>
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </div>
        {isSearching && (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-muted-foreground">Searching feedback...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8 border rounded-lg bg-muted/20">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}
        {searchResults && !isSearching && !error && (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Results for: <span className="font-medium">"{searchResults.query}"</span>
              </p>
            </div>
            <div className="flex gap-4 items-center justify-center flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {searchResults.semanticCount} AI results
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {searchResults.keywordCount} Keyword results
              </Badge>
              <Badge>{searchResults.total} relevant results</Badge>
            </div>
            {searchResults.total === 0 && (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No relevant results found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try using different keywords or more specific terms
                </p>
              </div>
            )}
            {searchResults.allResults && searchResults.allResults.length > 0 && (
              <div className="grid gap-4">
                {searchResults.allResults.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all duration-300 border-border/20">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-lg">{item.name}</div>
                        <div className="flex items-center gap-3">
                          {typeof item.relevance_score === "number" && (
                            <Badge
                              variant="outline"
                              className={
                                item.relevance_score > 70
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : item.relevance_score > 40
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {item.relevance_score.toFixed(0)}% match
                            </Badge>
                          )}
                          {renderStars(item.rating)}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{item.feedback}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}