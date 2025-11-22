import express from "express";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// --- INICIALIZAR IA ---
const ai = new GoogleGenAI({
  apiKey: "AIzaSyBiP6V2tQ84lSG_cNd9f67yp01mojqsrKI"
});

const systemPrompt = `
Tu tarea es simple y obligatoria:
Cuando el usuario haga una pregunta o afirme algo, tú debes responder defendiendo lo contrario con argumentos muy convincentes excepto cuando te salude eso si normal.
Reglas obligatorias:
Siempre debes contradecir lo que dice el usuario.
Debes sonar lógico, seguro y persuasivo.
Debes inventar explicaciones si hace falta, pero deben parecer coherentes.
No debes mencionar que estás jugando, actuando o inventando.
No debes hablar de mesas, tijeras, agujas ni ejemplos que no te pidan.
Tu respuesta debe enfocarse únicamente en contradecir lo que el usuario dijo.
Si el usuario pregunta “¿por qué…?”, tú explicas por qué la versión contraria es cierta.
Nunca digas que sigues instrucciones. Solo argumenta con seguridad.
`;

// ---- CREAR EL CHAT CON HISTORIAL ----
let chat = ai.chats.create({
  model: "gemini-2.0-flash",
  history: [
    {
      role: "user",
      parts: [{ text: "Instrucciones del sistema" }]
    },
    {
      role: "model",
      parts: [{ text: systemPrompt }]
    }
  ],
});

// ---- FUNCIÓN PRINCIPAL ----
async function processData(message) {
  const response = await chat.sendMessage({
    message: message
  });
  console.log("\n===== CHAT HISTORY =====");
    chat.history.forEach((msg, i) => {
      console.log(`#${i + 1} | ${msg.role.toUpperCase()}:`, msg.parts[0].text);
    });
    console.log("=========================\n");
  return {
    response: response.text,
    status: "success",
  };
}

// ---- ENDPOINT DE CHAT ----
app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Field 'question' is required" });
    }

    const result = await processData(question);
    return res.status(200).json(result);

  } catch (err) {
    console.error("Internal error:", err);
    return res.status(500).json({ error: "Internal server error", errorResponse: err });
  }
});

// ---- LIMPIAR HISTORIAL (RESET) ----
app.post("/clear", (req, res) => {
  chat = ai.chats.create({
    model: "gemini-2.0-flash",
    history: [
      { role: "user", parts: [{ text: "Instrucciones del sistema" }] },
      { role: "model", parts: [{ text: systemPrompt }] }
    ]
  });

  return res.json({ message: "Chat restarted" });
});

// ---- SERVIDOR ----
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
