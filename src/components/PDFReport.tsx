import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  Link,
} from "@react-pdf/renderer";

// Register fonts (you might need to add these to your project)
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 700,
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: 10,
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryItem: {
    width: "30%",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1f2937",
  },
  ratingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingLabel: {
    fontSize: 10,
    width: 50,
    color: "#374151",
  },
  ratingBarFill: {
    height: 10,
    backgroundColor: "#3b82f6",
    borderRadius: 2,
  },
  ratingCount: {
    fontSize: 10,
    marginLeft: 10,
    color: "#6b7280",
  },
  insightText: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "#374151",
    marginBottom: 8,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "#e5e7eb",
    marginBottom: 15,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 8,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 600,
    color: "#374151",
  },
  tableCell: {
    fontSize: 10,
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
  },
  sentimentChart: {
    flexDirection: "row",
    height: 20,
    marginBottom: 15,
    borderRadius: 4,
    overflow: "hidden",
  },
  sentimentSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sentimentLabel: {
    fontSize: 8,
    color: "white",
    fontWeight: 600,
  },
});

interface VisualData {
  ratingTrends: { rating: number; percentage: number; count: number }[];
  sentimentChart: { name: string; value: number; color: string }[];
}

interface SummaryData {
  totalFeedback: number;
  averageRating: number;
  sentiment: {
    positivePercentage: number;
    negativePercentage?: number;
    neutralPercentage?: number;
  };
}

interface PDFReportProps {
  userCode: string;
  insights: string;
  summary: SummaryData;
  visualData: VisualData;
  feedbacks: any[];
}

const PDFReport: React.FC<PDFReportProps> = ({
  userCode,
  insights,
  summary,
  visualData,
  feedbacks,
}) => {
  // Format the insights text properly
  const formatInsights = (text: string) => {
    return text
      .replace(/###\s+/g, "\n\n### ")
      .replace(/##\s+/g, "\n\n## ")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\n\s*\n/g, "\n\n");
  };

  // Parse markdown-like sections
  const parseSections = (text: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = text.split("\n");
    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      if (
        line.startsWith("### ") ||
        line.startsWith("## ") ||
        line.startsWith("# ")
      ) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s/, ""),
          content: "",
        };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const formattedInsights = formatInsights(insights);
  const insightSections = parseSections(formattedInsights);
  const generatedDate = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Feedback Analysis Report</Text>
          <Text style={styles.subtitle}>Generated for: {userCode}</Text>
          <Text style={styles.subtitle}>Date: {generatedDate}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Feedback</Text>
              <Text style={styles.summaryValue}>{summary.totalFeedback}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average Rating</Text>
              <Text style={styles.summaryValue}>
                {summary.averageRating.toFixed(1)}/5
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Positive Sentiment</Text>
              <Text style={styles.summaryValue}>
                {summary.sentiment.positivePercentage}%
              </Text>
            </View>
          </View>

          {/* Rating Distribution */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 10,
              color: "#374151",
            }}
          >
            Rating Distribution
          </Text>
          {visualData.ratingTrends.map(
            (rating: { rating: any; percentage: any; count: any }) => (
              <View key={rating.rating} style={styles.ratingBar}>
                <Text style={styles.ratingLabel}>{rating.rating} stars</Text>
                <View
                  style={[
                    styles.ratingBarFill,
                    { width: `${rating.percentage}%` },
                  ]}
                />
                <Text style={styles.ratingCount}>
                  {rating.count} ({rating.percentage}%)
                </Text>
              </View>
            )
          )}
        </View>

        {/* Sentiment Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
          <View style={styles.sentimentChart}>
            {visualData.sentimentChart.map(
              (sentiment: { name: any; value: number; color: any }) => (
                <View
                  key={sentiment.name}
                  style={[
                    styles.sentimentSegment,
                    {
                      width: `${
                        (sentiment.value / summary.totalFeedback) * 100
                      }%`,
                      backgroundColor: sentiment.color,
                    },
                  ]}
                >
                  <Text style={styles.sentimentLabel}>
                    {sentiment.name} (
                    {Math.round(
                      (sentiment.value / summary.totalFeedback) * 100
                    )}
                    %)
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI-Powered Analysis</Text>
          {insightSections.map((section, index) => (
            <View key={index} style={{ marginBottom: 15 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#1f2937",
                }}
              >
                {section.title}
              </Text>
              <Text style={styles.insightText}>{section.content.trim()}</Text>
            </View>
          ))}
        </View>

        {/* Sample Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Feedback Samples</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Name</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Rating</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Feedback</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Date</Text>
              </View>
            </View>

            {/* Table Rows */}
            {feedbacks.slice(0, 5).map((feedback, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{feedback.name}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{feedback.rating}/5</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {feedback.feedback.length > 50
                      ? `${feedback.feedback.substring(0, 50)}...`
                      : feedback.feedback}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Feedback Analytics • {generatedDate} • Confidential
        </Text>
      </Page>
    </Document>
  );
};

export default PDFReport;
