import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

interface PDFUploaderProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  multiple?: boolean;
}

export const PDFUploader = ({ onFileUpload, accept = "application/pdf", multiple = false }: PDFUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.type === "application/pdf") {
          onFileUpload(file);
          toast.success(`${file.name} uploaded successfully`);
        } else {
          toast.error("Please upload a PDF file");
        }
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [".pdf"] },
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
        isDragActive
          ? "border-primary bg-primary/5 shadow-hover"
          : "border-border bg-muted/30 hover:border-primary hover:bg-primary/5"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <Upload className="w-16 h-16 text-primary animate-bounce" />
        ) : (
          <FileText className="w-16 h-16 text-muted-foreground" />
        )}
        <div>
          <p className="text-lg font-semibold text-foreground mb-1">
            {isDragActive ? "Drop your PDF here" : "Upload PDF"}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag & drop or click to browse
          </p>
        </div>
      </div>
    </div>
  );
};
