const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyCNCF87s_qpNXvHuT6RaTud_LKK9ackCPs";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testKey() {
  console.log("🚀 Testing Gemini API Key with Official SDK...");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ SUCCESS! The AI is responding.");
    console.log("AI Response:", text);
  } catch (err) {
    console.error("❌ FAILED! The key might be invalid or restricted.");
    console.error(`Error: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }
}

testKey();
