#!/usr/bin/env python3
"""Female neural TTS for visualizer narration (English + Indic)."""
import asyncio
import os
import sys
import tempfile

VOICES = {
    "en": ("en-IN-NeerjaNeural", "+12%", "+2Hz"),
    "kn": ("kn-IN-SapnaNeural", "+18%", "+4Hz"),
    "hi": ("hi-IN-SwaraNeural", "+18%", "+4Hz"),
    "ta": ("ta-IN-PallaviNeural", "+16%", "+3Hz"),
    "te": ("te-IN-ShrutiNeural", "+18%", "+4Hz"),
}


async def synth(text, voice, rate, pitch):
    import edge_tts

    fd, path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)
    try:
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        except TypeError:
            communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(path)
        with open(path, "rb") as handle:
            data = handle.read()
        if not data:
            raise RuntimeError("empty speech file")
        sys.stdout.buffer.write(data)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


async def main():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        sys.stderr.write("edge-tts is not installed\n")
        sys.exit(2)

    lang = sys.argv[1] if len(sys.argv) > 1 else "en"
    voice, rate, pitch = VOICES.get(lang, VOICES["en"])
    text = sys.stdin.read().strip()
    if not text:
        sys.exit(1)
    await synth(text, voice, rate, pitch)


if __name__ == "__main__":
    asyncio.run(main())
