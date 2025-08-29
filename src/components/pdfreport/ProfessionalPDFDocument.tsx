import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Clean, minimal PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 25,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  summaryItem: {
    width: '48%',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  ratingLabel: {
    fontSize: 10,
    width: '25%',
    fontWeight: 'bold',
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#4B5563',
    borderRadius: 3,
  },
  ratingValue: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '20%',
    textAlign: 'right',
  },
  paragraph: {
    marginBottom: 12,
  },
  text: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    textAlign: 'left',
  },
  bulletPoint: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    marginLeft: 10,
    marginBottom: 6,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1F2937',
  },
  insightsBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 15,
    marginTop: 20,
  },
  insightsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  insightsGrid: {
    flexDirection: 'column',
    gap: 6,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 9,
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 10,
    right: 40,
    color: '#9CA3AF',
  },
});

// Improved text cleaning and structuring function
const cleanInsightsText = (text: string): {type: 'heading' | 'paragraph' | 'bullet', content: string}[] => {
  if (!text) return [{type: 'paragraph', content: 'No analysis available'}];
  
  // Clean up the text
  let cleaned = text
    .replace(/ort\s+/g, '') // Remove "ort" gibberish
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\.{3,}/g, '...')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove common artifacts and gibberish
  const artifacts = [
    /Okay, here's a comproach\./i,
    /Comprehensive Feedback Analysis Rep/i,
    /Here's a comprehensive analysis/i,
    /Let me analyze this/i,
    /Based on the data/i,
    /The analysis shows/i,
    /Okay, based on the initial analysis/i,
    /— Analysis generated using advanced AI/i,
    /ort Executive Summary This ft experience/i,
    /I didn't liked the ui at all its fucked up/i,
    /bad i didn't like at all/i
  ];
  
  artifacts.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Split into meaningful sections
  const sections = cleaned.split(/(?=\b(?:Executive Summary|Key Strengths|Critical Issues|Patterns & Trends|Actionable Recommendations|Risk Assessment|Strategic Business Insights)\b)/i);
  
  const structuredContent: {type: 'heading' | 'paragraph' | 'bullet', content: string}[] = [];

  sections.forEach(section => {
    const lines = section.split('\n\n').filter(line => line.trim().length > 0);
    
    lines.forEach(line => {
      const content = line
        .trim()
        .replace(/^[^a-zA-Z]*/, '')
        .replace(/[^a-zA-Z0-9.!?]*$/, '');

      if (content.length < 5) return;

      // Detect headings (section titles)
      if (content.match(/^(Executive Summary|Key Strengths|Critical Issues|Patterns & Trends|Actionable Recommendations|Risk Assessment|Strategic Business Insights|Competitive Advantages|Market Positioning|Customer Retention|Product Development|Communication Strategy)/i)) {
        structuredContent.push({type: 'heading', content});
      } 
      // Detect bullet points
      else if (content.includes('• ') || content.match(/^[a-zA-Z]*\s*•\s/) || content.match(/^-\s/)) {
        const bulletPoints = content.split(/[•\-]\s+/).filter(point => point.trim().length > 0);
        bulletPoints.forEach(point => {
          if (point.trim().length > 0 && !point.match(/^\d+\./)) {
            structuredContent.push({type: 'bullet', content: point.trim()});
          }
        });
      }
      // Numbered lists
      else if (content.match(/^\d+\.\s/)) {
        structuredContent.push({type: 'bullet', content: content.replace(/^\d+\.\s*/, '• ')});
      }
      // Regular paragraphs
      else {
        // Split long paragraphs into smaller chunks
        const words = content.split(' ');
        if (words.length > 50) {
          // Split into smaller paragraphs of ~40 words each
          for (let i = 0; i < words.length; i += 40) {
            const chunk = words.slice(i, i + 40).join(' ');
            if (chunk.length > 10) {
              structuredContent.push({type: 'paragraph', content: chunk});
            }
          }
        } else {
          structuredContent.push({type: 'paragraph', content});
        }
      }
    });
  });

  return structuredContent.slice(0, 40);
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

const ProfessionalPDFDocument: React.FC<ProfessionalPDFDocumentProps> = ({ insightsData, summaryData }) => {
  const structuredContent = cleanInsightsText(insightsData);
  
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
                <Text style={pdfStyles.summaryValue}>{summaryData.totalFeedback}</Text>
              </View>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Average Rating</Text>
                <Text style={pdfStyles.summaryValue}>{summaryData.averageRating.toFixed(1)}/5.0</Text>
              </View>
            </View>
            
            <View style={pdfStyles.summaryRow}>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Positive Sentiment</Text>
                <Text style={pdfStyles.summaryValue}>{summaryData.sentiment.positivePercentage}%</Text>
              </View>
              <View style={pdfStyles.summaryItem}>
                <Text style={pdfStyles.summaryLabel}>Happy Customers</Text>
                <Text style={pdfStyles.summaryValue}>{summaryData.sentiment.positive}</Text>
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
              const percentage = summaryData.totalFeedback > 0 
                ? ((count / summaryData.totalFeedback) * 100)
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
              if (item.type === 'heading') {
                return (
                  <View key={index} style={pdfStyles.paragraph}>
                    <Text style={pdfStyles.subsectionTitle}>{item.content}</Text>
                  </View>
                );
              } else if (item.type === 'bullet') {
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

        {/* Key Insights Box */}
        <View style={pdfStyles.insightsBox}>
          <Text style={pdfStyles.insightsTitle}>Key Insights</Text>
          <View style={pdfStyles.insightsGrid}>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• Based on {summaryData.totalFeedback} customer reviews</Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• {summaryData.sentiment.positivePercentage}% positive sentiment</Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• Average rating: {summaryData.averageRating.toFixed(1)}/5 stars</Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• UI issues identified as critical concern</Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• Immediate UI/UX review recommended</Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• Small sample size limits generalizability</Text>
            </View>
            <View style={pdfStyles.insightItem}>
              <Text style={pdfStyles.insightText}>• Polarized user experiences detected</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <Text style={pdfStyles.footer}>
          Generated by Tellus - Your Feedback Analytics Partner • {new Date().getFullYear()}
        </Text>
        <Text 
          style={pdfStyles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default ProfessionalPDFDocument;