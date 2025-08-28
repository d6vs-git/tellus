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

  const handleSearch = async (e?: React.SyntheticEvent) => {
    // Guard: if called as an event handler, prevent default and ignore event
    if (e && typeof (e as any).preventDefault === 'function') {
      e.preventDefault();
    }
    if (!searchQuery.trim() || !userCode) return;
    setIsSearching(true);
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
        setSearchResults(null);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults(null);
    }
    setIsSearching(false);
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
    <Card className="border-primary/10 hover:border-primary/30 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
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
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchResults && (
          <div className="space-y-8">
            {/* Search Query Display */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Results for: <span className="font-medium">"{searchResults.query}"</span>
              </p>
            </div>

            {/* Summary Stats */}
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

            {/* No Results Message */}
            {searchResults.total === 0 && (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No relevant results found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try using different keywords or more specific terms
                </p>
              </div>
            )}

            {/* Combined Results */}
            {searchResults.allResults && searchResults.allResults.length > 0 && (
              <div className="grid gap-4">
                {searchResults.allResults.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all duration-300 border-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-lg">{item.name}</div>
                        <div className="flex items-center gap-3">
                          {typeof item.relevance_score === 'number' && (
                            <Badge 
                              variant="outline" 
                              className={
                                item.relevance_score > 70 ? "bg-green-50 text-green-700 border-green-200" :
                                item.relevance_score > 40 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
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