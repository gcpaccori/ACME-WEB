import { FormEvent, useState, type ChangeEvent, type ReactNode, useEffect } from 'react';
import { supabase } from '../../../integrations/supabase/client';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconArrow = ({ dir = 'right' }: { dir?: 'right' | 'left' }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    {dir === 'right'
      ? <path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      : <path d="M15 9H3M7 5L3 9l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <circle cx="8.5" cy="5.5" r="3" stroke="#9ca3af" strokeWidth="1.6"/>
    <path d="M2 15c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconMail = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <rect x="2" y="4" width="13" height="9" rx="2" stroke="#9ca3af" strokeWidth="1.6"/>
    <path d="M2 6l6.5 4.5L15 6" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <rect x="4" y="8" width="9" height="7" rx="2" stroke="#9ca3af" strokeWidth="1.6"/>
    <path d="M6 8V6a2.5 2.5 0 015 0v2" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="8.5" cy="11.5" r="1" fill="#9ca3af"/>
  </svg>
);
const IconStore = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M2 7h13l-1 8H3L2 7z" stroke="#9ca3af" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M1 4h15l-1 3H2L1 4z" stroke="#9ca3af" strokeWidth="1.6" strokeLinejoin="round"/>
    <rect x="6.5" y="10" width="4" height="5" rx="1" stroke="#9ca3af" strokeWidth="1.4"/>
  </svg>
);
const IconBranch = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M8.5 2a4 4 0 014 4c0 3-4 9-4 9s-4-6-4-9a4 4 0 014-4z" stroke="#9ca3af" strokeWidth="1.6"/>
    <circle cx="8.5" cy="6" r="1.5" fill="#9ca3af"/>
  </svg>
);
const IconPin = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M8.5 1.5A4.5 4.5 0 0113 6c0 4-4.5 9.5-4.5 9.5S4 10 4 6a4.5 4.5 0 014.5-4.5z" stroke="#9ca3af" strokeWidth="1.6"/>
    <circle cx="8.5" cy="6" r="1.8" stroke="#9ca3af" strokeWidth="1.4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M4 2h3l1.5 3.5-2 1.2A9 9 0 0010.3 12l1.2-2L15 11.5V14c0 1-.9 1.5-2 1.5A13 13 0 012.5 3C2.5 2 3 2 4 2z" stroke="#9ca3af" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 9l5 5 7-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  email: string; password: string; businessName: string;
  branchName: string; address: string; phone: string; ownerName: string;
}

