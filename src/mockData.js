// Nakli data. Baad me isko API (DynamoDB) se replace karenge.
export const stations = [
  { id: "anand-vihar", name: "Anand Vihar", lat: 28.6469, lng: 77.3164, aqi: 380 },
  { id: "ito", name: "ITO", lat: 28.6289, lng: 77.2405, aqi: 310 },
  { id: "rk-puram", name: "RK Puram", lat: 28.5633, lng: 77.1869, aqi: 290 },
  { id: "dwarka", name: "Dwarka", lat: 28.5921, lng: 77.046, aqi: 265 },
  { id: "lodhi-road", name: "Lodhi Road", lat: 28.5918, lng: 77.2273, aqi: 220 },
  { id: "rohini", name: "Rohini", lat: 28.7325, lng: 77.1197, aqi: 340 },
];

export const aqiLevel = (aqi) => {
  if (aqi <= 50) return { key: "good", color: "#2e9e57" };
  if (aqi <= 100) return { key: "satisfactory", color: "#8bc34a" };
  if (aqi <= 200) return { key: "moderate", color: "#e0b100" };
  if (aqi <= 300) return { key: "poor", color: "#ef7d00" };
  if (aqi <= 400) return { key: "veryPoor", color: "#d62f2f" };
  return { key: "severe", color: "#7a1230" };
};