import "server-only";
import { deflateSync } from "node:zlib";

/**
 * 이미지 생성 어댑터. 기본은 Google Gemini 이미지 모델(REST, API 키).
 * IMAGE_PROVIDER=mock 이면 외부 호출 없이 단색 PNG 를 만들어 흐름 테스트에 쓴다.
 */
export interface GeneratedImage {
  bytes: Buffer;
  mime: string;
  model: string;
}

export const IMAGE_MODELS: Array<{ id: string; label: string }> = [
  { id: "gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image (Nano Banana 2)" },
  { id: "gemini-3-pro-image", label: "Gemini 3 Pro Image (Nano Banana Pro)" },
  { id: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
];

export function defaultImageModel(): string {
  return process.env.IMAGE_MODEL || IMAGE_MODELS[0].id;
}

export function imageGenAvailable(): boolean {
  return process.env.IMAGE_PROVIDER === "mock" || Boolean(process.env.GEMINI_API_KEY);
}

export async function generateImage(prompt: string, model: string): Promise<GeneratedImage> {
  if (process.env.IMAGE_PROVIDER === "mock") return mockImage(prompt, model);

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
      }),
      signal: AbortSignal.timeout(110_000),
    },
  );
  const json = (await res.json()) as GeminiResponse;
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    throw new Error(friendlyGeminiError(msg));
  }
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) {
    const reason = json.candidates?.[0]?.finishReason ?? json.promptFeedback?.blockReason ?? "no image returned";
    throw new Error(`Image not returned (${reason})`);
  }
  return {
    bytes: Buffer.from(part.inlineData.data, "base64"),
    mime: part.inlineData.mimeType || "image/png",
    model,
  };
}

interface GeminiResponse {
  error?: { message?: string; status?: string };
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> };
  }>;
}

function friendlyGeminiError(msg: string): string {
  if (/quota|RESOURCE_EXHAUSTED|billing/i.test(msg)) {
    return "Gemini quota/billing: 이미지 모델은 무료 범위에서 쓸 수 없습니다. Google AI Studio 에서 결제(Billing)를 연결하세요. / " + msg.slice(0, 160);
  }
  return msg.slice(0, 300);
}

// ---------- mock: 프롬프트 해시 기반 단색 PNG (외부 호출 없음) ----------

function mockImage(prompt: string, model: string): GeneratedImage {
  let h = 2166136261;
  for (const ch of prompt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const r = 120 + (h & 0x7f);
  const g = 120 + ((h >> 8) & 0x7f);
  const b = 120 + ((h >> 16) & 0x7f);
  return { bytes: solidPng(256, 256, r, g, b), mime: "image/png", model: `mock(${model})` };
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function solidPng(w: number, hgt: number, r: number, g: number, b: number): Buffer {
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: hgt }, () => row));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(hgt, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
