export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="relative flex flex-col items-center">
        {/* Pulse Ring */}
        <div className="absolute animate-ping h-16 w-16 rounded-full bg-primary/30"></div>
        
        {/* Main Circle with Gradient */}
        <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-accent">
          {/* Inner Loading Circle */}
          <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
        </div>

        {/* Loading Text with Fade Animation */}
        <div className="mt-6 flex space-x-1">
          <span className="text-sm text-foreground/70 animate-pulse">Loading</span>
          <span className="text-sm text-foreground/70 animate-bounce delay-100">.</span>
          <span className="text-sm text-foreground/70 animate-bounce delay-200">.</span>
          <span className="text-sm text-foreground/70 animate-bounce delay-300">.</span>
        </div>
      </div>
    </div>
  );
} 