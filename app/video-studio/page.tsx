'use client';

import { useState } from 'react';
import { Film, Loader2, Copy, Check, ChevronDown, Sparkles, AlertCircle, RefreshCw, Download, Clock, Music, Camera, Hash } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';

const PLATFORMS = ['Instagram Reels','YouTube Shorts','TikTok','Facebook Reels','LinkedIn Video'];
const DURATIONS = ['15','30','45','60','90'];
const STYLES = ['Talking Head','Product Showcase','Tutorial / How-To','Behind the Scenes','Testimonial Style','Cinematic / Story','Fast-Cut Trendy','Voiceover + B-Roll'];
const GOALS = ['Drive Sales','Brand Awareness','Generate Leads','Educate Audience','Viral / Entertainment','Promote Event'];

interface Scene {
  scene_number: number;
  duration_seconds: number;
  shot_type: string;
  visual: string;
  voiceover: string;
  text_overlay: string;
  music_mood: string;
}

interface VideoScript {
  title: string;
  hook_line: string;
  voiceover_script: string;
  scenes: Scene[];
  caption: string;
  hashtags: string[];
  thumbnail_idea: string;
  cta: string;
  editing_tips: string[];
  music_suggestion: string;
  b_roll_list: string[];
  best_posting_time: string;
}

type TabKey = 'script' | 'scenes' | 'caption' | 'production';

