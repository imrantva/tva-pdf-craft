import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import * as pdfjsLib from "pdfjs-dist";

interface PDFViewerProps {
  file: File | null;
}

export const PDFViewer = ({ file }: PDFViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  // Load PDF document
  useEffect(() => {
    if (file) {
      const loadPDF = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      };
      loadPDF();
    }
  }, [file]);

  // Render current page
  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      const renderPage = async () => {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      };
      renderPage();
    }
  }, [pdfDoc, currentPage]);

  if (!file) {
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
        <div className="max-w-4xl mx-auto bg-white shadow-elegant rounded-lg p-4">
          <canvas ref={canvasRef} className="w-full h-auto" />
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
