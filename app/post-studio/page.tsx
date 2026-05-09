'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Copy, Check, ChevronDown, Sparkles, AlertCircle,
  RefreshCw, Zap, Lock, Download, Clock, MessageSquare,
  Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../components/Toast';
import AuthGuard from '../components/AuthGuard';

const PLATFORMS = ['Instagram','Facebook','Twitter/X','LinkedIn','YouTube'];
const POST_TYPES = ['Feed Post','Reel','Story','Carousel','Ad Copy'];
const TONES = ['Luxury & Premium','Engaging & Warm','Bold & Confident','Playful & Fun','Professional','Urgent & Sales-Driven'];
const GOALS = ['Drive Sales','Brand Awareness','Generate Leads','Grow Followers','Promote Event','Product Launch'];

interface PostData {
  visual_style: string;
  colors: { bg: string; bg2: string; accent: string; accent2: string; text_primary: string; text_secondary: string };
  headline: string;
  headline_accent: string;
  tagline: string;
  badge_text: string;
  offer_text: string;
  visual_motif: string;
  caption: string;
  hashtags: string[];
  first_comment: string;
  story_idea: string;
  best_time: string;
  image_prompt: string;
  reply_templates: { trigger: string; reply: string }[];
  imageUrl?: string | null;
}

/* ── Canvas Post Renderer ─────────────────────────────────── */
function drawPost(canvas: HTMLCanvasElement, data: PostData, businessName: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const S = 1080;
  canvas.width = S; canvas.height = S;
  const c = data.colors;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, c.bg || '#08080d');
  bg.addColorStop(0.5, c.bg2 || c.bg || '#120a1e');
  bg.addColorStop(1, c.bg || '#08080d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);

  // Translucent shimmer overlay
  const shimmer = ctx.createLinearGradient(0, 0, S, S);
  shimmer.addColorStop(0, 'rgba(255,255,255,0.03)');
  shimmer.addColorStop(0.5, 'rgba(255,255,255,0.055)');
  shimmer.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = shimmer; ctx.fillRect(0, 0, S, S);

  // Glow blobs
  ctx.save();
  const g1 = ctx.createRadialGradient(S*0.1,S*0.1,0,S*0.1,S*0.1,S*0.5);
  g1.addColorStop(0, c.accent+'44'); g1.addColorStop(1,'transparent');
  ctx.globalAlpha=0.25; ctx.fillStyle=g1; ctx.fillRect(0,0,S,S);
  const g2 = ctx.createRadialGradient(S*0.9,S*0.9,0,S*0.9,S*0.9,S*0.45);
  g2.addColorStop(0, (c.accent2||c.accent)+'44'); g2.addColorStop(1,'transparent');
  ctx.fillStyle=g2; ctx.fillRect(0,0,S,S);
  const g3 = ctx.createRadialGradient(S/2,S/2,0,S/2,S/2,S*0.35);
  g3.addColorStop(0, c.accent+'18'); g3.addColorStop(1,'transparent');
  ctx.globalAlpha=0.5; ctx.fillStyle=g3; ctx.fillRect(0,0,S,S);
  ctx.restore();

  // Visual motif
  ctx.save(); ctx.globalAlpha=0.065; ctx.strokeStyle=c.accent; ctx.lineWidth=1.2;
  const motif = data.visual_motif || 'geometric_circles';
  if (motif==='geometric_circles') {
    for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(S/2,S/2,90+i*80,0,Math.PI*2);ctx.stroke();}
  } else if (motif==='dot_grid') {
    ctx.fillStyle=c.accent;
    for(let x=30;x<S;x+=30) for(let y=30;y<S;y+=30){ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}
  } else if (motif==='diagonal_lines') {
    for(let i=-S;i<S*2;i+=32){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+S,S);ctx.stroke();}
  } else if (motif==='wave_lines') {
    for(let y=0;y<S;y+=35){ctx.beginPath();for(let x=0;x<=S;x+=8){const wy=y+Math.sin((x/S)*Math.PI*4)*12;x===0?ctx.moveTo(x,wy):ctx.lineTo(x,wy);}ctx.stroke();}
  } else if (motif==='hexagon_pattern') {
    const hw=35,hh=30;
    for(let row=0;row<14;row++) for(let col=0;col<16;col++){
      const ox=col*hw*1.5+(row%2?hw*0.75:0),oy=row*hh;
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;ctx.lineTo(ox+hw*0.5*Math.cos(a),oy+hh*0.5*Math.sin(a));}
      ctx.closePath();ctx.stroke();
    }
  }
  ctx.restore();

  // Border frame
  ctx.save(); ctx.globalAlpha=0.45; ctx.strokeStyle=c.accent; ctx.lineWidth=1.2;
  ctx.strokeRect(28,28,S-56,S-56);
  ctx.globalAlpha=0.18; ctx.strokeRect(40,40,S-80,S-80);
  ctx.restore();

  // Corner accents
  const cL=22;
  ctx.save(); ctx.strokeStyle=c.accent; ctx.lineWidth=3; ctx.globalAlpha=0.95;
  [[28,28],[S-28,28],[28,S-28],[S-28,S-28]].forEach(([cx,cy])=>{
    const sx=cx<S/2?1:-1,sy=cy<S/2?1:-1;
    ctx.beginPath();ctx.moveTo(cx+sx*cL,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*cL);ctx.stroke();
  });
  ctx.restore();

  // Badge
  if (data.badge_text) {
    const bt = data.badge_text.toUpperCase();
    ctx.save();
    ctx.font='500 22px Montserrat,sans-serif';
    ctx.letterSpacing='3px';
    const bw = ctx.measureText(bt).width + 48;
    const bx=(S-bw)/2, by=120;
    ctx.globalAlpha=0.18; ctx.fillStyle=c.accent; ctx.beginPath(); ctx.roundRect(bx,by,bw,32,2); ctx.fill();
    ctx.globalAlpha=0.6; ctx.strokeStyle=c.accent; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(bx,by,bw,32,2); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle=c.accent; ctx.textAlign='center';
    ctx.fillText(bt, S/2, by+22);
    ctx.restore();
  }

  // Headline — auto-fit font size so it NEVER gets cut off
  const hl = (data.headline || businessName).toUpperCase();
  const acc = (data.headline_accent || '').toUpperCase();
  ctx.save(); ctx.textAlign='center';

  // Auto-fit: start large, shrink until it fits within 85% of canvas width
  let fontSize = 110;
  ctx.font = `900 ${fontSize}px 'Playfair Display',Georgia,serif`;
  while (ctx.measureText(hl).width > S * 0.85 && fontSize > 40) {
    fontSize -= 4;
    ctx.font = `900 ${fontSize}px 'Playfair Display',Georgia,serif`;
  }

  const hlY = data.badge_text ? 230 : 250;
  if (acc && hl.includes(acc)) {
    // Measure each part separately to position correctly
    const pre = hl.slice(0, hl.indexOf(acc));
    const post = hl.slice(hl.indexOf(acc) + acc.length);
    const wPre = ctx.measureText(pre).width;
    const wAcc = ctx.measureText(acc).width;
    const wPost = ctx.measureText(post).width;
    const total = wPre + wAcc + wPost;
    let x = (S - total) / 2;
    ctx.fillStyle = c.text_primary; ctx.fillText(pre, x + wPre/2, hlY); x += wPre;
    ctx.fillStyle = c.accent;
    ctx.font = `900 italic ${fontSize}px 'Playfair Display',Georgia,serif`;
    ctx.fillText(acc, x + wAcc/2, hlY); x += wAcc;
    ctx.font = `900 ${fontSize}px 'Playfair Display',Georgia,serif`;
    ctx.fillStyle = c.text_primary; ctx.fillText(post, x + wPost/2, hlY);
  } else {
    ctx.fillStyle = c.text_primary; ctx.fillText(hl, S/2, hlY);
  }
  ctx.restore();

  // Divider
  const dy = hlY + 50;
  ctx.save(); ctx.globalAlpha=0.45; ctx.strokeStyle=c.accent; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(S*0.2,dy); ctx.lineTo(S*0.8,dy); ctx.stroke();
  ctx.globalAlpha=1; ctx.fillStyle=c.accent;
  ctx.beginPath(); ctx.arc(S/2,dy,4,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Tagline
  if (data.tagline) {
    ctx.save(); ctx.font='300 28px Montserrat,sans-serif'; ctx.fillStyle=c.text_secondary;
    ctx.globalAlpha=0.8; ctx.textAlign='center'; ctx.letterSpacing='4px';
    ctx.fillText(data.tagline.toUpperCase(), S/2, dy+50);
    ctx.restore();
  }

  // Offer pill
  if (data.offer_text) {
    const ot = data.offer_text.toUpperCase();
    ctx.save(); ctx.font='700 24px Montserrat,sans-serif'; ctx.textAlign='center';
    ctx.letterSpacing='2px';
    const pw = ctx.measureText(ot).width + 64;
    const px = (S-pw)/2, py = dy + 90;
    ctx.fillStyle=c.accent; ctx.beginPath(); ctx.roundRect(px,py,pw,48,3); ctx.fill();
    // Ensure pill text contrasts — pick dark or light based on accent brightness
    const pr=parseInt(c.accent.slice(1,3)||'d4',16);
    const pg=parseInt(c.accent.slice(3,5)||'af',16);
    const pb=parseInt(c.accent.slice(5,7)||'37',16);
    const luminance=(0.299*pr+0.587*pg+0.114*pb)/255;
    ctx.fillStyle = luminance > 0.55 ? '#1a0a00' : '#ffffff';
    ctx.fillText(ot, S/2, py+32);
    ctx.restore();
  }

  // Ornamental center design — fills lower half beautifully
  const centerY = S * 0.65;
  ctx.save();
  ctx.globalAlpha = 0.08; ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
  for (const rr of [80, 120, 160]) {
    ctx.beginPath(); ctx.arc(S/2, centerY, rr, 0, Math.PI*2); ctx.stroke();
  }
  ctx.restore();

  // Mandala petal lines
  ctx.save(); ctx.globalAlpha = 0.1; ctx.strokeStyle = c.accent; ctx.lineWidth = 1;
  for (let i=0; i<12; i++) {
    const ang = (i/12)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(S/2+Math.cos(ang)*40, centerY+Math.sin(ang)*40);
    ctx.lineTo(S/2+Math.cos(ang)*150, centerY+Math.sin(ang)*150);
    ctx.stroke();
  }
  ctx.restore();

  // Center jewel glow
  ctx.save();
  const jewel = ctx.createRadialGradient(S/2,centerY,0,S/2,centerY,30);
  jewel.addColorStop(0, c.accent); jewel.addColorStop(0.5, c.accent+'66'); jewel.addColorStop(1,'transparent');
  ctx.globalAlpha=0.5; ctx.fillStyle=jewel;
  ctx.beginPath(); ctx.arc(S/2,centerY,30,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Subtle hint text
  ctx.save(); ctx.font='300 16px Montserrat,sans-serif'; ctx.fillStyle=c.accent;
  ctx.globalAlpha=0.25; ctx.textAlign='center'; ctx.letterSpacing='1px';
  ctx.fillText('Add TOGETHER_API_KEY for AI photo', S/2, centerY+210);
  ctx.restore();

  // Sparkle stars
  ctx.save(); ctx.fillStyle=c.accent;
  const stars=[[70,180],[S-65,190],[60,S-170],[S-70,S-180],[70,S/2],[S-70,S/2-30],[S/2-120,80],[S/2+110,90],[S/2-90,S-80],[S/2+100,S-90]];
  stars.forEach(([x,y])=>{
    const a=0.3+Math.random()*0.6, r=2.5;
    ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=a*0.7;
    ctx.fillRect(x-7,y-0.7,14,1.4); ctx.fillRect(x-0.7,y-7,1.4,14);
  });
  ctx.restore();

  // Brand name footer
  ctx.save(); ctx.font='400 22px Montserrat,sans-serif'; ctx.fillStyle=c.text_secondary;
  ctx.globalAlpha=0.5; ctx.textAlign='center'; ctx.letterSpacing='5px';
  ctx.fillText(businessName.toUpperCase(), S/2, S-42);
  ctx.restore();
}

function PostCanvas({ data, businessName, onReady }: {
  data: PostData; businessName: string; onReady?: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    drawPost(canvasRef.current, data, businessName);
    if (onReady) onReady(canvasRef.current.toDataURL('image/png'));
  }, [data, businessName, onReady]);

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `${businessName.replace(/\s+/g,'_')}_post.png`;
    a.click();
  };

  return (
    <div className="relative group">
      <canvas ref={canvasRef} className="w-full rounded-2xl" style={{ aspectRatio:'1/1', display:'block' }} />
      <button onClick={download}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs bg-black/70 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-xl hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100">
        <Download size={11} />Save PNG (1080×1080)
      </button>
    </div>
  );
}

