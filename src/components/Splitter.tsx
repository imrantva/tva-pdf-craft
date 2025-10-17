import { useEffect, useMemo, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl as any;

interface SplitterProps {
  file: File;
}

export const Splitter = ({ file }: SplitterProps) => {
  const [numPages, setNumPages] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data }).promise;
      if (cancelled) return;
      setNumPages(pdf.numPages);
      const images: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        images.push(canvas.toDataURL());
      }
      if (!cancelled) {
        setThumbs(images);
        setSelected(Array(pdf.numPages).fill(true));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [file]);

  const toggle = (idx: number) => {
    setSelected((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const download = async () => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const srcDoc = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const keepIndexes = selected
        .map((v, i) => (v ? i : -1))
        .filter((i) => i >= 0);
      if (keepIndexes.length === 0) {
        toast.error("Select at least one page");
        return;
      }
      const pages = await out.copyPages(srcDoc, keepIndexes);
      pages.forEach((p) => out.addPage(p));
      const outBytes = await out.save();
      const blob = new Blob([outBytes as any], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name.replace(/\.pdf$/i, "-split.pdf");
      a.click();
    } catch (e) {
      console.error(e);
      toast.error("Failed to split PDF");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {thumbs.map((src, i) => (
          <label key={i} className="relative cursor-pointer group">
            <img src={src} alt={`Page ${i + 1}`} className="w-full rounded border border-border shadow-sm" />
            <input
              type="checkbox"
              checked={selected[i]}
              onChange={() => toggle(i)}
              className="absolute top-2 left-2 w-4 h-4 accent-[hsl(var(--primary))]"
            />
            <span className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-background/80 border border-border">
              {i + 1}
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={download} className="bg-gradient-primary">Download Split PDF</Button>
      </div>
    </div>
  );
}