import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import {
  Dumbbell, Flame, Moon, Zap, Activity, TrendingDown, Ruler,
  CheckCircle2, Circle, AlertTriangle, ChevronRight, Utensils,
  Pill, Footprints, Heart, Calendar, Target
} from 'lucide-react';

// ════════════════════════════════════════════════════════
// KALICI DEPOLAMA — tarayıcı localStorage kullanır
// Sayfa kapanıp açılsa da, gün değişse de veri silinmez.
// ════════════════════════════════════════════════════════

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      // depolama dolu veya kullanılamıyor — sessizce geç
    }
  }, [key, state]);

  return [state, setState];
}

// ════════════════════════════════════════════════════════
// SABİT PROGRAM VERİSİ — gerçek program, mock değil
// ════════════════════════════════════════════════════════

const START_DATE = '2026-06-25';
const PROFILE = {
  startWeight: 104.7,
  targetWeight: 78,
  startWaist: 113, // göbek
  startBelt: 109,  // bel / love handles
  height: 184,
  age: 20,
  bmr: 2090,
  tdee: 3030,
  targetCalories: 2300,
  deficit: 730,
  expectedWeeklyLoss: [0.65, 0.75],
};

const MACRO_TARGETS = { protein: 215, carbs: 180, fat: 75, kcal: 2300 };

const TRAINING_DAYS = [
  {
    id: 'push',
    label: 'Push',
    fullName: 'Gün 1 — Push (İtme)',
    color: '#2D5BFF',
    exercises: [
      { name: 'Barbell Bench Press', sets: '4 x 6-10', note: 'Chest press alternatifi', star: false },
      { name: 'Incline Dumbbell Press', sets: '3 x 10-12', note: 'Üst göğüs', star: false },
      { name: 'Dumbbell Flyes', sets: '3 x 12-15', note: 'Peck deck alternatifi', star: false },
      { name: 'Dumbbell Shoulder Press', sets: '3 x 10-12', note: 'Anterior + medial delt', star: false },
      { name: 'Lateral Raise', sets: '4 x 15-20', note: 'Medial delt — V-taper kritik', star: true },
      { name: 'Triceps Pushdown (kablo)', sets: '3 x 12', note: 'Triceps', star: false },
      { name: 'Plank', sets: '3 x 45sn', note: 'Core stabilizasyon', star: false },
    ],
  },
  {
    id: 'pull',
    label: 'Pull',
    fullName: 'Gün 2 — Pull (Çekme)',
    color: '#1E9E5A',
    exercises: [
      { name: 'Lat Pulldown / Pull-up', sets: '4 x 8-12', note: 'Lat genişliği — V-taper kritik', star: true },
      { name: 'Barbell / Dumbbell Row', sets: '4 x 10', note: 'Mid-back kalınlık', star: false },
      { name: 'Face Pull (kablo)', sets: '3 x 15-20', note: 'Arka omuz makinesi alternatifi', star: false },
      { name: 'Reverse Dumbbell Flyes', sets: '3 x 15', note: 'Arka omuz makinesi alternatifi', star: false },
      { name: 'Dumbbell Lateral Raise', sets: '3 x 15', note: 'Medial delt — 2. frekans', star: true },
      { name: 'Barbell Curl', sets: '3 x 10', note: 'Biceps', star: false },
      { name: 'Cable Crunch', sets: '3 x 15', note: 'Üst karın', star: false },
    ],
  },
  {
    id: 'legs',
    label: 'Legs',
    fullName: 'Gün 3 — Legs (Bacak)',
    color: '#C7670E',
    exercises: [
      { name: 'Barbell Squat', sets: '4 x 6-10', note: 'İlk 2 hafta — TEKNİK ÖNCELİKLİ', star: false },
      { name: 'Romanian Deadlift', sets: '4 x 8-10', note: 'İlk 2 hafta — TEKNİK ÖNCELİKLİ', star: false },
      { name: 'Leg Press', sets: '3 x 12-15', note: 'Quad hacim', star: false },
      { name: 'Walking Lunge', sets: '3 x 12/taraf', note: 'Unilateral quad + glute', star: false },
      { name: 'Leg Curl', sets: '3 x 12', note: 'Hamstring izolasyon', star: false },
      { name: 'Calf Raise', sets: '4 x 15', note: 'Gastrocnemius', star: false },
      { name: 'Hanging Leg Raise', sets: '3 x 12', note: 'Alt karın', star: false },
    ],
  },
  {
    id: 'hiit',
    label: 'HIIT',
    fullName: 'Gün 4 — HIIT + Core',
    color: '#B8551E',
    exercises: [
      { name: 'Isınma', sets: '5 dk', note: 'Yürüyüş veya hafif bisiklet', star: false },
      { name: 'HIIT Sprint Protokolü', sets: '8-10 tur', note: '30sn sprint / 90sn yürüyüş', star: false },
      { name: 'Soğuma', sets: '5 dk', note: 'Yavaş tempo', star: false },
      { name: 'Ab Wheel', sets: '3 x 10', note: 'Core', star: false },
      { name: 'Cable Woodchop', sets: '3 x 12/taraf', note: 'Core rotasyon', star: false },
      { name: 'Plank Variations', sets: '3 x 45-60sn', note: 'Core stabilizasyon', star: false },
    ],
  },
];

