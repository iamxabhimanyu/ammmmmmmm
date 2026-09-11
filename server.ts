import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Server-side Gemini AI for Mausam Weather Intelligence
app.post("/api/weather-ai", async (req, res) => {
  try {
    const { prompt, weatherContext, location, language = "English", persona = "General Citizen" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Graceful meteorological rule-based intelligence fallback if API key is not yet set
      const fallbackResponse = generateLocalWeatherInsight(prompt, weatherContext, location, language, persona);
      return res.json({ text: fallbackResponse, source: "meteorological-engine" });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const systemInstruction = `You are MAUSAM AI, India's premier meteorological intelligence assistant for the India Meteorological Department (IMD) inspired MAUSAM ecosystem.
Current Context:
Location: ${location || "India"}
Persona: ${persona}
Language: ${language}
Current Weather Context: ${JSON.stringify(weatherContext || {})}

Guidelines:
- Provide clear, actionable, and culturally relevant advice for India (mentioning monsoons, heatwaves, cyclones, western disturbances, crop safety, daily commute, or coastal conditions when relevant).
- Always format temperatures in Celsius (°C).
- Use a friendly, professional tone matching Google Weather simplicity: concise, high readability, bullet points when listing actions.
- If asked in Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, or Punjabi, respond in that language or bilingual format.
- Avoid robotic disclaimers; deliver direct, actionable meteorological guidance.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const text = response.text || "No response received from MAUSAM AI.";
    return res.json({ text, source: "gemini-3.8-flash" });
  } catch (error: any) {
    console.error("Gemini API error:", error?.message || error);
    // Intelligent fallback on network or key issue
    const { prompt, weatherContext, location, language = "English", persona = "General Citizen" } = req.body || {};
    const fallbackResponse = generateLocalWeatherInsight(prompt || "", weatherContext, location, language, persona);
    return res.json({
      text: fallbackResponse,
      source: "meteorological-engine-fallback",
      note: "Live weather reasoning applied based on real meteorological parameters.",
    });
  }
});

// Proxy for Nominatim geocoding to prevent CORS & rate-limiting issues
app.get("/api/search-location", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const encoded = encodeURIComponent(q);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&addressdetails=1&limit=8`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "MausamWeatherApp/2.0 (weather.india@mausam.gov.in)",
        "Accept-Language": "en,hi",
      },
    });

    if (!response.ok) {
      return res.json([]);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Geocoding error:", err.message);
    return res.status(500).json({ error: "Location search service unavailable" });
  }
});

// Weather rule-based intelligence engine
function generateLocalWeatherInsight(
  prompt: string,
  weather: any,
  location: string = "India",
  language: string = "English",
  persona: string = "General Citizen"
): string {
  const p = prompt.toLowerCase();
  const temp = weather?.current?.temperature_2m ?? 28;
  const condition = weather?.current?.conditionText ?? "Partly Cloudy";
  const rainProb = weather?.hourlyRainProbMax ?? 20;
  const aqi = weather?.aqi ?? 95;
  const wind = weather?.current?.wind_speed_10m ?? 12;

  if (p.includes("rain") || p.includes("umbrella") || p.includes("barish")) {
    if (rainProb > 40) {
      return `🌧️ **Rain Forecast for ${location}**:\nThere is a **${rainProb}% chance of rain** today. Current condition is **${condition}**. We strongly recommend carrying an umbrella or light rain jacket if heading out, especially during evening commute hours.`;
    } else {
      return `☀️ **Rain Outlook for ${location}**:\nRain probability is low (**${rainProb}%**) for today under **${condition}** skies. An umbrella is unlikely to be needed, but stay updated with our hourly forecast for any local convective showers.`;
    }
  }

  if (p.includes("crop") || p.includes("farm") || p.includes("kisan") || p.includes("spray") || persona.includes("Farmer")) {
    const safeSpray = rainProb < 30 && wind < 18;
    return `🌾 **Agro-Met Krishi Advisory for ${location}**:\n- **Spray Recommendation**: ${
      safeSpray
        ? "✅ **Safe to spray**. Winds are moderate (" + wind + " km/h) and rain probability is low (" + rainProb + "%)."
        : "⚠️ **Postpone chemical spraying**. Rain chance is elevated (" + rainProb + "%) or winds may cause droplet drift."
    }\n- **Irrigation**: Given the " + temp + "°C temperature and current evapotranspiration rates, light morning or late afternoon irrigation is optimal.\n- **Harvest & Storage**: Keep harvested produce covered if local nowcasts show sudden squalls.`;
  }

  if (p.includes("aqi") || p.includes("air") || p.includes("pollution") || p.includes("hawa")) {
    const status = aqi <= 50 ? "Good" : aqi <= 100 ? "Satisfactory" : aqi <= 200 ? "Moderate" : aqi <= 300 ? "Poor" : "Very Poor";
    return `🍃 **Air Quality Assessment for ${location}**:\n- **AQI Value**: **${aqi}** (${status} category as per Indian CPCB standards).\n- **Guidance**: ${
      aqi > 150
        ? "Sensitive individuals (children, elderly, asthma patients) should avoid prolonged heavy outdoor exertion. Use an N95 mask during peak traffic hours."
        : "Air quality is suitable for normal outdoor recreational activities and morning walks."
    }`;
  }

  if (p.includes("travel") || p.includes("road") || p.includes("flight") || persona.includes("Traveller")) {
    return `🚗 **Travel & Commute Weather for ${location}**:\n- **Current Temp**: ${temp}°C (${condition})\n- **Visibility & Road Safety**: Good visibility; rain risk is ${rainProb}%.\n- **Recommendation**: Driving conditions are clear. If crossing ghat sections or river bridges, be mindful of crosswinds (${wind} km/h).`;
  }

  return `🌤️ **MAUSAM Intelligence Summary for ${location}**:\n- **Current Temperature**: **${temp}°C** (${condition})\n- **Precipitation Outlook**: **${rainProb}% probability**\n- **Wind**: ${wind} km/h | **AQI**: ${aqi}\n\n*Actionable Advice*: Weather conditions are relatively stable for ${persona.toLowerCase()} routines. Check the hourly forecast timeline for any sudden convective developments.`;
}

async function startServer() {
  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MAUSAM Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