// ── InputField ────────────────────────────────────────────────────────────────
function InputField({ label, name, type = 'text', value, onChange, icon, error, hint, rows }: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  icon?: React.ReactNode; error?: string; hint?: string; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const border = error ? '#f87171' : focused ? '#8b5cf6' : '#e4e4e7';
  const bg = focused ? '#faf8ff' : '#fafafa';
  const shared: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px 11px 40px',
    border: `1.8px solid ${border}`, borderRadius: 10,
    fontSize: '0.91rem', outline: 'none',
    background: bg, color: '#18181b',
    transition: 'all 0.18s ease',
    fontFamily: "'DM Sans', sans-serif",
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#52525b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {hint && <p style={{ margin: 0, fontSize: '0.74rem', color: '#a1a1aa' }}>{hint}</p>}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: rows ? 13 : '50%', transform: rows ? 'none' : 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
          {icon}
        </span>
        {rows
          ? <textarea name={name} value={value} onChange={onChange} required rows={rows}
              style={{ ...shared, resize: 'none', paddingTop: 11 }}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>
          : <input type={type} name={name} value={value} onChange={onChange} required
              style={shared} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>}
      </div>
      {error && <p style={{ margin: 0, fontSize: '0.74rem', color: '#ef4444' }}>⚠ {error}</p>}
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ step, total }: { step: number; total: number }) {
  const labels = ['Cuenta', 'Negocio', 'Contacto'];
  const emojis = ['👤', '🏪', '📍'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: done ? 'rgba(255,255,255,0.3)' : active ? '#fff' : 'rgba(255,255,255,0.12)',
                border: active ? 'none' : done ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? '0.9rem' : '1.1rem',
                boxShadow: active ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.3s ease',
                color: active ? '#7c3aed' : 'white',
                fontWeight: 800,
              }}>
                {done ? '✓' : emojis[i]}
              </div>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: active ? 'white' : done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', transition: 'color 0.3s' }}>
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div style={{ width: 52, height: 2, margin: '0 8px', marginBottom: 20, background: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)', transition: 'background 0.4s ease', borderRadius: 2 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── FeatureCard ───────────────────────────────────────────────────────────────
function FeatureCard({ emoji, title, desc, accent }: { emoji: string; title: string; desc: string; accent: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? `linear-gradient(135deg,${accent}f0,${accent}c0)` : '#fff',
      borderRadius: 20, padding: '28px 24px',
      boxShadow: hov ? `0 20px 48px ${accent}44` : '0 2px 20px rgba(0,0,0,0.05)',
      border: `1.5px solid ${hov ? 'transparent' : '#f0eeff'}`,
      transform: hov ? 'translateY(-6px)' : 'none',
      transition: 'all 0.28s cubic-bezier(.4,0,.2,1)', cursor: 'default',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 14 }}>{emoji}</div>
      <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1rem', color: hov ? '#fff' : '#18181b', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: hov ? 'rgba(255,255,255,0.85)' : '#71717a', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function BusinessPage() {
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '', password: '', businessName: '', branchName: '', address: '', phone: '', ownerName: '',
  });
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (e.target.name === 'email') {
      setEmailError(e.target.value && !validateEmail(e.target.value) ? 'Email inválido, ej: contacto@tuempresa.com' : '');
    }
  };

  const canAdvance = () => {
    if (step === 0) return formData.ownerName.trim() && validateEmail(formData.email) && !emailError && formData.password.length >= 6;
    if (step === 1) return formData.businessName.trim() && formData.branchName.trim();
    return formData.address.trim() && formData.phone.trim();
  };

  const goTo = (next: number) => {
    if (animating) return;
    setDir(next > step ? 'forward' : 'back');
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 240);
  };

  const handleSubmit = async () => {
    if (!canAdvance()) return;
    setIsSubmitting(true); setApiError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + '/portal/login'
        }
      });
      if (authError) throw authError;
      if (!authData?.session) {
        localStorage.setItem('pendingBusinessRegistration', JSON.stringify({
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          businessName: formData.businessName,
          branchName: formData.branchName,
          address: formData.address
        }));
        setAwaitingConfirmation(true);
        setApiError('');
        return;
      }
      if (authData.user) {
        const { data: merchantData, error: mErr } = await supabase.from('merchants').insert([{ trade_name: formData.businessName }]).select().single();
        if (mErr) throw mErr;
        const { data: branchData, error: bErr } = await supabase.from('merchant_branches').insert([{ name: formData.branchName, merchant_id: merchantData.id, address_id: null, phone: formData.phone }]).select().single();
        if (bErr) throw bErr;
        const { error: pErr } = await supabase
          .from('profiles')
          .insert([{ user_id: authData.user.id, full_name: formData.ownerName, email: formData.email, phone: formData.phone }]);
        if (pErr) throw pErr;
        const { data: staffData, error: sErr } = await supabase.from('merchant_staff').insert([{ user_id: authData.user.id, merchant_id: merchantData.id, staff_role: 'owner', branch_id: null }]).select().single();
        if (sErr) throw sErr;
        if (!staffData?.id) throw new Error('No se pudo crear la asignación de staff.');
        const { error: sbErr } = await supabase.from('merchant_staff_branches').insert([{ branch_id: branchData.id, merchant_staff_id: staffData.id, is_primary: true }]);
        if (sbErr) throw sbErr;
        setSuccess(true);
      }
    } catch (e: any) {
      const message = String(e?.message ?? e ?? 'Ocurrió un error inesperado');
      if (message.toLowerCase().includes('invalid api key') || message.toLowerCase().includes('api key')) {
        setApiError('Error de configuración: la clave pública de Supabase no es válida. Verifica VITE_SUPABASE_ANON_KEY en .env y reinicia el servidor.');
      } else {
        setApiError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => { setStep(0); setSuccess(false); setAwaitingConfirmation(false); setApiError(''); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const stepTitles = ['Crea tu cuenta', 'Tu negocio', 'Dónde encontrarte'];
  const stepSubtitles = [
    'Datos de acceso al portal de gestión.',
    'Cuéntanos sobre tu negocio y sucursal principal.',
    'Dirección y teléfono de contacto.',
  ];

  const stepContent = [
    <div key="s0" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InputField label="Nombre completo" name="ownerName" value={formData.ownerName} onChange={handleChange} icon={<IconUser/>}/>
      <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<IconMail/>} error={emailError} hint="Recibirás un enlace de confirmación."/>
      <InputField label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} icon={<IconLock/>} hint="Mínimo 6 caracteres."/>
    </div>,

    <div key="s1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InputField label="Nombre del negocio" name="businessName" value={formData.businessName} onChange={handleChange} icon={<IconStore/>}/>
      <InputField label="Nombre de la sucursal principal" name="branchName" value={formData.branchName} onChange={handleChange} icon={<IconBranch/>}/>
    </div>,

    <div key="s2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InputField label="Dirección" name="address" value={formData.address} onChange={handleChange} icon={<IconPin/>} rows={2}/>
      <InputField label="Teléfono" name="phone" type="tel" value={formData.phone} onChange={handleChange} icon={<IconPhone/>}/>
    </div>,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBlob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(28px,-18px) scale(1.04)} 66%{transform:translate(-18px,14px) scale(0.97)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.93) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideInForward { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInBack { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes successPop { 0%{transform:scale(0)} 65%{transform:scale(1.14)} 100%{transform:scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .cta-btn:hover { transform:translateY(-2px) scale(1.03) !important; box-shadow:0 14px 36px rgba(124,58,237,0.45) !important; }
        .cta-btn:active { transform:scale(0.98) !important; }
        .step-forward { animation: slideInForward 0.24s cubic-bezier(.4,0,.2,1) both; }
        .step-back    { animation: slideInBack    0.24s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      <div style={{ background: '#faf8ff', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(140deg,#1e0445 0%,#3b0f7a 55%,#5b21b6 100%)', padding: '88px 24px 110px', position: 'relative', overflow: 'hidden' }}>
          {[
            { w:420,h:420,top:-100,right:-80,color:'rgba(167,139,250,0.14)',d:'0s' },
            { w:300,h:300,bottom:-100,left:-60,color:'rgba(255,98,0,0.1)',d:'5s' },
            { w:200,h:200,top:'38%',left:'45%',color:'rgba(139,92,246,0.16)',d:'9s' },
          ].map((b,i) => (
            <div key={i} style={{ position:'absolute', width:b.w, height:b.h, top:b.top as any, right:b.right as any, bottom:b.bottom as any, left:b.left as any, background:b.color, borderRadius:'50%', filter:'blur(64px)', animation:`floatBlob 14s ease-in-out ${b.d} infinite`, pointerEvents:'none' }}/>
          ))}

          <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:100, padding:'6px 18px', marginBottom:28, color:'rgba(255,255,255,0.88)', fontSize:'0.8rem', fontWeight:600, animation:'fadeUp 0.6s ease both' }}>
              ✦ Plataforma #1 para negocios locales
            </div>
            <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(2rem,5.5vw,3.8rem)', fontWeight:800, color:'#fff', lineHeight:1.14, margin:'0 0 22px', animation:'fadeUp 0.65s 0.1s ease both' }}>
              Haz crecer tu negocio<br/>
              <span style={{ background:'linear-gradient(90deg,#c084fc,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>con ACME Pedidos</span>
            </h1>
            <p style={{ fontSize:'clamp(0.95rem,2vw,1.1rem)', color:'rgba(255,255,255,0.7)', lineHeight:1.72, maxWidth:520, margin:'0 auto 38px', animation:'fadeUp 0.65s 0.2s ease both' }}>
              Recibe pedidos en línea, gestiona tu carta y controla tus sucursales — todo desde un portal dedicado.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', animation:'fadeUp 0.65s 0.3s ease both' }}>
              <button className="cta-btn" onClick={openModal} style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', border:'none', borderRadius:12, padding:'15px 32px', fontSize:'0.97rem', fontWeight:700, cursor:'pointer', transition:'all 0.22s cubic-bezier(.4,0,.2,1)', fontFamily:"'Sora',sans-serif", boxShadow:'0 8px 24px rgba(124,58,237,0.38)', display:'inline-flex', alignItems:'center', gap:8 }}>
                Registra tu negocio <IconArrow/>
              </button>
              <button style={{ background:'transparent', color:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(255,255,255,0.25)', borderRadius:12, padding:'15px 26px', fontSize:'0.92rem', fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Ver demo</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, maxWidth:500, margin:'52px auto 0', animation:'fadeUp 0.65s 0.4s ease both' }}>
              {[['2,400+','Negocios activos'],['98%','Satisfacción'],['< 2 min','Setup inicial']].map(([n,l]) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.07)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'18px 10px' }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:'1.5rem', fontWeight:800, color:'#c084fc', marginBottom:4 }}>{n}</div>
                  <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.52)', fontWeight:500 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ marginTop:-2, lineHeight:0 }}>
          <svg viewBox="0 0 1440 60" style={{ display:'block', width:'100%' }}>
            <defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1e0445"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs>
            <path d="M0,30 C360,70 1080,-10 1440,30 L1440,0 L0,0 Z" fill="url(#wg)"/>
          </svg>
        </div>

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <section style={{ maxWidth:1060, margin:'0 auto', padding:'72px 24px 60px' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <p style={{ color:'#7c3aed', fontWeight:700, fontSize:'0.73rem', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>¿Por qué elegirnos?</p>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1.5rem,3.5vw,2.3rem)', fontWeight:800, color:'#18181b', margin:0 }}>Todo lo que necesita tu negocio</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:20 }}>
            <FeatureCard emoji="📦" title="Pedidos en tiempo real" desc="Recibe, acepta y actualiza estados al instante, sin depender de terceros ni llamadas." accent="#7c3aed"/>
            <FeatureCard emoji="🍽️" title="Control de carta" desc="Administra categorías, productos, precios y disponibilidad por sucursal con facilidad." accent="#0ea5e9"/>
            <FeatureCard emoji="📊" title="Portal por sucursal" desc="Cada sucursal tiene su propio espacio independiente para una gestión eficiente." accent="#10b981"/>
          </div>
        </section>

        {/* ── CTA bottom ───────────────────────────────────────────────────── */}
        <section style={{ textAlign:'center', padding:'60px 24px 90px' }}>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, color:'#18181b', marginBottom:12 }}>¿Listo para empezar?</h2>
          <p style={{ color:'#71717a', marginBottom:28, lineHeight:1.7 }}>Registro gratuito en menos de 2 minutos.</p>
          <button className="cta-btn" onClick={openModal} style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', border:'none', borderRadius:12, padding:'15px 34px', fontSize:'0.97rem', fontWeight:700, cursor:'pointer', transition:'all 0.22s cubic-bezier(.4,0,.2,1)', fontFamily:"'Sora',sans-serif", boxShadow:'0 8px 24px rgba(124,58,237,0.35)', display:'inline-flex', alignItems:'center', gap:8 }}>
            Registrar mi negocio <IconArrow/>
          </button>
        </section>

        {/* ── MODAL ────────────────────────────────────────────────────────── */}
        {modalOpen && (
          <div
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
            style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(12,0,28,0.8)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          >
            <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:468, boxShadow:'0 32px 80px rgba(0,0,0,0.3)', animation:'modalIn 0.28s cubic-bezier(.34,1.2,.64,1) both', overflow:'hidden' }}>

              {/* ── Header ── */}
              <div style={{ background:'linear-gradient(135deg,#2d0a6b,#7c3aed)', padding:'22px 22px 20px', position:'relative' }}>
                <button onClick={closeModal} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}>
                  <IconClose/>
                </button>

                {!success && !awaitingConfirmation && <Stepper step={step} total={TOTAL_STEPS}/>}

                {(success || awaitingConfirmation) && (
                  <p style={{ textAlign:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, color:'#fff', margin:0, fontSize:'1.05rem' }}>
                    {awaitingConfirmation ? 'Confirma tu correo' : '¡Registro completado! 🎉'}
                  </p>
                )}
              </div>

              {/* ── Body ── */}
              <div style={{ padding:'22px 26px 26px' }}>
                {success ? (
                  <div style={{ textAlign:'center', padding:'8px 0' }}>
                    <div style={{ animation:'successPop 0.45s cubic-bezier(.34,1.56,.64,1) both', display:'inline-block', marginBottom:16 }}>
                      <svg width="68" height="68" viewBox="0 0 68 68">
                        <circle cx="34" cy="34" r="34" fill="#f0fdf4"/>
                        <circle cx="34" cy="34" r="24" fill="#22c55e"/>
                        <path d="M22 34l9 9 15-15" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.15rem', color:'#18181b', margin:'0 0 10px' }}>¡Bienvenido a bordo!</h3>
                    <p style={{ color:'#71717a', lineHeight:1.65, margin:'0 0 22px', fontSize:'0.88rem' }}>
                      Revisa tu email para confirmar tu cuenta y accede a tu portal de gestión.
                    </p>
                    <button onClick={closeModal} style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'white', border:'none', borderRadius:10, padding:'12px 28px', fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'0.93rem', cursor:'pointer', boxShadow:'0 6px 18px rgba(124,58,237,0.3)' }}>
                      Cerrar
                    </button>
                  </div>
                ) : awaitingConfirmation ? (
                  <div style={{ textAlign:'center', padding:'8px 0' }}>
                    <div style={{ animation:'successPop 0.45s cubic-bezier(.34,1.56,.64,1) both', display:'inline-block', marginBottom:16 }}>
                      <svg width="68" height="68" viewBox="0 0 68 68">
                        <circle cx="34" cy="34" r="34" fill="#fef3c7"/>
                        <circle cx="34" cy="34" r="24" fill="#f59e0b"/>
                        <path d="M28 34l4 4 8-8" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.15rem', color:'#18181b', margin:'0 0 10px' }}>Revisa tu correo</h3>
                    <p style={{ color:'#71717a', lineHeight:1.65, margin:'0 0 22px', fontSize:'0.88rem' }}>
                      Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta y serás redirigido al portal para iniciar sesión.
                    </p>
                    <button onClick={closeModal} style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'white', border:'none', borderRadius:10, padding:'12px 28px', fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'0.93rem', cursor:'pointer', boxShadow:'0 6px 18px rgba(124,58,237,0.3)' }}>
                      Entendido
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Step title */}
                    <div style={{ marginBottom:18 }}>
                      <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'#18181b', margin:'0 0 3px' }}>{stepTitles[step]}</h3>
                      <p style={{ margin:0, color:'#a1a1aa', fontSize:'0.82rem' }}>{stepSubtitles[step]}</p>
                    </div>

                    {/* Animated content */}
                    <div className={animating ? '' : dir === 'forward' ? 'step-forward' : 'step-back'}>
                      {!animating && stepContent[step]}
                    </div>

                    {/* API error */}
                    {apiError && (
                      <div style={{ marginTop:12, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', color:'#dc2626', fontSize:'0.8rem' }}>
                        ⚠ {apiError}
                      </div>
                    )}

                    {/* Nav buttons */}
                    <div style={{ display:'flex', gap:10, marginTop:22 }}>
                      {step > 0 && (
                        <button onClick={() => goTo(step - 1)} style={{ flex:'0 0 auto', background:'#f4f0ff', color:'#7c3aed', border:'none', borderRadius:10, padding:'12px 16px', fontWeight:700, fontSize:'0.86rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:5 }}>
                          <IconArrow dir="left"/> Atrás
                        </button>
                      )}
                      <button
                        onClick={() => { if (step < TOTAL_STEPS - 1) goTo(step + 1); else handleSubmit(); }}
                        disabled={!canAdvance() || isSubmitting}
                        style={{ flex:1, background: (!canAdvance() || isSubmitting) ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#a855f7)', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontWeight:700, fontSize:'0.93rem', cursor:(!canAdvance() || isSubmitting) ? 'not-allowed' : 'pointer', fontFamily:"'Sora',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:(canAdvance() && !isSubmitting) ? '0 5px 16px rgba(124,58,237,0.3)' : 'none', transition:'all 0.2s' }}
                      >
                        {isSubmitting
                          ? <><svg width="16" height="16" viewBox="0 0 16 16" style={{ animation:'spin 0.8s linear infinite' }}><circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" fill="none"/><path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg> Registrando...</>
                          : step < TOTAL_STEPS - 1
                            ? <>Continuar <IconArrow/></>
                            : <>Finalizar registro <IconCheck/></>}
                      </button>
                    </div>

                    {/* Progress dots */}
                    <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
                      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div key={i} style={{ width: i === step ? 22 : 6, height:6, borderRadius:3, background: i === step ? '#7c3aed' : i < step ? '#a78bfa' : '#e4d9fe', transition:'all 0.3s ease' }}/>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}