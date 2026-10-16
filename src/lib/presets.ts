import type { Ad, Condition, LabelConfig, SurveyItem } from "@/lib/types";

/** 0단계 설계안의 공개 조건 C0~C3 프리셋 */
export const CONDITION_PRESETS: Array<Omit<Condition, "id" | "experiment_id">> = [
  {
    code: "C0",
    name: "統制（表示なし）",
    weight: 1,
    sort_order: 0,
    label_config: {
      enabled: false,
      text: "",
      description: "",
      position: "bottom-right",
      size: "sm",
      style: "subtle",
      show_icon: false,
    },
  },
  {
    code: "C1",
    name: "最小（小さな文字）",
    weight: 1,
    sort_order: 1,
    label_config: {
      enabled: true,
      text: "画像はAIで生成",
      description: "",
      position: "bottom-right",
      size: "sm",
      style: "subtle",
      show_icon: false,
    },
  },
  {
    code: "C2",
    name: "強調（バッジ）",
    weight: 1,
    sort_order: 2,
    label_config: {
      enabled: true,
      text: "AI生成広告",
      description: "",
      position: "top-left",
      size: "md",
      style: "badge",
      show_icon: true,
    },
  },
  {
    code: "C3",
    name: "説明型（人による確認）",
    weight: 1,
    sort_order: 3,
    label_config: {
      enabled: true,
      text: "AI生成広告",
      description: "この広告の画像はAIで生成し、人が内容を確認しています",
      position: "top-bar",
      size: "md",
      style: "banner",
      show_icon: true,
    },
  },
];

export const AD_PRESETS: Array<Omit<Ad, "id" | "experiment_id">> = [
  {
    code: "AD_HEDONIC",
    name: "化粧品（快楽的）",
    brand_name: "LUMIÈRE",
    product_category: "hedonic",
    headline: "朝の光を、肌にまとう。",
    body_text: "新しい美容液「LUMIÈRE セラム」。一滴で、透明感のある一日がはじまる。",
    cta_text: "詳しく見る",
    image_url: "/demo/ad-hedonic.svg",
    sort_order: 0,
  },
  {
    code: "AD_UTIL",
    name: "自動車保険（実用的）",
    brand_name: "セーフドライブ保険",
    product_category: "utilitarian",
    headline: "もしもの時も、月々1,980円から。",
    body_text: "事故対応24時間365日。ネット申込で最大20%割引。",
    cta_text: "見積もりをとる",
    image_url: "/demo/ad-utilitarian.svg",
    sort_order: 1,
  },
];

const L7 = ["全くそう思わない", "非常にそう思う"];

function likert(
  phase: SurveyItem["phase"],
  code: string,
  construct: string,
  text: string,
  sort_order: number,
): Omit<SurveyItem, "id" | "experiment_id"> {
  return {
    phase,
    code,
    construct,
    text,
    type: "likert",
    scale_points: 7,
    scale_labels: L7,
    options: [],
    required: true,
    sort_order,
  };
}

