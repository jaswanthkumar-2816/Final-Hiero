const fs = require('fs');
const path = 'c:/Users/souvi/Final-Hiero/hiero-prototype/jss/hiero/hiero-last/public/solve.html';
let content = fs.readFileSync(path, 'utf8');

// Find the section and replace it with clean code
const startSearch = "appendBubble('orbit', 'Establishing secure link...');";
const endSearch = "function appendBubble(role, text) {";

const startIndex = content.indexOf(startSearch);
const endIndex = content.indexOf(endSearch);

if (startIndex !== -1 && endIndex !== -1) {
    const prefix = content.substring(0, startIndex + startSearch.length);
    const suffix = content.substring(endIndex);

    // The clean version of handleSend body
    const cleanBody = `
        thinkingBubble.innerHTML = ''; 
        let fullAnswer = "";

        try {
          const response = await fetch("/api/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: question,
              skill: currentSkill,
              lesson: currentLesson,
              code: editor.value
            })
          });

          if (!response.ok) {
            thinkingBubble.innerText = "⚠️ Backend error: " + response.status;
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let partialChunk = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            partialChunk += chunk;

            const lines = partialChunk.split('\\n');
            partialChunk = lines.pop();

            for (let line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  let token = parsed.token || parsed.answer || "";
                  if (typeof token === "object") token = JSON.stringify(token);
                  fullAnswer += token;
                } catch (e) {}
              }
            }

            const cleanMarkdown = fullAnswer.replace(/\\[object Object\\]/g, "");
            thinkingBubble.innerHTML = marked.parse(cleanMarkdown);
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
          }

          chatHistory.push({ role: "user", content: question });
          chatHistory.push({ role: "assistant", content: fullAnswer });
          chatHistory = chatHistory.slice(-10);

        } catch (error) {
          thinkingBubble.innerText = "System failure. Connection disrupted.";
          console.error("Chat Failure:", error);
        }
      };

      btn.onclick = handleSend;
      chatInp.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
    }

    `;

    fs.writeFileSync(path, prefix + cleanBody + suffix);
    console.log("Successfully fixed solve.html");
} else {
    console.error("Could not find search markers", { startIndex, endIndex });
}
