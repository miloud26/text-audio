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
  AlertTriangle
} from 'lucide-react';
import { analyzeScript, generateEmotionalAudio, ScriptSegment } from './lib/gemini';
import { playTTSAudio, downloadAudioAsWav } from './lib/audio';

export default function App() {
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<{ audioContext: AudioContext; source: AudioBufferSourceNode } | null>(null);

  const handleAnalyze = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeScript(script);
      setSegments(result);
    } catch (err: any) {
      console.error(err);
      setError("فشل تحليل السكريبت. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (segments.length === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      const base64 = await generateEmotionalAudio(segments, voice);
      setAudioBase64(base64);
    } catch (err: any) {
      console.error(err);
      setError("فشل إنتاج الصوت. قد يكون هناك ضغط على الخدمة أو مشكلة في الاتصال.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioBase64) {
      downloadAudioAsWav(audioBase64, `VO_Export_${voice}.wav`);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      audioRef.current?.source.stop();
      setIsPlaying(false);
    } else if (audioBase64) {
      setIsPlaying(true);
      const playback = await playTTSAudio(audioBase64);
      audioRef.current = playback;
      playback.source.onended = () => setIsPlaying(false);
    }
  };

  const clearAll = () => {
    setScript('');
    setSegments([]);
    setAudioBase64(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.source.stop();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-[#F27D26]/30" dir="rtl">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F27D26]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1a1a1a] blur-[120px] rounded-full border border-[#F27D26]/5" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F27D26] flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)]">
              <Mic2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Al-Sawtify AI</h1>
              <p className="text-[#888] text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#F27D26]" />
                تحليل وإنتاج الصوت العاطفي
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-[#151619] p-1 rounded-full border border-white/5"
          >
            <button 
              onClick={() => setVoice('female')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${voice === 'female' ? 'bg-[#F27D26] text-white shadow-lg' : 'text-[#888] hover:text-white'}`}
            >
              <UserRound className="w-4 h-4" />
              <span>أنثوي (Kore)</span>
            </button>
            <button 
              onClick={() => setVoice('male')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${voice === 'male' ? 'bg-[#F27D26] text-white shadow-lg' : 'text-[#888] hover:text-white'}`}
            >
              <User className="w-4 h-4" />
              <span>ذكوري (Charon)</span>
            </button>
          </motion.div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <section className="lg:col-span-12 xl:col-span-12 mb-8">
            <div className="bg-[#151619] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-bottom border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#F27D26]" />
                  <span className="text-sm font-mono uppercase tracking-wider text-[#888]">سكريبت الإعلان</span>
                </div>
                <button 
                  onClick={clearAll}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[#555] hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea 
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="أدخل نص الإعلان هنا... مثلاً: 'لقد مر الجميع بلحظات صعبة، عندما يبدو كل شيء مظلماً. لكننا هنا لنضيء لك الطريق...'"
                className="w-full h-48 bg-transparent p-8 focus:outline-none text-xl leading-relaxed resize-none placeholder:text-[#333]"
              />
              <div className="p-6 bg-white/[0.01] flex justify-end">
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !script.trim()}
                  className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-[#F27D26] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform rotate-180" />}
                  <span>تحليل المشاعر والنبضات</span>
                </button>
              </div>
            </div>
          </section>

          {/* Results Analysis */}
          <section className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {segments.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-[1px] flex-grow bg-white/10" />
                    <span className="text-xs font-mono text-[#444] uppercase tracking-[0.3em]">الجدول الزمني للسكريبت</span>
                    <div className="h-[1px] flex-grow bg-white/10" />
                  </div>
                  
                  {segments.map((segment, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative bg-[#111111] p-6 rounded-xl border border-white/5 hover:border-[#F27D26]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <p className="text-lg leading-relaxed text-[#bbb] group-hover:text-white transition-colors">
                            {segment.text}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[120px]">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            segment.emotion.includes('sad') || segment.emotion.includes('pain') 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {segment.emotion}
                          </span>
                          <span className="text-[10px] text-[#444] font-mono italic">
                            {segment.direction}
                          </span>
                        </div>
                      </div>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#F27D26] transition-colors rounded-l-xl" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-[#333]">
                  <Info className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg">قم بإدخال السكريبت للبدء في التحليل العاطفي</p>
                </div>
              )}
            </AnimatePresence>
          </section>

          {/* Action/Audio Card */}
          <aside className="lg:col-span-4 self-start sticky top-8">
            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Volume2 className="w-24 h-24" />
              </div>

              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse" />
                إنتاج تعليق صوتي واقعي
              </h2>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <ul className="space-y-4 mb-8 text-sm text-[#888]">
                <li className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  أصوات بشرية عالية الدقة 24kHz
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  تحليل نبرة الكلام الواقعية
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  تجنب المبالغة لضمان المصداقية
                </li>
              </ul>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || segments.length === 0}
                className="w-full bg-[#F27D26] text-white py-4 rounded-xl font-bold shadow-[0_10px_20px_rgba(242,125,38,0.2)] hover:shadow-[0_15px_30px_rgba(242,125,38,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic2 className="w-5 h-5" />}
                إنتاج التسجيل الصوتي
              </button>

              <AnimatePresence>
                {audioBase64 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-8 pt-8 border-t border-white/5 space-y-6"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-center gap-6">
                        <button 
                          onClick={togglePlayback}
                          className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        >
                          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-[-2px] ml-1 rotate-180" />}
                        </button>
                      </div>
                      
                      <button 
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        تحميل الملف الصوتي (WAV)
                      </button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-mono text-[#F27D26] uppercase tracking-[0.2em] mb-2">Audio Channel 1</p>
                      <p className="text-[10px] text-[#444]">Ready for Export (Linear PCM 24k)</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </main>
      </div>
      
      {/* Footer Info */}
      <footer className="mt-24 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <p className="text-xs font-mono uppercase tracking-[0.4em]">Proprietary AI Audio Layer • v3.1</p>
          <div className="flex items-center gap-8 text-[10px] uppercase font-bold tracking-widest">
            <span>Neural Engine</span>
            <span>Emotional Mapping</span>
            <span>Voice Synthesis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

