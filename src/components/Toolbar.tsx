import { Type, Pencil, Palette, Eraser, Image, Download } from "lucide-react";
import { Button } from "./ui/button";

export type ToolType = "text" | "draw" | "color" | "eraser" | "image" | null;

interface ToolbarProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  onDownload: () => void;
}

export const Toolbar = ({ activeTool, onToolSelect, onDownload }: ToolbarProps) => {
  const tools = [
    { id: "text" as ToolType, icon: Type, label: "Text" },
    { id: "draw" as ToolType, icon: Pencil, label: "Draw" },
    { id: "color" as ToolType, icon: Palette, label: "Color" },
    { id: "eraser" as ToolType, icon: Eraser, label: "Eraser" },
    { id: "image" as ToolType, icon: Image, label: "Image" },
  ];

  return (
    <div className="bg-gradient-toolbar border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <Button
                  key={tool.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolSelect(tool.id)}
                  className={`gap-2 transition-all ${
                    isActive
                      ? "shadow-tool scale-105"
                      : "hover:shadow-tool hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tool.label}</span>
                </Button>
              );
            })}
          </div>
          <Button
            onClick={onDownload}
            className="gap-2 bg-gradient-primary hover:shadow-hover transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
