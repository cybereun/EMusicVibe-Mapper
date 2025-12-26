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
      img.crossOrigin = "anonymous"; 
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4);
      gradient.addColorStop(0, 'rgba(0,0,0,0.95)');
      gradient.addColorStop(0.4, 'rgba(0,0,0,0.7)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const titleFontSize = Math.floor(canvas.width * 0.08); 
      ctx.font = `bold ${titleFontSize}px "Playfair Display", serif`;
      ctx.fillStyle = result.colors[2] || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 20;
      const centerX = canvas.width / 2;
      const bottomMargin = canvas.height * 0.15;
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
      const lineHeight = titleFontSize * 1.2;
      let currentY = canvas.height - bottomMargin - (lines.length * lineHeight) + lineHeight;
      lines.forEach((l) => {
          ctx.fillText(l.trim(), centerX, currentY);
          currentY += lineHeight;
      });
      const brandFontSize = Math.floor(canvas.width * 0.025);
      ctx.font = `black ${brandFontSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#f59e0b'; 
      ctx.shadowBlur = 0;
      ctx.fillText('E-MUSICVIBE ARCHITECTURE', centerX, canvas.height - (canvas.height * 0.08));
      if (showWatermark) {
          const wmFontSize = Math.floor(canvas.width * 0.02);
          ctx.font = `400 ${wmFontSize}px "Inter", sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.textAlign = 'right';
          ctx.fillText('GEMINI PRO 3.0 GEN', canvas.width - 30, 40);
      }
      const link = document.createElement('a');
      link.download = `EMusicVibe-${selectedTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.98);
      link.click();
    } catch (e) {
      console.error("Synthesis failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fadeIn pb-20">
      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-8 sticky top-32">
          <div className="relative group rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-slate-900 aspect-square">
            <img 
              src={result.thumbnailUrl} 
              alt="Generated Synthesis" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white serif leading-tight drop-shadow-2xl" style={{ color: result.colors[2] || '#ffffff' }}>
                {selectedTitle}
              </h2>
              <p className="mt-4 text-[10px] text-amber-500 font-black uppercase tracking-[0.4em]">E-MusicVibe Selection</p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-3">
             {result.colors.map((c, i) => (
               <div key={i} className="w-12 h-2 rounded-full" style={{ backgroundColor: c }}></div>
             ))}
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-8">
            <h3 className="text-white text-xs uppercase tracking-[0.5em] font-black border-l-4 border-amber-500 pl-4">Synthesized Titles</h3>
            <div className="grid gap-4">
              {result.titles.map((title, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 group
                    ${selectedTitle === title 
                      ? 'bg-white border-white text-slate-950 shadow-2xl scale-[1.02]' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }
                  `}
                >
                  <span className="font-bold text-lg group-hover:translate-x-1 transition-transform inline-block">{title}</span>
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
               <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Manual Refinement</label>
               <input 
                type="text" 
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Edit title..."
              />
            </div>
          </div>

          <div className="pt-10 border-t border-slate-900 flex flex-col gap-5">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full font-black py-6 px-10 rounded-full transition-all flex items-center justify-center space-x-4 shadow-2xl
                ${isDownloading 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                }
              `}
            >
              {isDownloading ? (
                <span className="animate-pulse">SYNTHESIZING FILE...</span>
              ) : (
                <>
                  <span className="text-lg uppercase tracking-wider">Export Studio Artwork</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </>
              )}
            </button>
            <button 
              onClick={onReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold py-5 px-10 rounded-full border border-slate-800 transition-all uppercase tracking-widest text-xs"
            >
              Back to Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;