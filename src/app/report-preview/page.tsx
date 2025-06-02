"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { saveAs } from 'file-saver';
import { generateReport } from '@/services/reportGenerator';
import { jsPDF } from 'jspdf';

type FormatType = 'txt' | 'doc' | 'pdf';

export default function ReportPreview() {
  const router = useRouter();
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [reportContent, setReportContent] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('generatedReport') || '';
    }
    return '';
  });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('reportImageUrls') || '[]');
    }
    return [];
  });

  const handleDownload = async (format: FormatType) => {
    const filename = localStorage.getItem('reportFileName')?.replace('.txt', '') || 'security-report';
    
    try {
      if (format === 'pdf') {
        // Convert to PDF using jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('SECURITY REPORT', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        
        // Split content into pages
        const lines = doc.splitTextToSize(reportContent, 180);
        let y = 30; // Start content after title
        
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 15, y);
          y += 7;
        });
        
        // Add images to the report if there are any
        if (uploadedImageUrls && uploadedImageUrls.length > 0) {
          // Add a new page for evidence
          doc.addPage();
          doc.setFontSize(16);
          doc.text('EVIDENCE / SCREENSHOTS', 105, 20, { align: 'center' });
          doc.setFontSize(12);
          
          let imageY = 40;
          
          for (let i = 0; i < uploadedImageUrls.length; i++) {
            try {
              // If we're running out of space on the page, add a new one
              if (imageY > 220) {
                doc.addPage();
                imageY = 40;
              }
              
              // Add title for the evidence
              doc.text(`Evidence ${i+1}:`, 15, imageY - 10);
              
              // Handle different image formats - base64 Data URLs will work directly
              const imageData = uploadedImageUrls[i];
              
              // Calculate appropriate image dimensions to fit the page while maintaining aspect ratio
              const imgWidth = 180; // Max width on the page
              const imgHeight = 100; // Default height
              
              // Add the image to the PDF
              doc.addImage(imageData, 'AUTO', 15, imageY, imgWidth, imgHeight);
              
              // Move position for next image
              imageY += 120;
              
              console.log(`Added evidence image ${i+1} to PDF`);
            } catch (imgError) {
              console.error(`Failed to add image ${i+1} to PDF:`, imgError);
              // Add error text instead of the image
              doc.setTextColor(255, 0, 0);
              doc.text(`Error loading Evidence ${i+1}`, 15, imageY + 10);
              doc.setTextColor(0, 0, 0);
              imageY += 30; // Use less space for the error message
            }
          }
        }
        
        doc.save(`${filename}.pdf`);
      } else {
        // For txt and doc formats
        const blob = new Blob([reportContent], { 
          type: format === 'doc' 
            ? 'application/msword' 
            : 'text/plain;charset=utf-8' 
        });
        saveAs(blob, `${filename}.${format}`);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file. Please try again.');
    }
    
    setShowFormatMenu(false);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const reportData = JSON.parse(localStorage.getItem('reportData') || '{}');
      const newContent = await generateReport(reportData);
      setReportContent(newContent);
      localStorage.setItem('generatedReport', newContent);
    } catch (error) {
      console.error('Failed to regenerate report:', error);
      alert('Failed to regenerate report. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShare = async (format: FormatType) => {
    try {
      const emailSubject = 'Security Report';
      const emailBody = 'Please find the attached security report.';
      const email = localStorage.getItem('reportEmail') || '';

      let blob;
      if (format === 'pdf') {
        // Convert to PDF using jsPDF
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('SECURITY REPORT', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        
        // Split content into pages
        const lines = doc.splitTextToSize(reportContent, 180);
        let y = 30; // Start content after title
        
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 15, y);
          y += 7;
        });

        // Add images to the report if there are any
        if (uploadedImageUrls && uploadedImageUrls.length > 0) {
          // Add a new page for evidence
          doc.addPage();
          doc.setFontSize(16);
          doc.text('EVIDENCE / SCREENSHOTS', 105, 20, { align: 'center' });
          doc.setFontSize(12);
          
          let imageY = 40;
          
          for (let i = 0; i < uploadedImageUrls.length; i++) {
            try {
              // If we're running out of space on the page, add a new one
              if (imageY > 220) {
                doc.addPage();
                imageY = 40;
              }
              
              // Add title for the evidence
              doc.text(`Evidence ${i+1}:`, 15, imageY - 10);
              
              // Handle different image formats - base64 Data URLs will work directly
              const imageData = uploadedImageUrls[i];
              
              // Add the image to the PDF
              doc.addImage(imageData, 'AUTO', 15, imageY, 180, 100);
              
              // Move position for next image
              imageY += 120;
            } catch (imgError) {
              console.error(`Failed to add image ${i+1} to shared PDF:`, imgError);
              // Add error text instead of the image
              doc.setTextColor(255, 0, 0);
              doc.text(`Error loading Evidence ${i+1}`, 15, imageY + 10);
              doc.setTextColor(0, 0, 0);
              imageY += 30; // Use less space for the error message
            }
          }
        }

        // Create a blob from the PDF
        blob = doc.output('blob');
      } else {
        // For txt and doc formats
        blob = new Blob([reportContent], { 
          type: format === 'doc' ? 'application/msword' : 'text/plain;charset=utf-8' 
        });
      }

      const url = URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-report.${format}`;
      document.body.appendChild(link);

      // Simulate a click to download the file
      link.click();

      // Clean up the URL object
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Open the user's email client
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  };

  const handleEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReportContent(e.target.value);
    localStorage.setItem('generatedReport', e.target.value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 bg-secondary/80 backdrop-blur-xl border-b border-primary/10 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-primary/70 hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </motion.button>
            <div className="h-4 w-px bg-primary/10" />
            <h1 className="text-lg font-semibold text-primary">Report Preview</h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Regenerate Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center space-x-2 px-3 py-1.5 bg-secondary text-primary/80 rounded-lg 
                hover:text-primary hover:bg-secondary/80 transition-all border border-primary/10 text-sm
                disabled:opacity-50 shadow-sm"
            >
              <svg className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <span className="font-medium">{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
            </motion.button>

            {/* Share Button with Format Menu */}
            <div className="relative">
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-primary text-white rounded-lg 
                  hover:bg-primary/90 transition-all text-sm shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-medium">Share</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-secondary rounded-xl 
                      border border-primary/10 shadow-xl overflow-hidden z-20"
                  >
                    {(['txt', 'doc', 'pdf'] as FormatType[]).map((format) => (
                      <button
                        key={format}
                        onClick={() => handleShare(format)}
                        className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-primary/10 
                          transition-colors text-white bg-secondary/95 border-b border-primary/10 last:border-0"
                      >
                        <span className="font-medium">.{format.toUpperCase()}</span>
                        <span className="text-xs px-2 py-1 bg-primary/20 rounded-md text-primary/90">
                          {format === 'txt' ? 'Text' : format === 'doc' ? 'Word' : 'PDF'}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-secondary/50 backdrop-blur-xl rounded-2xl border border-primary/10 h-[calc(100vh-100px)]
              shadow-lg"
          >
            <div className="h-full relative">
              <textarea
                value={reportContent}
                onChange={handleEdit}
                className="w-full h-full px-8 py-6 bg-transparent text-white/90 font-mono text-sm 
                  focus:outline-none focus:ring-0 resize-none leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <div className="absolute top-4 right-4 px-2 py-1 bg-primary/5 rounded-md text-xs text-primary/60
                backdrop-blur-sm border border-primary/5">
                Edit mode
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 