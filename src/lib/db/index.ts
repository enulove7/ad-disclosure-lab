import "server-only";
import type { Store } from "./store";
import { localStore } from "./local";
import { createSupabaseStore } from "./supabase";

/**
 * 환경변수에 Supabase 설정이 있으면 Supabase, 없으면 로컬 JSON 파일 저장소를 사용한다.
 * 어느 쪽인지는 /admin 상단에 표시된다.
 */
let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? createSupabaseStore(url, key) : localStore;
  return cached;
}

export function storeKind(): "supabase" | "local" {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local";
}
