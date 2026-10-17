// 도메인 타입. DB 컬럼명(snake_case)과 동일하게 유지해 매핑 비용을 없앤다.
import type { Locale } from "@/lib/i18n";

export type ExperimentStatus = "draft" | "active" | "closed";

export interface Experiment {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ExperimentStatus;
  consent_text: string;
  debrief_text: string;
  settings: ExperimentSettings;
  created_at: string;
}

export interface ExperimentSettings {
  /** 광고 노출 최소 시간(초). 이 시간이 지나야 다음 버튼이 활성화됨 */
  min_exposure_seconds: number;
  /** 참가자에게 보여줄 광고 수. 0이면 전부 */
  ads_per_participant: number;
  /** 광고 순서 무작위화 */
  randomize_ad_order: boolean;
  /** 조건 배정 방식: balanced = 가장 적게 배정된 조건 우선, weighted = 가중치 확률 */
  assignment: "balanced" | "weighted";
  /** 참가자 화면 언어 */
  locale: Locale;
  /** 종료 화면에 표시할 완료 코드 (패널 연동용, 비우면 표시 안 함) */
  completion_code: string;
  /** 종료 화면의 복귀 링크. {pid} 는 external_id 로 치환 */
  completion_url: string;
}

export type LabelPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-bar"
  | "bottom-bar"
  | "below-image";

export type LabelSize = "sm" | "md" | "lg";
export type LabelStyle = "subtle" | "badge" | "banner";

/** 공개 라벨 설정. 조건(condition)마다 하나씩. */
export interface LabelConfig {
  enabled: boolean;
  text: string;
  /** 보조 설명(예: 사람이 확인했다는 문구). 비우면 표시 안 함 */
  description: string;
  position: LabelPosition;
  size: LabelSize;
  style: LabelStyle;
  show_icon: boolean;
}

export interface Condition {
  id: string;
  experiment_id: string;
  code: string;
  name: string;
  label_config: LabelConfig;
  weight: number;
  sort_order: number;
}

export interface Ad {
  id: string;
  experiment_id: string;
  code: string;
  name: string;
  brand_name: string;
  product_category: string;
  headline: string;
  body_text: string;
  cta_text: string;
  image_url: string;
  /** 채택된 이미지를 만든 프롬프트·모델 (AI 생성 시) */
  gen_prompt: string;
  gen_model: string;
  sort_order: number;
}

/** AI 로 생성한 광고 이미지 후보 */
export interface AdImage {
  id: string;
  experiment_id: string;
  ad_id: string;
  image_url: string;
  prompt: string;
  model: string;
  created_at: string;
}

export type SurveyPhase = "pre" | "post_ad" | "final";
export type ItemType = "likert" | "single" | "multi" | "number" | "text";

export interface SurveyItem {
  id: string;
  experiment_id: string;
  phase: SurveyPhase;
  code: string;
  /** 분석용 구성개념명(예: ad_attitude, purchase_intention) */
  construct: string;
  text: string;
  type: ItemType;
  /** likert: 척도 포인트 수(5/7). 그 외 무시 */
  scale_points: number;
  /** likert: 양 끝 앵커 라벨 [왼쪽, 오른쪽] */
  scale_labels: string[];
  /** single/multi: 선택지 */
  options: string[];
  required: boolean;
  sort_order: number;
}

export type ParticipantStatus = "started" | "pre_done" | "ads_done" | "completed" | "dropped";

export interface Participant {
  id: string;
  experiment_id: string;
  condition_id: string;
  token: string;
  status: ParticipantStatus;
  user_agent: string;
  /** 패널에서 넘어온 참가자 ID (?pid=) */
  external_id: string;
  /** 유입 경로 (?src=) */
  source: string;
  /** 참여 URL 의 나머지 쿼리 파라미터 */
  params: Record<string, string>;
  started_at: string;
  completed_at: string | null;
}

export interface Exposure {
  id: string;
  participant_id: string;
  ad_id: string;
  condition_id: string;
  sort_order: number;
  /** 노출 당시 라벨 설정 스냅샷. 조건을 나중에 수정해도 데이터 무결성 유지 */
  label_snapshot: LabelConfig;
  shown_at: string | null;
  duration_ms: number | null;
  /** 광고 버튼(CTA) 클릭 시각. 행동 지표 */
  cta_clicked_at: string | null;
}

export interface Response {
  id: string;
  participant_id: string;
  exposure_id: string | null;
  item_id: string;
  phase: SurveyPhase;
  value: unknown;
  answered_at: string;
}

export const DEFAULT_SETTINGS: ExperimentSettings = {
  min_exposure_seconds: 10,
  ads_per_participant: 0,
  randomize_ad_order: true,
  assignment: "balanced",
  locale: "ja",
  completion_code: "",
  completion_url: "",
};

export const DEFAULT_LABEL: LabelConfig = {
  enabled: false,
  text: "",
  description: "",
  position: "bottom-right",
  size: "sm",
  style: "subtle",
  show_icon: false,
};

// ---------------- 게임 ----------------

export interface GameSettings {
  /** 한 판에 보여줄 카드 수. 0이면 전부 */
  cards_per_round: number;
  /** 결과 화면에서 연결할 실험 slug (비우면 링크 없음) */
  link_experiment_slug: string;
  locale: Locale;
  /** 판정 전에 호감도를 묻는지 */
  ask_liking: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  cards_per_round: 10,
  link_experiment_slug: "",
  locale: "ja",
  ask_liking: true,
};

export interface Game {
  id: string;
  slug: string;
  title: string;
  intro_text: string;
  status: ExperimentStatus;
  settings: GameSettings;
  created_at: string;
}

export interface GameCard {
  id: string;
  game_id: string;
  brand_name: string;
  headline: string;
  body_text: string;
  image_url: string;
  /** true = AI 생성, false = 사람 제작 */
  is_ai: boolean;
  /** 출처·라이선스 메모 (사람 제작 이미지의 경우 필수에 가깝다) */
  source_note: string;
  gen_prompt: string;
  gen_model: string;
  sort_order: number;
}

export interface GameSession {
  id: string;
  game_id: string;
  token: string;
  /** 이번 판에 배정된 카드 id 순서 */
  card_ids: string[];
  user_agent: string;
  started_at: string;
  completed_at: string | null;
  score: number;
  total: number;
}

export interface GameAnswer {
  id: string;
  session_id: string;
  card_id: string;
  sort_order: number;
  guess_ai: boolean;
  correct: boolean;
  liking_before: number | null;
  liking_after: number | null;
  response_ms: number | null;
  answered_at: string;
}
