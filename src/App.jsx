import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { stations as mockStations, aqiLevel } from "./mockData";
import "./App.css";

const API_URL = "https://pa6jzyvopbrlzmyvz4ul34452e0jgods.lambda-url.us-east-1.on.aws/";

const T = {
  en: {
    tagline: "Every breath, personalised.",
    profile: "Your health profile",
    age: "Age group",
    ages: { child: "Child (under 12)", adult: "Adult (12-59)", senior: "Senior (60+)" },
    conditions: { asthma: "Asthma / lung condition", heart: "Heart condition", pregnant: "Pregnant", outdoor: "Works outdoors" },
    area: "Your area",
    aqiNow: "AQI now",
    advice: "What you should do",
    aiAdvisor: "AI Health Advisor",
    getAiAdviceBtn: "✨ Get AI Advice",
    aiHint: "Click below to get custom AI recommendations based on your health profile.",
    avg: "Delhi average",
    worst: "Most polluted",
    best: "Cleanest",
    updated: "Updated",
    live: "LIVE",
    footer: "Data: OpenAQ · Advice: Gemini AI · Built on AWS",
    levels: { good: "Good", satisfactory: "Satisfactory", moderate: "Moderate", poor: "Poor", veryPoor: "Very poor", severe: "Severe" },
    a: {
      stay: "Stay indoors today. Avoid going out unless it is essential.",
      mask: "Wear a well-fitted N95 mask if you must step out.",
      meds: "Keep your inhaler or regular medicines with you.",
      limit: "Limit outdoor activity and avoid exercising outside.",
      breaks: "Take frequent breaks indoors during work.",
      ok: "Air is fine for you. Enjoy your day.",
      doctor: "Contact a doctor if you feel breathless or chest pain.",
    },
  },
  hi: {
    tagline: "हर साँस, आपके हिसाब से।",
    profile: "आपकी स्वास्थ्य प्रोफ़ाइल",
    age: "उम्र",
    ages: { child: "बच्चा (12 से कम)", adult: "वयस्क (12-59)", senior: "बुज़ुर्ग (60+)" },
    conditions: { asthma: "अस्थमा / फेफड़ों की बीमारी", heart: "दिल की बीमारी", pregnant: "गर्भवती", outdoor: "बाहर काम करते हैं" },
    area: "आपका इलाका",
    aqiNow: "अभी का AQI",
    advice: "आपको क्या करना चाहिए",
    aiAdvisor: "AI स्वास्थ्य सलाहकार",
    getAiAdviceBtn: "✨ AI सलाह लें",
    aiHint: "अपनी स्वास्थ्य प्रोफ़ाइल के आधार पर सलाह पाने के लिए नीचे क्लिक करें।",
    avg: "दिल्ली औसत",
    worst: "सबसे प्रदूषित",
    best: "सबसे साफ़",
    updated: "अपडेट",
    live: "लाइव",
    footer: "डेटा: OpenAQ · सलाह: Gemini AI · AWS पर बना",
    levels: { good: "अच्छा", satisfactory: "संतोषजनक", moderate: "मध्यम", poor: "खराब", veryPoor: "बहुत खराब", severe: "गंभीर" },
    a: {
      stay: "आज घर के अंदर रहिए। ज़रूरी हो तभी बाहर जाइए।",
      mask: "बाहर जाना पड़े तो सही फिट वाला N95 मास्क पहनिए।",
      meds: "इन्हेलर या अपनी दवाइयाँ साथ रखिए।",
      limit: "बाहर की गतिविधि कम कीजिए, बाहर व्यायाम न कीजिए।",
      breaks: "काम के बीच-बीच में अंदर आकर आराम कीजिए।",
      ok: "आपके लिए हवा ठीक है। दिन अच्छा बिताइए।",
      doctor: "साँस फूले या सीने में दर्द हो तो डॉक्टर से मिलें।",
    },
  },
};

function getAdvice(aqi, p) {
  const vulnerable = p.age !== "adult" || p.asthma || p.heart || p.pregnant;
  const keys = [];
  if (aqi > 300 || (vulnerable && aqi > 200)) keys.push("stay");
  else if (aqi > 100 && vulnerable) keys.push("limit");
  else if (aqi > 200) keys.push("limit");
  if (aqi > 150 || (vulnerable && aqi > 100)) keys.push("mask");
  if ((p.asthma || p.heart) && aqi > 100) keys.push("meds");
  if (p.outdoor && aqi > 150) keys.push("breaks");
  if (vulnerable && aqi > 200) keys.push("doctor");
  if (keys.length === 0) keys.push("ok");
  return keys;
}

// Gemini ke **bold** aur "* " bullets ko sundar dikhane ke liye
const renderBold = (s) =>
  s.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

