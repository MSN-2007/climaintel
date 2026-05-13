import { GoogleGenAI } from "@google/genai";
import { ClimateStats } from "../types";

export async function getClimateInsights(stats: ClimateStats): Promise<string> {
  // Always use a fresh instance to ensure the latest API key is used
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("MISSING_KEY: API key is not configured.");
  }  const seasonalData = {
    q1: stats.monthlyData.slice(0, 3).reduce((acc, m) => acc + m.tempAvg, 0) / 3,
    q2: stats.monthlyData.slice(3, 6).reduce((acc, m) => acc + m.tempAvg, 0) / 3,
    q3: stats.monthlyData.slice(6, 9).reduce((acc, m) => acc + m.tempAvg, 0) / 3,
    q4: stats.monthlyData.slice(9, 12).reduce((acc, m) => acc + m.tempAvg, 0) / 3,
  };

  const prompt = `
    Act as a senior climate engineer and global relocation advisor. Analyze the 30-year WMO climate baseline for ${stats.location.name} (${stats.location.lat}, ${stats.location.lng}).
    
    Provide a professional, highly informative 3-sentence summary that covers:
    1. The primary climate classification and general comfort level.
    2. Specific seasonal trends (e.g., when the rainy season peaks or if heatwaves are common).
    3. A specific insight for someone living or working there (e.g., HVAC needs or solar potential).

    Data Summary:
    - Peak Heat Index: ${Math.max(...stats.monthlyData.map(m => m.heatIndex))}°C
    - Annual Rainfall: ${stats.monthlyData.reduce((acc, m) => acc + m.rainfall, 0).toFixed(0)}mm
    - Hottest/Coldest Months: ${stats.summary.hottestMonth} / ${stats.summary.coldestMonth}
    - Seasonal Temp Averages: Q1: ${seasonalData.q1.toFixed(1)}°C, Q2: ${seasonalData.q2.toFixed(1)}°C, Q3: ${seasonalData.q3.toFixed(1)}°C, Q4: ${seasonalData.q4.toFixed(1)}°C
    - Max UV Index: ${Math.max(...stats.monthlyData.map(m => m.uvIndex))}
  `;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Climate analysis complete. Detailed patterns are available in the dashboard below.";
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    const message = error.message?.toLowerCase() || "";
    
    if (message.includes("requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND: The selected API key project was not found. Please re-select.");
    }
    
    if (message.includes("quota") || message.includes("429")) {
      return "The AI quota for this location has been reached. Please explore the interactive data tables below for detailed insights.";
    }

    return "Data processing complete. Historical records are ready for review.";
  }
}