const RIR_STEPS = [
  { label: 'Set 1', value: 'RIR 2', active: false },
  { label: 'Set 2', value: 'RIR 2', active: false },
  { label: 'Set 3', value: 'RIR 1', active: false },
  { label: 'Son Set', value: 'RIR 0 — Failure', active: true },
];

const MEALS = [
  {
    id: 'm1', name: 'Öğün 1', time: '08:00', kcal: 560,
    macros: { p: 42, k: 55, y: 20 },
    content: '4 yumurta (2 tam + 2 ak) · 60g yulaf (su ile) · 1 tatlı kaşığı bal + tarçın',
  },
  {
    id: 'm2', name: 'Öğün 2', time: '13:30', kcal: 610,
    macros: { p: 55, k: 60, y: 15 },
    content: '230g tavuk göğsü ızgara · 120g bulgur (kuru) · yeşillik + 1yk zeytinyağı',
  },
  {
    id: 'm3', name: 'Öğün 3', time: '19:30', kcal: 720,
    macros: { p: 63, k: 55, y: 30 },
    content: '220g dana kıyma / somon · 40g whey izolat · 150g tatlı patates · brokoli',
  },
  {
    id: 'm4', name: 'Ara Öğün', time: '16:00', kcal: 180,
    macros: { p: 12, k: 15, y: 10 },
    content: '20g badem + 1 elma (opsiyonel, açlık halinde)',
    optional: true,
  },
];

const SUPPLEMENTS = [
  { id: 's1', name: 'Whey izolat', dose: '40-60g', time: 'Antrenman sonrası' },
  { id: 's2', name: 'Kreatin monohidrat', dose: '5g', time: 'Herhangi bir saat' },
  { id: 's3', name: 'D vitamini', dose: '2000-4000 IU', time: 'Sabah, yemekle' },
  { id: 's4', name: 'Omega-3', dose: '2-3g EPA+DHA', time: 'Yemekle' },
  { id: 's5', name: 'Multivitamin', dose: '1 tablet', time: 'Sabah' },
];

// Haftanın gününe göre antrenman döngüsü: Pzt=Push Sal=Pull Çar=Legs Per=HIIT Cum=Push Cmt=Pull Paz=dinlenme
const DAY_CYCLE = ['rest', 'push', 'pull', 'legs', 'hiit', 'push', 'pull'];
// index 0 = Pazar ... getDay() js standardına göre 0=Pazar

function getTodayTraining() {
  const day = new Date().getDay();
  const cycleId = DAY_CYCLE[day];
  if (cycleId === 'rest') return null;
  return TRAINING_DAYS.find(d => d.id === cycleId);
}