/** 기본 설문 세트. 논문 전환 시 검증된 척도 원문으로 교체하면 된다. */
export const ITEM_PRESETS: Array<Omit<SurveyItem, "id" | "experiment_id">> = [
  // --- 사전 설문 ---
  {
    phase: "pre",
    code: "age",
    construct: "demographic",
    text: "あなたの年齢を教えてください。",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["18〜24歳", "25〜34歳", "35〜44歳", "45〜54歳", "55〜64歳", "65歳以上"],
    required: true,
    sort_order: 0,
  },
  {
    phase: "pre",
    code: "gender",
    construct: "demographic",
    text: "あなたの性別を教えてください。",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["女性", "男性", "その他", "回答しない"],
    required: true,
    sort_order: 1,
  },
  likert("pre", "ai_att1", "ai_attitude", "AI技術は社会にとって有益だと思う。", 2),
  likert("pre", "ai_att2", "ai_attitude", "AIが作ったコンテンツに抵抗はない。", 3),
  likert("pre", "ai_att3", "ai_attitude", "AIを使ったサービスをよく利用している。", 4),
  likert("pre", "ad_skep1", "ad_skepticism", "広告は一般的に信用できない。", 5),
  likert("pre", "ad_skep2", "ad_skepticism", "広告は製品の良い面だけを伝えている。", 6),

  // --- 광고별 설문 ---
  likert("post_ad", "aad1", "ad_attitude", "この広告は好ましい。", 0),
  likert("post_ad", "aad2", "ad_attitude", "この広告は魅力的だ。", 1),
  likert("post_ad", "aad3", "ad_attitude", "この広告は良い広告だ。", 2),
  likert("post_ad", "pi1", "purchase_intention", "この商品を購入したいと思う。", 3),
  likert("post_ad", "pi2", "purchase_intention", "機会があればこの商品を検討する。", 4),
  likert("post_ad", "dec1", "perceived_deception", "この広告は消費者を誤解させようとしている。", 5),
  likert("post_ad", "dec2", "perceived_deception", "この広告には何か隠されていると感じる。", 6),
  likert("post_ad", "trans1", "perceived_transparency", "この広告主は正直だと感じる。", 7),
  likert("post_ad", "trans2", "perceived_transparency", "この広告は情報を隠さず開示している。", 8),
  likert("post_ad", "trust1", "brand_trust", "このブランドは信頼できる。", 9),
  likert("post_ad", "trust2", "brand_trust", "このブランドは誠実だと思う。", 10),
  likert("post_ad", "auth1", "authenticity", "この広告には人間らしい温かみがある。", 11),
  {
    phase: "post_ad",
    code: "attn1",
    construct: "attention_check",
    text: "注意確認のため、この質問では「2」を選んでください。",
    type: "likert",
    scale_points: 7,
    scale_labels: L7,
    options: [],
    required: true,
    sort_order: 12,
  },

  // --- 최종 설문 ---
  {
    phase: "final",
    code: "mc_notice",
    construct: "manipulation_check",
    text: "先ほどの広告に、AIに関する表示はありましたか？",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["あった", "なかった", "わからない"],
    required: true,
    sort_order: 0,
  },
  likert("final", "mc_ai", "manipulation_check", "広告の画像はAIで作られていたと思う。", 1),
  {
    phase: "final",
    code: "ai_ad_exp",
    construct: "exposure_experience",
    text: "これまでにAIで作られた広告を見たことがありますか？",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["よくある", "たまにある", "ほとんどない", "わからない"],
    required: true,
    sort_order: 2,
  },
  {
    phase: "final",
    code: "open",
    construct: "open_ended",
    text: "広告を見て感じたことを自由にお書きください（任意）。",
    type: "text",
    scale_points: 0,
    scale_labels: [],
    options: [],
    required: false,
    sort_order: 3,
  },
];

export const DEFAULT_CONSENT = `本調査は広告に対する印象を調べる学術的な調査です。
所要時間は約5〜7分です。回答は匿名で収集され、個人を特定する情報は記録しません。
調査はいつでも中断できます。下のボタンを押すと、調査への参加に同意したものとみなします。`;

export const DEFAULT_DEBRIEF = `ご協力ありがとうございました。
本調査で表示した広告とブランドはすべて架空のものであり、画像はすべてAIによって生成されたものです。
本調査の目的は、広告におけるAI利用の開示方法が消費者の反応にどのような影響を与えるかを調べることです。
一部の参加者にはAI利用の表示がない広告をご覧いただきました。ご理解のほどよろしくお願いいたします。`;

export function labelSummary(l: LabelConfig): string {
  if (!l.enabled) return "表示なし";
  return `${l.text}${l.description ? " / " + l.description : ""}（${l.position}, ${l.size}, ${l.style}）`;
}
