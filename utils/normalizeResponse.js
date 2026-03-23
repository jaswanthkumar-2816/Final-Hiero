/**
 * Universal Response Normalization Utility
 * Ensures that all data sent to the Orbit frontend is properly formatted as a string,
 * converting code objects or metadata into standard markdown blocks to prevent [object Object].
 */

function normalizeResponse(data) {
    if (data === null || data === undefined) return "";

    // 1. Scrub hallucinated string representations of objects
    // AI sometimes literalizes [object Object] if it sees it in context
    if (typeof data === "string" && (data === "[object Object]" || data.includes("[object Object]"))) {
        return data.replace(/\[object Object\]/g, "⚠️ (Neural Sync Error: Object Leak Captured)");
    }

    // 2. If it is already a string and not JSON-like, just return it
    if (typeof data === "string" && !data.trim().startsWith('{') && !data.trim().startsWith('[')) {
        return data;
    }

    // 3. Try to parse JSON strings
    let processedData = data;
    if (typeof data === "string") {
        try {
            processedData = JSON.parse(data);
        } catch (e) {
            return data;
        }
    }

    // 4. Handle structured implementation data (common AI output pattern)
    if (typeof processedData === "object" && processedData !== null) {
        if (processedData.code || processedData.content || processedData.implementation) {
            const impl = processedData.implementation || processedData;
            const lang = impl.language || processedData.language || "python";
            let rawCode = impl.content || impl.code || processedData.content || processedData.code || "";

            if (typeof rawCode === "object") rawCode = JSON.stringify(rawCode, null, 2);
            return "```" + lang + "\n" + rawCode + "\n```";
        }

        // 5. Fallback for all other objects
        try {
            const json = JSON.stringify(processedData, null, 2);
            if (json === "{}" || json === "[]") return "";
            return "```json\n" + json + "\n```";
        } catch (e) {
            return "⚠️ Orbit Signal Decoding Error";
        }
    }

    return String(data);
}

module.exports = { normalizeResponse };
