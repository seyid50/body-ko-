import React, { useState, useEffect, useMemo } from "react";

const START_DATE = new Date(2026, 5, 29); // 29.06.2026
const STORAGE_KEY = "body_dashboard_v1";
const BASE_KCAL = 2000; // Sabit günlük temel alım — her gün otomatik sayılır

const defaultState = {
  kcalTarget: 2300,
  proteinTarget: 215,
  carbTarget: 180,
  fatTarget: 75,
  days: {} // { "2026-06-29": { water, steps, sleep, energy, sleepQuality, activities:[], foods:[] } }
};

const measurementsDefault = []; // [{date, weight, waist}]

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function fmtDate(d) {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dayNumber() {
  const today = new Date();
  const d0 = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
  const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((d1 - d0) / 86400000) + 1;
  return diff < 1 ? 1 : diff;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("State load error", e);
  }
  return { ...defaultState, measurements: measurementsDefault };
}

function emptyDay() {
  return { water: 0, steps: "", sleep: "", energy: null, sleepQuality: null, activities: [], foods: [] };
}

function LineChart({ data, color, height = 160, width = 320 }) {
  if (data.length < 2) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#a9a9bd" fontSize="12">
          En az 2 ölçüm gerekli
        </text>
      </svg>
    );
  }
  const padX = 20, padY = 20;
  const w = width - padX * 2, h = height - padY * 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * w;
    const y = padY + h - ((v - min) / range) * h;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={color} />
      ))}
    </svg>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("bugun");
  const [actForm, setActForm] = useState({ type: "Ağırlık", duration: "", name: "", kcal: "" });
  const [foodForm, setFoodForm] = useState({ name: "", kcal: "", p: "", c: "", f: "" });
  const [measureForm, setMeasureForm] = useState({ weight: "", waist: "" });

  const tKey = todayKey();
  const today = state.days[tKey] || emptyDay();
  const measurements = state.measurements || [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function updateToday(patch) {
    setState((s) => ({
      ...s,
      days: { ...s.days, [tKey]: { ...(s.days[tKey] || emptyDay()), ...patch } }
    }));
  }

  function addWater() {
    updateToday({ water: (today.water || 0) + 250 });
  }

  function addActivity() {
    if (!actForm.name && !actForm.duration) return;
    const list = [...(today.activities || []), { ...actForm, kcal: parseFloat(actForm.kcal) || 0 }];
    updateToday({ activities: list });
    setActForm({ type: "Ağırlık", duration: "", name: "", kcal: "" });
  }

  function removeActivity(i) {
    const list = [...(today.activities || [])];
    list.splice(i, 1);
    updateToday({ activities: list });
  }

  function addFood() {
    const p = parseFloat(foodForm.p) || 0;
    const c = parseFloat(foodForm.c) || 0;
    const f = parseFloat(foodForm.f) || 0;
    const kcal = parseFloat(foodForm.kcal) || 0;
    if (!foodForm.name && !kcal && !p && !c && !f) return;
    const list = [...(today.foods || []), { name: foodForm.name || "Besin", kcal, p, c, f }];
    updateToday({ foods: list });
    setFoodForm({ name: "", kcal: "", p: "", c: "", f: "" });
  }

  function removeFood(i) {
    const list = [...(today.foods || [])];
    list.splice(i, 1);
    updateToday({ foods: list });
  }

  function addMeasurement() {
    const w = parseFloat(measureForm.weight);
    const waist = parseFloat(measureForm.waist);
    if (!w && !waist) return;
    const entry = { date: fmtDate(new Date()), weight: w || null, waist: waist || null };
    setState((s) => ({ ...s, measurements: [...(s.measurements || []), entry] }));
    setMeasureForm({ weight: "", waist: "" });
  }

  function removeMeasurement(i) {
    setState((s) => {
      const list = [...(s.measurements || [])];
      list.splice(i, 1);
      return { ...s, measurements: list };
    });
  }

  const extraKcal = useMemo(
    () => Math.round((today.foods || []).reduce((s, f) => s + (f.kcal || 0), 0)),
    [today.foods]
  );
  const totalKcal = BASE_KCAL + extraKcal;
  const totalP = (today.foods || []).reduce((s, f) => s + f.p, 0);
  const totalC = (today.foods || []).reduce((s, f) => s + f.c, 0);
  const totalF = (today.foods || []).reduce((s, f) => s + f.f, 0);

  const weightSeries = measurements.filter((m) => m.weight).map((m) => m.weight);
  const waistSeries = measurements.filter((m) => m.waist).map((m) => m.waist);

  const plateau = useMemo(() => {
    if (weightSeries.length < 3) return null;
    const last3 = weightSeries.slice(-3);
    const change = Math.abs(last3[last3.length - 1] - last3[0]);
    const pct = (change / last3[0]) * 100;
    return pct < 0.5;
  }, [weightSeries]);

  function copySummary() {
    const last = measurements[measurements.length - 1] || {};
    const lines = [
      `📋 GÜNLÜK ÖZET — ${fmtDate(new Date())} (Gün ${dayNumber()})`,
      ``,
      `Kalori: ${totalKcal} / ${state.kcalTarget} kcal (Sabit ${BASE_KCAL} + Ekstra ${extraKcal})`,
      `Makrolar: P ${totalP}g · K ${totalC}g · Y ${totalF}g`,
      `Su: ${today.water || 0} ml`,
      `Adım: ${today.steps || "-"}`,
      `Uyku: ${today.sleep || "-"} saat (kalite: ${today.sleepQuality || "-"}/5)`,
      `Enerji: ${today.energy || "-"}/5`,
      ``,
      `Aktiviteler:`,
      (today.activities || []).length
        ? today.activities.map((a) => `- ${a.type} · ${a.name || ""} · ${a.duration || "-"}dk · ${a.kcal || 0}kcal`).join("\n")
        : "- (yok)",
      ``,
      `Ölçüm: ${last.weight ? last.weight + " kg" : "-"} ${last.waist ? "/ " + last.waist + " cm bel" : ""}`
    ];
    const text = lines.join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Özet kopyalandı ✅ Claude sohbetine yapıştırabilirsin."))
      .catch(() => alert("Kopyalama başarısız. Manuel kopyala:\n\n" + text));
  }

  const pct = (v, t) => Math.min(100, (v / t) * 100);

  return (
    <div className="bd-wrap">
      <style>{css}</style>

      <header className="bd-top">
        <div className="bd-brand">
          <div className="bd-dot" />
          <h1>BODY</h1>
        </div>
        <div className="bd-daycount">
          <span>Gün {dayNumber()}</span>
          <b>{fmtDate(new Date())}</b>
        </div>
      </header>

      <nav className="bd-tabs">
        {["bugun", "antrenman", "beslenme", "ilerleme"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {{ bugun: "Bugün", antrenman: "Antrenman", beslenme: "Beslenme", ilerleme: "İlerleme" }[t]}
          </button>
        ))}
      </nav>

      {tab === "bugun" && (
        <div className="bd-panel">
          <div className="bd-grid2">
            <div className="bd-card">
              <h3>🔥 Kalori</h3>
              <div className="bd-stat">{totalKcal}</div>
              <div className="bd-sub">/ {state.kcalTarget} kcal</div>
              <div className="bd-sub" style={{ marginTop: 4 }}>
                Sabit: {BASE_KCAL} + Ekstra: {extraKcal}
              </div>
              <div className="bd-track">
                <div className="bd-fill coral" style={{ width: pct(totalKcal, state.kcalTarget) + "%" }} />
              </div>
            </div>
            <div className="bd-card">
              <h3>💧 Su</h3>
              <div className="bd-stat">{today.water || 0} ml</div>
              <div className="bd-sub">Hedef: 2500 ml</div>
              <button className="bd-water-btn" onClick={addWater}>+ 250 ml</button>
            </div>
          </div>

          <div className="bd-grid2">
            <div className="bd-card">
              <h3>👟 Adım Sayısı</h3>
              <input type="number" placeholder="Örn: 8400" value={today.steps || ""} onChange={(e) => updateToday({ steps: e.target.value })} />
            </div>
            <div className="bd-card">
              <h3>🛏️ Uyku (saat)</h3>
              <input type="number" step="0.5" placeholder="Örn: 7.5" value={today.sleep || ""} onChange={(e) => updateToday({ sleep: e.target.value })} />
            </div>
          </div>

          <div className="bd-card">
            <h3>⚡ Enerji Seviyesi</h3>
            <div className="bd-pillrow">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={"bd-pill" + (today.energy === n ? " sel" : "")} onClick={() => updateToday({ energy: n })}>
                  {n}
                </div>
              ))}
            </div>
          </div>

          <div className="bd-card">
            <h3>😴 Uyku Kalitesi</h3>
            <div className="bd-pillrow">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={"bd-pill" + (today.sleepQuality === n ? " sel" : "")} onClick={() => updateToday({ sleepQuality: n })}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "antrenman" && (
        <div className="bd-panel">
          <div className="bd-card">
            <h3>+ Aktivite Ekle</h3>
            <div className="bd-row">
              <div>
                <label>Tür</label>
                <select value={actForm.type} onChange={(e) => setActForm({ ...actForm, type: e.target.value })}>
                  <option value="Ağırlık">Ağırlık</option>
                  <option value="Kardiyo">Kardiyo</option>
                </select>
              </div>
              <div>
                <label>Süre (dk)</label>
                <input type="number" placeholder="45" value={actForm.duration} onChange={(e) => setActForm({ ...actForm, duration: e.target.value })} />
              </div>
            </div>
            <div className="bd-row">
              <div>
                <label>Egzersiz / Not</label>
                <input type="text" placeholder="Örn: Bench Press 4x8 RIR2" value={actForm.name} onChange={(e) => setActForm({ ...actForm, name: e.target.value })} />
              </div>
              <div>
                <label>Tahmini kcal</label>
                <input type="number" placeholder="300" value={actForm.kcal} onChange={(e) => setActForm({ ...actForm, kcal: e.target.value })} />
              </div>
            </div>
            <button className="bd-add" onClick={addActivity}>Ekle</button>
          </div>

          <div className="bd-card">
            <h3>Bugünkü Aktiviteler</h3>
            {(today.activities || []).length === 0 ? (
              <div className="bd-empty">Henüz aktivite eklenmedi.</div>
            ) : (
              today.activities.map((a, i) => (
                <div className="bd-logitem" key={i}>
                  <div>
                    <b>{a.name || a.type}</b>
                    <div className="bd-meta">{a.type} · {a.duration || "-"} dk · {a.kcal || 0} kcal</div>
                  </div>
                  <button className="bd-del" onClick={() => removeActivity(i)}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "beslenme" && (
        <div className="bd-panel">
          <div className="bd-grid2">
            <div className="bd-card">
              <h3>Protein</h3>
              <div className="bd-stat">{totalP}g</div>
              <div className="bd-sub">/ {state.proteinTarget}g</div>
              <div className="bd-track"><div className="bd-fill teal" style={{ width: pct(totalP, state.proteinTarget) + "%" }} /></div>
            </div>
            <div className="bd-card">
              <h3>Karbonhidrat</h3>
              <div className="bd-stat">{totalC}g</div>
              <div className="bd-sub">/ {state.carbTarget}g</div>
              <div className="bd-track"><div className="bd-fill yellow" style={{ width: pct(totalC, state.carbTarget) + "%" }} /></div>
            </div>
          </div>
          <div className="bd-card">
            <h3>Yağ</h3>
            <div className="bd-stat">{totalF}g</div>
            <div className="bd-sub">/ {state.fatTarget}g</div>
            <div className="bd-track"><div className="bd-fill lavender" style={{ width: pct(totalF, state.fatTarget) + "%" }} /></div>
          </div>

          <div className="bd-card">
            <h3>+ Ekstra Besin Ekle</h3>
            <div className="bd-row">
              <div>
                <label>Besin adı</label>
                <input type="text" placeholder="Örn: Çikolata 1 parça" value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} />
              </div>
              <div>
                <label>Kalori (kcal)</label>
                <input type="number" placeholder="150" value={foodForm.kcal} onChange={(e) => setFoodForm({ ...foodForm, kcal: e.target.value })} />
              </div>
            </div>
            <div className="bd-row">
              <div><label>Protein (g) — opsiyonel</label><input type="number" placeholder="0" value={foodForm.p} onChange={(e) => setFoodForm({ ...foodForm, p: e.target.value })} /></div>
              <div><label>Karb (g) — opsiyonel</label><input type="number" placeholder="0" value={foodForm.c} onChange={(e) => setFoodForm({ ...foodForm, c: e.target.value })} /></div>
              <div><label>Yağ (g) — opsiyonel</label><input type="number" placeholder="0" value={foodForm.f} onChange={(e) => setFoodForm({ ...foodForm, f: e.target.value })} /></div>
            </div>
            <button className="bd-add" onClick={addFood}>Ekle</button>
          </div>

          <div className="bd-card">
            <h3>Bugünkü Ekstra Besinler</h3>
            {(today.foods || []).length === 0 ? (
              <div className="bd-empty">Henüz ekstra besin eklenmedi. Taban: {BASE_KCAL} kcal</div>
            ) : (
              today.foods.map((f, i) => (
                <div className="bd-logitem" key={i}>
                  <div>
                    <b>{f.name}</b>
                    <div className="bd-meta">{f.kcal || 0} kcal {(f.p || f.c || f.f) ? `· P:${f.p}g K:${f.c}g Y:${f.f}g` : ""}</div>
                  </div>
                  <button className="bd-del" onClick={() => removeFood(i)}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "ilerleme" && (
        <div className="bd-panel">
          <div className="bd-card">
            <h3>+ Ölçüm Ekle</h3>
            <div className="bd-row">
              <div><label>Kilo (kg)</label><input type="number" step="0.1" placeholder="104.7" value={measureForm.weight} onChange={(e) => setMeasureForm({ ...measureForm, weight: e.target.value })} /></div>
              <div><label>Bel / Göbek (cm)</label><input type="number" step="0.5" placeholder="113" value={measureForm.waist} onChange={(e) => setMeasureForm({ ...measureForm, waist: e.target.value })} /></div>
            </div>
            <button className="bd-add" onClick={addMeasurement}>Kaydet</button>
          </div>

          <div className="bd-card">
            <h3>Kilo Trend</h3>
            <LineChart data={weightSeries} color="#FF6B6B" />
            {plateau && <div className="bd-flag">⚠️ Son 3 ölçümde değişim %0.5 altında — plato olasılığı. Kalibrasyon gerekebilir.</div>}
          </div>

          <div className="bd-card">
            <h3>Bel Ölçüsü Trend</h3>
            <LineChart data={waistSeries} color="#8B7FD9" />
          </div>

          <div className="bd-card">
            <h3>Geçmiş Ölçümler</h3>
            {measurements.length === 0 ? (
              <div className="bd-empty">Henüz ölçüm eklenmedi.</div>
            ) : (
              measurements.slice().reverse().map((m) => {
                const i = measurements.indexOf(m);
                return (
                  <div className="bd-logitem" key={i}>
                    <div>
                      <b>{m.date}</b>
                      <div className="bd-meta">{m.weight ? "Kilo: " + m.weight + " kg " : ""}{m.waist ? "· Bel: " + m.waist + " cm" : ""}</div>
                    </div>
                    <button className="bd-del" onClick={() => removeMeasurement(i)}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="bd-footer">
        <div className="bd-footer-inner">
          <button className="bd-copy" onClick={copySummary}>📋 Günlük Özeti Kopyala</button>
          <div className="bd-copy-note">Veriler bu tarayıcıda (localStorage) saklanır.</div>
        </div>
      </div>
    </div>
  );
}

const css = `
.bd-wrap{
  --bg:#FAF6EF; --card:#FFFFFF; --text:#2B2D42; --text-soft:#767B96;
  --coral:#FF6B6B; --teal:#1FAF9E; --teal-bg:#E3F7F2; --yellow:#FFB100;
  --lavender:#8B7FD9; --coral-bg:#FFEAEA; --border:#EEE7D9;
  background:var(--bg); color:var(--text); font-family:'Inter',sans-serif;
  min-height:100vh; padding-bottom:100px;
}
.bd-wrap h1,.bd-wrap h3{font-family:'Poppins',sans-serif;}
.bd-wrap *{box-sizing:border-box;}
.bd-wrap{max-width:760px;margin:0 auto;padding:20px 16px 100px;}
.bd-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
.bd-brand{display:flex;align-items:center;gap:10px;}
.bd-dot{width:14px;height:14px;border-radius:50%;background:var(--coral);box-shadow:0 0 0 4px var(--coral-bg);}
.bd-brand h1{font-size:22px;margin:0;font-weight:800;letter-spacing:-0.5px;}
.bd-daycount{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:8px 14px;font-size:13px;color:var(--text-soft);text-align:right;box-shadow:0 4px 16px rgba(43,45,66,0.06);}
.bd-daycount b{color:var(--coral);font-size:16px;display:block;font-family:'Poppins',sans-serif;}
.bd-tabs{display:flex;gap:8px;margin-bottom:18px;overflow-x:auto;padding-bottom:4px;}
.bd-tabs button{flex:1;min-width:80px;background:var(--card);color:var(--text-soft);padding:10px 8px;border-radius:12px;font-weight:600;font-size:13px;cursor:pointer;border:1px solid var(--border);}
.bd-tabs button.active{background:var(--text);color:#fff;border-color:var(--text);}
.bd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.bd-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px;box-shadow:0 4px 16px rgba(43,45,66,0.06);margin-bottom:12px;}
.bd-card h3{margin:0 0 10px;font-size:14px;color:var(--text-soft);font-weight:600;}
.bd-stat{font-size:26px;font-weight:800;font-family:'Poppins',sans-serif;}
.bd-sub{font-size:12px;color:var(--text-soft);margin-top:2px;}
.bd-track{height:10px;background:var(--border);border-radius:6px;overflow:hidden;margin-top:10px;}
.bd-fill{height:100%;border-radius:6px;transition:width .35s ease;}
.bd-fill.coral{background:var(--coral);} .bd-fill.teal{background:var(--teal);}
.bd-fill.yellow{background:var(--yellow);} .bd-fill.lavender{background:var(--lavender);}
.bd-wrap input,.bd-wrap select{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);font-size:14px;background:#fcfbf8;color:var(--text);}
.bd-wrap label{font-size:12px;color:var(--text-soft);font-weight:600;display:block;margin-bottom:4px;}
.bd-row{display:flex;gap:10px;margin-bottom:10px;}
.bd-row>div{flex:1;}
.bd-water-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--teal-bg);color:var(--teal);border:none;border-radius:12px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;width:100%;margin-top:10px;}
.bd-pillrow{display:flex;gap:6px;}
.bd-pill{flex:1;text-align:center;padding:10px 0;border-radius:10px;border:1px solid var(--border);background:#fcfbf8;cursor:pointer;font-weight:700;color:var(--text-soft);font-size:14px;}
.bd-pill.sel{background:var(--lavender);color:#fff;border-color:var(--lavender);}
.bd-add{background:var(--text);color:#fff;border:none;border-radius:10px;padding:11px;font-weight:700;width:100%;cursor:pointer;font-size:14px;margin-top:4px;}
.bd-logitem{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fcfbf8;border-radius:10px;margin-bottom:6px;font-size:13px;}
.bd-meta{color:var(--text-soft);font-size:12px;}
.bd-del{background:none;border:none;color:var(--coral);font-size:16px;cursor:pointer;}
.bd-empty{color:var(--text-soft);font-size:13px;text-align:center;padding:14px 0;}
.bd-flag{background:#FFF4DC;color:#8a5a00;border-radius:12px;padding:10px 14px;font-size:13px;font-weight:600;margin-top:10px;}
.bd-footer{position:fixed;bottom:0;left:0;right:0;background:var(--card);border-top:1px solid var(--border);padding:12px 16px;box-shadow:0 -4px 16px rgba(43,45,66,0.06);}
.bd-footer-inner{max-width:760px;margin:0 auto;}
.bd-copy{width:100%;background:var(--coral);color:#fff;border:none;border-radius:14px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;font-family:'Poppins',sans-serif;}
.bd-copy-note{font-size:11px;color:var(--text-soft);text-align:center;margin-top:6px;}
`;
