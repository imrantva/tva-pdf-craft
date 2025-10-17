import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Canvas as FabricCanvas, Rect, Circle, Line, Textbox, FabricImage } from "fabric";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument } from "pdf-lib";
import type { ToolType } from "./Toolbar";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl as any;

interface PDFViewerProps {
  file: File | null;
  activeTool?: ToolType;
}

export type PDFViewerHandle = {
  exportEditedPDF: () => Promise<void>;
};

export const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(({ file, activeTool = null }, ref) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const pageJSON = useRef<Map<number, any>>(new Map());

  // tool states
  const [activeColor, setActiveColor] = useState<string>("#0ea5b7");
  const [drawMode, setDrawMode] = useState<"freehand" | "rect" | "circle" | "line">("freehand");
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>("Arial");

  useImperativeHandle(ref, () => ({
    exportEditedPDF: async () => {
      if (!file) return;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes);
      // ensure current page json is saved
      if (fabricRef.current) {
        pageJSON.current.set(currentPage, fabricRef.current.toJSON());
      }
      // Ensure pdfDoc for page sizes
      const pdf = pdfDoc || (await pdfjs.getDocument({ data: bytes }).promise);
      for (let p = 1; p <= doc.getPageCount(); p++) {
        const json = pageJSON.current.get(p);
        if (!json) continue;
        // render json to an offscreen fabric canvas to get PNG
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.5 });
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const fc = new FabricCanvas(tempCanvas, { selection: false });
        await new Promise<void>((resolve) => {
          fc.loadFromJSON(json, () => resolve());
        });
        const dataUrl = tempCanvas.toDataURL("image/png");
        const flipped = await flipDataUrlVertically(dataUrl);
        const pngBytes = dataURLToUint8Array(flipped);
        const img = await doc.embedPng(pngBytes);
        const pageRef = doc.getPage(p - 1);
        const w = pageRef.getWidth();
        const h = pageRef.getHeight();
        pageRef.drawImage(img, { x: 0, y: 0, width: w, height: h });
        fc.dispose();
      }
      const out = await doc.save();
      const blob = new Blob([out as any], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace(/\.pdf$/i, "-edited.pdf");
      a.click();
    }
  }));

  useEffect(() => {
    const loadPDF = async () => {
      if (!file) return;
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    };
    loadPDF();
  }, [file]);

  // render page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !baseCanvasRef.current) return;
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = baseCanvasRef.current;
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      // sync overlay size
      if (overlayRef.current) {
        overlayRef.current.width = viewport.width;
        overlayRef.current.height = viewport.height;
      }
      // init fabric if needed
      if (!fabricRef.current && overlayRef.current) {
        fabricRef.current = new FabricCanvas(overlayRef.current, { selection: true });
      }
      // load saved JSON for this page
      if (fabricRef.current) {
        const json = pageJSON.current.get(currentPage);
        if (json) {
          fabricRef.current.loadFromJSON(json, () => fabricRef.current!.renderAll());
        } else {
          fabricRef.current.clear();
        }
        fabricRef.current.freeDrawingBrush.width = lineWidth;
        fabricRef.current.freeDrawingBrush.color = activeTool === "eraser" ? "#ffffff" : activeColor;
      }
    };
    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage]);

  // save page json on page change
  useEffect(() => {
    return () => {
      if (fabricRef.current) pageJSON.current.set(currentPage, fabricRef.current.toJSON());
    };
  }, [currentPage]);

  // tools behavior
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    // default
    fc.isDrawingMode = false;

    if (activeTool === "draw") {
      if (drawMode === "freehand") {
        fc.isDrawingMode = true;
        fc.freeDrawingBrush.color = activeColor;
        fc.freeDrawingBrush.width = lineWidth;
      } else {
        fc.isDrawingMode = false;
        fc.off("mouse:down");
        fc.on("mouse:down", (opt) => {
          const pointer = fc.getPointer(opt.e);
          let obj: any = null;
          if (drawMode === "rect") {
            obj = new Rect({ left: pointer.x, top: pointer.y, width: 120, height: 80, fill: "transparent", stroke: activeColor, strokeWidth: lineWidth });
          } else if (drawMode === "circle") {
            obj = new Circle({ left: pointer.x, top: pointer.y, radius: 50, fill: "transparent", stroke: activeColor, strokeWidth: lineWidth });
          } else if (drawMode === "line") {
            obj = new Line([pointer.x, pointer.y, pointer.x + 120, pointer.y], { stroke: activeColor, strokeWidth: lineWidth });
          }
          if (obj) fc.add(obj);
        });
      }
    } else if (activeTool === "text") {
      fc.off("mouse:down");
      fc.on("mouse:down", (opt) => {
        const pointer = fc.getPointer(opt.e);
        const tb = new Textbox("Text", {
          left: pointer.x,
          top: pointer.y,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fill: activeColor,
        });
        fc.add(tb);
        fc.setActiveObject(tb);
      });
    } else if (activeTool === "eraser") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#ffffff";
      fc.freeDrawingBrush.width = Math.max(8, lineWidth * 3);
    } else {
      fc.isDrawingMode = false;
      fc.off("mouse:down");
    }
    // apply color to selection
    const sel = fc.getActiveObject();
    if (sel) {
      // @ts-ignore
      sel.set({ fill: activeColor, stroke: activeColor });
      fc.renderAll();
    }
  }, [activeTool, activeColor, lineWidth, drawMode, fontSize, fontFamily]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;
    const url = URL.createObjectURL(file);
    FabricImage.fromURL(url).then((img) => {
      img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
      fabricRef.current!.add(img);
      fabricRef.current!.setActiveObject(img);
      URL.revokeObjectURL(url);
    });
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No PDF loaded. Upload a file to begin editing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-muted/20 rounded-lg shadow-inner p-4 overflow-auto">
        <div className="relative max-w-4xl mx-auto bg-background rounded-lg p-2">
          <canvas ref={baseCanvasRef} className="w-full h-auto block" />
          <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />

          {/* Pop-up toolbars */}
          {activeTool === "text" && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-card border border-border rounded px-2 py-1 shadow-sm">
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-sm">
                <option>Arial</option>
                <option>Times New Roman</option>
                <option>Roboto</option>
                <option>Inter</option>
              </select>
              <select value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="bg-background border border-border rounded px-2 py-1 text-sm">
                {[8,10,12,14,18,24,32].map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          )}

          {activeTool === "draw" && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-card border border-border rounded px-2 py-1 shadow-sm">
              <select value={drawMode} onChange={(e) => setDrawMode(e.target.value as any)} className="bg-background border border-border rounded px-2 py-1 text-sm">
                <option value="freehand">Freehand</option>
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="line">Line</option>
              </select>
              <input type="range" min={1} max={12} value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} />
            </div>
          )}

          {activeTool === "color" && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-card border border-border rounded px-2 py-1 shadow-sm">
              <input type="color" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} />
            </div>
          )}

          {activeTool === "image" && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-card border border-border rounded px-2 py-1 shadow-sm">
              <label className="text-sm cursor-pointer">Add Image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4 bg-card border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fabricRef.current) pageJSON.current.set(currentPage, fabricRef.current.toJSON());
            setCurrentPage((p) => Math.max(1, p - 1));
          }}
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
          onClick={() => {
            if (fabricRef.current) pageJSON.current.set(currentPage, fabricRef.current.toJSON());
            setCurrentPage((p) => Math.min(totalPages, p + 1));
          }}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

function dataURLToUint8Array(dataURL: string): Uint8Array {
  const base64 = dataURL.split(",")[1];
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes;
}

async function flipDataUrlVertically(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, -img.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}
