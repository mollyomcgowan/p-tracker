import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const STORAGE_KEY = "poo_tracker_v1";
async function loadData() {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : {}; }
  catch { return {}; }
}
async function saveData(d) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fromKey = s => { const [y,m,dd]=s.split("-"); return new Date(+y,m-1,+dd); };
const fmtFull = s => fromKey(s).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const fmtShort = s => fromKey(s).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const todayET = () => new Date().toLocaleDateString("en-CA",{timeZone:"America/New_York"});
const nowTimeET = () => { const t=new Date().toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",hour12:false}); return t==="24:00"?"00:00":t; };
const getType = s => Math.min(7,Math.max(1,s.type||s.rating||4));

const B = {
  icon:  ["","🪨","🌰","🌭","🍌","🫐","☁️","💧"],
  label: ["","Type 1","Type 2","Type 3","Type 4","Type 5","Type 6","Type 7"],
  short: ["","Hard lumps","Lumpy","Cracked","Smooth","Soft blobs","Mushy","Liquid"],
  note:  ["","Constipated","Constipated","Near-normal","Ideal","Soft","Loose","Diarrhea"],
  bg:    ["","#FCEBEB","#FAECE7","#FAEEDA","#EAF3DE","#FAEEDA","#FAECE7","#FCEBEB"],
  fg:    ["","#791F1F","#712B13","#633806","#27500A","#633806","#712B13","#791F1F"],
};
const SIZES = [{key:"small",label:"Small"},{key:"medium",label:"Medium"},{key:"large",label:"Large"},{key:"pencil",label:"Pencil"}];
const TRAITS = [
  {key:"clean",     label:"Clean",        emoji:"✅"},
  {key:"messy",     label:"Messy",        emoji:"💦"},
  {key:"in_pieces", label:"In pieces",    emoji:"🧩"},
  {key:"urgency",   label:"Urgency",      emoji:"⚡"},
  {key:"hard_pass", label:"Hard to pass", emoji:"😤"},
];

function SizeIcon({ k }) {
  switch(k) {
    case "small":  return <svg width="24" height="24"><circle cx="12" cy="12" r="4"  fill="currentColor"/></svg>;
    case "medium": return <svg width="24" height="24"><circle cx="12" cy="12" r="7"  fill="currentColor"/></svg>;
    case "large":  return <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>;
    case "pencil": return <svg width="24" height="24"><ellipse cx="12" cy="12" rx="3" ry="10" fill="currentColor"/></svg>;
    default: return null;
  }
}

function BristolBadge({ type, sm }) {
  const t = Math.min(7,Math.max(1,type||4));
  return <span style={{background:B.bg[t],color:B.fg[t],border:`0.5px solid ${B.fg[t]}55`,borderRadius:20,padding:sm?"2px 8px":"3px 10px",fontSize:sm?11:12,fontWeight:500,whiteSpace:"nowrap"}}>
    {B.icon[t]} {B.label[t]} · {B.short[t]}
  </span>;
}

function Chip({ children }) {
  return <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",color:"var(--color-text-secondary)",whiteSpace:"nowrap"}}>{children}</span>;
}

function NavBtn({ onClick, disabled, children }) {
  return <button onClick={onClick} disabled={disabled} style={{width:32,height:32,borderRadius:"var(--border-radius-md)",background:"none",border:`0.5px solid ${disabled?"transparent":"var(--color-border-secondary)"}`,cursor:disabled?"default":"pointer",fontSize:18,color:disabled?"var(--color-border-tertiary)":"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</button>;
}

function SmBtn({ onClick, children }) {
  return <button onClick={onClick} style={{background:"none",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"4px 6px",cursor:"pointer",fontSize:13,color:"var(--color-text-secondary)"}}>{children}</button>;
}

function SessionCard({ s, onEdit, onDelete }) {
  const t = getType(s);
  const sizeEntry = SIZES.find(z=>z.key===s.size);
  const traitLabels = (s.traits||[]).map(k=>TRAITS.find(o=>o.key===k)).filter(Boolean);
  return (
    <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",padding:"12px 14px",border:"0.5px solid var(--color-border-tertiary)",borderLeft:`3px solid ${B.fg[t]}66`,display:"flex",alignItems:"flex-start",gap:10}}>
      <button onClick={onEdit} title="Tap to edit" style={{background:"none",cursor:"pointer",fontFamily:"inherit",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"3px 7px",color:"var(--color-text-secondary)",fontSize:12,flexShrink:0,marginTop:1}}>{s.time}</button>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        <BristolBadge type={t}/>
        {(sizeEntry||traitLabels.length>0) && (
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {sizeEntry && <Chip><span style={{display:"inline-flex",alignItems:"center",gap:3}}>
              <svg width="10" height="10" style={{display:"inline-block",verticalAlign:"middle"}}>
                {s.size==="pencil"?<ellipse cx="5" cy="5" rx="1.5" ry="4.5" fill="currentColor"/>:<circle cx="5" cy="5" r={s.size==="small"?2:s.size==="medium"?3.5:4.5} fill="currentColor"/>}
              </svg>
              {sizeEntry.label}
            </span></Chip>}
            {traitLabels.map(tr=><Chip key={tr.key}>{tr.emoji} {tr.label}</Chip>)}
          </div>
        )}
        {s.notes&&<div style={{color:"var(--color-text-secondary)",fontSize:12,lineHeight:1.5}}>{s.notes}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        <SmBtn onClick={onEdit}>✏️</SmBtn>
        <SmBtn onClick={onDelete}>🗑️</SmBtn>
      </div>
    </div>
  );
}

function LogTab({ data, date, setDate, onAdd, onEdit, onDelete }) {
  const sessions = [...(data[date]||[])].sort((a,b)=>a.time<b.time?-1:1);
  const isToday = date===todayET();
  const shift = n => { const d=fromKey(date); d.setDate(d.getDate()+n); const k=d.toLocaleDateString("en-CA",{timeZone:"America/New_York"}); if(k<=todayET()) setDate(k); };
  const avgRaw = sessions.length?sessions.reduce((s,x)=>s+getType(x),0)/sessions.length:null;
  const closestType = avgRaw?Math.min(7,Math.max(1,Math.round(avgRaw))):null;
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"16px 0 14px",borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:14}}>
        <NavBtn onClick={()=>shift(-1)}>‹</NavBtn>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{isToday?"Today":fmtFull(date)}</div>
          {isToday?<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:1}}>{fmtFull(date)}</div>:<button onClick={()=>setDate(todayET())} style={{background:"none",border:"none",color:"#BA7517",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:0,marginTop:2}}>→ Back to today</button>}
        </div>
        <NavBtn onClick={()=>shift(1)} disabled={isToday}>›</NavBtn>
      </div>
      <div style={{marginBottom:14}}>
        <input type="date" value={date} max={todayET()} onChange={e=>e.target.value&&setDate(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",fontSize:12,fontFamily:"inherit",cursor:"pointer"}}/>
      </div>
      {sessions.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[["Sessions",String(sessions.length)],["Avg type",avgRaw?avgRaw.toFixed(1):"—"],["Closest",closestType?B.short[closestType]:"—"]].map(([l,v])=>(
          <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"var(--color-text-secondary)",marginBottom:3}}>{l}</div>
            <div style={{fontSize:String(v).length>6?12:20,fontWeight:500,color:"var(--color-text-primary)",lineHeight:1.3}}>{v}</div>
          </div>
        ))}
      </div>}
      {sessions.length===0?<div style={{textAlign:"center",color:"var(--color-text-secondary)",fontSize:13,padding:"44px 16px",border:"0.5px dashed var(--color-border-secondary)",borderRadius:"var(--border-radius-lg)"}}>No sessions logged for this day</div>:
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{sessions.map(s=><SessionCard key={s.id} s={s} onEdit={()=>onEdit(s)} onDelete={()=>onDelete(s.id)}/>)}</div>}
      <button onClick={onAdd} style={{width:"100%",marginTop:16,padding:"13px",borderRadius:"var(--border-radius-lg)",background:"#EF9F27",border:"none",color:"#412402",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>+ Log a session</button>
    </div>
  );
}

