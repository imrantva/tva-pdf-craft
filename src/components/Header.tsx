import { FileText } from "lucide-react";

export const Header = () => {
  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-tool">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              TVA – Invoice Editor
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="https://thevirtualassistant.pro/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Home
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
            <a
              href="https://thevirtualassistant.pro/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Contact
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
            <a
              href="https://thevirtualassistant.pro/more/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              More Free Apps
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
