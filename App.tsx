
import React, { useState, useEffect } from 'react';
import { DESTINATIONS, VIEWS, MOODS } from './constants';
import { VibeOption, UserSelection, GeneratedResult, Step } from './types';
import StepIndicator from './components/StepIndicator';
import SelectionCard from './components/SelectionCard';
import ResultView from './components/ResultView';
import { generateTitles, generateThumbnail, generateColorPalette, testConnection } from './services/geminiService';

// Extend window for aistudio shim
declare global {
  interface Window {
    aistudio: any;
  }
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('destination');
  const [selection, setSelection] = useState<UserSelection>({
    destination: null,
    view: null,
    mood: null,
    aspectRatio: "16:9",
  });
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customDestInput, setCustomDestInput] = useState("");
  
  // Settings States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean, message?: string} | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  /**
   * Guidelines: Use window.aistudio.hasSelectedApiKey() to check if an API key is selected.
   */
  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else if ((window as any).process?.env?.API_KEY) {
      setHasKey(true);
    }
  };

  /**
   * Guidelines: Add a button which calls window.aistudio.openSelectKey() to select a key.
   */
  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume selection was successful after triggering to avoid race conditions as per guidelines
      setHasKey(true);
      setTestResult({ success: true, message: "Key selection triggered." });
    }
  };

  const handleTestConnection = async () => {
    if (!hasKey) return;
    
    setIsTestingConn(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
      if (res.success) setHasKey(true);
    } catch (err: any) {
      setTestResult({ success: false, message: "Connection failed. Check your network." });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSelection = (option: VibeOption) => {
    const nextSelection = { ...selection, [currentStep]: option };
    setSelection(nextSelection);
    
    if (currentStep === 'destination') {
      setTimeout(() => setCurrentStep('view'), 300);
    } else if (currentStep === 'view') {
      setTimeout(() => setCurrentStep('mood'), 300);
    }
  };

  /**
   * Fix: Added missing handleCustomDestination function.
   */
  const handleCustomDestination = () => {
    if (!customDestInput.trim()) return;
    const customOption: VibeOption = {
      id: `custom-${Date.now()}`,
      label: customDestInput.trim(),
      keywords: [customDestInput.trim(), 'custom'],
      image: `https://picsum.photos/seed/${customDestInput.trim()}/200/200`
    };
    handleSelection(customOption);
  };

  const handleGenerate = async () => {
    if (!selection.destination || !selection.view || !selection.mood) return;
    
    /**
     * Guidelines: Re-check API key right before generating.
     */
    const isKeySelected = window.aistudio?.hasSelectedApiKey ? await window.aistudio.hasSelectedApiKey() : !!((window as any).process?.env?.API_KEY);
    
    if (!isKeySelected) {
      setIsSettingsOpen(true);
      setError("Please select your Gemini API Key in Settings to continue.");
      return;
    }

    setCurrentStep('generating');
    setError(null);
    try {
      const colors = await generateColorPalette(selection.mood.label);
      const titlesPromise = generateTitles(selection);
      const thumbnailPromise = generateThumbnail(selection, colors);
      const [titles, thumbnailData] = await Promise.all([titlesPromise, thumbnailPromise]);
      
      setResult({
        titles,
        thumbnailUrl: thumbnailData.url,
        colors,
        promptUsed: thumbnailData.prompt
      });
      setCurrentStep('result');
    } catch (err: any) {
      console.error(err);
      /**
       * Guidelines: If the request fails with "Requested entity was not found", reset the key selection state.
       */
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        setIsSettingsOpen(true);
      }
      setError("Jazz frequency interrupted. Check your API key or usage limits.");
      setCurrentStep('mood');
    }
  };

  const resetApp = () => {
    setSelection({ ...selection, destination: null, view: null, mood: null, aspectRatio: "16:9" });
    setResult(null);
    setCustomDestInput("");
    setCurrentStep('destination');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <header className="py-4 px-6 md:px-12 border-b border-slate-900 flex justify-between items-center bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={resetApp}>
          <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-950" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight serif">
            E-Music<span className="text-amber-500">Vibe</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-full border ${hasKey ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-amber-500/20 bg-amber-500/5 text-amber-400'} text-[10px] font-bold uppercase tracking-widest transition-colors duration-500`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{hasKey ? 'Engine Connected' : 'Setup Required'}</span>
          </div>
          <button onClick={() => { setIsSettingsOpen(true); setTestResult(null); }} className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-xl font-bold serif text-white">Engine Configuration</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] flex justify-between">
                  Gemini API Key
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">Billing Docs</a>
                </label>
                <div className="flex flex-col space-y-4">
                  <p className="text-xs text-slate-400">
                    This application uses <strong>Gemini 3 Pro</strong> for art generation, which requires a paid API key selection.
                  </p>
                  <button 
                    onClick={handleOpenKeyDialog} 
                    className="bg-amber-500 text-slate-950 px-6 py-4 rounded-2xl text-sm font-black hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                  >
                    SELECT PAID API KEY
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl text-xs font-medium border animate-fadeIn ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                   {testResult.message}
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <button 
                  onClick={handleTestConnection} 
                  disabled={isTestingConn || !hasKey} 
                  className="w-full py-4 bg-white text-slate-950 hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl font-black transition-all flex items-center justify-center space-x-2"
                >
                  {isTestingConn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-950 rounded-full animate-spin"></div>
                      <span>VERIFYING FREQUENCY...</span>
                    </>
                  ) : "TEST CONNECTION"}
                </button>
                <p className="text-[9px] text-center text-slate-600 uppercase tracking-widest leading-relaxed">
                  Required for High-Resolution Art Generation via Gemini 3 Pro
                </p>
              </div>
            </div>
            
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        {currentStep !== 'result' && currentStep !== 'generating' && (
          <StepIndicator currentStep={currentStep === 'destination' ? 1 : currentStep === 'view' ? 2 : 3} />
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl mb-12 text-center animate-fadeIn flex flex-col items-center">
            <span className="font-bold mb-1">Transmission Error</span>
            <span className="text-sm opacity-80">{error}</span>
            <button onClick={() => setIsSettingsOpen(true)} className="mt-4 text-xs font-black uppercase tracking-widest text-white underline underline-offset-4 decoration-red-500/50">Open Settings</button>
          </div>
        )}

        {currentStep === 'generating' ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fadeIn">
             <div className="w-20 h-20 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin mb-10"></div>
             <h2 className="text-3xl serif text-white mb-3">Synthesizing Artist Profile</h2>
             <p className="text-slate-500 text-xs tracking-widest uppercase italic">Gemini 3 Pro Image Engine • 1024x1024 px</p>
          </div>
        ) : currentStep === 'result' && result ? (
          <ResultView result={result} onReset={resetApp} aspectRatio={selection.aspectRatio} />
        ) : (
          <div className="animate-fadeIn pb-24">
            <h2 className="text-4xl md:text-6xl text-center serif text-white mb-16 leading-tight">
              {currentStep === 'destination' ? "Where is your mind traveling?" : 
               currentStep === 'view' ? "What do you see?" : "Choose your sonic palette."}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
              {(currentStep === 'destination' ? DESTINATIONS : currentStep === 'view' ? VIEWS : MOODS).map((option) => (
                <SelectionCard
                  key={option.id}
                  option={option}
                  selected={selection[currentStep as keyof UserSelection]?.id === option.id}
                  onClick={() => handleSelection(option)}
                />
              ))}
            </div>

            {currentStep === 'destination' && (
               <div className="mt-16 max-w-md mx-auto">
                 <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-1.5 flex items-center shadow-2xl">
                   <input type="text" value={customDestInput} onChange={(e) => setCustomDestInput(e.target.value)} placeholder="Type a custom city..." className="flex-grow bg-transparent border-none text-white px-5 py-4 focus:ring-0 outline-none text-sm placeholder:text-slate-600" />
                   <button onClick={handleCustomDestination} className="bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg hover:bg-amber-400 transition-all">GO</button>
                 </div>
               </div>
            )}

            <div className="mt-20 flex flex-col items-center space-y-8 sticky bottom-10 z-20">
               {selection.destination && selection.view && selection.mood ? (
                 <>
                   <div className="flex bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
                     {[
                       { id: '16:9', label: '16:9' },
                       { id: '1:1', label: '1:1' },
                       { id: '9:16', label: '9:16' }
                     ].map((ratio) => (
                       <button
                         key={ratio.id}
                         onClick={() => setSelection({ ...selection, aspectRatio: ratio.id })}
                         className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${selection.aspectRatio === ratio.id 
                             ? 'bg-amber-500 text-slate-950 shadow-lg' 
                             : 'text-slate-500 hover:text-slate-300'
                           }
                         `}
                       >
                         {ratio.label}
                       </button>
                     ))}
                   </div>

                   <button
                      onClick={handleGenerate}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-5 px-16 rounded-full shadow-2xl transition-all flex items-center space-x-4 active:scale-95 group"
                   >
                      <span className="text-xl uppercase tracking-wider">Start Vibe Mapping</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                   </button>
                 </>
               ) : (
                 <div className="h-24"></div>
               )}
            </div>
          </div>
        )}
      </main>
      <footer className="py-12 text-center text-slate-700 text-[9px] uppercase tracking-[0.4em] border-t border-slate-900">
        <p>© 2024 E-MusicVibe Architecture • Ticketless Travel Initiative</p>
      </footer>
    </div>
  );
};

export default App;
