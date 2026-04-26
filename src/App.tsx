/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic2, 
  Sparkles, 
  Play, 
  Pause, 
  Trash2, 
  Info, 
  User, 
  UserRound, 
  ChevronRight,
  Loader2,
  Volume2,
  Activity,
  Download,
  AlertTriangle,
  Settings,
  Code,
  Layers,
  Zap
} from 'lucide-react';
import { processJsonToSpeech, autoAnalyzeScriptToJson, SpeechEngineInput, SpeechEngineOutput } from './lib/gemini';
import { playTTSAudio, downloadAudioAsWav } from './lib/audio';

export default function App() {
  const [script, setScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [engineInput, setEngineInput] = useState<SpeechEngineInput | null>(null);
  const [engineOutput, setEngineOutput] = useState<SpeechEngineOutput | null>(null);
  const [voiceMode, setVoiceMode] = useState<'male' | 'female'>('female');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'json'>('script');
  
  const audioRef = useRef<{ audioContext: AudioContext; source: AudioBufferSourceNode } | null>(null);

  const handleAutoAnalyze = async () => {
    if (!script.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const input = await autoAnalyzeScriptToJson(script, voiceMode);
      setEngineInput(input);
      setActiveTab('json');
    } catch (err: any) {
      console.error(err);
      setError("فشل تحليل السكريبت وتحويله إلى تنسيق المحرك.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunEngine = async () => {
    if (!engineInput) return;
    setIsGenerating(true);
    setError(null);
    try {
      const output = await processJsonToSpeech(engineInput);
      setEngineOutput(output);
    } catch (err: any) {
      console.error(err);
      setError("فشل محرك توليد الصوت. يرجى التحقق من معلمات الـ JSON.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (engineOutput?.final_mix.output_file) {
      downloadAudioAsWav(engineOutput.final_mix.output_file, `SpeechEngine_Result_${voiceMode}.wav`);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      audioRef.current?.source.stop();
      setIsPlaying(false);
    } else if (engineOutput?.final_mix.output_file) {
      setIsPlaying(true);
      try {
        const playback = await playTTSAudio(engineOutput.final_mix.output_file);
        audioRef.current = playback;
        playback.source.onended = () => setIsPlaying(false);
      } catch (err) {
        console.error("Playback failed", err);
        setIsPlaying(false);
      }
    }
  };

  const clearAll = () => {
    setScript('');
    setEngineInput(null);
    setEngineOutput(null);
    setError(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.source.stop();
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e5e5] font-sans selection:bg-[#F27D26]/30" dir="rtl">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#F27D26]/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1a1a1a] blur-[120px] rounded-full border border-[#F27D26]/5" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 bg-[#111] p-6 rounded-3xl border border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F27D26] to-[#d66b1d] flex items-center justify-center shadow-[0_0_30px_rgba(242,125,38,0.4)]">
              <Mic2 className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white mb-0.5">DARJA ENGINE v1.0</h1>
              <p className="text-[#F27D26] text-xs font-mono uppercase tracking-[0.3em] flex items-center gap-2">
                <Zap className="w-3 h-3 fill-current" />
                SYSTEM — JSON TO SPEECH (DARJA)
              </p>
            </div>
          </motion.div>

          <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => { setVoiceMode('female'); if(engineInput) setEngineInput({...engineInput, voice_mode: 'female'})}}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-bold ${voiceMode === 'female' ? 'bg-[#F27D26] text-white' : 'text-[#555] hover:text-white'}`}
            >
              <UserRound className="w-4 h-4" />
              <span>أنثى</span>
            </button>
            <button 
              onClick={() => { setVoiceMode('male'); if(engineInput) setEngineInput({...engineInput, voice_mode: 'male'})}}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-bold ${voiceMode === 'male' ? 'bg-[#F27D26] text-white' : 'text-[#555] hover:text-white'}`}
            >
              <User className="w-4 h-4" />
              <span>ذكر</span>
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <section className="lg:col-span-12 xl:col-span-7">
            <div className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[700px]">
              <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('script')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${activeTab === 'script' ? 'bg-[#F27D26] text-white' : 'text-[#444] hover:text-[#888]'}`}
                  >
                    <Sparkles className="w-3 h-3" /> SCRIPT
                  </button>
                  <button 
                    onClick={() => setActiveTab('json')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${activeTab === 'json' ? 'bg-white text-black' : 'text-[#444] hover:text-[#888]'}`}
                  >
                    <Code className="w-3 h-3" /> ENGINE JSON
                  </button>
                </div>
                <button 
                  onClick={clearAll}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[#333] hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-grow overflow-hidden">
                {activeTab === 'script' ? (
                  <textarea 
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="أدخل نص الإعلان بالدارجة الجزائرية هنا..."
                    className="w-full h-full bg-transparent p-10 focus:outline-none text-2xl leading-relaxed resize-none placeholder:text-[#222] font-medium"
                  />
                ) : (
                  <textarea 
                    value={engineInput ? JSON.stringify(engineInput, null, 2) : ''}
                    onChange={(e) => {
                      try {
                        setEngineInput(JSON.parse(e.target.value));
                      } catch (err) {}
                    }}
                    dir="ltr"
                    className="w-full h-full bg-[#0a0a0a] p-8 focus:outline-none text-sm font-mono text-green-500/80 leading-relaxed resize-none"
                  />
                )}
              </div>

              <div className="p-8 bg-white/[0.01] border-t border-white/5 flex gap-4">
                <button 
                  onClick={handleAutoAnalyze}
                  disabled={isProcessing || !script.trim()}
                  className="flex-grow flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-[#F27D26] hover:text-white transition-all disabled:opacity-50 group hover:scale-[1.02]"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Settings className="w-5 h-5" />}
                  <span>تهيئة مشغل المحرك (STRUCTURAL ANALYSIS)</span>
                </button>
                
                {activeTab === 'json' && (
                  <button 
                    onClick={handleRunEngine}
                    disabled={isGenerating || !engineInput}
                    className="aspect-square bg-[#F27D26] text-white p-4 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[#F27D26]/20 disabled:opacity-30"
                    title="Run Generation Engine"
                  >
                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 rotate-180" />}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Configuration & Output Display */}
          <aside className="lg:col-span-12 xl:col-span-5 flex flex-col gap-8">
            {/* Status Panel */}
            <div className="bg-[#111] p-8 rounded-3xl border border-white/5 relative overflow-hidden h-fit">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#F27D26] shadow-[0_0_20px_#F27D26]" />
              
              <h2 className="text-xl font-black mb-8 flex items-center justify-between">
                التحكم بالمعالجة
                <Layers className="w-5 h-5 text-[#333]" />
              </h2>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key="error-box"
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!engineInput && !engineOutput && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <Activity className="w-16 h-16 mb-4 animate-pulse" />
                  <p className="text-sm font-mono uppercase tracking-widest">Awaiting Input Stream</p>
                </div>
              )}

              {engineInput && !engineOutput && (
                <div className="space-y-6">
                  <p className="text-xs font-mono text-[#444] uppercase tracking-widest">Engine Config Ready</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-[#444] uppercase mb-1">Language</span>
                      <span className="text-sm font-bold">{engineInput.language}</span>
                    </div>
                    <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-[#444] uppercase mb-1">Scenes Detected</span>
                      <span className="text-sm font-bold">{engineInput.scenes.length}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleRunEngine}
                    disabled={isGenerating}
                    className="w-full bg-white text-black py-4 rounded-xl font-black hover:bg-[#F27D26] hover:text-white transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'جاري التوليد...' : 'تشغيل المحرك الصوتي (SPEECH GENERATION)'}
                  </button>
                </div>
              )}

              {engineOutput && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-bold text-green-400">AUDIO READY</span>
                    </div>
                    <span className="text-[10px] font-mono text-green-500/60 font-bold">MODE: LOCKED</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={togglePlayback}
                      className="w-full flex items-center justify-center gap-4 py-6 bg-white text-black rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
                    >
                      {isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black rotate-180" />}
                      <span className="text-xl">تجربة الأداء الصوتي</span>
                    </button>
                    
                    <button 
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-3 py-4 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/5 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      تحميل نسخة المحرك (WAV)
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-[#333] uppercase tracking-[0.3em]">Audio Scene Logs</p>
                    <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {engineOutput.audio_scenes.map((scene, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-white/5 text-[10px] font-mono">
                          <span className="text-white/60">SCENE_{scene.scene}</span>
                          <span className="text-[#F27D26] uppercase">{scene.notes}</span>
                          <span className="text-[#444]">{scene.timing}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Instruction Card */}
            <div className="bg-gradient-to-br from-[#151515] to-[#0a0a0a] p-8 rounded-3xl border border-white/5 shadow-xl">
              <h3 className="text-sm font-black text-[#555] uppercase tracking-widest mb-6 flex items-center gap-3">
                <Info className="w-4 h-4" /> ENGINE CAPABILITIES
              </h3>
              <div className="grid grid-cols-1 gap-4 text-[11px] font-mono text-[#888] leading-loose">
                <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[#F27D26] font-bold">01</div>
                   <p>تحميل السكريبت → معالجة هيكلية (Phases 1-4) → تحويل لـ JSON.</p>
                </div>
                <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[#F27D26] font-bold">02</div>
                   <p>إدارة النبرة العاطفية (Intensity + Emotion) للدارجة الجزائرية.</p>
                </div>
                <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[#F27D26] font-bold">03</div>
                   <p>توزيع السكتات (Pause Map) وتقسيم المشاهد زمنياً (Timing Sync).</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #F27D26; }
      `}</style>
    </div>
  );
}

