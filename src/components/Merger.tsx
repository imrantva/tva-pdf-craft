import { useEffect, useMemo, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl as any;

interface MergerProps {
  files: File[];
  onReorder: (next: File[]) => void;
}

export const Merger = ({ files, onReorder }: MergerProps) => {
  const [thumbs, setThumbs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadThumbs = async () => {
      const imgs: string[] = [];
      for (const file of files) {
        const data = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        imgs.push(canvas.toDataURL());
      }
      if (!cancelled) setThumbs(imgs);
    };
    if (files.length) loadThumbs();
    else setThumbs([]);
    return () => { cancelled = true; };
  }, [files]);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from)) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    onReorder(next);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const download = async () => {
    if (files.length === 0) return toast.error("Upload PDFs to merge");
    try {
      const out = await PDFDocument.create();
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes);
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "merged.pdf";
      a.click();
      toast.success("Merged PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to merge PDFs");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {files.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 border border-border rounded-lg bg-card hover-scale"
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, i)}
          >
            {thumbs[i] ? (
              <img src={thumbs[i]} alt={`Preview ${f.name}`} className="w-16 h-20 object-cover rounded border border-border" />
            ) : (
              <div className="w-16 h-20 bg-muted rounded" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">Drag to reorder</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={download} className="bg-gradient-primary">Merge PDFs</Button>
      </div>
    </div>
  );
}