function VideoStudioInner() {
  const toast = useToast();
  const [form, setForm] = useState({
    businessName: '', category: '', productDescription: '',
    targetAudience: '', platform: 'Instagram Reels', duration: '30',
    style: 'Talking Head', goal: 'Drive Sales', hook: '',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<VideoScript | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('script');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const generate = async () => {
    if (!form.businessName || !form.productDescription) {
      setError('Business name and product description are required.');
      return;
    }
    setError(''); setGenerating(true); setResult(null);
    try {
      const res = await fetch('/api/generate-video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Server error — check GROQ_API_KEY in .env.local');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast('Video script generated!', 'ai');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setGenerating(false); }
  };

  const downloadScript = () => {
    if (!result) return;
    const text = [
      `VIDEO SCRIPT — ${result.title}`,
      `Platform: ${form.platform} | Duration: ${form.duration}s`,
      `\n═══ HOOK ═══\n${result.hook_line}`,
      `\n═══ FULL VOICEOVER SCRIPT ═══\n${result.voiceover_script}`,
      `\n═══ SCENES ═══`,
      ...result.scenes.map((s) =>
        `\nScene ${s.scene_number} (${s.duration_seconds}s) — ${s.shot_type}\nVisual: ${s.visual}\nVoiceover: "${s.voiceover}"\nText Overlay: ${s.text_overlay}\nMusic Mood: ${s.music_mood}`
      ),
      `\n═══ PRODUCTION ═══`,
      `Music: ${result.music_suggestion}`,
      `CTA: ${result.cta}`,
      `Thumbnail: ${result.thumbnail_idea}`,
      `\nB-Roll List:\n${result.b_roll_list.map((b,i) => `${i+1}. ${b}`).join('\n')}`,
      `\nEditing Tips:\n${result.editing_tips.map((t,i) => `${i+1}. ${t}`).join('\n')}`,
      `\n═══ CAPTION ═══\n${result.caption}`,
      `\nHashtags: ${result.hashtags.join(' ')}`,
      `\nBest Posting Time: ${result.best_posting_time}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${result.title.replace(/\s+/g, '_')}_script.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast('Script downloaded!');
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'script', label: 'Script', icon: Film },
    { key: 'scenes', label: 'Scene Plan', icon: Camera },
    { key: 'caption', label: 'Caption', icon: Hash },
    { key: 'production', label: 'Production', icon: Music },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-pink-600/8 top-[-150px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-pink-500/8 border border-pink-500/15 rounded-full px-4 py-1.5 text-xs text-pink-400 font-light tracking-widest uppercase mb-4">
            <Film size={11} /> Video Studio
          </div>
          <h1 className="text-5xl font-light text-white tracking-wide mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Create Your Video
          </h1>
          <p className="text-slate-500 text-sm font-light">AI-generated script, scene-by-scene shot plan, voiceover, captions and production guide.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
          {/* Form */}
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-7 space-y-4 h-fit">
            <h2 className="text-lg font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Video details</h2>

            {[
              { label: 'Business / Brand name', key: 'businessName', placeholder: 'e.g. Priya Gold House...' },
              { label: 'What are you promoting?', key: 'productDescription', placeholder: 'Describe your product or service...', textarea: true },
              { label: 'Target audience', key: 'targetAudience', placeholder: 'e.g. Women 25–40, small business owners...' },
            ].map(({ label, key, placeholder, textarea }) => (
              <div key={key}>
                <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">{label}</label>
                {textarea ? (
                  <textarea rows={2} placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-pink-500/30 text-sm font-light resize-none" />
                ) : (
                  <input type="text" placeholder={placeholder} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-pink-500/30 text-sm font-light" />
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Platform', key: 'platform', options: PLATFORMS },
                { label: 'Duration', key: 'duration', options: DURATIONS, suffix: 's' },
                { label: 'Style', key: 'style', options: STYLES },
                { label: 'Goal', key: 'goal', options: GOALS },
              ].map(({ label, key, options, suffix }) => (
                <div key={key}>
                  <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">{label}</label>
                  <div className="relative">
                    <select value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-3 py-3 text-white focus:outline-none text-xs font-light appearance-none">
                      {options.map((o) => <option key={o} value={o} className="bg-[#16161f]">{o}{suffix || ''}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Hook idea <span className="normal-case text-slate-700">(optional)</span></label>
              <input type="text" placeholder="e.g. Start with a shocking stat, show before/after..."
                value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })}
                className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-pink-500/30 text-sm font-light" />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-xs font-light">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            <button onClick={generate} disabled={generating}
              className="w-full py-4 rounded-2xl text-sm font-light text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-85"
              style={{ background: 'linear-gradient(135deg, #db2777, #9333ea)' }}>
              {generating ? <><Loader2 size={15} className="animate-spin" />Generating script...</>
                : <><Sparkles size={15} />Generate Video Package</>}
            </button>
          </div>

          {/* Result */}
          <div>
            {!result && !generating && (
              <div className="h-full min-h-[400px] bg-[#16161f] border border-white/[0.06] rounded-3xl flex flex-col items-center justify-center text-center p-10">
                <div className="w-16 h-16 rounded-3xl bg-pink-500/8 border border-pink-500/15 flex items-center justify-center mb-5">
                  <Film size={28} className="text-pink-400/50" />
                </div>
                <h3 className="text-2xl font-light text-white/40 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Your video script will appear here</h3>
                <p className="text-slate-600 text-xs font-light">Fill in the details and click generate</p>
              </div>
            )}

            {generating && (
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 space-y-4">
                {['Writing your hook...','Planning scenes...','Scripting voiceover...','Building production guide...'].map((msg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl shimmer flex-shrink-0" />
                    <div className="flex-1 h-3 rounded-full shimmer" />
                    <span className="text-xs text-slate-700 font-light">{msg}</span>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-slide-up">
                {/* Title + actions */}
                <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-light text-white mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{result.title}</h2>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-light">
                        <span className="flex items-center gap-1"><Clock size={10} />{form.duration}s · {form.platform}</span>
                        <span className="flex items-center gap-1">🎯 {form.goal}</span>
                        <span className="flex items-center gap-1">{form.style}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={downloadScript}
                        className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-slate-400 hover:bg-white/[0.07] transition-all font-light">
                        <Download size={11} />Download
                      </button>
                      <button onClick={generate}
                        className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-slate-400 hover:bg-white/[0.07] transition-all font-light">
                        <RefreshCw size={11} />Redo
                      </button>
                    </div>
                  </div>

                  {/* Hook callout */}
                  <div className="mt-5 bg-pink-500/8 border border-pink-500/15 rounded-2xl p-4">
                    <div className="text-xs font-light text-pink-400 uppercase tracking-widest mb-1.5">🎣 Opening Hook</div>
                    <p className="text-white text-sm font-light leading-relaxed italic">&ldquo;{result.hook_line}&rdquo;</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl overflow-hidden">
                  <div className="flex border-b border-white/[0.06]">
                    {tabs.map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => setActiveTab(key)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-light py-3.5 transition-all border-b-2 -mb-px"
                        style={{
                          color: activeTab === key ? '#f472b6' : '#475569',
                          borderBottomColor: activeTab === key ? '#db2777' : 'transparent',
                          background: activeTab === key ? 'rgba(219,39,119,0.06)' : 'transparent',
                        }}>
                        <Icon size={11} />{label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {/* Script tab */}
                    {activeTab === 'script' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-slate-500 font-light uppercase tracking-widest">Full Voiceover Script</span>
                          <button onClick={() => copy(result.voiceover_script, 'script')}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-light">
                            {copied === 'script' ? <><Check size={10} className="text-green-400" />Copied</> : <><Copy size={10} />Copy</>}
                          </button>
                        </div>
                        <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/[0.04]">
                          <p className="text-slate-200 text-sm font-light leading-loose whitespace-pre-wrap">{result.voiceover_script}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 font-light">
                          <Clock size={11} />Estimated read time: ~{Math.ceil(result.voiceover_script.split(' ').length / 2.5)}s at normal pace
                        </div>
                      </div>
                    )}

                    {/* Scenes tab */}
                    {activeTab === 'scenes' && (
                      <div className="space-y-4">
                        {result.scenes.map((scene) => (
                          <div key={scene.scene_number} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/15">
                                  Scene {scene.scene_number}
                                </span>
                                <span className="text-xs text-slate-500 font-light">{scene.duration_seconds}s · {scene.shot_type}</span>
                              </div>
                              <span className="text-xs text-slate-600 font-light italic">{scene.music_mood}</span>
                            </div>
                            <div className="space-y-2.5">
                              <div>
                                <span className="text-xs text-slate-600 font-light uppercase tracking-widest">📷 Visual</span>
                                <p className="text-sm text-slate-300 font-light mt-1 leading-relaxed">{scene.visual}</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-600 font-light uppercase tracking-widest">🎙️ Voiceover</span>
                                <p className="text-sm text-violet-300 font-light mt-1 italic">&ldquo;{scene.voiceover}&rdquo;</p>
                              </div>
                              {scene.text_overlay && (
                                <div>
                                  <span className="text-xs text-slate-600 font-light uppercase tracking-widest">📝 Text Overlay</span>
                                  <p className="text-sm text-amber-400 font-light mt-1">{scene.text_overlay}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Caption tab */}
                    {activeTab === 'caption' && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-500 font-light uppercase tracking-widest">Post Caption</span>
                          <button onClick={() => copy(result.caption, 'caption')}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 font-light transition-colors">
                            {copied === 'caption' ? <><Check size={10} className="text-green-400" />Copied</> : <><Copy size={10} />Copy</>}
                          </button>
                        </div>
                        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04] mb-5">
                          <p className="text-slate-200 text-sm font-light leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-600 font-light uppercase tracking-widest"># Hashtags</span>
                          <button onClick={() => copy(result.hashtags.join(' '), 'hashtags')}
                            className="text-xs text-slate-600 hover:text-slate-400 font-light transition-colors">
                            {copied === 'hashtags' ? '✓ Copied' : 'Copy all'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {result.hashtags.map((h, i) => (
                            <span key={i} className="text-xs bg-pink-500/8 text-pink-400 border border-pink-500/15 rounded-full px-2.5 py-1 font-light">{h}</span>
                          ))}
                        </div>
                        <div className="bg-amber-500/6 border border-amber-500/12 rounded-2xl p-4">
                          <div className="text-xs text-amber-400 font-light uppercase tracking-widest mb-1">📅 Best time to post</div>
                          <p className="text-sm text-slate-300 font-light">{result.best_posting_time}</p>
                        </div>
                      </div>
                    )}

                    {/* Production tab */}
                    {activeTab === 'production' && (
                      <div className="space-y-5">
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                          <div className="text-xs text-violet-400 font-light uppercase tracking-widest mb-2">🎵 Music</div>
                          <p className="text-sm text-slate-300 font-light">{result.music_suggestion}</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                          <div className="text-xs text-cyan-400 font-light uppercase tracking-widest mb-2">🖼️ Thumbnail</div>
                          <p className="text-sm text-slate-300 font-light">{result.thumbnail_idea}</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                          <div className="text-xs text-green-400 font-light uppercase tracking-widest mb-3">🎬 B-Roll List</div>
                          <ul className="space-y-2">
                            {result.b_roll_list.map((b, i) => (
                              <li key={i} className="text-sm text-slate-300 font-light flex gap-2">
                                <span className="text-slate-600">{i + 1}.</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                          <div className="text-xs text-amber-400 font-light uppercase tracking-widest mb-3">✂️ Editing Tips</div>
                          <ul className="space-y-2">
                            {result.editing_tips.map((t, i) => (
                              <li key={i} className="text-sm text-slate-300 font-light flex gap-2">
                                <span className="text-slate-600">{i + 1}.</span>{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-pink-500/8 border border-pink-500/15 rounded-2xl p-5">
                          <div className="text-xs text-pink-400 font-light uppercase tracking-widest mb-2">📢 Closing CTA</div>
                          <p className="text-white text-sm font-light italic">&ldquo;{result.cta}&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VideoStudioPage() {
  return <AuthGuard><VideoStudioInner /></AuthGuard>;
}