function daysSinceStart() {
  const start = new Date(START_DATE);
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// ════════════════════════════════════════════════════════
// STYLE TOKENS
// ════════════════════════════════════════════════════════

const COLORS = {
  bg: '#0F1115',
  panel: '#161922',
  panelAlt: '#1C2029',
  border: '#272B36',
  borderLight: '#333844',
  text: '#E8EAED',
  textDim: '#8B919E',
  textFaint: '#5A6070',
  accent: '#FF5A1F',
  accentDim: '#3A2418',
  blue: '#2D5BFF',
  green: '#1E9E5A',
  amber: '#D9A11C',
  red: '#E5484D',
};

const fontStack = `'IBM Plex Mono', 'SF Mono', Consolas, monospace`;
const fontBody = `'Inter', -apple-system, sans-serif`;

// ════════════════════════════════════════════════════════
// COMPONENTS
// ════════════════════════════════════════════════════════

function StatTile({ icon: Icon, label, value, unit, accent }) {
  return (
    <div style={{
      background: COLORS.panel, border: `1px solid ${COLORS.border}`,
      borderRadius: 4, padding: '14px 16px', flex: 1, minWidth: 130,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color={accent || COLORS.textDim} strokeWidth={2} />
        <span style={{
          fontFamily: fontStack, fontSize: 10, color: COLORS.textDim,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{ fontFamily: fontStack, fontSize: 22, fontWeight: 600, color: COLORS.text }}>
        {value}<span style={{ fontSize: 12, color: COLORS.textDim, marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
      paddingBottom: 8, borderBottom: `1px solid ${COLORS.border}`,
    }}>
      {Icon && <Icon size={14} color={COLORS.accent} strokeWidth={2.2} />}
      <span style={{
        fontFamily: fontStack, fontSize: 11, color: COLORS.textDim,
        letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
      }}>{children}</span>
    </div>
  );
}

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', fontFamily: fontStack, fontSize: 11.5,
        letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
        background: active ? COLORS.accent : 'transparent',
        color: active ? '#1A0E08' : COLORS.textDim,
        border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
        borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s ease',
      }}
    >
      {Icon && <Icon size={13} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function ProgressBar({ value, target, color, label }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: fontStack, fontSize: 10.5, color: COLORS.textDim, letterSpacing: '0.03em' }}>{label}</span>
        <span style={{ fontFamily: fontStack, fontSize: 10.5, color: COLORS.text }}>{value} / {target}g</span>
      </div>
      <div style={{ height: 5, background: COLORS.panelAlt, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          transition: 'width 0.4s ease', borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

// ───────────────────────── TODAY TAB ─────────────────────────

function TodayTab({ logs, addLog }) {
  const today = getTodayTraining();
  const dayNum = daysSinceStart() + 1;
  const [form, setForm] = useState({ weight: '', sleep: '', sleepQuality: 5, energy: 5, hr: '', trained: null });
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find(l => l.date === todayKey);

  const lastWeight = logs.length ? logs[logs.length - 1].weight : PROFILE.startWeight;

  // 14 gün sabit tartı uyarısı
  const plateauWarning = useMemo(() => {
    if (logs.length < 14) return false;
    const last14 = logs.slice(-14).map(l => l.weight).filter(Boolean);
    if (last14.length < 14) return false;
    const range = Math.max(...last14) - Math.min(...last14);
    return range < 0.4;
  }, [logs]);

  const handleSubmit = () => {
    if (!form.weight) return;
    addLog({
      date: todayKey,
      weight: parseFloat(form.weight),
      sleep: form.sleep,
      sleepQuality: form.sleepQuality,
      energy: form.energy,
      hr: form.hr,
      trained: form.trained,
    });
    setForm({ weight: '', sleep: '', sleepQuality: 5, energy: 5, hr: '', trained: null });
  };

  return (
    <div>
      {plateauWarning && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#2A1F0E', border: `1px solid ${COLORS.amber}`,
          borderRadius: 4, padding: '12px 14px', marginBottom: 18,
        }}>
          <AlertTriangle size={16} color={COLORS.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: fontBody, fontSize: 12.5, color: '#E8C875', lineHeight: 1.5 }}>
            <strong>Plato tespit edildi.</strong> Son 14 günde tartı sabit kaldı. Kaloriyi 150–200 kcal düşür
            veya 1 refeed günü uygula. Bu adaptasyon, başarısızlık değil.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatTile icon={Calendar} label="Gün" value={dayNum} unit="/ 150" accent={COLORS.accent} />
        <StatTile icon={Activity} label="Güncel Kilo" value={lastWeight} unit="kg" />
        <StatTile icon={Target} label="Hedef" value={PROFILE.targetWeight} unit="kg" />
        <StatTile icon={TrendingDown} label="Kalan" value={(lastWeight - PROFILE.targetWeight).toFixed(1)} unit="kg" accent={COLORS.green} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Bugünün antrenmanı */}
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18 }}>
          <SectionLabel icon={Dumbbell}>Bugünün Antrenmanı</SectionLabel>
          {today ? (
            <div>
              <div style={{
                display: 'inline-block', padding: '4px 10px', borderRadius: 3,
                background: today.color + '22', border: `1px solid ${today.color}55`,
                fontFamily: fontStack, fontSize: 11, color: today.color, fontWeight: 600,
                marginBottom: 12, letterSpacing: '0.03em',
              }}>
                {today.fullName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {today.exercises.slice(0, 4).map((ex, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: fontBody, fontSize: 12.5, color: COLORS.text,
                    padding: '6px 0', borderBottom: i < 3 ? `1px solid ${COLORS.border}` : 'none',
                  }}>
                    <span>{ex.star && '★ '}{ex.name}</span>
                    <span style={{ color: COLORS.textDim, fontFamily: fontStack, fontSize: 11 }}>{ex.sets}</span>
                  </div>
                ))}
                {today.exercises.length > 4 && (
                  <div style={{ fontFamily: fontStack, fontSize: 10.5, color: COLORS.textFaint, marginTop: 4 }}>
                    +{today.exercises.length - 4} hareket daha — Antrenman sekmesinde
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: fontBody, fontSize: 13, color: COLORS.textDim, padding: '20px 0', textAlign: 'center' }}>
              Bugün dinlenme günü. Uyku ve toparlanma öncelik.
            </div>
          )}
        </div>

        {/* Sabah raporu formu */}
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18 }}>
          <SectionLabel icon={Heart}>Sabah Raporu</SectionLabel>
          {todayLog ? (
            <div style={{ fontFamily: fontBody, fontSize: 13, color: COLORS.green, display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0' }}>
              <CheckCircle2 size={18} /> Bugünün raporu girildi: {todayLog.weight} kg
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Aç karnına kilo (kg)" value={form.weight}
                     onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="104.2" />
              <div style={{ display: 'flex', gap: 10 }}>
                <Field label="Uyku (saat)" value={form.sleep}
                       onChange={v => setForm(f => ({ ...f, sleep: v }))} placeholder="7.5" />
                <Field label="Nabız (ort.)" value={form.hr}
                       onChange={v => setForm(f => ({ ...f, hr: v }))} placeholder="138" />
              </div>
              <SliderField label={`Enerji: ${form.energy}/10`} value={form.energy}
                           onChange={v => setForm(f => ({ ...f, energy: v }))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setForm(f => ({ ...f, trained: true }))}
                        style={pillBtnStyle(form.trained === true, COLORS.green)}>Antrenman yapıldı</button>
                <button onClick={() => setForm(f => ({ ...f, trained: false }))}
                        style={pillBtnStyle(form.trained === false, COLORS.textFaint)}>Yapılmadı</button>
              </div>
              <button onClick={handleSubmit} style={{
                marginTop: 4, padding: '10px', background: COLORS.accent, color: '#1A0E08',
                border: 'none', borderRadius: 3, fontFamily: fontStack, fontSize: 11.5,
                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
              }}>Raporu Kaydet</button>
            </div>
          )}
        </div>
      </div>

      {/* Günlük kalori/makro hedefi */}
      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18, marginTop: 16 }}>
        <SectionLabel icon={Flame}>Günlük Hedef</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: fontStack, fontSize: 28, fontWeight: 700, color: COLORS.text }}>{MACRO_TARGETS.kcal}</span>
          <span style={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textDim }}>kcal · açık: -{PROFILE.deficit} kcal</span>
        </div>
        <ProgressBar value={0} target={MACRO_TARGETS.protein} color={COLORS.blue} label="PROTEİN" />
        <ProgressBar value={0} target={MACRO_TARGETS.carbs} color={COLORS.green} label="KARBONHİDRAT" />
        <ProgressBar value={0} target={MACRO_TARGETS.fat} color={COLORS.amber} label="YAĞ" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontFamily: fontStack, fontSize: 9.5, color: COLORS.textFaint, letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
        {label.toUpperCase()}
      </label>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`,
          borderRadius: 3, padding: '8px 10px', color: COLORS.text,
          fontFamily: fontStack, fontSize: 13, outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function SliderField({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontFamily: fontStack, fontSize: 9.5, color: COLORS.textFaint, letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      <input
        type="range" min="1" max="10" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: COLORS.accent }}
      />
    </div>
  );
}

function pillBtnStyle(active, color) {
  return {
    flex: 1, padding: '8px', borderRadius: 3, cursor: 'pointer',
    fontFamily: fontStack, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em',
    background: active ? color + '22' : 'transparent',
    border: `1px solid ${active ? color : COLORS.border}`,
    color: active ? color : COLORS.textDim,
  };
}

// ───────────────────────── TRAINING TAB ─────────────────────────

function TrainingTab() {
  const [activeDay, setActiveDay] = useState(TRAINING_DAYS[0].id);
  const [completed, setCompleted] = usePersistentState('body_completed_exercises', {});
  const day = TRAINING_DAYS.find(d => d.id === activeDay);

  const toggleExercise = (exName) => {
    const key = `${activeDay}-${exName}`;
    setCompleted(c => ({ ...c, [key]: !c[key] }));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TRAINING_DAYS.map(d => (
          <button key={d.id} onClick={() => setActiveDay(d.id)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: fontStack, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
                    background: activeDay === d.id ? d.color + '22' : COLORS.panel,
                    border: `1px solid ${activeDay === d.id ? d.color : COLORS.border}`,
                    color: activeDay === d.id ? d.color : COLORS.textDim,
                    textTransform: 'uppercase',
                  }}>
            {d.label}
          </button>
        ))}
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18 }}>
        <div style={{ fontFamily: fontStack, fontSize: 13, fontWeight: 700, color: day.color, marginBottom: 4 }}>
          {day.fullName}
        </div>
        <div style={{ fontFamily: fontBody, fontSize: 11.5, color: COLORS.textFaint, marginBottom: 16 }}>
          ★ işaretli hareketler V-taper için önceliklidir
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {day.exercises.map((ex, i) => {
            const key = `${activeDay}-${ex.name}`;
            const done = completed[key];
            return (
              <div key={i}
                   onClick={() => toggleExercise(ex.name)}
                   style={{
                     display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
                     borderBottom: i < day.exercises.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                     cursor: 'pointer', opacity: done ? 0.5 : 1,
                   }}>
                {done ? <CheckCircle2 size={17} color={COLORS.green} /> : <Circle size={17} color={COLORS.textFaint} />}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: fontBody, fontSize: 13.5, color: ex.star ? day.color : COLORS.text,
                    fontWeight: ex.star ? 600 : 400, textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {ex.star && '★ '}{ex.name}
                  </div>
                  <div style={{ fontFamily: fontBody, fontSize: 11, color: COLORS.textFaint, marginTop: 2 }}>{ex.note}</div>
                </div>
                <div style={{ fontFamily: fontStack, fontSize: 12.5, color: COLORS.textDim, whiteSpace: 'nowrap' }}>
                  {ex.sets}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18, marginTop: 16 }}>
        <SectionLabel icon={Zap}>RIR Protokolü</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {RIR_STEPS.map((step, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '12px 6px', borderRadius: 4,
              background: step.active ? COLORS.accentDim : COLORS.panelAlt,
              border: `1px solid ${step.active ? COLORS.accent : COLORS.border}`,
            }}>
              <div style={{ fontFamily: fontStack, fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>{step.label}</div>
              <div style={{ fontFamily: fontStack, fontSize: 12, fontWeight: 700, color: step.active ? COLORS.accent : COLORS.text }}>
                {step.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── NUTRITION TAB ─────────────────────────

function NutritionTab() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [eaten, setEaten] = usePersistentState(`body_meals_${todayKey}`, {});
  const [customFoods, setCustomFoods] = usePersistentState(`body_custom_foods_${todayKey}`, []);
  const [customForm, setCustomForm] = useState({ name: '', kcal: '', p: '', k: '', y: '' });

  const totalKcal = MEALS.filter(m => eaten[m.id]).reduce((s, m) => s + m.kcal, 0)
    + customFoods.reduce((s, f) => s + (parseFloat(f.kcal) || 0), 0);
  const totalP = MEALS.filter(m => eaten[m.id]).reduce((s, m) => s + m.macros.p, 0)
    + customFoods.reduce((s, f) => s + (parseFloat(f.p) || 0), 0);
  const totalK = MEALS.filter(m => eaten[m.id]).reduce((s, m) => s + m.macros.k, 0)
    + customFoods.reduce((s, f) => s + (parseFloat(f.k) || 0), 0);
  const totalY = MEALS.filter(m => eaten[m.id]).reduce((s, m) => s + m.macros.y, 0)
    + customFoods.reduce((s, f) => s + (parseFloat(f.y) || 0), 0);

  const [supDone, setSupDone] = usePersistentState(`body_supplements_${todayKey}`, {});

  const addCustomFood = () => {
    if (!customForm.name || !customForm.kcal) return;
    setCustomFoods(prev => [...prev, { ...customForm, id: Date.now().toString() }]);
    setCustomForm({ name: '', kcal: '', p: '', k: '', y: '' });
  };

  const removeCustomFood = (id) => {
    setCustomFoods(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
      <div>
        <SectionLabel icon={Utensils}>Günlük Öğünler</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MEALS.map(meal => {
            const done = eaten[meal.id];
            return (
              <div key={meal.id}
                   style={{
                     background: COLORS.panel, border: `1px solid ${done ? COLORS.green : COLORS.border}`,
                     borderRadius: 4, padding: 14, opacity: meal.optional && !done ? 0.85 : 1,
                   }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: fontStack, fontSize: 13, fontWeight: 700, color: COLORS.text }}>{meal.name}</span>
                      <span style={{ fontFamily: fontStack, fontSize: 10.5, color: COLORS.textFaint }}>{meal.time}</span>
                      {meal.optional && (
                        <span style={{ fontFamily: fontStack, fontSize: 9, color: COLORS.textFaint, border: `1px solid ${COLORS.border}`, padding: '1px 6px', borderRadius: 8 }}>
                          OPSİYONEL
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: fontBody, fontSize: 12, color: COLORS.textDim, marginTop: 5, lineHeight: 1.5 }}>
                      {meal.content}
                    </div>
                  </div>
                  <button onClick={() => setEaten(e => ({ ...e, [meal.id]: !e[meal.id] }))}
                          style={{
                            flexShrink: 0, marginLeft: 12,
                            background: done ? COLORS.green + '22' : 'transparent',
                            border: `1px solid ${done ? COLORS.green : COLORS.border}`,
                            borderRadius: 3, padding: '5px 6px', cursor: 'pointer',
                          }}>
                    {done ? <CheckCircle2 size={15} color={COLORS.green} /> : <Circle size={15} color={COLORS.textFaint} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 14, fontFamily: fontStack, fontSize: 11, color: COLORS.textDim }}>
                  <span>{meal.kcal} kcal</span>
                  <span style={{ color: COLORS.blue }}>P {meal.macros.p}g</span>
                  <span style={{ color: COLORS.green }}>K {meal.macros.k}g</span>
                  <span style={{ color: COLORS.amber }}>Y {meal.macros.y}g</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manuel besin girişi */}
        <div style={{ marginTop: 20 }}>
          <SectionLabel icon={Utensils}>Ek Besin Girişi (Manuel)</SectionLabel>
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 14, marginBottom: 10 }}>
            <div style={{ marginBottom: 8 }}>
              <Field label="Besin adı" value={customForm.name}
                     onChange={v => setCustomForm(f => ({ ...f, name: v }))} placeholder="örn. muz, simit, döner" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Field label="Kcal" value={customForm.kcal}
                     onChange={v => setCustomForm(f => ({ ...f, kcal: v }))} placeholder="250" />
              <Field label="Protein (g)" value={customForm.p}
                     onChange={v => setCustomForm(f => ({ ...f, p: v }))} placeholder="20" />
              <Field label="Karb (g)" value={customForm.k}
                     onChange={v => setCustomForm(f => ({ ...f, k: v }))} placeholder="30" />
              <Field label="Yağ (g)" value={customForm.y}
                     onChange={v => setCustomForm(f => ({ ...f, y: v }))} placeholder="8" />
            </div>
            <button onClick={addCustomFood} style={{
              width: '100%', padding: '9px', background: COLORS.accent, color: '#1A0E08',
              border: 'none', borderRadius: 3, fontFamily: fontStack, fontSize: 11.5,
              fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
            }}>Ekle</button>
          </div>

          {customFoods.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {customFoods.map(food => (
                <div key={food.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`,
                  borderRadius: 4, padding: '8px 12px',
                }}>
                  <div>
                    <span style={{ fontFamily: fontBody, fontSize: 12.5, color: COLORS.text }}>{food.name}</span>
                    <span style={{ fontFamily: fontStack, fontSize: 10.5, color: COLORS.textFaint, marginLeft: 10 }}>
                      {food.kcal} kcal · P{food.p || 0} K{food.k || 0} Y{food.y || 0}
                    </span>
                  </div>
                  <button onClick={() => removeCustomFood(food.id)}
                          style={{ background: 'transparent', border: 'none', color: COLORS.textFaint, cursor: 'pointer', fontSize: 14 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionLabel icon={Flame}>Günlük Toplam</SectionLabel>
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: fontStack, fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 2 }}>
            {totalKcal}<span style={{ fontSize: 13, color: COLORS.textDim }}> / {MACRO_TARGETS.kcal} kcal</span>
          </div>
          <div style={{ height: 5, background: COLORS.panelAlt, borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, totalKcal / MACRO_TARGETS.kcal * 100)}%`, background: COLORS.accent }} />
          </div>
          <ProgressBar value={totalP} target={MACRO_TARGETS.protein} color={COLORS.blue} label="PROTEİN" />
          <ProgressBar value={totalK} target={MACRO_TARGETS.carbs} color={COLORS.green} label="KARBONHİDRAT" />
          <ProgressBar value={totalY} target={MACRO_TARGETS.fat} color={COLORS.amber} label="YAĞ" />
        </div>

        <SectionLabel icon={Pill}>Supplement</SectionLabel>
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 12 }}>
          {SUPPLEMENTS.map((sup, i) => {
            const done = supDone[sup.id];
            return (
              <div key={sup.id}
                   onClick={() => setSupDone(d => ({ ...d, [sup.id]: !d[sup.id] }))}
                   style={{
                     display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px',
                     borderBottom: i < SUPPLEMENTS.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                     cursor: 'pointer', opacity: done ? 0.5 : 1,
                   }}>
                {done ? <CheckCircle2 size={15} color={COLORS.green} /> : <Circle size={15} color={COLORS.textFaint} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: fontBody, fontSize: 12.5, color: COLORS.text, textDecoration: done ? 'line-through' : 'none' }}>
                    {sup.name}
                  </div>
                  <div style={{ fontFamily: fontStack, fontSize: 10, color: COLORS.textFaint }}>{sup.dose} · {sup.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── PROGRESS TAB ─────────────────────────

function ProgressTab({ logs, addMeasurement }) {
  const [waistInput, setWaistInput] = useState('');
  const [beltInput, setBeltInput] = useState('');

  const chartData = useMemo(() => {
    const base = [{ day: 0, weight: PROFILE.startWeight, label: 'Başlangıç' }];
    logs.forEach((l, i) => base.push({ day: i + 1, weight: l.weight, label: l.date.slice(5) }));
    return base;
  }, [logs]);

  const measurements = useMemo(() => {
    const base = [{ day: 0, waist: PROFILE.startWaist, belt: PROFILE.startBelt }];
    logs.filter(l => l.waist || l.belt).forEach((l, i) => {
      base.push({ day: i + 1, waist: l.waist || base[base.length - 1].waist, belt: l.belt || base[base.length - 1].belt });
    });
    return base;
  }, [logs]);

  const plateauWarning = useMemo(() => {
    if (logs.length < 14) return false;
    const last14 = logs.slice(-14).map(l => l.weight).filter(Boolean);
    if (last14.length < 14) return false;
    return Math.max(...last14) - Math.min(...last14) < 0.4;
  }, [logs]);

  const handleMeasurementSubmit = () => {
    if (!waistInput && !beltInput) return;
    addMeasurement({
      waist: waistInput ? parseFloat(waistInput) : undefined,
      belt: beltInput ? parseFloat(beltInput) : undefined,
    });
    setWaistInput('');
    setBeltInput('');
  };

  return (
    <div>
      {plateauWarning && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#2A1F0E', border: `1px solid ${COLORS.amber}`,
          borderRadius: 4, padding: '12px 14px', marginBottom: 18,
        }}>
          <AlertTriangle size={16} color={COLORS.amber} />
          <span style={{ fontFamily: fontBody, fontSize: 12.5, color: '#E8C875' }}>
            14 gün üst üste tartı sabit — kaloriyi 150-200 kcal düşür veya refeed günü uygula.
          </span>
        </div>
      )}

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18, marginBottom: 16 }}>
        <SectionLabel icon={TrendingDown}>Kilo Grafiği</SectionLabel>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="2 4" />
            <XAxis dataKey="day" stroke={COLORS.textFaint} tick={{ fontSize: 10, fontFamily: fontStack }} />
            <YAxis domain={[75, 108]} stroke={COLORS.textFaint} tick={{ fontSize: 10, fontFamily: fontStack }} />
            <Tooltip contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, fontFamily: fontStack, fontSize: 11 }} />
            <ReferenceLine y={PROFILE.targetWeight} stroke={COLORS.green} strokeDasharray="4 4" label={{ value: 'Hedef 78kg', fill: COLORS.green, fontSize: 10, fontFamily: fontStack }} />
            <Line type="monotone" dataKey="weight" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 3, fill: COLORS.accent }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18, marginBottom: 16 }}>
        <SectionLabel icon={Ruler}>Ölçüm Takibi</SectionLabel>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={measurements} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="2 4" />
            <XAxis dataKey="day" stroke={COLORS.textFaint} tick={{ fontSize: 10, fontFamily: fontStack }} />
            <YAxis domain={[80, 116]} stroke={COLORS.textFaint} tick={{ fontSize: 10, fontFamily: fontStack }} />
            <Tooltip contentStyle={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, fontFamily: fontStack, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontFamily: fontStack, fontSize: 11 }} />
            <Line type="monotone" dataKey="waist" name="Göbek (cm)" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="belt" name="Bel (cm)" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: 18 }}>
        <SectionLabel icon={Ruler}>Haftalık Ölçüm Girişi</SectionLabel>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Field label="Göbek (cm)" value={waistInput} onChange={setWaistInput} placeholder="111" />
          <Field label="Bel (cm)" value={beltInput} onChange={setBeltInput} placeholder="107" />
          <button onClick={handleMeasurementSubmit} style={{
            padding: '8px 16px', background: COLORS.accent, color: '#1A0E08',
            border: 'none', borderRadius: 3, fontFamily: fontStack, fontSize: 11.5,
            fontWeight: 700, cursor: 'pointer', height: 36,
          }}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════

export default function BodyDashboard() {
  const [tab, setTab] = useState('today');
  const [logs, setLogs] = usePersistentState('body_daily_logs', []);

  const addLog = (entry) => setLogs(prev => {
    const existing = prev.findIndex(l => l.date === entry.date);
    if (existing >= 0) {
      const copy = [...prev];
      copy[existing] = { ...copy[existing], ...entry };
      return copy;
    }
    return [...prev, entry].sort((a, b) => a.date.localeCompare(b.date));
  });

  const addMeasurement = (measurement) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setLogs(prev => {
      const existing = prev.findIndex(l => l.date === todayKey);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], ...measurement };
        return copy;
      }
      // o gün için sabah raporu henüz girilmemişse, sadece ölçüm için yeni satır aç
      return [...prev, { date: todayKey, ...measurement }].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  return (
    <div style={{
      background: COLORS.bg, minHeight: '100vh', padding: '28px 24px',
      fontFamily: fontBody, color: COLORS.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        input[type="range"] { height: 4px; border-radius: 2px; background: ${COLORS.panelAlt}; -webkit-appearance: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${COLORS.accent}; cursor: pointer; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: fontStack, fontSize: 11, color: COLORS.accent, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>
              BODY — PERFORMANS LOG
            </div>
            <div style={{ fontFamily: fontStack, fontSize: 22, fontWeight: 700, color: COLORS.text }}>
              Faz 1 · 104.7kg → 78kg
            </div>
          </div>
          <div style={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textFaint, textAlign: 'right' }}>
            BAŞLANGIÇ: 17.06.2026<br/>BMR {PROFILE.bmr} · TDEE {PROFILE.tdee}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          <TabButton active={tab === 'today'} onClick={() => setTab('today')} icon={Footprints}>Bugün</TabButton>
          <TabButton active={tab === 'training'} onClick={() => setTab('training')} icon={Dumbbell}>Antrenman</TabButton>
          <TabButton active={tab === 'nutrition'} onClick={() => setTab('nutrition')} icon={Utensils}>Beslenme</TabButton>
          <TabButton active={tab === 'progress'} onClick={() => setTab('progress')} icon={TrendingDown}>İlerleme</TabButton>
        </div>

        {tab === 'today' && <TodayTab logs={logs} addLog={addLog} />}
        {tab === 'training' && <TrainingTab />}
        {tab === 'nutrition' && <NutritionTab />}
        {tab === 'progress' && <ProgressTab logs={logs} addMeasurement={addMeasurement} />}
      </div>
    </div>
  );
}
