const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyCNCF87s_qpNXvHuT6RaTud_LKK9ackCPs";
const genAI = new GoogleGenerativeAI(API_KEY);

async function findBestModel() {
  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
  ];

  console.log("🔍 Finding a working model for your key...");

  for (const modelName of modelsToTry) {
    try {
      console.log(` 🛠️ Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      await result.response;
      console.log(` ✅ ${modelName} is WORKING!`);
      return modelName;
    } catch (err) {
      console.log(` ❌ ${modelName} failed: ${err.message.substring(0, 50)}...`);
    }
  }

  console.error("💀 No standard models found! We might need to use a specific preview model.");
  return null;
}

findBestModel().then(m => {
  if (m) console.log(`\n🏆 BEST MODEL FOUND: ${m}`);
});
