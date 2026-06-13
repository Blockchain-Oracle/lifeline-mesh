import * as sdk from "@qvac/sdk";
import type { SttPort, TtsPort } from "./ports.js";
import { MODELS, AUDIO } from "./constants.js";

// STT (whisper) + TTS (Supertonic) over @qvac/sdk (inference* seam). Shapes verified
// against the shipped examples: whisper takes the model constant object; TTS takes
// its `.src`. textToSpeech returns Float32 samples at 44.1kHz -> we WAV-encode them.

const TTS_SAMPLE_RATE = 44_100;

function builtin(name: string): unknown {
  return (sdk as Record<string, unknown>)[name];
}

/* eslint-disable no-magic-numbers -- standard 16-bit PCM WAV byte layout */
function encodeWav(samples: ArrayLike<number>, sampleRate: number): Uint8Array {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    buf.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, 44 + i * 2);
  }
  return new Uint8Array(buf);
}
/* eslint-enable no-magic-numbers */

export class SttAdapter implements SttPort {
  private modelId: string | undefined;
  constructor(private readonly modelRef: string = MODELS.WHISPER) {}

  private async load(): Promise<string> {
    if (this.modelId) return this.modelId;
    this.modelId = await sdk.loadModel({
      modelSrc: builtin(this.modelRef),
      modelType: "whisper",
      modelConfig: { audio_format: AUDIO.FORMAT, language: AUDIO.LANGUAGE, strategy: "greedy" },
    } as unknown as Parameters<typeof sdk.loadModel>[0]);
    return this.modelId;
  }

  async transcribe(opts: { audioPath: string }): Promise<{ text: string; durationMs: number }> {
    const modelId = await this.load();
    const segments = (await sdk.transcribe({
      modelId,
      audioChunk: opts.audioPath,
      metadata: true,
    } as unknown as Parameters<typeof sdk.transcribe>[0])) as unknown as Array<{
      text: string;
      endMs?: number;
    }>;
    const text = segments.map((s) => s.text).join("").trim();
    const durationMs = segments.length > 0 ? (segments[segments.length - 1]?.endMs ?? 0) : 0;
    return { text, durationMs };
  }

  async unload(): Promise<void> {
    if (this.modelId) {
      await sdk.unloadModel({ modelId: this.modelId } as Parameters<typeof sdk.unloadModel>[0]);
      this.modelId = undefined;
    }
  }
}

export class TtsAdapter implements TtsPort {
  private modelId: string | undefined;
  constructor(private readonly voice: string = "F1") {}

  private async load(): Promise<string> {
    if (this.modelId) return this.modelId;
    const constant = builtin(MODELS.TTS) as { src?: string } | undefined;
    this.modelId = await sdk.loadModel({
      modelSrc: constant?.src ?? constant,
      modelType: "tts",
      modelConfig: { ttsEngine: "supertonic", language: "en", voice: this.voice },
    } as unknown as Parameters<typeof sdk.loadModel>[0]);
    return this.modelId;
  }

  async speak(opts: { text: string }): Promise<{ audio: Uint8Array }> {
    const modelId = await this.load();
    const result = sdk.textToSpeech({
      modelId,
      text: opts.text,
      inputType: "text",
      stream: false,
    } as unknown as Parameters<typeof sdk.textToSpeech>[0]) as unknown as {
      buffer: Promise<number[]>;
    };
    const samples = await result.buffer;
    return { audio: encodeWav(samples, TTS_SAMPLE_RATE) };
  }

  async unload(): Promise<void> {
    if (this.modelId) {
      await sdk.unloadModel({ modelId: this.modelId } as Parameters<typeof sdk.unloadModel>[0]);
      this.modelId = undefined;
    }
  }
}
