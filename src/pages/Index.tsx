import { useState } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFUploader } from "@/components/PDFUploader";
import { PDFViewer } from "@/components/PDFViewer";
import { Toolbar, ToolType } from "@/components/Toolbar";
import { toast } from "sonner";

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  const handleFileUpload = (file: File) => {
    setPdfFile(file);
  };

  const handleDownload = () => {
    if (!pdfFile) {
      toast.error("No PDF to download");
      return;
    }
    toast.success("Download functionality will be implemented with pdf-lib");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="splitter">Splitter</TabsTrigger>
            <TabsTrigger value="merger">Merger</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            {!pdfFile ? (
              <PDFUploader onFileUpload={handleFileUpload} />
            ) : (
              <>
                <Toolbar
                  activeTool={activeTool}
                  onToolSelect={setActiveTool}
                  onDownload={handleDownload}
                />
                <div className="bg-card rounded-lg shadow-elegant p-6 min-h-[600px]">
                  <PDFViewer file={pdfFile} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="splitter" className="space-y-6">
            <div className="bg-card rounded-lg shadow-elegant p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">PDF Splitter</h2>
              <p className="text-muted-foreground mb-6">
                Upload a PDF and select pages to keep. Remove unwanted pages easily.
              </p>
              <PDFUploader onFileUpload={handleFileUpload} />
            </div>
          </TabsContent>

          <TabsContent value="merger" className="space-y-6">
            <div className="bg-card rounded-lg shadow-elegant p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">PDF Merger</h2>
              <p className="text-muted-foreground mb-6">
                Upload multiple PDFs and merge them into a single document.
              </p>
              <PDFUploader onFileUpload={handleFileUpload} multiple />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
