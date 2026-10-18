import type { Ad, Condition, LabelConfig, SurveyItem } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/** 0단계 설계안의 공개 조건 C0~C3 프리셋 */
const CONDITION_PRESETS_JA: Array<Omit<Condition, "id" | "experiment_id">> = [
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

/**
 * 가상의 대중 패션 브랜드 "LOAM". 실제 브랜드와 겹치지 않는지 사용 전 확인할 것.
 * 패션 AI 광고의 쟁점은 AI 생성 모델(인물)이므로, 이미지는 모델이 옷을 입은 캠페인 컷으로 잡는다.
 */
const PROMPT_OUTERWEAR_JA =
  "Fashion campaign photograph for a mass-market apparel brand: a Japanese woman in her mid 20s wearing a beige oversized trench coat over a white t-shirt and straight light-blue jeans, walking on a quiet Tokyo backstreet in soft overcast daylight, natural relaxed expression, candid editorial style, full body, shot on 50mm lens, f/2.8, muted natural colors, realistic skin texture. No text, no letters, no logo, no watermark, no visible brand marks.";
const PROMPT_BASICS_JA =
  "Fashion campaign photograph for a mass-market apparel brand: a Japanese man in his late 20s wearing a plain heather-grey crewneck sweatshirt and black tapered chino pants, standing against a sunlit concrete wall, three-quarter body, slight smile, clean minimal composition, soft directional afternoon light, shot on 85mm lens, f/2.0, realistic skin and fabric texture. No text, no letters, no logo, no watermark, no visible brand marks.";
const PROMPT_OUTERWEAR_KO = PROMPT_OUTERWEAR_JA.replace("a Japanese woman", "a Korean woman").replace("Tokyo backstreet", "Seoul backstreet");
const PROMPT_BASICS_KO = PROMPT_BASICS_JA.replace("a Japanese man", "a Korean man");

const AD_PRESETS_JA: Array<Omit<Ad, "id" | "experiment_id">> = [
  {
    code: "AD_OUTER",
    name: "アウター（トレンチコート）",
    brand_name: "LOAM",
    product_category: "outerwear",
    headline: "春の定番、新しく。",
    body_text: "軽くて動きやすいオーバーサイズトレンチ。¥9,990",
    cta_text: "詳しく見る",
    image_url: "/demo/ad-outerwear.svg",
    gen_prompt: PROMPT_OUTERWEAR_JA,
    gen_model: "",
    sort_order: 0,
  },
  {
    code: "AD_BASIC",
    name: "ベーシック（スウェット）",
    brand_name: "LOAM",
    product_category: "basics",
    headline: "毎日着たい、ちょうどいい。",
    body_text: "肌ざわりのいいクルーネックスウェット。全6色 ¥3,990",
    cta_text: "詳しく見る",
    image_url: "/demo/ad-basics.svg",
    gen_prompt: PROMPT_BASICS_JA,
    gen_model: "",
    sort_order: 1,
  },
];

const L7_JA = ["全くそう思わない", "非常にそう思う"];
const L7_KO = ["전혀 그렇지 않다", "매우 그렇다"];

type ItemPreset = Omit<SurveyItem, "id" | "experiment_id">;

function likertWith(labels: string[]) {
  return (phase: SurveyItem["phase"], code: string, construct: string, text: string, sort_order: number): ItemPreset => ({
    phase,
    code,
    construct,
    text,
    type: "likert",
    scale_points: 7,
    scale_labels: labels,
    options: [],
    required: true,
    sort_order,
  });
}
const likert = likertWith(L7_JA);
const likertKo = likertWith(L7_KO);


/** 기본 설문 세트. 논문 전환 시 검증된 척도 원문으로 교체하면 된다. */
const ITEM_PRESETS_JA: ItemPreset[] = [
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
    scale_labels: L7_JA,
    options: ["2"],
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

const DEFAULT_CONSENT_JA = `本調査は広告に対する印象を調べる学術的な調査です。
所要時間は約5〜7分です。回答は匿名で収集され、個人を特定する情報は記録しません。
調査はいつでも中断できます。下のボタンを押すと、調査への参加に同意したものとみなします。`;

const DEFAULT_DEBRIEF_JA = `ご協力ありがとうございました。
本調査で表示した広告とブランドはすべて架空のものであり、画像はすべてAIによって生成されたものです。
本調査の目的は、広告におけるAI利用の開示方法が消費者の反応にどのような影響を与えるかを調べることです。
一部の参加者にはAI利用の表示がない広告をご覧いただきました。ご理解のほどよろしくお願いいたします。`;


// ===================== 한국어 프리셋 =====================

const CONDITION_PRESETS_KO: Array<Omit<Condition, "id" | "experiment_id">> = [
  { ...CONDITION_PRESETS_JA[0], name: "통제 (표시 없음)" },
  {
    ...CONDITION_PRESETS_JA[1],
    name: "최소 (작은 문구)",
    label_config: { ...CONDITION_PRESETS_JA[1].label_config, text: "이미지는 AI로 생성됨" },
  },
  {
    ...CONDITION_PRESETS_JA[2],
    name: "강조 (배지)",
    label_config: { ...CONDITION_PRESETS_JA[2].label_config, text: "AI 생성 광고" },
  },
  {
    ...CONDITION_PRESETS_JA[3],
    name: "설명형 (사람이 확인)",
    label_config: {
      ...CONDITION_PRESETS_JA[3].label_config,
      text: "AI 생성 광고",
      description: "이 광고의 이미지는 AI로 생성했으며 사람이 내용을 확인했습니다",
    },
  },
];

const AD_PRESETS_KO: Array<Omit<Ad, "id" | "experiment_id">> = [
  {
    code: "AD_OUTER",
    name: "아우터 (트렌치코트)",
    brand_name: "LOAM",
    product_category: "outerwear",
    headline: "봄의 기본, 새롭게.",
    body_text: "가볍고 활동적인 오버사이즈 트렌치. 99,000원",
    cta_text: "자세히 보기",
    image_url: "/demo/ad-outerwear.svg",
    gen_prompt: PROMPT_OUTERWEAR_KO,
    gen_model: "",
    sort_order: 0,
  },
  {
    code: "AD_BASIC",
    name: "베이직 (스웨트셔츠)",
    brand_name: "LOAM",
    product_category: "basics",
    headline: "매일 입고 싶은, 딱 좋은.",
    body_text: "부드러운 크루넥 스웨트셔츠. 6색 39,000원",
    cta_text: "자세히 보기",
    image_url: "/demo/ad-basics.svg",
    gen_prompt: PROMPT_BASICS_KO,
    gen_model: "",
    sort_order: 1,
  },
];

const ITEM_PRESETS_KO: ItemPreset[] = [
  {
    phase: "pre",
    code: "age",
    construct: "demographic",
    text: "귀하의 연령대를 알려 주세요.",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["18~24세", "25~34세", "35~44세", "45~54세", "55~64세", "65세 이상"],
    required: true,
    sort_order: 0,
  },
  {
    phase: "pre",
    code: "gender",
    construct: "demographic",
    text: "귀하의 성별을 알려 주세요.",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["여성", "남성", "기타", "응답하지 않음"],
    required: true,
    sort_order: 1,
  },
  likertKo("pre", "ai_att1", "ai_attitude", "AI 기술은 사회에 유익하다고 생각한다.", 2),
  likertKo("pre", "ai_att2", "ai_attitude", "AI가 만든 콘텐츠에 거부감이 없다.", 3),
  likertKo("pre", "ai_att3", "ai_attitude", "AI를 활용한 서비스를 자주 이용한다.", 4),
  likertKo("pre", "ad_skep1", "ad_skepticism", "광고는 대체로 믿을 수 없다.", 5),
  likertKo("pre", "ad_skep2", "ad_skepticism", "광고는 제품의 좋은 면만 전달한다.", 6),

  likertKo("post_ad", "aad1", "ad_attitude", "이 광고는 호감이 간다.", 0),
  likertKo("post_ad", "aad2", "ad_attitude", "이 광고는 매력적이다.", 1),
  likertKo("post_ad", "aad3", "ad_attitude", "이 광고는 좋은 광고다.", 2),
  likertKo("post_ad", "pi1", "purchase_intention", "이 제품을 구매하고 싶다.", 3),
  likertKo("post_ad", "pi2", "purchase_intention", "기회가 있다면 이 제품을 고려하겠다.", 4),
  likertKo("post_ad", "dec1", "perceived_deception", "이 광고는 소비자를 오해하게 만들려 한다.", 5),
  likertKo("post_ad", "dec2", "perceived_deception", "이 광고에는 무언가 숨겨진 것이 있다고 느낀다.", 6),
  likertKo("post_ad", "trans1", "perceived_transparency", "이 광고주는 정직하다고 느낀다.", 7),
  likertKo("post_ad", "trans2", "perceived_transparency", "이 광고는 정보를 숨기지 않고 공개하고 있다.", 8),
  likertKo("post_ad", "trust1", "brand_trust", "이 브랜드는 신뢰할 수 있다.", 9),
  likertKo("post_ad", "trust2", "brand_trust", "이 브랜드는 진실하다고 생각한다.", 10),
  likertKo("post_ad", "auth1", "authenticity", "이 광고에는 사람다운 따뜻함이 있다.", 11),
  {
    ...likertKo("post_ad", "attn1", "attention_check", "주의 확인을 위해 이 질문에서는 「2」를 선택해 주세요.", 12),
    options: ["2"],
  },

  {
    phase: "final",
    code: "mc_notice",
    construct: "manipulation_check",
    text: "앞서 본 광고에 AI 관련 표시가 있었습니까?",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["있었다", "없었다", "모르겠다"],
    required: true,
    sort_order: 0,
  },
  likertKo("final", "mc_ai", "manipulation_check", "광고 이미지는 AI로 만들어졌다고 생각한다.", 1),
  {
    phase: "final",
    code: "ai_ad_exp",
    construct: "exposure_experience",
    text: "지금까지 AI로 만든 광고를 본 적이 있습니까?",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["자주 있다", "가끔 있다", "거의 없다", "모르겠다"],
    required: true,
    sort_order: 2,
  },
  {
    phase: "final",
    code: "open",
    construct: "open_ended",
    text: "광고를 보고 느낀 점을 자유롭게 적어 주세요 (선택).",
    type: "text",
    scale_points: 0,
    scale_labels: [],
    options: [],
    required: false,
    sort_order: 3,
  },
];

const DEFAULT_CONSENT_KO = `본 조사는 광고에 대한 인상을 알아보는 학술 조사입니다.
소요 시간은 약 5~7분입니다. 응답은 익명으로 수집되며 개인을 식별할 수 있는 정보는 기록하지 않습니다.
조사는 언제든지 중단할 수 있습니다. 아래 버튼을 누르면 조사 참여에 동의한 것으로 간주합니다.`;

const DEFAULT_DEBRIEF_KO = `참여해 주셔서 감사합니다.
본 조사에서 보여드린 광고와 브랜드는 모두 가상이며, 이미지는 모두 AI로 생성되었습니다.
본 조사의 목적은 광고에서 AI 사용을 공개하는 방식이 소비자 반응에 어떤 영향을 미치는지 알아보는 것입니다.
일부 참가자에게는 AI 사용 표시가 없는 광고를 보여드렸습니다. 양해 부탁드립니다.`;


// ===================== English presets (US sample) =====================

const PROMPT_OUTERWEAR_EN = PROMPT_OUTERWEAR_JA.replace("a Japanese woman", "an American woman").replace("quiet Tokyo backstreet", "quiet residential street in a US city");
const PROMPT_BASICS_EN = PROMPT_BASICS_JA.replace("a Japanese man", "an American man");

const CONDITION_PRESETS_EN: Array<Omit<Condition, "id" | "experiment_id">> = [
  { ...CONDITION_PRESETS_JA[0], name: "Control (no label)" },
  {
    ...CONDITION_PRESETS_JA[1],
    name: "Minimal (small text)",
    label_config: { ...CONDITION_PRESETS_JA[1].label_config, text: "Image generated by AI" },
  },
  {
    ...CONDITION_PRESETS_JA[2],
    name: "Prominent (badge)",
    label_config: { ...CONDITION_PRESETS_JA[2].label_config, text: "AI-generated ad" },
  },
  {
    ...CONDITION_PRESETS_JA[3],
    name: "Explanatory (human-reviewed)",
    label_config: {
      ...CONDITION_PRESETS_JA[3].label_config,
      text: "AI-generated ad",
      description: "The image in this ad was generated by AI and reviewed by a person",
    },
  },
];

const AD_PRESETS_EN: Array<Omit<Ad, "id" | "experiment_id">> = [
  {
    code: "AD_OUTER",
    name: "Outerwear (trench coat)",
    brand_name: "LOAM",
    product_category: "outerwear",
    headline: "The spring essential, reimagined.",
    body_text: "Our lightweight oversized trench. $79.90",
    cta_text: "Shop now",
    image_url: "/demo/ad-outerwear.svg",
    gen_prompt: PROMPT_OUTERWEAR_EN,
    gen_model: "",
    sort_order: 0,
  },
  {
    code: "AD_BASIC",
    name: "Basics (sweatshirt)",
    brand_name: "LOAM",
    product_category: "basics",
    headline: "The one you'll reach for every day.",
    body_text: "Soft crewneck sweatshirt in 6 colors. $29.90",
    cta_text: "Shop now",
    image_url: "/demo/ad-basics.svg",
    gen_prompt: PROMPT_BASICS_EN,
    gen_model: "",
    sort_order: 1,
  },
];

const L7_EN = ["Strongly disagree", "Strongly agree"];
const likertEn = likertWith(L7_EN);

const ITEM_PRESETS_EN: ItemPreset[] = [
  {
    phase: "pre",
    code: "age",
    construct: "demographic",
    text: "What is your age?",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["18–24", "25–34", "35–44", "45–54", "55–64", "65 or older"],
    required: true,
    sort_order: 0,
  },
  {
    phase: "pre",
    code: "gender",
    construct: "demographic",
    text: "What is your gender?",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["Woman", "Man", "Non-binary / other", "Prefer not to say"],
    required: true,
    sort_order: 1,
  },
  likertEn("pre", "ai_att1", "ai_attitude", "AI technology is beneficial for society.", 2),
  likertEn("pre", "ai_att2", "ai_attitude", "I am comfortable with content created by AI.", 3),
  likertEn("pre", "ai_att3", "ai_attitude", "I often use services powered by AI.", 4),
  likertEn("pre", "ad_skep1", "ad_skepticism", "Advertising is generally not trustworthy.", 5),
  likertEn("pre", "ad_skep2", "ad_skepticism", "Ads only tell you the good things about products.", 6),

  likertEn("post_ad", "aad1", "ad_attitude", "I like this ad.", 0),
  likertEn("post_ad", "aad2", "ad_attitude", "This ad is appealing.", 1),
  likertEn("post_ad", "aad3", "ad_attitude", "This is a good ad.", 2),
  likertEn("post_ad", "pi1", "purchase_intention", "I would like to buy this product.", 3),
  likertEn("post_ad", "pi2", "purchase_intention", "I would consider this product if I had the chance.", 4),
  likertEn("post_ad", "dec1", "perceived_deception", "This ad is trying to mislead consumers.", 5),
  likertEn("post_ad", "dec2", "perceived_deception", "I feel something is being hidden in this ad.", 6),
  likertEn("post_ad", "trans1", "perceived_transparency", "This advertiser seems honest.", 7),
  likertEn("post_ad", "trans2", "perceived_transparency", "This ad discloses information openly.", 8),
  likertEn("post_ad", "trust1", "brand_trust", "This brand can be trusted.", 9),
  likertEn("post_ad", "trust2", "brand_trust", "This brand seems sincere.", 10),
  likertEn("post_ad", "auth1", "authenticity", "This ad has a human touch.", 11),
  {
    ...likertEn("post_ad", "attn1", "attention_check", "To check you are paying attention, please select \"2\" for this question.", 12),
    options: ["2"],
  },

  {
    phase: "final",
    code: "mc_notice",
    construct: "manipulation_check",
    text: "Did the ad(s) you saw include any label about AI?",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["Yes", "No", "Not sure"],
    required: true,
    sort_order: 0,
  },
  likertEn("final", "mc_ai", "manipulation_check", "The image in the ad was created by AI.", 1),
  {
    phase: "final",
    code: "ai_ad_exp",
    construct: "exposure_experience",
    text: "Have you seen ads made with AI before?",
    type: "single",
    scale_points: 0,
    scale_labels: [],
    options: ["Often", "Sometimes", "Rarely", "Not sure"],
    required: true,
    sort_order: 2,
  },
  {
    phase: "final",
    code: "open",
    construct: "open_ended",
    text: "Anything you'd like to share about the ad(s)? (optional)",
    type: "text",
    scale_points: 0,
    scale_labels: [],
    options: [],
    required: false,
    sort_order: 3,
  },
];

const DEFAULT_CONSENT_EN = `This is an academic study about impressions of advertising.
It takes about 5–7 minutes. Responses are collected anonymously; no personally identifying information is recorded.
You may stop at any time. By pressing the button below, you agree to take part.`;

const DEFAULT_DEBRIEF_EN = `Thank you for participating.
All ads and brands shown in this study are fictional, and every image was generated by AI.
The purpose of the study is to understand how disclosing the use of AI in advertising affects consumer responses.
Some participants saw ads without an AI label. We appreciate your understanding.`;

export interface PresetBundle {
  conditions: Array<Omit<Condition, "id" | "experiment_id">>;
  ads: Array<Omit<Ad, "id" | "experiment_id">>;
  items: ItemPreset[];
  consent: string;
  debrief: string;
}

/** 언어별 프리셋 묶음 */
export function getPresets(locale: Locale): PresetBundle {
  if (locale === "en") {
    return {
      conditions: CONDITION_PRESETS_EN,
      ads: AD_PRESETS_EN,
      items: ITEM_PRESETS_EN,
      consent: DEFAULT_CONSENT_EN,
      debrief: DEFAULT_DEBRIEF_EN,
    };
  }
  if (locale === "ko") {
    return {
      conditions: CONDITION_PRESETS_KO,
      ads: AD_PRESETS_KO,
      items: ITEM_PRESETS_KO,
      consent: DEFAULT_CONSENT_KO,
      debrief: DEFAULT_DEBRIEF_KO,
    };
  }
  return {
    conditions: CONDITION_PRESETS_JA,
    ads: AD_PRESETS_JA,
    items: ITEM_PRESETS_JA,
    consent: DEFAULT_CONSENT_JA,
    debrief: DEFAULT_DEBRIEF_JA,
  };
}

export function labelSummary(l: LabelConfig): string {
  if (!l.enabled) return "表示なし";
  return `${l.text}${l.description ? " / " + l.description : ""}（${l.position}, ${l.size}, ${l.style}）`;
}

// ===================== 예비조사(자극물 선별) 프리셋 =====================
// 라벨 없는 단일 조건에서 후보 이미지 여러 장을 평가해 본 실험용 자극물을 고른다.

const PRETEST_VARIANTS: Array<{ code: string; name: { ja: string; ko: string; en: string }; scene: string }> = [
  { code: "V1", name: { ja: "路地（歩き）", ko: "골목 (걷기)", en: "Backstreet (walking)" }, scene: "walking on a quiet residential backstreet in soft overcast daylight, candid editorial style, full body" },
  { code: "V2", name: { ja: "スタジオ白背景", ko: "스튜디오 흰 배경", en: "Studio white background" }, scene: "standing in a bright minimal photo studio with a plain white backdrop, lookbook style, three-quarter body, soft even light" },
  { code: "V3", name: { ja: "カフェ窓際", ko: "카페 창가", en: "Cafe window" }, scene: "sitting by a large cafe window with warm afternoon light, relaxed natural pose, waist-up, shallow depth of field" },
  { code: "V4", name: { ja: "コンクリート壁", ko: "콘크리트 벽", en: "Concrete wall" }, scene: "standing against a sunlit concrete wall, three-quarter body, slight smile, clean minimal composition, soft directional light" },
  { code: "V5", name: { ja: "横断歩道", ko: "횡단보도", en: "Crosswalk" }, scene: "crossing a city street at a crosswalk, motion in the step, overcast daylight, full body, documentary street-fashion style" },
  { code: "V6", name: { ja: "公園ベンチ", ko: "공원 벤치", en: "Park bench" }, scene: "sitting on a wooden park bench under soft dappled light, relaxed pose, three-quarter body, muted natural colors" },
];

function pretestPrompt(locale: Locale, scene: string): string {
  const who = locale === "en" ? "an American woman in her mid 20s" : locale === "ko" ? "a Korean woman in her mid 20s" : "a Japanese woman in her mid 20s";
  return `Fashion campaign photograph for a mass-market apparel brand: ${who} wearing a beige oversized trench coat over a white t-shirt and straight light-blue jeans, ${scene}, natural expression, realistic skin and fabric texture, shot on 50mm lens, f/2.8. No text, no letters, no signage, no logo, no watermark, no visible brand marks.`;
}

const PRETEST_AD_COPY = {
  ja: { headline: "春の定番、新しく。", body: "軽くて動きやすいオーバーサイズトレンチ。¥9,990", cta: "詳しく見る" },
  ko: { headline: "봄의 기본, 새롭게.", body: "가볍고 활동적인 오버사이즈 트렌치. 99,000원", cta: "자세히 보기" },
  en: { headline: "The spring essential, reimagined.", body: "Our lightweight oversized trench. $79.90", cta: "Shop now" },
};

function pretestItems(locale: Locale): ItemPreset[] {
  const L = locale === "en" ? L7_EN : locale === "ko" ? L7_KO : L7_JA;
  const lk = likertWith(L);
  const T = {
    ja: {
      age: ["あなたの年齢を教えてください。", ["18〜24歳", "25〜34歳", "35〜44歳", "45〜54歳", "55〜64歳", "65歳以上"]],
      gender: ["あなたの性別を教えてください。", ["女性", "男性", "その他", "回答しない"]],
      ai1: "AIで作られた画像を見分ける自信がある。",
      ai2: "AI画像生成ツールを使ったことがある。",
      fash: "手頃な価格のファッションブランド（ユニクロ、GU、ZARA など）の服をよく買う。",
      quality: "この広告の画像は品質が高い。",
      real: "この画像は実際に撮影された写真のように見える。",
      ailike: "この画像はAIで作られたように見える。",
      attr: "この広告は魅力的だ。",
      fit: "この広告は手頃な価格のファッションブランドの広告としてふさわしい。",
      effort: "この広告の制作には手間がかかっていると思う。",
      made: ["この画像はどのように作られたと思いますか？", ["実際に撮影した写真", "デザイナーが制作した画像", "AIで生成した画像", "わからない"]],
      odd: "不自然に感じた部分があれば教えてください（任意）。",
      attn: "注意確認のため、この質問では「2」を選んでください。",
      open: "全体を通して気づいたことがあれば教えてください（任意）。",
    },
    ko: {
      age: ["귀하의 연령대를 알려 주세요.", ["18~24세", "25~34세", "35~44세", "45~54세", "55~64세", "65세 이상"]],
      gender: ["귀하의 성별을 알려 주세요.", ["여성", "남성", "기타", "응답하지 않음"]],
      ai1: "AI로 만든 이미지를 구분할 자신이 있다.",
      ai2: "AI 이미지 생성 도구를 써 본 적이 있다.",
      fash: "저렴한 패션 브랜드(유니클로, 자라, 스파오 등)의 옷을 자주 산다.",
      quality: "이 광고 이미지는 품질이 높다.",
      real: "이 이미지는 실제로 촬영한 사진처럼 보인다.",
      ailike: "이 이미지는 AI로 만든 것처럼 보인다.",
      attr: "이 광고는 매력적이다.",
      fit: "이 광고는 저렴한 패션 브랜드의 광고로 적합하다.",
      effort: "이 광고를 만드는 데 공이 많이 들어갔다고 생각한다.",
      made: ["이 이미지는 어떻게 만들어졌다고 생각하나요?", ["실제로 촬영한 사진", "디자이너가 제작한 이미지", "AI로 생성한 이미지", "모르겠다"]],
      odd: "부자연스럽게 느껴진 부분이 있으면 적어 주세요 (선택).",
      attn: "주의 확인을 위해 이 질문에서는 「2」를 선택해 주세요.",
      open: "전체적으로 느낀 점이 있으면 적어 주세요 (선택).",
    },
    en: {
      age: ["What is your age?", ["18–24", "25–34", "35–44", "45–54", "55–64", "65 or older"]],
      gender: ["What is your gender?", ["Woman", "Man", "Non-binary / other", "Prefer not to say"]],
      ai1: "I am confident I can tell AI-generated images from real photos.",
      ai2: "I have used an AI image generation tool.",
      fash: "I often buy clothes from affordable fashion brands (e.g., Uniqlo, Zara, H&M).",
      quality: "The image in this ad is high quality.",
      real: "This image looks like a real photograph.",
      ailike: "This image looks like it was made by AI.",
      attr: "This ad is appealing.",
      fit: "This ad fits an affordable fashion brand.",
      effort: "A lot of effort went into making this ad.",
      made: ["How do you think this image was made?", ["A real photograph", "Created by a designer", "Generated by AI", "Not sure"]],
      odd: "Did anything look unnatural? (optional)",
      attn: "To check you are paying attention, please select \"2\" for this question.",
      open: "Any other comments? (optional)",
    },
  }[locale];
  const single = (phase: SurveyItem["phase"], code: string, construct: string, text: string, options: string[], sort_order: number, required = true): ItemPreset => ({
    phase, code, construct, text, type: "single", scale_points: 0, scale_labels: [], options, required, sort_order,
  });
  const free = (phase: SurveyItem["phase"], code: string, construct: string, text: string, sort_order: number): ItemPreset => ({
    phase, code, construct, text, type: "text", scale_points: 0, scale_labels: [], options: [], required: false, sort_order,
  });
  return [
    single("pre", "age", "demographic", T.age[0] as string, T.age[1] as string[], 0),
    single("pre", "gender", "demographic", T.gender[0] as string, T.gender[1] as string[], 1),
    lk("pre", "ai_conf", "ai_familiarity", T.ai1, 2),
    lk("pre", "ai_used", "ai_familiarity", T.ai2, 3),
    lk("pre", "fash_inv", "fashion_involvement", T.fash, 4),
    lk("post_ad", "quality", "image_quality", T.quality, 0),
    lk("post_ad", "realism", "realism", T.real, 1),
    lk("post_ad", "ailike", "ai_likeness", T.ailike, 2),
    lk("post_ad", "attr", "ad_attractiveness", T.attr, 3),
    lk("post_ad", "fit", "brand_fit", T.fit, 4),
    lk("post_ad", "effort", "perceived_effort", T.effort, 5),
    single("post_ad", "made", "origin_guess", T.made[0] as string, T.made[1] as string[], 6),
    free("post_ad", "odd", "open_ended", T.odd, 7),
    { ...lk("final", "attn1", "attention_check", T.attn, 0), options: ["2"] },
    free("final", "open", "open_ended", T.open, 1),
  ];
}

const PRETEST_CONSENT = {
  ja: `本調査はファッション広告の画像に対する印象を調べる学術的な予備調査です。
広告画像を6枚ご覧いただき、それぞれについて短い質問にお答えいただきます。所要時間は約6〜8分です。
回答は匿名で収集され、個人を特定する情報は記録しません。調査はいつでも中断できます。
下のボタンを押すと、調査への参加に同意したものとみなします。`,
  ko: `본 조사는 패션 광고 이미지에 대한 인상을 알아보는 학술 예비조사입니다.
광고 이미지 6장을 보고 각각 짧은 질문에 답해 주시면 됩니다. 약 6~8분 소요됩니다.
응답은 익명으로 수집되며 개인 식별 정보는 기록하지 않습니다. 언제든 중단할 수 있습니다.
아래 버튼을 누르면 참여에 동의한 것으로 간주합니다.`,
  en: `This is an academic pilot study about impressions of fashion advertising images.
You will see 6 ad images and answer a few short questions about each. It takes about 6–8 minutes.
Responses are anonymous; no personally identifying information is recorded. You may stop at any time.
By pressing the button below, you agree to take part.`,
};
const PRETEST_DEBRIEF = {
  ja: `ご協力ありがとうございました。
本調査で表示した広告とブランドはすべて架空のものであり、画像はすべてAIによって生成されたものです。
この予備調査の結果は、今後の本調査で使用する広告画像を選ぶために用いられます。`,
  ko: `참여해 주셔서 감사합니다.
본 조사에서 보여드린 광고와 브랜드는 모두 가상이며, 이미지는 모두 AI로 생성되었습니다.
이 예비조사 결과는 본 조사에서 사용할 광고 이미지를 고르는 데 쓰입니다.`,
  en: `Thank you for participating.
All ads and brands shown were fictional, and every image was generated by AI.
The results of this pilot will be used to select the ad images for the main study.`,
};

/** 예비조사(자극물 선별) 프리셋: 라벨 없는 단일 조건 + 후보 이미지 6장 + 평가 문항 */
export function getPretestPresets(locale: Locale): PresetBundle {
  const copy = PRETEST_AD_COPY[locale];
  return {
    conditions: [{ ...CONDITION_PRESETS_JA[0], name: locale === "en" ? "No label (pretest)" : locale === "ko" ? "표시 없음 (예비조사)" : "表示なし（予備調査）" }],
    ads: PRETEST_VARIANTS.map((v, i) => ({
      code: v.code,
      name: v.name[locale],
      brand_name: "LOAM",
      product_category: "outerwear",
      headline: copy.headline,
      body_text: copy.body,
      cta_text: copy.cta,
      image_url: "/demo/ad-outerwear.svg",
      gen_prompt: pretestPrompt(locale, v.scene),
      gen_model: "",
      sort_order: i,
    })),
    items: pretestItems(locale),
    consent: PRETEST_CONSENT[locale],
    debrief: PRETEST_DEBRIEF[locale],
  };
}

// ===================== 본 실험(논문) 프리셋: 2(AI 공개 유무) 피험자 간 =====================
// 척도 원문은 docs/scales.md 참조. [앱 추가] 표시는 논문에 없는 질문 줄기를 앱에서 보탠 것.
// 일본어는 초벌 번역이며 역번역 검증 후 관리자 화면에서 문장만 교체한다.

type Bipolar = { code: string; text: string; left: string; right: string };

function bipolar(phase: SurveyItem["phase"], construct: string, items: Bipolar[], start: number, points = 7): ItemPreset[] {
  return items.map((b, i) => ({
    phase, code: b.code, construct, text: b.text, type: "likert", scale_points: points, scale_labels: [b.left, b.right], options: [], required: true, sort_order: start + i,
  }));
}

const THESIS = {
  en: {
    brand: "LOAM",
    label: "Image generated by AI",
    effortStem: "The development of this ad was…",
    effort: [["not time intensive", "time intensive"], ["not effortful", "effortful"], ["not difficult", "difficult"]],
    auth: [
      "The standards of the brand LOAM are apparently conveyed by the advertisement.",
      "The advertisement seems to reflect that of the LOAM brand.",
      "The advertisement appears to connect with what I know about the LOAM brand.",
      "The advertisement is consistent with the image of the LOAM brand.",
      "The advertisement captures what makes the LOAM brand unique to me.",
    ],
    agree: ["strongly disagree", "strongly agree"],
    evalStem: "Overall, this ad is…",
    evalPairs: [["unfavorable", "favorable"], ["negative", "positive"], ["bad", "good"], ["unpleasant", "pleasant"], ["dislike", "like"]],
    pi: ["The likelihood of purchasing this product is", "The probability that I would consider buying the product is", "My willingness to buy the product is"],
    piAnchors: ["very low", "very high"],
    aias: ["I believe that AI will improve my life.", "I believe that AI will improve my work.", "I think I will use AI technology in the future.", "I think AI technology is positive for humanity."],
    aiasAnchors: ["not at all", "completely agree"],
    mc: ["Did the ad include a note saying that the image was generated by AI?", ["Yes", "No", "Not sure"]],
    mc2: "The image in the ad was created by AI.",
    attn: "To check you are paying attention, please select \"2\" for this question.",
    age: ["What is your age?", ["18–24", "25–34", "35–44", "45–54", "55–64", "65 or older"]],
    gender: ["What is your gender?", ["Woman", "Man", "Non-binary / other", "Prefer not to say"]],
    country: ["Which country do you currently live in?", ["United States", "Japan", "Other"]],
    open: "Any comments about the ad or this survey? (optional)",
    consent: `This is an academic study about impressions of advertising, conducted for a master's thesis.
You will see one ad and answer questions about it. It takes about 5 minutes.
Responses are collected anonymously and stored on a secure server; no personally identifying information is recorded. You may stop at any time without penalty.
By pressing the button below, you confirm that you are 18 or older and agree to take part.`,
    debrief: `Thank you for participating.
The brand and the ad shown in this study are fictional, and the image was generated by AI.
The study examines how disclosing the use of AI in advertising affects consumer responses. Some participants saw the ad without an AI label; this was necessary to compare responses and we apologize for not telling you in advance.
If you have questions about the study, please contact the researcher through the survey platform.`,
  },
  ko: {
    brand: "LOAM",
    label: "이 이미지는 AI로 생성되었습니다",
    effortStem: "이 광고의 제작은…",
    effort: [["시간이 들지 않았다", "시간이 많이 들었다"], ["노력이 들지 않았다", "노력이 많이 들었다"], ["어렵지 않았다", "어려웠다"]],
    auth: [
      "이 광고에서 LOAM이라는 브랜드의 기준이 분명하게 전달된다.",
      "이 광고는 LOAM 브랜드다움을 반영하는 것 같다.",
      "이 광고는 내가 LOAM 브랜드에 대해 아는 것과 연결되는 것 같다.",
      "이 광고는 LOAM 브랜드의 이미지와 일치한다.",
      "이 광고는 나에게 LOAM 브랜드를 특별하게 만드는 점을 담고 있다.",
    ],
    agree: ["전혀 그렇지 않다", "매우 그렇다"],
    evalStem: "전체적으로 이 광고는…",
    evalPairs: [["호감이 가지 않는다", "호감이 간다"], ["부정적이다", "긍정적이다"], ["나쁘다", "좋다"], ["불쾌하다", "유쾌하다"], ["싫다", "좋다"]],
    pi: ["이 제품을 구매할 가능성은…", "이 제품 구매를 고려할 가능성은…", "이 제품을 사고 싶은 마음은…"],
    piAnchors: ["매우 낮다", "매우 높다"],
    aias: ["AI는 내 삶을 더 좋게 만들 것이라고 믿는다.", "AI는 내 일을 더 좋게 만들 것이라고 믿는다.", "앞으로 AI 기술을 사용할 것 같다.", "AI 기술은 인류에게 긍정적이라고 생각한다."],
    aiasAnchors: ["전혀 아니다", "전적으로 동의한다"],
    mc: ["앞서 본 광고에 이미지가 AI로 생성되었다는 표시가 있었습니까?", ["있었다", "없었다", "모르겠다"]],
    mc2: "광고 이미지는 AI로 만들어졌다고 생각한다.",
    attn: "주의 확인을 위해 이 질문에서는 「2」를 선택해 주세요.",
    age: ["귀하의 연령대를 알려 주세요.", ["18~24세", "25~34세", "35~44세", "45~54세", "55~64세", "65세 이상"]],
    gender: ["귀하의 성별을 알려 주세요.", ["여성", "남성", "기타", "응답하지 않음"]],
    country: ["현재 거주하는 국가를 알려 주세요.", ["한국", "일본", "미국", "기타"]],
    open: "광고나 이 조사에 대해 의견이 있으면 적어 주세요 (선택).",
    consent: `본 조사는 광고에 대한 인상을 알아보는 학술 조사로, 석사 논문을 위해 실시합니다.
광고 1개를 보고 그에 대한 질문에 답해 주시면 됩니다. 약 5분 소요됩니다.
응답은 익명으로 수집되어 안전한 서버에 저장되며, 개인을 식별할 수 있는 정보는 기록하지 않습니다. 조사는 언제든지 불이익 없이 중단할 수 있습니다.
아래 버튼을 누르면 만 18세 이상이며 조사 참여에 동의한 것으로 간주합니다.`,
    debrief: `참여해 주셔서 감사합니다.
본 조사에서 보여드린 브랜드와 광고는 가상이며, 이미지는 AI로 생성되었습니다.
본 조사는 광고에서 AI 사용을 공개하는 것이 소비자 반응에 어떤 영향을 미치는지 알아보는 연구입니다. 일부 참가자에게는 AI 표시가 없는 광고를 보여드렸습니다. 반응을 비교하기 위해 필요한 절차였으며, 미리 알려드리지 못한 점 양해 부탁드립니다.
조사에 대해 궁금한 점이 있으면 조사 플랫폼을 통해 연구자에게 문의해 주세요.`,
  },
  ja: {
    brand: "LOAM",
    label: "この画像はAIで生成されました",
    effortStem: "この広告の制作は…",
    effort: [["時間がかかっていない", "時間がかかっている"], ["手間がかかっていない", "手間がかかっている"], ["難しくない", "難しい"]],
    auth: [
      "この広告からは、LOAMというブランドの基準（スタンダード）がはっきりと伝わってくる。",
      "この広告は、LOAMブランドらしさを反映しているように見える。",
      "この広告は、私がLOAMブランドについて知っていることとつながっているように見える。",
      "この広告は、LOAMブランドのイメージと一致している。",
      "この広告は、私にとってLOAMブランドを特別なものにしている点をとらえている。",
    ],
    agree: ["全くそう思わない", "非常にそう思う"],
    evalStem: "全体として、この広告は…",
    evalPairs: [["好ましくない", "好ましい"], ["否定的", "肯定的"], ["悪い", "良い"], ["不快", "快い"], ["嫌い", "好き"]],
    pi: ["この商品を購入する可能性は…", "この商品の購入を検討する可能性は…", "この商品を買いたいという気持ちは…"],
    piAnchors: ["非常に低い", "非常に高い"],
    aias: ["AIは私の生活をより良くすると思う。", "AIは私の仕事をより良くすると思う。", "将来、AI技術を使うと思う。", "AI技術は人類にとって良いものだと思う。"],
    aiasAnchors: ["全くそう思わない", "完全にそう思う"],
    mc: ["先ほどの広告に、画像がAIで生成されたという表示はありましたか？", ["あった", "なかった", "わからない"]],
    mc2: "広告の画像はAIで作られていたと思う。",
    attn: "注意確認のため、この質問では「2」を選んでください。",
    age: ["あなたの年齢を教えてください。", ["18〜24歳", "25〜34歳", "35〜44歳", "45〜54歳", "55〜64歳", "65歳以上"]],
    gender: ["あなたの性別を教えてください。", ["女性", "男性", "その他", "回答しない"]],
    country: ["現在お住まいの国を教えてください。", ["日本", "アメリカ", "その他"]],
    open: "広告やこの調査についてご意見があればお書きください（任意）。",
    consent: `本調査は広告に対する印象を調べる学術調査で、修士論文のために実施しています。
広告を1つご覧いただき、それについての質問にお答えいただきます。所要時間は約5分です。
回答は匿名で収集され、安全なサーバーに保存されます。個人を特定する情報は記録しません。調査はいつでも、不利益なく中断できます。
下のボタンを押すと、18歳以上であること、および調査への参加に同意したものとみなします。`,
    debrief: `ご協力ありがとうございました。
本調査で表示したブランドと広告は架空のものであり、画像はAIによって生成されたものです。
本調査は、広告におけるAI利用の開示が消費者の反応にどのような影響を与えるかを調べるものです。一部の参加者にはAI利用の表示がない広告をご覧いただきました。反応を比較するために必要な手続きでしたが、事前にお伝えできなかったことをお詫びします。
本調査についてご質問がある場合は、調査プラットフォームを通じて研究者にご連絡ください。`,
  },
};

/** 본 실험 프리셋: 조건 2개(공개 없음/있음), 광고 1개, 논문 척도 */
export function getThesisPresets(locale: Locale): PresetBundle {
  const T = locale === "ja" ? THESIS.ja : locale === "ko" ? THESIS.ko : THESIS.en;
  const loc: Locale = locale;
  const base = getPresets(loc);
  const lkAgree = likertWith(T.agree);
  const single = (phase: SurveyItem["phase"], code: string, construct: string, text: string, options: string[], sort_order: number): ItemPreset => ({
    phase, code, construct, text, type: "single", scale_points: 0, scale_labels: [], options, required: true, sort_order,
  });
  const items: ItemPreset[] = [
    single("pre", "age", "demographic", T.age[0] as string, T.age[1] as string[], 0),
    single("pre", "gender", "demographic", T.gender[0] as string, T.gender[1] as string[], 1),
    single("pre", "country", "demographic", T.country[0] as string, T.country[1] as string[], 2),
    ...T.aias.map((t, i) => ({ ...likertWith(T.aiasAnchors)("pre", `aias${i + 1}`, "ai_attitude_aias4", t, 3 + i), scale_points: 10 })),

    ...bipolar("post_ad", "perceived_effort", T.effort.map(([l, r], i) => ({ code: `eff${i + 1}`, text: T.effortStem, left: l, right: r })), 0),
    ...T.auth.map((t, i) => lkAgree("post_ad", `auth${i + 1}`, "ad_authenticity", t, 3 + i)),
    ...bipolar("post_ad", "ad_evaluation", T.evalPairs.map(([l, r], i) => ({ code: `eval${i + 1}`, text: T.evalStem, left: l, right: r })), 8),
    ...bipolar("post_ad", "purchase_intention", T.pi.map((t, i) => ({ code: `pi${i + 1}`, text: t, left: T.piAnchors[0], right: T.piAnchors[1] })), 13),
    { ...lkAgree("post_ad", "attn1", "attention_check", T.attn, 16), options: ["2"] },

    single("final", "mc_notice", "manipulation_check", T.mc[0] as string, T.mc[1] as string[], 0),
    lkAgree("final", "mc_ai", "manipulation_check", T.mc2, 1),
    { phase: "final", code: "open", construct: "open_ended", text: T.open, type: "text", scale_points: 0, scale_labels: [], options: [], required: false, sort_order: 2 },
  ];
  const noLabel = { ...CONDITION_PRESETS_JA[0], name: loc === "ja" ? "AI非開示" : loc === "ko" ? "AI 비공개" : "No disclosure" };
  const withLabel: Omit<Condition, "id" | "experiment_id"> = {
    code: "C1",
    name: loc === "ja" ? "AI開示（表示あり）" : loc === "ko" ? "AI 공개 (표시 있음)" : "AI disclosure (label)",
    weight: 1,
    sort_order: 1,
    label_config: { enabled: true, text: T.label, description: "", position: "top-left", size: "md", style: "badge", show_icon: true },
  };
  return {
    conditions: [noLabel, withLabel],
    ads: [base.ads[0]],
    items,
    consent: T.consent,
    debrief: T.debrief,
  };
}
