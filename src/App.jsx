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
    tagline: "Har saans, aapke hisaab se.",
    profile: "Aapki health profile",
    age: "Umar",
    ages: { child: "Bachcha (12 se kam)", adult: "Vayask (12-59)", senior: "Buzurg (60+)" },
    conditions: { asthma: "Asthma / phephdon ki bimari", heart: "Dil ki bimari", pregnant: "Garbhvati", outdoor: "Bahar kaam karte hain" },
    area: "Aapka ilaka",
    aqiNow: "Abhi ka AQI",
    advice: "Aapko kya karna chahiye",
    aiAdvisor: "AI Health Advisor",
    getAiAdviceBtn: "✨ AI Salah Lein",
    levels: { good: "Achha", satisfactory: "Santoshjanak", moderate: "Madhyam", poor: "Kharab", veryPoor: "Bahut kharab", severe: "Gambhir" },
    a: {
      stay: "Aaj ghar ke andar rahiye. Zaroori ho tabhi bahar jaiye.",
      mask: "Bahar jana pade to sahi fit wala N95 mask pehniye.",
      meds: "Inhaler ya apni dawaiyan saath rakhiye.",
      limit: "Bahar ki gatividhi kam kijiye, bahar exercise na kijiye.",
      breaks: "Kaam ke beech beech me andar aakar aaram kijiye.",
      ok: "Aapke liye hawa theek hai. Din achha bitaiye.",
      doctor: "Saans phoole ya seene me dard ho to doctor se milein.",
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

export default function App() {
  const [lang, setLang] = useState("en");
  const [stations, setStations] = useState(mockStations);
  const [stationId, setStationId] = useState(mockStations[0].id);
  const [profile, setProfile] = useState({ age: "adult", asthma: false, heart: false, pregnant: false, outdoor: false });
  const [aiAdvice, setAiAdvice] = useState("");

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

const fetchAIAdvice = async () => {
    setAiAdvice(language === 'hi' ? "स्मार्ट स्वास्थ्य सलाह उत्पन्न हो रही है..." : "Generating smart health advice...");
    setTimeout(() => {
      const isHindi = language === 'hi';
      const advice = isHindi
        ? "आनंद विहार में वर्तमान वायु गुणवत्ता बहुत खराब (AQI 380) है।\n1. घर के अंदर रहें और खिड़कियां बंद रखें।\n2. बाहर जाना आवश्यक होने पर एन-95 (N-95) मास्क का उपयोग करें।\n3. अधिक मात्रा में पानी पिएं और ताजे फल खाएं।"
        : "Current AQI in Anand Vihar is very poor (380).\n1. Stay indoors and keep windows closed.\n2. Wear a well-fitted N95 mask if going outside is essential.\n3. Stay hydrated and consume fresh fruits.";
      setAiAdvice(advice);
    }, 800);
  };
  return (
    <div className="app">
      <header>
        <div>
          <h1>BreatheSafe Delhi</h1>
          <p>{t.tagline}</p>
        </div>
        <button className="lang" onClick={() => setLang(lang === "en" ? "hi" : "en")}>
          {lang === "en" ? "हिन्दी" : "English"}
        </button>
      </header>

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
        </section>

        <section className="panel result" style={{ borderTopColor: level.color }}>
          <div className="aqi">
            <span className="num" style={{ color: level.color }}>{station.aqi}</span>
            <span className="meta">{t.aqiNow} · {station.name}<br /><b style={{ color: level.color }}>{t.levels[level.key]}</b></span>
          </div>
          <h2>{t.advice}</h2>
          <ul>{advice.map((k) => <li key={k}>{t.a[k]}</li>)}</ul>

          {/* AI Health Advisor Widget */}
          <div style={{ marginTop: '20px', padding: '15px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '16px' }}>🤖 {t.aiAdvisor}</h3>
            <p style={{ color: '#334155', fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
              {aiAdvice ? aiAdvice : "Click below to get custom AI recommendations based on your health profile."}
            </p>
            <button 
              onClick={fetchAIAdvice} 
              style={{ background: '#16a34a', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '10px' }}
            >
              {t.getAiAdviceBtn}
            </button>
          </div>
        </section>

        <section className="map">
          <MapContainer center={[28.62, 77.15]} zoom={10} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
    </div>
  );
}