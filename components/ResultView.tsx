import React, { useState } from 'react';
import { GeneratedResult } from '../types';

interface ResultViewProps {
  result: GeneratedResult;
  onReset: () => void;
  aspectRatio: string;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onReset, aspectRatio }) => {
  const [selectedTitle, setSelectedTitle] = useState(result.titles[0]);
  const [brandingText, setBrandingText] = useState("E-MusicVibe Selection");
  const [isDownloading, setIsDownloading] = useState(false);

  // Determine tailwind aspect class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-video';
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = result.thumbnailUrl;
      img.crossOrigin = "anonymous"; 
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      
      // 1. Draw pure background image
      ctx.drawImage(img, 0, 0);

      // 2. Sophisticated gradient overlay for text readability
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4);
      gradient.addColorStop(0, 'rgba(2, 6, 23, 0.95)');
      gradient.addColorStop(0.5, 'rgba(2, 6, 23, 0.4)');
      gradient.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Main Title Rendering
      const isPortrait = aspectRatio === '9:16';
      const titleFontSize = Math.floor(canvas.width * (isPortrait ? 0.08 : 0.06)); 
      ctx.font = `bold ${titleFontSize}px "Playfair Display", serif`;
      ctx.fillStyle = result.colors[1] || '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 15;
      
      const centerX = canvas.width / 2;
      const titleBottomOffset = canvas.height * 0.18;
      const titleY = canvas.height - titleBottomOffset;
      
      const words = selectedTitle.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = canvas.width * 0.85;
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const lineHeight = titleFontSize * 1.1;
      let currentY = titleY - ((lines.length - 1) * lineHeight);
      lines.forEach((l) => {
          ctx.fillText(l.trim(), centerX, currentY);
          currentY += lineHeight;
      });

      // 4. Sub Branding Text
      if (brandingText) {
        const brandFontSize = Math.floor(canvas.width * (isPortrait ? 0.035 : 0.022));
        ctx.font = `italic 600 ${brandFontSize}px "Inter", sans-serif`;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowBlur = 0;
        ctx.letterSpacing = "4px";
        ctx.fillText(brandingText.toUpperCase(), centerX, canvas.height - (canvas.height * 0.1));
      }

      // Final trigger for download
      const link = document.createElement('a');
      link.download = `EMusicVibe-Art-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (e) {
      console.error("Art export failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Artwork Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`relative group rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-slate-900 ${getAspectClass()} bg-slate-900 mx-auto max-h-[80vh]`}>
            <img 
              src={result.thumbnailUrl} 
              alt="Generated Synthesis" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-center pointer-events-none">
              <h2 className="text-2xl md:text-5xl font-bold text-white serif leading-tight mb-4 drop-shadow-2xl">
                {selectedTitle}
              </h2>
              {brandingText && (
                <p className="text-[10px] md:text-xs text-amber-500 font-black uppercase tracking-[0.4em] drop-shadow-lg">
                  {brandingText}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls & Information */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 space-y-6">
            <h3 className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black">Sonic Color Palette</h3>
            <div className="grid grid-cols-1 gap-4">
              {result.colors.slice(0, 3).map((color, idx) => (
                <div key={idx} className="flex items-center space-x-4 group">
                  <div className="w-10 h-10 rounded-xl border border-white/5 transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
                  <div className="flex flex-col">
                    <span className="text-white font-mono font-bold text-base">{color.toUpperCase()}</span>
                    <span className="text-slate-600 text-[9px] uppercase font-bold tracking-widest">Channel {idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black border-l-2 border-amber-500 pl-4">Suggested Titles</h3>
            <div className="grid gap-2">
              {result.titles.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300
                    ${selectedTitle === title 
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-black' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xs line-clamp-1">{title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/50">
             <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Edit Main Title</label>
                <input 
                  type="text" 
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Edit Sub Branding</label>
                <input 
                  type="text" 
                  value={brandingText}
                  onChange={(e) => setBrandingText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-amber-500 outline-none text-sm"
                />
             </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full font-black py-6 rounded-full transition-all flex items-center justify-center space-x-4 shadow-2xl
                ${isDownloading 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-white hover:bg-slate-100 text-slate-950 active:scale-95'
                }
              `}
            >
              {isDownloading ? (
                <span className="animate-pulse italic">EXPORTING {aspectRatio} ART...</span>
              ) : (
                <>
                  <span className="text-base uppercase tracking-widest">Download Artwork</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </>
              )}
            </button>
            <button onClick={onReset} className="w-full bg-transparent hover:bg-slate-900 text-slate-500 font-bold py-4 rounded-full transition-all uppercase tracking-widest text-[10px]">
              Create New Vibe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;