import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface PDFViewerProps {
  file: File | null;
}

export const PDFViewer = ({ file }: PDFViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      // In a real implementation, we'd use pdf-lib or pdfjs-dist to get page count
      setTotalPages(1); // Placeholder
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (!file || !pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No PDF loaded. Upload a file to begin editing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Display Area */}
      <div className="flex-1 bg-muted/20 rounded-lg shadow-inner p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white shadow-elegant rounded-lg">
          <iframe
            src={pdfUrl}
            className="w-full h-[600px] rounded-lg"
            title="PDF Preview"
          />
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 py-4 bg-card border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
