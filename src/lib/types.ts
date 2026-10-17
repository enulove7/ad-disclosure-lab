// 도메인 타입. DB 컬럼명(snake_case)과 동일하게 유지해 매핑 비용을 없앤다.

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
  locale: "ja" | "ko";
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
  sort_order: number;
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
