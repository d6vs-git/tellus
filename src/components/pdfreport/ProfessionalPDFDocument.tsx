import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Clean, minimal PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 25,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  dateText: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  summaryItem: {
    width: "48%",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5,
  },
  ratingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 10,
    width: "25%",
    fontWeight: "bold",
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  ratingBar: {
    height: "100%",
    backgroundColor: "#4B5563",
    borderRadius: 3,
  },
  ratingValue: {
    fontSize: 10,
    fontWeight: "bold",
    width: "20%",
    textAlign: "right",
  },
  paragraph: {
    marginBottom: 12,
  },
  text: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
    textAlign: "left",
  },
  bulletPoint: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
    marginLeft: 10,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 10,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 4,
  },
  insightsBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 15,
    marginTop: 20,
  },
  insightsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  insightsGrid: {
    flexDirection: "column",
    gap: 6,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 9,
    color: "#4B5563",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 10,
    right: 40,
    color: "#9CA3AF",
  },
  subBullet: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
    marginLeft: 20,
    marginBottom: 6,
  },
});

// Final clean function to parse markdown content
const parseMarkdownContent = (
  text: string
): {
  type: "heading" | "paragraph" | "bullet" | "subbullet";
  content: string;
  level?: number;
}[] => {
  if (!text) return [{ type: "paragraph", content: "No analysis available" }];

  const structuredContent: {
    type: "heading" | "paragraph" | "bullet" | "subbullet";
    content: string;
    level?: number;
  }[] = [];

  // Clean the text - remove random starting text and artifacts
  let cleanedText = text
    // Remove random starting text patterns
    .replace(/^[a-zA-Z0-9@]*\s*/gm, "")
    .replace(/a@Bxistin[\s\S]*?demogr/g, "")
    .replace(/@otenti[\s\S]*?elemen/g, "")
    .replace(/@espo[\s\S]*?this can/g, "")
    .replace(/tion: Dee[\s\S]*?those \|/g, "")
    .replace(/\* Market F[\s\S]*/g, "")
    .replace(/@urren[\s\S]*?the targ/g, "")
    .replace(/@®pport[\s\S]*?design\./g, "")
    .replace(/@otenti[\s\S]*?hattar \|/g, "")
    // Remove other common artifacts
    .replace(/[\*]{3,}/g, "")
    .replace(/[#]{4,}/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/---+/g, "")
    .trim();

  const lines = cleanedText.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith("---") &&
      !trimmed.match(/^[=-]{5,}/)
    );
  });

  let currentSection = "";
  let inList = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) return;

    // Skip any remaining random text patterns
    if (
      trimmedLine.match(/^[a-z0-9@]/i) &&
      trimmedLine.length < 20 &&
      !trimmedLine.includes(" ")
    ) {
      return;
    }

    // Detect main headings
    if (trimmedLine.match(/^#{1,3}\s/)) {
      const headingLevel = trimmedLine.match(/^#+/)?.[0].length || 1;
      const headingText = trimmedLine.replace(/^#+\s/, "").trim();

      if (headingLevel <= 2 && headingText.length > 3) {
        currentSection = headingText;
        structuredContent.push({ type: "heading", content: headingText });
      }
      inList = false;
      return;
    }

    // Detect bullet points
    if (trimmedLine.match(/^[\*\-•]\s/)) {
      const bulletText = trimmedLine.replace(/^[\*\-•]\s/, "").trim();
      if (bulletText.length > 3) {
        structuredContent.push({ type: "bullet", content: bulletText });
        inList = true;
      }
      return;
    }

    // Detect numbered lists
    if (trimmedLine.match(/^\d+\.\s/)) {
      const numberedText = trimmedLine.replace(/^\d+\.\s/, "").trim();
      if (numberedText.length > 3) {
        structuredContent.push({ type: "bullet", content: numberedText });
        inList = true;
      }
      return;
    }

    // Regular paragraphs (only add if meaningful content)
    if (trimmedLine.length > 10 && !trimmedLine.match(/^[\[\]\(\)@]/)) {
      const cleanParagraph = trimmedLine.replace(/\s+/g, " ").trim();

      structuredContent.push({ type: "paragraph", content: cleanParagraph });
      inList = false;
    }
  });

  // Filter out any remaining short/meaningless items
  return structuredContent.filter(
    (item) =>
      item.content.length > 5 &&
      !item.content.match(/^[@#\*]/) &&
      item.content.split(" ").length > 1
  );
};

export interface ProfessionalPDFDocumentProps {
  insightsData: string;
  summaryData: {
    totalFeedback: number;
    averageRating: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
      positivePercentage: number;
    };
    ratingDistribution: Record<number, number>;
  };
}

const ProfessionalPDFDocument: React.FC<ProfessionalPDFDocumentProps> = ({
  insightsData,
  summaryData,
}) => {
  const structuredContent = parseMarkdownContent(insightsData);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>AI Insights Report</Text>
        </View>

        {/* Executive Summary */}
        <View style={pdfStyles.summaryCard}>
          <Text style={pdfStyles.summaryTitle}>Executive Summary</Text>

          <View style={pdfStyles.summaryGrid}>
            <View style={pdfStyles.summaryRow}>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Total Reviews</Text>
                <Text style={pdfStyles.summaryValue}>
                  {summaryData.totalFeedback}
                </Text>
              </View>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Average Rating</Text>
                <Text style={pdfStyles.summaryValue}>
                  {summaryData.averageRating.toFixed(1)}/5.0
                </Text>
              </View>
            </View>

            <View style={pdfStyles.summaryRow}>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Positive Sentiment</Text>
                <Text style={pdfStyles.summaryValue}>
                  {summaryData.sentiment.positivePercentage}%
                </Text>
              </View>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Happy Customers</Text>
                <Text style={pdfStyles.summaryValue}>
                  {summaryData.sentiment.positive}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={pdfStyles.divider} />

        {/* Rating Distribution */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Rating Distribution</Text>
          {Object.entries(summaryData.ratingDistribution)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([rating, count]) => {
              const percentage =
                summaryData.totalFeedback > 0
                  ? (count / summaryData.totalFeedback) * 100
                  : 0;
              const barWidth = `${Math.max(5, percentage)}%`;

              return (
                <View key={rating} style={pdfStyles.ratingItem}>
                  <Text style={pdfStyles.ratingLabel}>{rating} Stars</Text>
                  <View style={pdfStyles.ratingBarContainer}>
                    <View style={[pdfStyles.ratingBar, { width: barWidth }]} />
                  </View>
                  <Text style={pdfStyles.ratingValue}>
                    {count} ({percentage.toFixed(1)}%)
                  </Text>
                </View>
              );
            })}
        </View>

        <View style={pdfStyles.divider} />

        {/* Detailed Analysis */}
        {structuredContent.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Detailed Analysis</Text>

            {structuredContent.map((item, index) => {
              if (item.type === "heading") {
                return (
                  <View key={index} style={pdfStyles.paragraph}>
                    <Text style={pdfStyles.subsectionTitle}>
                      {item.content}
                    </Text>
                  </View>
                );
              } else if (item.type === "bullet") {
                return (
                  <View key={index} style={pdfStyles.paragraph}>
                    <Text style={pdfStyles.bulletPoint}>• {item.content}</Text>
                  </View>
                );
              } else {
                return (
                  <View key={index} style={pdfStyles.paragraph}>
                    <Text style={pdfStyles.text}>{item.content}</Text>
                  </View>
                );
              }
            })}
          </View>
        )}

        <View style={pdfStyles.divider} />

        {/* Key Metrics Box */}
        <View style={pdfStyles.insightsBox}>
          <Text style={pdfStyles.insightsTitle}>Key Metrics</Text>
          <View style={pdfStyles.insightsGrid}>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>
                • Based on {summaryData.totalFeedback} customer reviews
              </Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>
                • {summaryData.sentiment.positivePercentage}% positive sentiment
              </Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>
                • Average rating: {summaryData.averageRating.toFixed(1)}/5 stars
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Generated by Tellus - Your Feedback Analytics Partner •{" "}
          {new Date().getFullYear()}
        </Text>
        <Text
          style={pdfStyles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default ProfessionalPDFDocument;