function AiText({ text }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="ai-text">
      {lines.map((l, i) => {
        const bullet = /^[*\-•]\s+/.test(l);
        const clean = l.replace(/^[*\-•]\s+/, "");
        return bullet ? (
          <div key={i} className="ai-li"><span>•</span><span>{renderBold(clean)}</span></div>
        ) : (
          <p key={i}>{renderBold(clean)}</p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("en");
  const [stations, setStations] = useState(mockStations);
  const [stationId, setStationId] = useState(mockStations[0].id);
  const [profile, setProfile] = useState({ age: "adult", asthma: false, heart: false, pregnant: false, outdoor: false });
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length) {
          setStations(d);
          setStationId(d[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const t = T[lang];
  const station = stations.find((s) => s.id === stationId) || stations[0];
  const level = aqiLevel(station.aqi);
  const advice = getAdvice(station.aqi, profile);
  const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const sorted = [...stations].sort((a, b) => b.aqi - a.aqi);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const avg = Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length);
  const isLive = !!station.updated;
  const updatedAt = station.updated
    ? new Date(station.updated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const pinPct = Math.min(station.aqi, 500) / 5;

  const findNearest = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      let nearest = stations[0];
      let min = Infinity;
      stations.forEach((s) => {
        const d = (s.lat - latitude) ** 2 + (s.lng - longitude) ** 2;
        if (d < min) { min = d; nearest = s; }
      });
      setStationId(nearest.id);
    });
  };

  const shareText = encodeURIComponent(
    `${station.name}: AQI ${station.aqi} (${t.levels[level.key]}) - BreatheSafe Delhi https://main.djmw8ydrwt4df.amplifyapp.com`
  );

  const fetchAIAdvice = async () => {
    const isHindi = lang === "hi";
    setAiLoading(true);
    setAiAdvice("");
    try {
      const prompt = `${isHindi
        ? "Reply ONLY in Hindi written in Devanagari script (हिन्दी). Do not use English letters, except the words AQI and N95."
        : "Reply in simple English."}
Delhi station: ${station.name}, AQI: ${station.aqi}.
User profile: age group ${profile.age}, asthma: ${profile.asthma}, heart condition: ${profile.heart}, pregnant: ${profile.pregnant}, works outdoors: ${profile.outdoor}.
Give 3 to 4 short bullet points of practical advice. Do not diagnose any disease.`;

      const models = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
      let text = "";
      for (const m of models) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": import.meta.env.VITE_GEMINI_KEY,
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          break;
        }
        console.error("Model failed:", m, response.status, data.error?.message);
      }
      if (!text) throw new Error("No model worked");
      setAiAdvice(text);
    } catch (error) {
      console.error("AI error:", error);
      setAiAdvice(isHindi ? "अभी AI सलाह प्राप्त नहीं हो सकी। कृपया पुनः प्रयास करें।" : "Could not fetch AI advice right now.");
    }
    setAiLoading(false);
  };

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo">🌬️</span>
          <div>
            <h1>BreatheSafe Delhi</h1>
            <p>{t.tagline}</p>
          </div>
        </div>
        <button className="lang" onClick={() => setLang(lang === "en" ? "hi" : "en")}>
          {lang === "en" ? "हिन्दी" : "English"}
        </button>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">{t.avg}</span>
          <span className="stat-num" style={{ color: aqiLevel(avg).color }}>{avg}</span>
          <span className="stat-sub">{t.levels[aqiLevel(avg).key]}</span>
        </div>
        <button className="stat click" onClick={() => setStationId(worst.id)}>
          <span className="stat-label">{t.worst}</span>
          <span className="stat-num" style={{ color: aqiLevel(worst.aqi).color }}>{worst.aqi}</span>
          <span className="stat-sub">{worst.name}</span>
        </button>
        <button className="stat click" onClick={() => setStationId(best.id)}>
          <span className="stat-label">{t.best}</span>
          <span className="stat-num" style={{ color: aqiLevel(best.aqi).color }}>{best.aqi}</span>
          <span className="stat-sub">{best.name}</span>
        </button>
      </div>

      <main>
        <section className="panel">
          <h2>{t.profile}</h2>
          <label>
            {t.age}
            <select value={profile.age} onChange={(e) => set("age", e.target.value)}>
              {Object.entries(t.ages).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <div className="checks">
            {Object.entries(t.conditions).map(([k, v]) => (
              <label key={k} className="check">
                <input type="checkbox" checked={profile[k]} onChange={(e) => set(k, e.target.checked)} />
                {v}
              </label>
            ))}
          </div>
          <label>
            {t.area}
            <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button className="ghost" onClick={findNearest}>
            📍 {lang === "hi" ? "मेरे पास का स्टेशन" : "Use my location"}
          </button>
        </section>

        <section className="panel result" style={{ borderTopColor: level.color }}>
          <div className="aqi">
            <span className="num" style={{ color: level.color }}>{station.aqi}</span>
            <span className="meta">
              {t.aqiNow} · {station.name}
              <br />
              <b className="badge" style={{ background: level.color }}>{t.levels[level.key]}</b>
              {isLive && <span className="live"><i /> {t.live}{updatedAt ? ` · ${t.updated} ${updatedAt}` : ""}</span>}
            </span>
          </div>

          <div className="gauge"><div className="pin" style={{ left: `${pinPct}%`, borderColor: level.color }} /></div>
          <div className="gauge-labels"><span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500</span></div>

          <h2>{t.advice}</h2>
          <ul className="advice">{advice.map((k) => <li key={k}>{t.a[k]}</li>)}</ul>

          <div className="ai">
            <h3>🤖 {t.aiAdvisor}</h3>
            {aiLoading ? (
              <div className="ai-loading"><span className="spin" />{lang === "hi" ? "स्मार्ट सलाह तैयार हो रही है..." : "Generating smart advice..."}</div>
            ) : aiAdvice ? (
              <AiText text={aiAdvice} />
            ) : (
              <p className="ai-hint">{t.aiHint}</p>
            )}
            <button className="ai-btn" onClick={fetchAIAdvice} disabled={aiLoading}>
              {t.getAiAdviceBtn}
            </button>
            <a className="ghost" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
              📲 WhatsApp
            </a>
          </div>
        </section>

        <section className="map">
          <MapContainer center={[28.62, 77.15]} zoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {stations.map((s) => {
              const c = aqiLevel(s.aqi).color;
              return (
                <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={s.id === stationId ? 16 : 12}
                  pathOptions={{ color: c, fillColor: c, fillOpacity: 0.7 }}
                  eventHandlers={{ click: () => setStationId(s.id) }}>
                  <Tooltip>{s.name}: {s.aqi}</Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </section>
      </main>

      <footer>{t.footer}</footer>
    </div>
  );
}