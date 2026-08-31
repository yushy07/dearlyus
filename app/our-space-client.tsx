'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Check, Copy, Download, Heart, Sparkles, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const moments = [
  { date: 'AUG 18', title: 'The rainy-day ramen run', note: 'You ordered the brave one. I absolutely did not.', tone: 'coral' },
  { date: 'AUG 11', title: 'A note from 2:14am', note: 'Saved because some messages deserve a home.', tone: 'lilac' },
  { date: 'JUL 29', title: 'Seventy-three tiny Sundays', note: 'Our newest made-up anniversary.', tone: 'lime' },
];

export default function Home() {
  const [panel, setPanel] = useState<'invite'|'ritual'|'quiz'|'photo'|'draw'|'moment'|'letter'|null>(null);
  const [savedMoments, setSavedMoments] = useState(moments);
  const [toast, setToast] = useState('');
  const [ritualAnswer, setRitualAnswer] = useState('');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File|null>(null);
  const [invite, setInvite] = useState({code:'MOON-42',token:''});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => { fetch('/api/moments').then(r=>r.ok?r.json() as Promise<{moments:Array<{title:string;note:string;happenedAt:string}>}>:null).then(data=>{if(data?.moments?.length)setSavedMoments(data.moments.map((m,index)=>({date:new Date(m.happenedAt).toLocaleDateString('en',{month:'short',day:'2-digit'}).toUpperCase(),title:m.title,note:m.note,tone:['coral','lilac','lime'][index%3]}))) }).catch(()=>{}) },[]);
  const openInvite = async () => { setPanel('invite'); try{const response=await fetch('/api/invites',{method:'POST'});if(response.ok){const data=await response.json() as {code:string;token:string};setInvite({code:data.code,token:data.token})}}catch{} };
  const sendPhoto = async () => { if(!photoFile)return;const form=new FormData();form.append('file',photoFile);try{await fetch('/api/media',{method:'POST',body:form})}catch{}setPanel(null);celebrate('Photo locked — waiting for Alex') };
  const startActivity = (activityKey:'know-me'|'photo-quest'|'draw-together',next:'quiz'|'photo'|'draw') => { setPanel(next);fetch('/api/activities',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({activityKey})}).catch(()=>{}) };

  const celebrate = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const addMoment = (form: FormData) => {
    const titleValue=form.get('title'),noteValue=form.get('note');const title=typeof titleValue==='string'?titleValue.trim():'';
    const note=typeof noteValue==='string'?noteValue.trim():'';
    if (!title) return;
    setSavedMoments([{ date: 'TODAY', title, note: note || 'A new little thing worth keeping.', tone: 'coral' }, ...savedMoments]);
    setPanel(null); celebrate('Moment tucked into your storybook ✦');
    fetch('/api/moments', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ title, note }) }).catch(() => {});
  };
  const beginDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true; const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect(), ctx = c.getContext('2d'); if (!ctx) return;
    ctx.beginPath(); ctx.moveTo((event.clientX-r.left)*(c.width/r.width),(event.clientY-r.top)*(c.height/r.height));
  };
  const moveDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return; const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect(), ctx = c.getContext('2d'); if (!ctx) return;
    ctx.lineWidth=7;ctx.lineCap='round';ctx.strokeStyle='#11152c';ctx.lineTo((event.clientX-r.left)*(c.width/r.width),(event.clientY-r.top)*(c.height/r.height));ctx.stroke();
  };
  const downloadDrawing = () => { const c=canvasRef.current; if(!c)return; const a=document.createElement('a');a.download='our-space-drawing.png';a.href=c.toDataURL();a.click();celebrate('Your masterpiece is saved'); };

  return (
    <>
    <main className="app-shell">
      <aside className="rail">
        <a className="brand" href="#top" aria-label="Our Space home"><span className="brand-mark">OS</span><span>our space</span></a>
        <nav aria-label="Primary navigation">
          <a className="nav-link active" href="#tonight">Tonight <span>01</span></a>
          <a className="nav-link" href="#storybook">Storybook <span>24</span></a>
          <a className="nav-link" href="#rituals">Rituals <span>03</span></a>
          <a className="nav-link" href="#together">Together <span>→</span></a>
        </nav>
        <div className="partner-card"><span className="eyebrow">YOUR LITTLE WORLD</span><div className="avatar-pair"><span>Y</span><span>A</span></div><strong>You + Alex</strong><small>Partner is here · <i /> live</small></div>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar"><div><span className="status-dot" /> Sunday, 8:42 PM · both here</div><button className="invite-button" onClick={openInvite}>Invite to this moment <ArrowUpRight size={16} /></button></header>
        <div className="content-grid">
          <section className="main-column" id="tonight">
            <div className="hero-copy"><span className="eyebrow">TONIGHT, IN YOUR SPACE</span><h1>Make a small night<br/><em>worth keeping.</em></h1><p>A private place to play, remember, and leave little things for each other.</p></div>
            <article className="ritual-card" id="rituals">
              <div className="ritual-topline"><span>WEEKLY RITUAL · 07</span><span>8 MIN</span></div>
              <div className="ritual-body"><div><span className="sticker">NO OVERTHINKING</span><h2>What felt like us this week?</h2><p>Answer privately. Your notes open together when you’re both ready.</p></div><button className="primary-button" onClick={() => setPanel('ritual')}>Answer together <ArrowUpRight size={18}/></button></div>
              <div className="ritual-progress"><span>You answered</span><span className="waiting">Waiting for Alex</span></div>
            </article>

            <section className="section-block" id="together">
              <div className="section-heading"><div><span className="eyebrow">TOGETHER MODE</span><h2>Pick your kind of chaos.</h2></div><span className="live-pill">● ALEX IS READY</span></div>
              <div className="game-grid">
                <article className="game-card quiz"><span className="game-number">01</span><Sparkles/><h3>Know Me</h3><p>Guess their answer, lock it in, reveal together.</p><button onClick={() => {setQuizAnswer('');setQuizRevealed(false);startActivity('know-me','quiz')}}>Start a round →</button></article>
                <article className="game-card photo"><span className="game-number">02</span><span className="game-symbol">◎</span><h3>Photo Quest</h3><p>Race the clock. Find it, frame it, send it.</p><button onClick={() => startActivity('photo-quest','photo')}>Get a mission →</button></article>
                <article className="game-card draw"><span className="game-number">03</span><span className="game-symbol">✎</span><h3>Draw Together</h3><p>One prompt, one canvas, two very different ideas.</p><button onClick={() => startActivity('draw-together','draw')}>Open canvas →</button></article>
              </div>
            </section>

            <section className="section-block" id="storybook">
              <div className="section-heading"><div><span className="eyebrow">YOUR STORYBOOK</span><h2>Recently, in your world.</h2></div><button className="text-button" onClick={() => setPanel('moment')}>Add a moment +</button></div>
              <div className="timeline">{savedMoments.map((moment, index) => <article className={`moment ${moment.tone}`} key={`${moment.title}-${index}`}><span>{moment.date}</span><div><h3>{moment.title}</h3><p>{moment.note}</p></div><Heart size={18}/></article>)}</div>
            </section>
          </section>

          <aside className="right-column">
            <article className="countdown-card"><span className="eyebrow">NEXT LITTLE THING</span><strong>Friday date</strong><div className="countdown"><span><b>04</b>DAYS</span><span><b>18</b>HRS</span><span><b>32</b>MIN</span></div><p>“Street-food roulette”<br/>planned by Alex</p></article>
            <article className="letter-card"><span className="eyebrow">SEALED FOR LATER</span><div className="stamp">✦</div><h3>A letter from last winter</h3><p>Opens on 24 December 2026</p><button onClick={() => setPanel('letter')}>Write another letter →</button></article>
            <blockquote>“Let’s never become too grown-up for a made-up anniversary.”<footer>— YOU, 29 JUL</footer></blockquote>
          </aside>
        </div>
      </section>
    </main>

    <Dialog open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
      <DialogContent className="product-dialog" showCloseButton>
        {panel === 'invite' && <><DialogHeader><DialogTitle>Bring your person in</DialogTitle><DialogDescription>Either path joins the same private space. This link expires after one use.</DialogDescription></DialogHeader><div className="invite-code"><span>YOUR JOIN CODE</span><strong>{invite.code}</strong></div><button className="modal-button" onClick={() => {void navigator.clipboard?.writeText(invite.code);celebrate('Join code copied')}}><Copy/> Copy join code</button><button className="modal-button secondary" onClick={() => {void navigator.clipboard?.writeText(`${location.origin}/join/${invite.token||invite.code}`);celebrate('Private link copied')}}><Copy/> Copy one-use link</button></>}
        {panel === 'ritual' && <><DialogHeader><DialogTitle>What felt like us this week?</DialogTitle><DialogDescription>Your answer stays folded until both of you are ready.</DialogDescription></DialogHeader><Textarea className="big-input" value={ritualAnswer} onChange={e=>setRitualAnswer(e.target.value)} placeholder="The tiny thing I keep thinking about is…"/><button className="modal-button" disabled={!ritualAnswer.trim()} onClick={()=>{setPanel(null);celebrate('Answer sealed — waiting for Alex')}}><Check/> Seal my answer</button></>}
        {panel === 'quiz' && <><DialogHeader><DialogTitle>Know Me · round one</DialogTitle><DialogDescription>What would Alex choose for the perfect surprise evening?</DialogDescription></DialogHeader><div className="answer-grid">{['Tiny jazz bar','Midnight picnic','Arcade rematch','Cook together'].map(answer=><button className={quizAnswer===answer?'selected':''} key={answer} onClick={()=>setQuizAnswer(answer)}>{answer}</button>)}</div>{!quizRevealed?<button className="modal-button" disabled={!quizAnswer} onClick={()=>setQuizRevealed(true)}>Lock it in & reveal</button>:<div className="reveal-card"><span>IT’S A MATCH ✦</span><strong>You both chose “{quizAnswer}”</strong><button onClick={()=>{setPanel(null);celebrate('Match saved to your storybook')}}>Keep this result →</button></div>}</>}
        {panel === 'photo' && <><DialogHeader><DialogTitle>Photo Quest · 02:00</DialogTitle><DialogDescription>Mission: find the smallest thing in your room that reminds you of each other.</DialogDescription></DialogHeader><label className="upload-zone"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f){setPhotoFile(f);setPhotoUrl(URL.createObjectURL(f))}}}/>{photoUrl?<Image unoptimized width={640} height={420} src={photoUrl} alt="Your quest submission preview"/>:<><Upload/><strong>Drop your evidence here</strong><span>JPG, PNG or WebP · max 8 MB</span></>}</label><button className="modal-button" disabled={!photoFile} onClick={sendPhoto}>Send to the room</button></>}
        {panel === 'draw' && <><DialogHeader><DialogTitle>Draw Together · open canvas</DialogTitle><DialogDescription>Prompt: draw the home you’d build on the moon. Your partner’s strokes appear in coral.</DialogDescription></DialogHeader><canvas ref={canvasRef} className="draw-canvas" width="700" height="420" onPointerDown={beginDraw} onPointerMove={moveDraw} onPointerUp={()=>drawing.current=false} onPointerLeave={()=>drawing.current=false}/><div className="dialog-actions"><button className="modal-button secondary" onClick={()=>{const c=canvasRef.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height)}}>Clear</button><button className="modal-button" onClick={downloadDrawing}><Download/> Save artwork</button></div></>}
        {panel === 'moment' && <form action={addMoment}><DialogHeader><DialogTitle>Add a little moment</DialogTitle><DialogDescription>No performance. Just something you’ll want to find again.</DialogDescription></DialogHeader><label htmlFor="moment-title">Title</label><Input id="moment-title" name="title" required placeholder="The five-minute kitchen dance"/><label htmlFor="moment-note">What happened?</label><Textarea id="moment-note" name="note" placeholder="A sentence is enough…"/><label htmlFor="moment-photo">Photo (optional)</label><Input id="moment-photo" name="photo" type="file" accept="image/*"/><button className="modal-button" type="submit">Tuck it into the storybook</button></form>}
        {panel === 'letter' && <form onSubmit={e=>{e.preventDefault();setPanel(null);celebrate('Letter sealed for the future ✦')}}><DialogHeader><DialogTitle>A note for later</DialogTitle><DialogDescription>Write it now. We’ll keep it closed until the date you choose.</DialogDescription></DialogHeader><Textarea className="big-input" required placeholder="Dear future us…"/><label htmlFor="letter-date">Open on</label><Input id="letter-date" type="date" required min="2026-09-01"/><button className="modal-button" type="submit">Seal this letter</button></form>}
      </DialogContent>
    </Dialog>
    {toast && <output className="toast">{toast}</output>}
    </>
  );
}
