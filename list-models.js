const axios = require("axios");

const API_KEY = "AIzaSyCNCF87s_qpNXvHuT6RaTud_LKK9ackCPs";
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  console.log("🔍 Fetching available models for this key...");
  try {
    const response = await axios.get(URL);
    if (response.data && response.data.models) {
      const flashModels = response.data.models.filter(m => m.name.includes("gemini-1.5-flash"));
      if (flashModels.length > 0) {
        console.log("✅ Found Flash models:");
        flashModels.forEach(m => console.log(` - ${m.name}`));
      } else {
        console.log("❌ No gemini-1.5-flash models found. Showing all:");
        response.data.models.forEach(m => console.log(` - ${m.name}`));
      }
    } else {
      console.log("❓ Unexpected response format.");
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (err) {
    console.error("❌ FAILED to list models.");
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Error: ${JSON.stringify(err.response.data, null, 2)}`);
    } else {
      console.error(`Error: ${err.message}`);
    }
  }
}

listModels();