function DataTab({ data }) {
  const days=Object.keys(data).sort((a,b)=>b>a?1:-1);
  const total=days.reduce((s,d)=>s+(data[d]||[]).length,0);
  const exportJSON=()=>{ const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`poo-tracker-${todayET()}.json`; a.click(); URL.revokeObjectURL(url); };

  const exportCSV=()=>{
    const header=["Date","Time","Bristol Type","Description","Clinical Note","Size",
      ...TRAITS.map(t=>t.label),"Notes"];
    const rows=[header];
    Object.keys(data).sort().forEach(date=>{
      (data[date]||[]).slice().sort((a,b)=>a.time<b.time?-1:1).forEach(s=>{
        const t=getType(s);
        rows.push([
          date,s.time,t,B.short[t],B.note[t],
          s.size||"",
          ...TRAITS.map(({key})=>(s.traits||[]).includes(key)?"Yes":"No"),
          s.notes||"",
        ]);
      });
    });
    const csv=rows.map(r=>r.map(v=>{
      const c=String(v);
      return /[,"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c;
    }).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`poo-tracker-${todayET()}.csv`;a.click();URL.revokeObjectURL(url);
  };
  if(!total) return <div style={{padding:"60px 20px",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>No data yet</div>;
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{padding:"14px 0 12px",borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{total} {total===1?"session":"sessions"} total</span>
        <button onClick={exportCSV} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"var(--border-radius-md)",padding:"5px 10px",cursor:"pointer",fontSize:11,color:"var(--color-text-secondary)",fontFamily:"inherit"}}>Export CSV ↓</button>
        <button onClick={exportJSON} style={{background:"none",border:"0.5px solid var(--color-border-secondary)",borderRadius:"var(--border-radius-md)",padding:"5px 10px",cursor:"pointer",fontSize:11,color:"var(--color-text-secondary)",fontFamily:"inherit"}}>Export JSON ↓</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {days.map(d=>{ const ss=[...(data[d]||[])].sort((a,b)=>a.time<b.time?-1:1); if(!ss.length) return null; const dayAvg=(ss.reduce((s,x)=>s+getType(x),0)/ss.length).toFixed(1);
          return <div key={d}>
            <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)",padding:"7px 10px",marginBottom:6,background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",borderLeft:"3px solid #EF9F27",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>{fmtFull(d)}</span><span style={{fontWeight:400,color:"var(--color-text-secondary)",fontSize:11}}>{ss.length} {ss.length===1?"session":"sessions"} · avg T{dayAvg}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,paddingLeft:10}}>
              {ss.map(s=>{ const t=getType(s); const sizeEntry=SIZES.find(z=>z.key===s.size); const traitLabels=(s.traits||[]).map(k=>TRAITS.find(o=>o.key===k)).filter(Boolean);
                return <div key={s.id} style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-md)",padding:"8px 10px",border:"0.5px solid var(--color-border-tertiary)",borderLeft:`2px solid ${B.fg[t]}55`,display:"grid",gridTemplateColumns:"38px 1fr",gap:8,alignItems:"start"}}>
                  <div style={{color:"var(--color-text-secondary)",fontSize:11,paddingTop:2}}>{s.time}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <BristolBadge type={t} sm/>
                    {(sizeEntry||traitLabels.length>0)&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{sizeEntry&&<Chip>{sizeEntry.label}</Chip>}{traitLabels.map(tr=><Chip key={tr.key}>{tr.emoji} {tr.label}</Chip>)}</div>}
                    {s.notes&&<div style={{color:"var(--color-text-secondary)",fontSize:11,lineHeight:1.5}}>{s.notes}</div>}
                  </div>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

function ChartsTab({ data }) {
  const cd=Object.keys(data).sort().map(d=>{ const ss=data[d]||[]; const avg=ss.length?ss.reduce((s,x)=>s+getType(x),0)/ss.length:null; return {date:fmtShort(d),count:ss.length,avg:avg?+avg.toFixed(1):null}; });
  if(!cd.length) return <div style={{padding:"60px 20px",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>No data yet</div>;
  const ts={background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,fontSize:12};
  return (
    <div style={{padding:"0 16px 16px"}}>
      <div style={{padding:"14px 0 10px",borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:12,fontSize:12,color:"var(--color-text-secondary)"}}>Sessions per day</div>
      <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-lg)",padding:"14px 4px 8px",border:"0.5px solid var(--color-border-tertiary)",marginBottom:16}}>
        <ResponsiveContainer width="100%" height={160}><LineChart data={cd} margin={{top:4,right:10,left:-24,bottom:4}}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)"/><XAxis dataKey="date" tick={{fill:"var(--color-text-secondary)",fontSize:10}}/><YAxis tick={{fill:"var(--color-text-secondary)",fontSize:10}} allowDecimals={false}/><Tooltip contentStyle={ts}/><Line type="monotone" dataKey="count" stroke="#EF9F27" strokeWidth={2} dot={{fill:"#EF9F27",r:4}} name="sessions"/></LineChart></ResponsiveContainer>
      </div>
      <div style={{padding:"14px 0 10px",borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:12,fontSize:12,color:"var(--color-text-secondary)"}}>Average Bristol type per day</div>
      <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-lg)",padding:"14px 4px 8px",border:"0.5px solid var(--color-border-tertiary)",marginBottom:16}}>
        <ResponsiveContainer width="100%" height={160}><LineChart data={cd} margin={{top:4,right:30,left:-24,bottom:4}}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)"/><XAxis dataKey="date" tick={{fill:"var(--color-text-secondary)",fontSize:10}}/><YAxis domain={[1,7]} ticks={[1,2,3,4,5,6,7]} tick={{fill:"var(--color-text-secondary)",fontSize:10}}/><Tooltip contentStyle={ts}/><ReferenceLine y={4} stroke="#27500A" strokeDasharray="4 3" label={{value:"ideal",fill:"#27500A",fontSize:9,position:"insideTopRight"}}/><Line type="monotone" dataKey="avg" stroke="#1D9E75" strokeWidth={2} dot={{fill:"#1D9E75",r:4}} connectNulls name="avg type"/></LineChart></ResponsiveContainer>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {[1,2,3,4,5,6,7].map(t=><div key={t} style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:22,textAlign:"center",fontSize:11,fontWeight:500,color:B.fg[t],background:B.bg[t],borderRadius:4,padding:"1px 0",flexShrink:0}}>{t}</span><span style={{fontSize:13,flexShrink:0}}>{B.icon[t]}</span><span style={{fontSize:11,color:"var(--color-text-secondary)",flex:1}}>{B.short[t]}</span><span style={{fontSize:11,color:B.fg[t]}}>{B.note[t]}</span></div>)}
      </div>
    </div>
  );
}

// ── Full-screen modal — replaces the content area entirely ────────────────────
function Modal({ mode, form, setForm, onSave, onClose }) {
  const toggleTrait = key => setForm(f=>({...f,traits:(f.traits||[]).includes(key)?f.traits.filter(t=>t!==key):[...(f.traits||[]),key]}));
  return (
    <div style={{position:"absolute",inset:0,background:"var(--color-background-primary)",zIndex:100,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:20,maxWidth:440,width:"100%",margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:14,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
          <div style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)"}}>{mode==="add"?"Log a session":"Edit session"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-secondary)",fontSize:20,lineHeight:1,padding:4}}>✕</button>
        </div>

        {/* Time */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8}}>Time (Eastern)</div>
          <input type="time" value={form.time} autoFocus={mode==="edit"}
            onChange={e=>setForm(f=>({...f,time:e.target.value}))}
            style={{width:"100%",padding:"10px 12px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontSize:14,fontFamily:"inherit"}}/>
        </div>

        {/* Bristol — icons make each type instantly recognisable */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8}}>Bristol stool type</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {[1,2,3,4,5,6,7].map(t=>(
              <button key={t} onClick={()=>setForm(f=>({...f,type:t}))} style={{padding:"10px 2px",borderRadius:"var(--border-radius-md)",cursor:"pointer",border:form.type===t?`1.5px solid ${B.fg[t]}`:"0.5px solid var(--color-border-tertiary)",background:form.type===t?B.bg[t]:"var(--color-background-secondary)",color:form.type===t?B.fg[t]:"var(--color-text-secondary)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:18,lineHeight:1}}>{B.icon[t]}</span>
                <span style={{fontSize:10,fontWeight:500}}>T{t}</span>
              </button>
            ))}
          </div>
          {form.type&&<div style={{marginTop:6,padding:"7px 10px",borderRadius:"var(--border-radius-md)",background:B.bg[form.type],color:B.fg[form.type],fontSize:12,textAlign:"center"}}>
            <strong>{B.label[form.type]}</strong> — {B.short[form.type]}<span style={{opacity:0.8}}> · {B.note[form.type]}</span>
          </div>}
        </div>

        {/* Size */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8}}>Size</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {SIZES.map(({key,label})=>{ const sel=form.size===key; return (
              <button key={key} onClick={()=>setForm(f=>({...f,size:f.size===key?null:key}))} style={{padding:"14px 4px 10px",borderRadius:"var(--border-radius-md)",cursor:"pointer",border:sel?"1.5px solid #1D9E75":"0.5px solid var(--color-border-tertiary)",background:sel?"#E1F5EE":"var(--color-background-secondary)",color:sel?"#085041":"var(--color-text-secondary)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,fontSize:11,fontFamily:"inherit"}}>
                <SizeIcon k={key}/><span>{label}</span>
              </button>
            );})}
          </div>
        </div>

        {/* Traits — 5 options in 2-col grid */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8}}>Select all that apply</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {TRAITS.map(({key,label,emoji})=>{ const sel=(form.traits||[]).includes(key); return (
              <button key={key} onClick={()=>toggleTrait(key)} style={{padding:"10px 12px",borderRadius:"var(--border-radius-md)",cursor:"pointer",border:sel?"1.5px solid #185FA5":"0.5px solid var(--color-border-tertiary)",background:sel?"#E6F1FB":"var(--color-background-secondary)",color:sel?"#0C447C":"var(--color-text-secondary)",display:"flex",alignItems:"center",gap:8,fontSize:12,fontFamily:"inherit",textAlign:"left"}}>
                <span style={{fontSize:16,flexShrink:0}}>{emoji}</span><span>{label}</span>
              </button>
            );})}
          </div>
        </div>

        {/* Notes */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:8}}>Notes (optional)</div>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Anything else notable..." rows={2}
            style={{width:"100%",padding:"10px 12px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontSize:13,fontFamily:"inherit",lineHeight:1.5,resize:"none"}}/>
        </div>

        <button onClick={onSave} disabled={!form.time} style={{width:"100%",padding:13,borderRadius:"var(--border-radius-lg)",background:form.time?"#EF9F27":"var(--color-background-secondary)",border:"none",color:form.time?"#412402":"var(--color-text-secondary)",fontSize:14,fontWeight:500,cursor:form.time?"pointer":"not-allowed",fontFamily:"inherit"}}>
          {mode==="add"?"Save session":"Save changes"}
        </button>
      </div>
    </div>
  );
}

const TABS=[{id:"log",icon:"📋",label:"Log"},{id:"data",icon:"🗂️",label:"Data"},{id:"charts",icon:"📈",label:"Charts"}];

export default function App() {
  const [data,setData]=useState(null); const [tab,setTab]=useState("log"); const [date,setDate]=useState(todayET());
  const [modal,setModal]=useState(null); const [form,setForm]=useState({time:"",type:4,size:null,traits:[],notes:""});
  useEffect(()=>{loadData().then(setData);},[]);
  if(!data) return <div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",color:"var(--color-text-secondary)",fontSize:13}}>Loading...</div>;
  const upd=async nd=>{setData(nd);await saveData(nd);};
  const openAdd=()=>{setForm({time:nowTimeET(),type:4,size:null,traits:[],notes:""});setModal({mode:"add"});};
  const openEdit=s=>{setForm({time:s.time,type:getType(s),size:s.size||null,traits:s.traits||[],notes:s.notes||""});setModal({mode:"edit",id:s.id});};
  const handleSave=async()=>{const nd={...data},list=[...(nd[date]||[])];if(modal.mode==="add"){list.push({id:uid(),...form});}else{const i=list.findIndex(s=>s.id===modal.id);if(i>=0)list[i]={...list[i],...form};}nd[date]=list;await upd(nd);setModal(null);};
  const handleDelete=async id=>{const nd={...data},list=(nd[date]||[]).filter(s=>s.id!==id);if(list.length)nd[date]=list;else delete nd[date];await upd(nd);};
  return (
    <div style={{position:"relative",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",maxWidth:440,margin:"0 auto",fontFamily:"var(--font-sans)"}}>
      <div style={{flexShrink:0,padding:"14px 16px 10px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>💩</span>
          <div><div style={{fontSize:16,fontWeight:500,color:"var(--color-text-primary)"}}>Poo Tracker</div><div style={{fontSize:10,color:"var(--color-text-secondary)",letterSpacing:"0.06em"}}>Personal health log · Eastern Time</div></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",background:"var(--color-background-tertiary)"}}>
        {tab==="log"&&<LogTab data={data} date={date} setDate={setDate} onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete}/>}
        {tab==="data"&&<DataTab data={data}/>}
        {tab==="charts"&&<ChartsTab data={data}/>}
      </div>
      <div style={{flexShrink:0,display:"flex",borderTop:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        {TABS.map(({id,icon,label})=><button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0 13px",background:"none",border:"none",cursor:"pointer",color:tab===id?"#BA7517":"var(--color-text-secondary)",display:"flex",flexDirection:"column",alignItems:"center",gap:3,borderTop:tab===id?"2px solid #EF9F27":"2px solid transparent"}}>
          <span style={{fontSize:20}}>{icon}</span><span style={{fontSize:10}}>{label}</span>
        </button>)}
      </div>
      {modal&&<Modal mode={modal.mode} form={form} setForm={setForm} onSave={handleSave} onClose={()=>setModal(null)}/>}
    </div>
  );
}
