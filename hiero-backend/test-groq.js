import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "hello" }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Groq Response:", response.data.choices[0].message.content);
    } catch (err) {
        console.error("Groq Error:", err.response?.data || err.message);
    }
}
test();
