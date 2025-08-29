import PDFReport from '@/components/PDFReport';

export const downloadPDF = async (
  userCode: string,
  insights: string,
  summary: any,
  visualData: any,
  feedbacks: any[]
) => {
  // Generate PDF blob using @react-pdf/renderer
  const { pdf } = await import('@react-pdf/renderer');
  const doc = (
    <PDFReport 
      userCode={userCode}
      insights={insights}
      summary={summary}
      visualData={visualData}
      feedbacks={feedbacks}
    />
  );
  const blob = await pdf(doc).toBlob();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `feedback-report-${userCode}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Alternative method using react-pdf's renderToStream
export const generatePDFBuffer = async (
  userCode: string,
  insights: string,
  summary: any,
  visualData: any,
  feedbacks: any[]
): Promise<Buffer> => {
  const { renderToStream } = await import('@react-pdf/renderer');
  const PDFReport = (await import('@/components/PDFReport')).default;
  
  const stream = await renderToStream(
    <PDFReport 
      userCode={userCode}
      insights={insights}
      summary={summary}
      visualData={visualData}
      feedbacks={feedbacks}
    />
  );
  
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};