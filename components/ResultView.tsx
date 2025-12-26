import React, { useState } from 'react';
import { GeneratedResult } from '../types';

interface ResultViewProps {
  result: GeneratedResult;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onReset }) => {
  const [selectedTitle, setSelectedTitle] = useState(result.titles[0]);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = result.thumbnailUrl;
      // Ensure crossOrigin is set if we ever switch to remote URLs, though base64 doesn't strictly need it.
      img.crossOrigin = "anonymous"; 
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      // Set dimensions to match the source image (high quality)
      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Draw Base Image
      ctx.drawImage(img, 0, 0);

      // 2. Draw Gradient Overlay (Bottom to top fade)
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4);
      gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
      gradient.addColorStop(0.4, 'rgba(0,0,0,0.6)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Configure Text Styles - Title
      // Dynamic font size based on image width
      const titleFontSize = Math.floor(canvas.width * 0.08); 
      ctx.font = `bold ${titleFontSize}px "Playfair Display", serif`;
      ctx.fillStyle = result.colors[2] || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Shadow for better readability
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      const centerX = canvas.width / 2;
      const bottomMargin = canvas.height * 0.15;
      
      // Word Wrap Logic
      const words = selectedTitle.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = canvas.width * 0.85;
      
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Draw Title Lines (Stacking upwards from bottom margin)
      const lineHeight = titleFontSize * 1.2;
      const titleBlockHeight = lines.length * lineHeight;
      let currentY = canvas.height - bottomMargin - titleBlockHeight + lineHeight;

      lines.forEach((l) => {
          ctx.fillText(l.trim(), centerX, currentY);
          currentY += lineHeight;
      });

      // 4. Draw Branding ("E-MusicVibe")
      const brandFontSize = Math.floor(canvas.width * 0.025);
      ctx.font = `500 ${brandFontSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#fcd34d'; // amber-300
      ctx.shadowBlur = 0; // Reset shadow
      // Manual letter spacing simulation not needed for simple text, keeping it clean
      ctx.fillText('E-MusicVibe', centerX, canvas.height - (canvas.height * 0.08));

      // 5. Watermark
      if (showWatermark) {
          const wmFontSize = Math.floor(canvas.width * 0.02);
          ctx.font = `400 ${wmFontSize}px "Inter", sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('AI GENERATED', canvas.width - 20, 20);
      }

      // 6. Trigger Download
      const link = document.createElement('a');
      const filename = `EMusicVibe-${selectedTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
      link.download = filename;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();

    } catch (e) {
      console.error("Download failed", e);
      alert("Could not generate download image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Preview */}
        <div className="space-y-6">
          <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-black aspect-square">
            <img 
              src={result.thumbnailUrl} 
              alt="Generated Thumbnail" 
              className="w-full h-full object-cover"
            />
            
            {/* Overlay Text - Simulating the 'Synthesis' */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
              <h2 
                className="text-2xl md:text-3xl font-bold text-white serif leading-tight drop-shadow-lg mb-2 text-center"
                style={{ color: result.colors[2] || '#ffffff' }}
              >
                {selectedTitle}
              </h2>
              {/* Jazz Icon Decoration */}
              <div className="flex items-center justify-center space-x-2 mt-4 opacity-80">
                 <div className="h-px w-8 bg-amber-500"></div>
                 <span className="text-[10px] tracking-[0.2em] text-amber-100 uppercase font-medium">E-MusicVibe</span>
                 <div className="h-px w-8 bg-amber-500"></div>
              </div>
            </div>

            {showWatermark && (
              <div className="absolute top-4 right-4 text-[10px] text-white/30 tracking-widest border border-white/20 px-2 py-1 rounded">
                AI GENERATED
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-sm text-slate-400 px-1">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>Show Watermark</span>
            </label>
            <span className="text-xs opacity-50">Images provided by Google Imagen / Gemini</span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-8 flex flex-col justify-center">
          <div>
            <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-semibold">Customize Title</h3>
            
            {/* Manual Input Field */}
            <div className="mb-4">
              <input 
                type="text" 
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                placeholder="Type your own title..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">Or select a suggestion:</p>
              {result.titles.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200
                    ${selectedTitle === title 
                      ? 'bg-slate-800 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500'
                    }
                  `}
                >
                  <span className="font-medium">{title}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
             <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-semibold">Color Palette</h3>
             <div className="flex space-x-4">
                {result.colors.map((color, i) => (
                  <div key={i} className="group relative">
                     <div 
                        className="w-12 h-12 rounded-full border-2 border-slate-800 shadow-lg cursor-help transition-transform hover:scale-110" 
                        style={{ backgroundColor: color }} 
                     />
                     <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded">
                       {color}
                     </span>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col gap-3">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2
                ${isDownloading 
                  ? 'bg-amber-500/50 cursor-wait text-black/50' 
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg hover:shadow-amber-500/20'
                }
              `}
            >
              {isDownloading ? (
                <>
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                   <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Cover Art</span>
                </>
              )}
            </button>
            <button 
              onClick={onReset}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Create New Vibe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;