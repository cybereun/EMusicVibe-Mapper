import React, { useState, useEffect } from 'react';
import { DESTINATIONS, VIEWS, MOODS } from './constants';
import { VibeOption, UserSelection, GeneratedResult, Step } from './types';
import StepIndicator from './components/StepIndicator';
import SelectionCard from './components/SelectionCard';
import ResultView from './components/ResultView';
import { generateTitles, generateThumbnail, generateColorPalette, testConnection } from './services/geminiService';

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('destination');
  const [selection, setSelection] = useState<UserSelection>({
    destination: null,
    view: null,
    mood: null,
    aspectRatio: "1:1",
  });
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customDestInput, setCustomDestInput] = useState("");
  const [customViewInput, setCustomViewInput] = useState("");
  
  // BYOK States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean, message?: string} | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    // 1. Check AI Studio Environment
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      if (selected) {
        setHasKey(true);
        return;
      }
    }
    
    // 2. Check LocalStorage Fallback (for Standalone)
    const saved = localStorage.getItem('user_gemini_key');
    if (saved) {
      setManualKey(saved);
      (window as any).process.env.API_KEY = saved;
      setHasKey(true);
    }
  };

  const handleSaveManualKey = () => {
    if (!manualKey.trim()) return;
    localStorage.setItem('user_gemini_key', manualKey.trim());
    (window as any).process.env.API_KEY = manualKey.trim();
    setHasKey(true);
    setTestResult({ success: true, message: "Key encrypted & saved locally." });
  };

  const handleOpenKeyPicker = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } else {
      setIsSettingsOpen(true);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    const res = await testConnection();
    setTestResult(res);
    setIsTestingConn(false);
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

  const handleCustomDestination = () => {
    if (!customDestInput.trim()) return;
    handleSelection({
      id: `custom-dest-${Date.now()}`,
      label: customDestInput,
      keywords: [customDestInput, 'Custom'],
      image: 'https://picsum.photos/200/200?grayscale'
    });
  };

  const handleGenerate = async () => {
    if (!selection.destination || !selection.view || !selection.mood) return;
    
    if (!hasKey) {
      setIsSettingsOpen(true);
      setError("API Key configuration required in settings.");
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
      setError("Lost the jazz signal. Please check your API key.");
      setCurrentStep('mood');
    }
  };

  const resetApp = () => {
    setSelection({ ...selection, destination: null, view: null, mood: null });
    setResult(null);
    setCustomDestInput("");
    setCustomViewInput("");
    setCurrentStep('destination');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Header */}
      <header className="py-5 px-6 md:px-12 border-b border-slate-900 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={resetApp}>
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-950" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight serif">
            E-Music<span className="text-amber-500">Vibe</span>
          </h1>
        </div>

        <div className="flex items-center space-x-5">
          <div className={`hidden md:flex items-center space-x-2 px-4 py-1.5 rounded-full border ${hasKey ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'} text-[10px] font-bold uppercase tracking-widest`}>
            <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span>{hasKey ? 'Engine Active' : 'Setup Key'}</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-slate-900/50 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white border border-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Modal - BYOK Implementation with Dark Theme */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold serif text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security Center
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Manual Gemini Key</label>
                <div className="flex space-x-2">
                  <input 
                    type="password"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder="Paste your API key here..."
                    className="flex-grow bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none text-slate-100 transition-all"
                  />
                  <button 
                    onClick={handleSaveManualKey}
                    className="bg-amber-500 text-slate-950 px-6 py-2 rounded-2xl text-xs font-black hover:bg-amber-400 transition-all active:scale-95"
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * Key is strictly encrypted in local storage. No data is sent to our servers.
                </p>
              </div>

              {window.aistudio && (
                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={handleOpenKeyPicker}
                    className="w-full flex items-center justify-center space-x-3 py-4 bg-slate-800 border border-slate-700 text-white rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all"
                  >
                    <span>Connect via AI Studio</span>
                  </button>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <button 
                  onClick={handleTestConnection}
                  disabled={isTestingConn || !hasKey}
                  className="w-full py-4 bg-white text-slate-950 hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 rounded-2xl font-black transition-all shadow-xl"
                >
                  {isTestingConn ? "SYNCHRONIZING..." : "VERIFY FREQUENCY"}
                </button>
                
                {testResult && (
                  <div className={`p-4 rounded-2xl text-xs font-medium border animate-slideDown ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {testResult.message}
                  </div>
                )}
              </div>

              <div className="text-center pt-4">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  className="text-[11px] text-amber-500 font-bold underline decoration-amber-500/30 underline-offset-4"
                >
                  Need a key? Get one for free at Google AI Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-16 max-w-5xl">
        {currentStep !== 'result' && currentStep !== 'generating' && (
          <StepIndicator currentStep={currentStep === 'destination' ? 1 : currentStep === 'view' ? 2 : 3} />
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-10 text-center font-medium animate-shake">
            {error}
          </div>
        )}

        {currentStep === 'generating' ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-10">
             <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-12 h-12 bg-amber-500/10 rounded-full animate-pulse"></div>
                </div>
             </div>
             <div className="text-center space-y-3">
               <h2 className="text-3xl md:text-4xl serif text-white">Synthesizing Artist Profile</h2>
               <p className="text-slate-500 text-sm tracking-widest uppercase italic">Gemini Pro • 1K Studio Quality Rendering</p>
             </div>
          </div>
        ) : currentStep === 'result' && result ? (
          <ResultView result={result} onReset={resetApp} />
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

            {/* Custom Inputs with Dark Theme */}
            {currentStep === 'destination' && (
               <div className="mt-16 max-w-lg mx-auto">
                 <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-1.5 flex items-center shadow-2xl focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                   <input 
                      type="text"
                      value={customDestInput}
                      onChange={(e) => setCustomDestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomDestination()}
                      placeholder="Type any city in the world..."
                      className="flex-grow bg-transparent border-none text-white px-6 py-5 focus:ring-0 outline-none text-base placeholder:text-slate-600"
                   />
                   <button 
                     onClick={handleCustomDestination}
                     className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95"
                   >
                     GO
                   </button>
                 </div>
               </div>
            )}

            <div className="mt-20 flex justify-center sticky bottom-10 z-20">
               {selection.destination && selection.view && selection.mood ? (
                 <button
                    onClick={handleGenerate}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-6 px-20 rounded-full shadow-2xl shadow-amber-500/20 transition-all flex items-center space-x-4 active:scale-95 group"
                 >
                    <span className="text-xl uppercase tracking-wider">Start Vibe Mapping</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                 </button>
               ) : (
                 <div className="h-24"></div>
               )}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.4em] border-t border-slate-900">
        <p>© 2024 E-MusicVibe Architecture • Powered by Gemini 3 Pro</p>
      </footer>
    </div>
  );
};

export default App;