function PostStudioInner() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const [userPlan, setUserPlan] = useState<string|null>(null);
  const [postsUsed, setPostsUsed] = useState(0);
  const [planLoading, setPlanLoading] = useState(true);
  const [expertMode, setExpertMode] = useState(false);
  const [form, setForm] = useState({
    businessName:'', category:'', productDescription:'',
    targetAudience:'', platform:'Instagram', postType:'Feed Post',
    tone:'Luxury & Premium', goal:'Drive Sales', offer:'', customPrompt:'',
  });
  const [generating, setGenerating] = useState(false);

  const [result, setResult] = useState<PostData|null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string|null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'post'|'caption'|'comments'|'replies'>('post');
  const [copied, setCopied] = useState<string|null>(null);

  useEffect(() => {
    if (authLoading || !user) { if (!authLoading) setPlanLoading(false); return; }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db,'users',user.uid));
        if (snap.exists() && snap.data().plan) { setUserPlan(snap.data().plan); setPostsUsed(snap.data().postsThisMonth||0); setPlanLoading(false); return; }
      } catch { /**/ }
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const q = query(collection(db,'orders'),where('userId','==',user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const orders: {planId:string}[] = [];
          snap.forEach(d => orders.push(d.data() as {planId:string}));
          const rank: Record<string,number> = {pro:3,growth:2,starter:1};
          const best = orders.reduce((a,b)=>(rank[b.planId]||0)>(rank[a.planId]||0)?b:a);
          if (best.planId) { setUserPlan(best.planId); setPlanLoading(false); return; }
        }
      } catch { /**/ }
      const pd = localStorage.getItem(`user_plan_${user.uid}`);
      if (pd) { try { const p=JSON.parse(pd); setUserPlan(p.plan||null); } catch { /**/ } }
      setPlanLoading(false);
    };
    load();
  }, [user, authLoading]);

  const planLimit = userPlan==='pro' ? Infinity : userPlan==='growth' ? 15 : 0;
  const postsLeft = planLimit===Infinity ? Infinity : Math.max(0, planLimit-postsUsed);
  const canGenerate = planLimit===Infinity || postsLeft>0;

  const copy = (text:string, key:string) => {
    navigator.clipboard.writeText(text); setCopied(key); toast('Copied!');
    setTimeout(()=>setCopied(null), 2000);
  };

  const handleCanvasReady = useCallback((dataUrl: string) => {
    setPreviewDataUrl(dataUrl);
  }, []);

  const generate = async () => {
    if (!canGenerate) return;
    if (!expertMode && (!form.businessName || !form.productDescription)) {
      setError('Business name and description are required.'); return;
    }
    if (expertMode && !form.customPrompt) {
      setError('Please enter your creative brief in the prompt box.'); return;
    }
    setError(''); setGenerating(true); setResult(null); setPreviewDataUrl(null); setActiveTab('post');
    try {
      const res = await fetch('/api/generate-post', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const ct = res.headers.get('content-type')||'';
      if (!ct.includes('application/json')) throw new Error('Server error — check GROQ_API_KEY in .env.local');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast('Post generated! ✨','ai');
      if (user && planLimit!==Infinity) {
        try { await setDoc(doc(db,'users',user.uid),{postsThisMonth:increment(1),updatedAt:serverTimestamp()},{merge:true}); setPostsUsed(p=>p+1); } catch { /**/ }
      }
    } catch(e:unknown) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setGenerating(false); }
  };

  // Auth handled by AuthGuard — no blocking spinner needed

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5"><Lock size={20} className="text-violet-400"/></div>
        <h2 className="text-2xl font-light text-white mb-3" style={{fontFamily:'Cormorant Garamond,serif'}}>Sign in required</h2>
        <p className="text-slate-500 text-sm font-light mb-7">Post Studio is for Growth and Pro plan users.</p>
        <button onClick={()=>router.push('/auth')} className="w-full py-3.5 rounded-2xl text-sm font-light text-white hover:opacity-85 transition-opacity" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>Sign In / Sign Up</button>
      </div>
    </main>
  );

  if (!userPlan||userPlan==='starter') return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6"><Sparkles size={22} className="text-amber-400"/></div>
        <h2 className="text-3xl font-light text-white mb-3" style={{fontFamily:'Cormorant Garamond,serif'}}>Post Studio</h2>
        <p className="text-slate-500 text-sm font-light mb-6">{userPlan==='starter'?'Upgrade from Starter to access Post Studio.':'Post Studio requires Growth or Pro plan.'}</p>
        <div className="bg-[#16161f] border border-white/[0.06] rounded-2xl p-5 mb-6 text-left space-y-3">
          {[{plan:'Growth ₹2,999',limit:'15 posts/month',color:'#7c3aed'},{plan:'Pro ₹7,999',limit:'Unlimited posts',color:'#f59e0b'}].map(({plan,limit,color})=>(
            <div key={plan} className="flex items-center justify-between text-sm">
              <span className="font-light text-white">{plan}</span>
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{background:`${color}15`,color}}>{limit}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>router.push('/')} className="w-full py-3.5 rounded-2xl text-sm font-light text-white hover:opacity-85 transition-opacity" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
          <Zap size={13} className="inline mr-2"/>Upgrade Plan
        </button>
        <p className="text-xs text-slate-600 mt-3 font-light">Already paid? Try refreshing the page.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 top-[-150px] right-[-100px]"/>
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/8 border border-violet-500/15 rounded-full px-4 py-1.5 text-xs text-violet-400 font-light tracking-widest uppercase mb-4">
              <Sparkles size={11}/> Post Studio
            </div>
            <h1 className="text-5xl font-light text-white tracking-wide mb-2" style={{fontFamily:'Cormorant Garamond,serif'}}>Create a Post</h1>
            <p className="text-slate-500 text-sm font-light">AI generates a stunning visual post — download and post directly to Instagram.</p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
            {/* Mode toggle */}
            <button onClick={()=>setExpertMode(!expertMode)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-all font-light"
              style={{ background: expertMode ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', borderColor: expertMode ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)', color: expertMode ? '#a78bfa' : '#475569' }}>
              {expertMode ? <Eye size={11}/> : <EyeOff size={11}/>}
              {expertMode ? 'Expert Mode ON' : 'Expert Mode'}
            </button>
            <div className="text-right">
              <div className="text-xs text-slate-600 font-light uppercase tracking-widest mb-1">Posts this month</div>
              {planLimit===Infinity ? (
                <div className="text-2xl font-light" style={{fontFamily:'Cormorant Garamond,serif',color:'#10b981'}}>Unlimited</div>
              ) : (
                <><div className="text-2xl font-light text-white" style={{fontFamily:'Cormorant Garamond,serif'}}>
                  <span style={{color:postsLeft<=3?'#ef4444':'#10b981'}}>{postsLeft}</span>
                  <span className="text-slate-600 text-lg"> / {planLimit}</span>
                </div>
                <div className="w-28 h-1 bg-white/[0.06] rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${(postsUsed/planLimit)*100}%`,background:postsLeft<=3?'#ef4444':'#10b981'}}/>
                </div></>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_440px] gap-6 items-start">

          {/* Form */}
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-7 space-y-4">
            <h2 className="text-lg font-light text-white" style={{fontFamily:'Cormorant Garamond,serif'}}>
              {expertMode ? 'Expert Prompt' : 'Post details'}
            </h2>

            {expertMode ? (
              /* Expert mode: single prompt box */
              <div>
                <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">
                  Your full creative brief — be as detailed as you want
                </label>
                <textarea rows={14}
                  placeholder={`Example:\n\nYou are a premium luxury jewellery brand strategist.\nCreate an Instagram post for Sri Lakshmi Jewellers, Nellore.\nOccasion: Bridal Collection Launch.\nTone: Luxury, emotional, aspirational.\nImage: South Indian bride with gold temple jewellery, soft warm lighting.\nCaption style: Storytelling, 2-3 sentences, elegant emojis only.\nOffer: No discounts — premium positioning only.`}
                  value={form.customPrompt}
                  onChange={e=>setForm({...form,customPrompt:e.target.value,businessName:form.businessName||'Brand'})}
                  className="w-full bg-white/[0.02] border border-violet-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/40 text-sm font-light resize-none transition-colors"
                  style={{minHeight:280}}/>
                <p className="text-xs text-slate-600 font-light mt-2">The AI will follow your prompt exactly — image style, tone, caption format, everything.</p>
                {/* Still need business name for the canvas footer */}
                <div className="mt-4">
                  <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Business name (for post footer)</label>
                  <input type="text" placeholder="e.g. Sri Lakshmi Jewellers" value={form.businessName}
                    onChange={e=>setForm({...form,businessName:e.target.value})}
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light"/>
                </div>
              </div>
            ) : (
              /* Standard mode: full form */
              <>
                {[
                  {label:'Business / Brand name *',key:'businessName',placeholder:'e.g. Sri Lakshmi Jewellers, TechLaunch...'},
                  {label:'What are you promoting? *',key:'productDescription',placeholder:'Describe your product, service or offer in detail...',textarea:true},
                  {label:'Target audience',key:'targetAudience',placeholder:'e.g. Women 25–45 interested in weddings and gold...'},
                  {label:'Offer or promotion',key:'offer',placeholder:'e.g. 10% off, New collection, Free consultation...'},
                ].map(({label,key,placeholder,textarea})=>(
                  <div key={key}>
                    <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">{label}</label>
                    {textarea
                      ? <textarea rows={2} placeholder={placeholder} value={form[key as keyof typeof form]} onChange={e=>setForm({...form,[key]:e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light resize-none"/>
                      : <input type="text" placeholder={placeholder} value={form[key as keyof typeof form]} onChange={e=>setForm({...form,[key]:e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light"/>
                    }
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[{label:'Platform',key:'platform',options:PLATFORMS},{label:'Post type',key:'postType',options:POST_TYPES},{label:'Tone',key:'tone',options:TONES},{label:'Goal',key:'goal',options:GOALS}].map(({label,key,options})=>(
                    <div key={key}>
                      <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">{label}</label>
                      <div className="relative">
                        <select value={form[key as keyof typeof form]} onChange={e=>setForm({...form,[key]:e.target.value})} className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-3 py-3 text-white focus:outline-none text-xs font-light appearance-none">
                          {options.map(o=><option key={o} value={o} className="bg-[#16161f]">{o}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">
                    Visual & style instructions <span className="normal-case text-slate-700">(optional — overrides AI defaults)</span>
                  </label>
                  <textarea rows={3}
                    placeholder="e.g. Use dark luxury style with gold accents. Show a South Indian bride wearing temple jewellery. Warm cinematic lighting, rich silk saree, translucent background."
                    value={form.customPrompt} onChange={e=>setForm({...form,customPrompt:e.target.value})}
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light resize-none"/>
                </div>
              </>
            )}

            {error && <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-xs font-light"><AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>{error}</div>}
            {!canGenerate && <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-3 text-amber-400 text-xs font-light"><Lock size={13} className="mt-0.5 flex-shrink-0"/>You&apos;ve used all {planLimit} posts this month.</div>}

            <button onClick={generate} disabled={generating||!canGenerate}
              className="w-full py-4 rounded-2xl text-sm font-light text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 hover:opacity-85"
              style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
              {generating ? <><Loader2 size={15} className="animate-spin"/>Generating your post...</> : <><Sparkles size={15}/>Generate Post</>}
            </button>
          </div>

          {/* Result panel */}
          <div className="space-y-4">
            {generating && (
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 space-y-3">
                <div className="w-full aspect-square rounded-2xl shimmer"/>
                <div className="w-3/4 h-3 rounded-full shimmer"/><div className="w-full h-3 rounded-full shimmer"/><div className="w-1/2 h-3 rounded-full shimmer"/>
              </div>
            )}

            {!result && !generating && (
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-10 text-center min-h-[300px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center mb-4"><Sparkles size={26} className="text-violet-400/40"/></div>
                <p className="text-xl font-light text-white/30" style={{fontFamily:'Cormorant Garamond,serif'}}>Your post will appear here</p>
                <p className="text-slate-700 text-xs font-light mt-1">A stunning visual crafted for your brand</p>
              </div>
            )}

            {result && (
              <div className="animate-slide-up space-y-4">
                {/* Tabs */}
                <div className="flex bg-[#16161f] border border-white/[0.06] rounded-2xl p-1 gap-1">
                  {([{key:'post',label:'Post Visual'},{key:'caption',label:'Caption'},{key:'comments',label:'Comments'},{key:'replies',label:'Replies'}] as {key:typeof activeTab;label:string}[]).map(({key,label})=>(
                    <button key={key} onClick={()=>setActiveTab(key)} className="flex-1 text-xs font-light py-2.5 rounded-xl transition-all"
                      style={{background:activeTab===key?'#7c3aed':'transparent',color:activeTab===key?'#fff':'#475569'}}>{label}</button>
                  ))}
                </div>

                {activeTab==='post' && (
                  <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-light text-slate-400 uppercase tracking-widest">{(result.visual_style||'').replace(/_/g,' ')} style</span>
                        <span className="text-xs text-slate-600 font-light ml-3">1080×1080 · Instagram ready</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {previewDataUrl && (
                          <button onClick={()=>setShowPreview(!showPreview)}
                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-light transition-colors">
                            <Eye size={10}/>{showPreview?'Hide':'Full Preview'}
                          </button>
                        )}
                        <button onClick={generate} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-light transition-colors"><RefreshCw size={10}/>Redo</button>
                      </div>
                    </div>

                    {/* Full preview modal */}
                    {showPreview && previewDataUrl && (
                      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={()=>setShowPreview(false)}>
                        <div className="max-w-lg w-full" onClick={e=>e.stopPropagation()}>
                          <img src={previewDataUrl} alt="Post preview" className="w-full rounded-2xl shadow-2xl"/>
                          <div className="flex gap-3 mt-4">
                            <a href={previewDataUrl} download={`${form.businessName.replace(/\s+/g,'_')}_post.png`}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-light text-white" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                              <Download size={13}/>Download PNG
                            </a>
                            <button onClick={()=>setShowPreview(false)} className="px-5 py-3 rounded-xl text-sm font-light text-slate-400 border border-white/[0.08] hover:border-white/[0.15] transition-all">Close</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.imageUrl ? (
                      <div className="relative group rounded-2xl overflow-hidden">
                        <img src={result.imageUrl} alt="AI generated post" className="w-full aspect-square object-cover"/>
                        <a href={result.imageUrl} download="post.jpg" target="_blank" rel="noopener noreferrer"
                          className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs bg-black/70 border border-white/20 text-white px-3 py-1.5 rounded-xl hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100">
                          <Download size={11}/>Download AI Image
                        </a>
                      </div>
                    ) : (
                      <PostCanvas data={result} businessName={form.businessName||'Your Brand'} onReady={handleCanvasReady}/>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.04]">
                        <div className="text-xs text-amber-400 font-light uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={9}/>Best time</div>
                        <p className="text-xs text-slate-300 font-light">{result.best_time}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.04]">
                        <div className="text-xs text-pink-400 font-light uppercase tracking-widest mb-1 flex items-center gap-1"><MessageSquare size={9}/>Story idea</div>
                        <p className="text-xs text-slate-300 font-light" style={{display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{result.story_idea}</p>
                      </div>
                    </div>

                    {/* ── Copy & Post Guide ── */}
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/[0.06]"
                      style={{ background: 'linear-gradient(135deg, rgba(225,48,108,0.06), rgba(131,58,180,0.06))' }}>
                      
                      {/* Header */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                            <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-light text-white">Post to Instagram</div>
                          <div className="text-xs font-light text-slate-500">3-step guide — takes 60 seconds</div>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        {/* Step 1 — Save image */}
                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d)' }}>1</div>
                            <span className="text-xs font-light text-slate-300 uppercase tracking-widest">Save your post image</span>
                          </div>
                          {result.imageUrl ? (
                            <a href={result.imageUrl} download="instagram_post.jpg" target="_blank" rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-light text-white transition-all hover:opacity-85"
                              style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d)' }}>
                              <Download size={12} />Download AI Image (1:1 ready)
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                                if (!canvas) return;
                                const a = document.createElement('a');
                                a.href = canvas.toDataURL('image/png');
                                a.download = `${form.businessName.replace(/\s+/g,'_')}_post.png`;
                                a.click();
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-light text-white transition-all hover:opacity-85"
                              style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d)' }}>
                              <Download size={12} />Download Post Image (1080×1080 PNG)
                            </button>
                          )}
                        </div>

                        {/* Step 2 — Copy caption */}
                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #fd1d1d, #fcb045)' }}>2</div>
                              <span className="text-xs font-light text-slate-300 uppercase tracking-widest">Copy caption + hashtags</span>
                            </div>
                            <button
                              onClick={() => {
                                const full = result.caption + '\n\n' + result.hashtags.join(' ');
                                navigator.clipboard.writeText(full);
                                toast('Caption copied! ✓');
                              }}
                              className="flex items-center gap-1.5 text-xs font-light px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-85"
                              style={{ background: 'rgba(252,180,69,0.2)', border: '1px solid rgba(252,180,69,0.3)', color: '#fcb045' }}>
                              <Copy size={10} />Copy All
                            </button>
                          </div>
                          <div className="bg-black/20 rounded-xl p-3 max-h-28 overflow-y-auto">
                            <p className="text-xs text-slate-300 font-light leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                            <p className="text-xs text-violet-400 font-light mt-2 leading-relaxed">{result.hashtags.join(' ')}</p>
                          </div>
                        </div>

                        {/* Step 3 — Open Instagram */}
                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.04]">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #fcb045, #833ab4)' }}>3</div>
                            <span className="text-xs font-light text-slate-300 uppercase tracking-widest">Open Instagram & post</span>
                          </div>
                          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-light text-white transition-all hover:opacity-85 mb-2"
                            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                              <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                            </svg>
                            Open Instagram
                          </a>
                          <p className="text-xs text-slate-600 font-light text-center">Upload the saved image → paste the copied caption → post</p>
                        </div>

                        {/* Best time reminder */}
                        <div className="flex items-center gap-2 px-1">
                          <Clock size={11} className="text-amber-400 flex-shrink-0"/>
                          <p className="text-xs text-slate-500 font-light">
                            Best time to post: <span className="text-amber-400">{result.best_time}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                )}

                {activeTab==='caption' && (
                  <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-light text-slate-500 uppercase tracking-widest">Full Caption</span>
                      <button onClick={()=>copy(result.caption+'\n\n'+result.hashtags.join(' '),'caption')}
                        className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5 text-slate-400 hover:bg-white/[0.07] transition-all font-light">
                        {copied==='caption'?<><Check size={11} className="text-green-400"/>Copied</>:<><Copy size={11}/>Copy all</>}
                      </button>
                    </div>
                    <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04] mb-5">
                      <p className="text-slate-200 text-sm font-light leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600 font-light uppercase tracking-widest">Hashtags</span>
                      <button onClick={()=>copy(result.hashtags.join(' '),'hashtags')} className="text-xs text-slate-600 hover:text-slate-400 font-light transition-colors">{copied==='hashtags'?'✓ Copied':'Copy all'}</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.hashtags.map((h,i)=>(
                        <span key={i} onClick={()=>copy(h,`h${i}`)} className="text-xs bg-violet-500/8 text-violet-400 border border-violet-500/15 rounded-full px-2.5 py-1 font-light cursor-pointer hover:bg-violet-500/15 transition-colors">{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab==='comments' && (
                  <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                    <p className="text-xs text-slate-500 font-light mb-5 leading-relaxed">Post this as <strong className="text-white font-normal">your first comment</strong> within 5 minutes of publishing — signals activity to the algorithm.</p>
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <p className="text-sm text-slate-200 font-light leading-relaxed flex-1">{result.first_comment}</p>
                        <button onClick={()=>copy(result.first_comment,'fc')} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">{copied==='fc'?<Check size={12} className="text-green-400"/>:<Copy size={12}/>}</button>
                      </div>
                    </div>
                    <div className="bg-amber-500/6 border border-amber-500/12 rounded-2xl p-4">
                      <p className="text-xs text-amber-400/80 font-light leading-relaxed">Posting your own comment within 5 minutes can boost initial reach by 30–40% by triggering early engagement signals.</p>
                    </div>
                  </div>
                )}

                {activeTab==='replies' && (
                  <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                    <p className="text-xs text-slate-500 font-light mb-5">Ready-made replies for common DMs and comments. Copy and personalise before sending.</p>
                    <div className="space-y-4">
                      {(result.reply_templates||[]).map((rt,i)=>(
                        <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                          <p className="text-xs text-slate-500 font-light uppercase tracking-widest mb-1">When someone says</p>
                          <p className="text-sm text-slate-400 font-light italic mb-3">&ldquo;{rt.trigger}&rdquo;</p>
                          <div className="h-px bg-white/[0.04] mb-3"/>
                          <div className="flex items-start gap-3">
                            <p className="text-sm text-slate-200 font-light leading-relaxed flex-1">{rt.reply}</p>
                            <button onClick={()=>copy(rt.reply,`r${i}`)} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5">{copied===`r${i}`?<Check size={12} className="text-green-400"/>:<Copy size={12}/>}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PostStudioPage() {
  return <AuthGuard><PostStudioInner/></AuthGuard>;
}
