import React, { useMemo, useRef, useState, useEffect } from "react";
import CountryPicker from "./CountryPicker";

const TIMEOUT_MS = 1 * 40 * 1000; // 40秒
const FIRST_Q_STEP = 1;
const LAST_Q_STEP  = 7;            // 1..7 = 7問
const TOTAL_STEPS  = 7;

/* ── 共通ヘルパ／オプション定義 ── */
const SUPPORTED_LANGS = ["ja", "en", "zh", "ko", "es"];

/* ── 画面上部の多言語タイトル（言語カード画面のみローテーション） ── */
const TITLE_ROTATION_MS = 3000; // 3秒ごとに切り替え

const TITLES = [
  { lang: "ja", text: "白川郷 観光客向けアンケート" },
  { lang: "en", text: "Shirakawa-go Visitor Survey" },
  { lang: "zh", text: "白川乡 游客问卷调查" },
  { lang: "ko", text: "시라카와고 관광객 설문조사" },
  { lang: "es", text: "Encuesta para visitantes de Shirakawa-go" },
];

/* ★ 言語カード画面用の背景画像（public/images/bg1-4.png） */
const BG_IMAGES = [
  "images/bg1.png",
  "images/bg2.png",
  "images/bg3.png",
  "images/bg4.png",
];

/* 回答画面用の背景グラデーション（1回答中は固定でよい） */
const BACKGROUNDS = [
  "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
  "linear-gradient(135deg, #fdfcfb 0%, #e2d1f9 100%)",
  "linear-gradient(135deg, #fceabb 0%, #f8b500 100%)",
  "linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
];

/** options: [{ id, ja, en, zh, ... }, ...] から「ラベル → id」Map を作る */
function buildLabelToIdMap(options) {
  const map = {};
  for (const opt of options) {
    for (const lang of SUPPORTED_LANGS) {
      const label = opt[lang];
      if (label) {
        map[label] = opt.id;
      }
    }
  }
  return map;
}

/** ある言語のラベル配列を取得（その言語でラベルが存在するものだけ） */
function getChoicesForLang(options, lang) {
  return options
    .map(opt => opt[lang])
    .filter(Boolean);
}

/* ── 年齢 ── */
const AGE_OPTIONS = [
  {
    id: "age_u18",
    ja: "18歳未満",
    en: "Under 18",
    zh: "18岁以下",
    ko: "18세 미만",
    es: "Menos de 18 años",
  },
  {
    id: "age_18_24",
    ja: "18–24",
    en: "18–24",
    zh: "18–24岁",
    ko: "18–24세",
    es: "18–24 años",
  },
  {
    id: "age_25_34",
    ja: "25–34",
    en: "25–34",
    zh: "25–34岁",
    ko: "25–34세",
    es: "25–34 años",
  },
  {
    id: "age_35_44",
    ja: "35–44",
    en: "35–44",
    zh: "35–44岁",
    ko: "35–44세",
    es: "35–44 años",
  },
  {
    id: "age_45_54",
    ja: "45–54",
    en: "45–54",
    zh: "45–54岁",
    ko: "45–54세",
    es: "45–54 años",
  },
  {
    id: "age_55_64",
    ja: "55–64",
    en: "55–64",
    zh: "55–64岁",
    ko: "55–64세",
    es: "55–64 años",
  },
  {
    id: "age_65p",
    ja: "65歳以上",
    en: "65+",
    zh: "65岁以上",
    ko: "65세 이상",
    es: "65 años o más",
  },
];

const AGE_ID_MAP = buildLabelToIdMap(AGE_OPTIONS);

/* ── Q3 きっかけ ── */
const DISCOVERY_OPTIONS = [
  {
    id: "discovery_sns",
    ja: "SNS",
    en: "SNS",
    zh: "社交媒体",
    ko: "SNS",
    es: "Redes sociales",
  },
  {
    id: "discovery_friend",
    ja: "知人の紹介",
    en: "Friends/Family",
    zh: "亲友介绍",
    ko: "지인 소개",
    es: "Recomendación de amigos/familia",
  },
  {
    id: "discovery_travel_site",
    ja: "旅行サイト",
    en: "Travel site",
    zh: "旅游网站",
    ko: "여행 사이트",
    es: "Página web de viajes",
  },
  {
    id: "discovery_guidebook",
    ja: "ガイドブック",
    en: "Guidebook",
    zh: "旅行指南",
    ko: "가이드북",
    es: "Guía de viajes",
  },
  {
    id: "discovery_media",
    ja: "テレビ・新聞などのマスメディア",
    en: "TV/News",
    zh: "电视／新闻等媒体",
    ko: "TV·신문 등 매스미디어",
    es: "TV/Noticias",
  },
  {
    id: "discovery_chatgpt",
    ja: "ChatGPT",
    en: "ChatGPT",
    zh: "ChatGPT",
    ko: "ChatGPT",
    es: "ChatGPT",
  },
  {
    id: "discovery_other",
    ja: "その他",
    en: "Other",
    zh: "其他",
    ko: "기타",
    es: "Otros",
  },
];

const DISCOVERY_ID_MAP = buildLabelToIdMap(DISCOVERY_OPTIONS);

/* ── Q4 SNS ── */
// 「使っていない」ラベル（多言語）
const SNS_NONE_VALUES = ["（使っていない）", "(None)", "未使用", "(사용 안 함)", "(Ninguna)"];

const SNS_OPTIONS = [
  {
    id: "sns_none",
    ja: "（使っていない）",
    en: "(None)",
    zh: "未使用",
    ko: "(사용 안 함)",
    es: "(Ninguna)",
  },
  {
    id: "sns_instagram",
    ja: "Instagram",
    en: "Instagram",
    zh: "Instagram",
    ko: "Instagram",
    es: "Instagram",
  },
  {
    id: "sns_tiktok",
    ja: "TikTok",
    en: "TikTok",
    zh: "TikTok",
    ko: "TikTok",
    es: "TikTok",
  },
  {
    id: "sns_youtube",
    ja: "YouTube",
    en: "YouTube",
    zh: "YouTube",
    ko: "YouTube",
    es: "YouTube",
  },
  {
    id: "sns_x",
    ja: "X（Twitter）",
    en: "X (Twitter)",
    zh: "X（原Twitter）",
    ko: "X(트위터)",
    es: "X (Twitter)",
  },
  {
    id: "sns_facebook",
    ja: "Facebook",
    en: "Facebook",
    zh: "Facebook",
    ko: "Facebook",
    es: "Facebook",
  },
  {
    id: "sns_reddit",
    ja: "Reddit",
    en: "Reddit",
    zh: "Reddit",
    ko: "Reddit",
    es: "Reddit",
  },
  {
    id: "sns_pinterest",
    ja: "Pinterest",
    en: "Pinterest",
    zh: "Pinterest",
    ko: "Pinterest",
    es: "Pinterest",
  },
  {
    id: "sns_yelp",
    ja: "Yelp",
    en: "Yelp",
    zh: "Yelp",
    ko: "Yelp",
    es: "Yelp",
  },
  {
    id: "sns_google_reviews",
    ja: "Google Reviews",
    en: "Google Reviews",
    zh: "Google评价",
    ko: "Google 리뷰",
    es: "Google Reseñas",
  },
  {
    id: "sns_google_maps",
    ja: "Google Maps",
    en: "Google Maps",
    zh: "Google地图",
    ko: "Google 지도",
    es: "Google Maps",
  },
  {
    id: "sns_tripadvisor",
    ja: "TripAdvisor",
    en: "TripAdvisor",
    zh: "TripAdvisor",
    ko: "TripAdvisor",
    es: "TripAdvisor",
  },
  {
    id: "sns_other",
    ja: "その他",
    en: "Other",
    zh: "其他",
    ko: "기타",
    es: "Otros",
  },

  // 中国語UI専用SNS（zh 以外のラベルは付けない）
  { id: "sns_wechat",   zh: "微信（WeChat）" },
  { id: "sns_weibo",    zh: "微博（Weibo）" },
  { id: "sns_red",      zh: "小红书（RED）" },
  { id: "sns_douyin",   zh: "抖音（Douyin）" },
  { id: "sns_bilibili", zh: "哔哩哔哩（Bilibili）" },
];

const SNS_ID_MAP = buildLabelToIdMap(SNS_OPTIONS);

/* ── Q5 交通手段 ── */
// 「レンタカー」を判定するためのラベル（多言語）
const RENTAL_LABELS = ["レンタカー", "Rental car", "租车", "렌터카", "Coche de alquiler"];

const TRANSPORT_OPTIONS = [
  {
    id: "transport_car",
    ja: "自家用車",
    en: "Private car",
    zh: "自驾车",
    ko: "자가용 자동차",
    es: "Coche propio",
  },
  {
    id: "transport_rental",
    ja: "レンタカー",
    en: "Rental car",
    zh: "租车",
    ko: "렌터카",
    es: "Coche de alquiler",
  },
  {
    id: "transport_bus",
    ja: "バス",
    en: "Bus",
    zh: "巴士",
    ko: "버스",
    es: "Autobús",
  },
  {
    id: "transport_train",
    ja: "電車",
    en: "Train",
    zh: "火车",
    ko: "전철",
    es: "Tren",
  },
  {
    id: "transport_bicycle",
    ja: "自転車",
    en: "Bicycle",
    zh: "自行车",
    ko: "자전거",
    es: "Bicicleta",
  },
  {
    id: "transport_taxi",
    ja: "タクシー",
    en: "Taxi",
    zh: "出租车",
    ko: "택시",
    es: "Taxi",
  },
  {
    id: "transport_other",
    ja: "その他",
    en: "Other",
    zh: "其他",
    ko: "기타",
    es: "Otros",
  },
];

const TRANSPORT_ID_MAP = buildLabelToIdMap(TRANSPORT_OPTIONS);

/* ── Q6 足りないと感じたもの ── */
// 「特にない」ラベル（多言語）
const LACKING_NONE_VALUES = ["特にない", "None", "无特别不足", "特별히 없음", "Nada en particular"];

const LACKING_OPTIONS = [
  {
    id: "lack_toilets",
    ja: "公共トイレ",
    en: "Public toilets",
    zh: "公共厕所",
    ko: "공중 화장실",
    es: "Baños públicos",
  },
  {
    id: "lack_rest",
    ja: "休憩スペース",
    en: "Rest spaces",
    zh: "休息空间",
    ko: "휴게 공간",
    es: "Zonas de descanso",
  },
  {
    id: "lack_signage",
    ja: "外国語の案内表示",
    en: "Foreign language signage",
    zh: "外语指示牌",
    ko: "외국어 안내 표지",
    es: "Carteles en idiomas extranjeros",
  },
  {
    id: "lack_food",
    ja: "飲食店・屋台",
    en: "Food stalls/restaurants",
    zh: "餐饮店／小吃摊",
    ko: "음식점·포장마차",
    es: "Restaurantes/puestos de comida",
  },
  {
    id: "lack_wifi",
    ja: "無料Wi-Fi",
    en: "Free Wi-Fi",
    zh: "免费Wi-Fi",
    ko: "무료 Wi-Fi",
    es: "Wi-Fi gratuito",
  },
  {
    id: "lack_bins",
    ja: "ごみ箱",
    en: "Trash bins",
    zh: "垃圾箱",
    ko: "쓰레기통",
    es: "Papeleras",
  },
  {
    id: "lack_smoking",
    ja: "喫煙所",
    en: "Smoking areas",
    zh: "吸烟区",
    ko: "흡연 구역",
    es: "Zonas para fumadores",
  },
  {
    id: "lack_none",
    ja: "特にない",
    en: "None",
    zh: "无特别不足",
    ko: "특별히 없음",
    es: "Nada en particular",
  },
];

const LACKING_ID_MAP = buildLabelToIdMap(LACKING_OPTIONS);

/* ── Q7 マナー情報 ── */
const MANNERS_OPTIONS = [
  {
    id: "manners_on_site_posters",
    ja: "白川郷内のポスター・掲示",
    en: "Posters/signage in Shirakawa-go",
    zh: "白川乡内的海报／公告",
    ko: "시라카와고 내의 포스터·게시물",
    es: "Carteles/avisos dentro de Shirakawa-go",
  },
  {
    id: "manners_public_transport",
    ja: "公共交通機関内のポスター・動画",
    en: "Posters/videos in public transport",
    zh: "公共交通工具内的海报／视频",
    ko: "대중교통 내 포스터·영상",
    es: "Carteles/vídeos en el transporte público",
  },
  {
    id: "manners_accommodation",
    ja: "宿泊施設での案内",
    en: "Information at accommodation",
    zh: "住宿设施的说明",
    ko: "숙박 시설의 안내",
    es: "Información en el alojamiento",
  },
  {
    id: "manners_friends_family",
    ja: "友人・家族",
    en: "Friends/Family",
    zh: "朋友／家人",
    ko: "친구·가족",
    es: "Amigos/Familia",
  },
  {
    id: "manners_sns",
    ja: "SNSの情報",
    en: "SNS posts",
    zh: "SNS信息",
    ko: "SNS 정보",
    es: "Información en redes sociales",
  },
  {
    id: "manners_guidebook",
    ja: "ガイドブック",
    en: "Guidebook",
    zh: "旅行指南",
    ko: "가이드북",
    es: "Guía de viajes",
  },
  {
    id: "manners_media",
    ja: "テレビ・新聞等",
    en: "TV/News",
    zh: "电视／新闻等",
    ko: "TV·신문 등",
    es: "TV/Noticias",
  },
  {
    id: "manners_none",
    ja: "確認していない",
    en: "Have not checked",
    zh: "未确认",
    ko: "확인하지 않음",
    es: "No lo he consultado",
  },
];

const MANNERS_ID_MAP = buildLabelToIdMap(MANNERS_OPTIONS);

/* レンタカーの借りた場所（都道府県＋市） */
const RENTAL_PICKUP_CHOICES_JA = [
  "富山県 富山市",
  "富山県 高岡市",
  "富山県 黒部市",
  "福井県 福井市",
  "福井県 敦賀市",
  "石川県 金沢市",
  "石川県 小松市",
  "岐阜県 岐阜市",
  "岐阜県 高山市",
  "岐阜県 中津川市",
  "愛知県 名古屋市",
  "愛知県 常滑市",
  "愛知県 豊橋市",
  "京都府 京都市",
  "京都府 宮津市",
  "大阪府 大阪市",
  "大阪府 豊中市",
  "大阪府 泉佐野市",
  "その他"
];

const RENTAL_PICKUP_CHOICES_EN = [
  "Toyama - Toyama City",
  "Toyama - Takaoka City",
  "Toyama - Kurobe City",
  "Fukui - Fukui City",
  "Fukui - Tsuruga City",
  "Ishikawa - Kanazawa City",
  "Ishikawa - Komatsu City",
  "Gifu - Gifu City",
  "Gifu - Takayama City",
  "Gifu - Nakatsugawa City",
  "Aichi - Nagoya City",
  "Aichi - Tokoname City",
  "Aichi - Toyohashi City",
  "Kyoto - Kyoto City",
  "Kyoto - Miyazu City",
  "Osaka - Osaka City",
  "Osaka - Toyonaka City",
  "Osaka - Izumisano City",
  "Other"
];

const RENTAL_PICKUP_ID_MAP = {
  "富山県 富山市":"rent_toyama_toyama",
  "Toyama - Toyama City":"rent_toyama_toyama",
  "富山県 高岡市":"rent_toyama_takaoka",
  "Toyama - Takaoka City":"rent_toyama_takaoka",
  "富山県 黒部市":"rent_toyama_kurobe",
  "Toyama - Kurobe City":"rent_toyama_kurobe",

  "福井県 福井市":"rent_fukui_fukui",
  "Fukui - Fukui City":"rent_fukui_fukui",
  "福井県 敦賀市":"rent_fukui_tsuruga",
  "Fukui - Tsuruga City":"rent_fukui_tsuruga",

  "石川県 金沢市":"rent_ishikawa_kanazawa",
  "Ishikawa - Kanazawa City":"rent_ishikawa_kanazawa",
  "石川県 小松市":"rent_ishikawa_komatsu",
  "Ishikawa - Komatsu City":"rent_ishikawa_komatsu",

  "岐阜県 岐阜市":"rent_gifu_gifu",
  "Gifu - Gifu City":"rent_gifu_gifu",
  "岐阜県 高山市":"rent_gifu_takayama",
  "Gifu - Takayama City":"rent_gifu_takayama",
  "岐阜県 中津川市":"rent_gifu_nakatsugawa",
  "Gifu - Nakatsugawa City":"rent_gifu_nakatsugawa",

  "愛知県 名古屋市":"rent_aichi_nagoya",
  "Aichi - Nagoya City":"rent_aichi_nagoya",
  "愛知県 常滑市":"rent_aichi_tokuname",
  "Aichi - Tokoname City":"rent_aichi_tokuname",
  "愛知県 豊橋市":"rent_aichi_toyohashi",
  "Aichi - Toyohashi City":"rent_aichi_toyohashi",

  "京都府 京都市":"rent_kyoto_kyoto",
  "Kyoto - Kyoto City":"rent_kyoto_kyoto",
  "京都府 宮津市":"rent_kyoto_miyazu",
  "Kyoto - Miyazu City":"rent_kyoto_miyazu",

  "大阪府 大阪市":"rent_osaka_osaka",
  "Osaka - Osaka City":"rent_osaka_osaka",
  "大阪府 豊中市":"rent_osaka_toyonaka",
  "Osaka - Toyonaka City":"rent_osaka_toyonaka",
  "大阪府 泉佐野市":"rent_osaka_izumisano",
  "Osaka - Izumisano City":"rent_osaka_izumisano",
  "その他":"rent_other",
  "Other":"rent_other"
};

/* ── 変換ヘルパ ── */
const toId  = (label, map) => map[label] ?? "unknown";
const toIds = (labels, map) => labels.map(l => toId(l, map));

export default function App() {
  // 0: 言語 → 1: 国籍 → 2: 年齢層 → 3: きっかけ(複数) → 4: SNS → 5: 交通手段 → 6: 不足項目 → 7: マナー確認
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("ja"); // "ja" | "en" | "zh" | "ko" | "es"

  // タイトルローテーション（言語カード画面のみ）
  const [titleIndex, setTitleIndex] = useState(0);

  // 言語カード画面用の背景画像（1回答ごとに固定）
  const [gateBg, setGateBg] = useState(
    () => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]
  );
  // 回答画面用の背景（1回答ごとに固定）
  const [answerBg, setAnswerBg] = useState(
    () => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]
  );

  // 言語カード画面のときだけタイトルをローテーション
  useEffect(() => {
    if (step !== 0) return;
    const id = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % TITLES.length);
    }, TITLE_ROTATION_MS);
    return () => clearInterval(id);
  }, [step]);

  // 回答
  const [nationality, setNationality] = useState("");
  const [agegroup, setAgegroup] = useState("");
  const [discovery, setDiscovery] = useState([]);     // 複数
  const [snsUsed, setSnsUsed] = useState([]);         // 複数（Noneは単独）
  const [transport, setTransport] = useState([]);     // 複数
  const [rentalPickup, setRentalPickup] = useState(""); // レンタカーを借りた場所
  const [lacking, setLacking] = useState([]);         // 複数（None/特にないは単独）
  const [mannersSrc, setMannersSrc] = useState([]);   // 複数

  const [result, setResult] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // 自動次ページ／自動送信用
  const [autoNextDeadline, setAutoNextDeadline] = useState(null);        // ms or null
  const [autoNextSecondsLeft, setAutoNextSecondsLeft] = useState(null);  // 残り秒数
  const [autoNextTotalSeconds, setAutoNextTotalSeconds] = useState(null); // 総秒数

  // 無操作タイマー
  const lastActivityRef = useRef(Date.now());
  const autoSubmittingRef = useRef(false);

  /* ── 文言 ── */
  const L = useMemo(() => ({
    ja: {
      title: "白川郷アンケート",
      nationality: "国籍（必須）",
      countryHint: "英字で検索可（例：jap, viet, thai など）。",
      agegroup: "年齢層（必須）",
      discovery: "白川郷を知ったきっかけ（必須・複数選択可）",
      sns: "白川郷を調べるために使ったSNS（必須・複数選択可）",
      transport: "白川郷へ来る際に利用した交通手段（必須・複数選択可）",
      rentalPickup: "レンタカーを借りた場所（レンタカーを利用した方のみ・必須）",
      lacking: "観光中に足りないと感じたもの（必須・複数選択可）",
      manners: "観光マナー情報をどこで確認しましたか？（必須・複数選択可）",
      next: "次へ",
      back: "戻る",
      submit: "送信",
      sending: "送信中…",
      success: "送信成功！",
      error: "通信エラー：",
      requiredMsg: "この質問は必須です。",
      select: "選択してください"
    },
    en: {
      title: "Shirakawa-go Survey",
      nationality: "Nationality (required)",
      countryHint: "You can search by typing English letters (e.g. “jap”, “viet”, “thai”).",
      agegroup: "Age group (required)",
      discovery: "How did you first learn about Shirakawa-go? (required, multiple)",
      sns: "SNS used to research Shirakawa-go (required, multiple)",
      transport: "Transportation to Shirakawa-go (required, multiple)",
      rentalPickup: "Where did you rent your car? (required if you used a rental car)",
      lacking: "What felt lacking during your visit? (required, multiple)",
      manners: "Where did you check tourism manners? (required, multiple)",
      next: "Next",
      back: "Back",
      submit: "Submit",
      sending: "Sending…",
      success: "Submitted!",
      error: "Network error: ",
      requiredMsg: "This question is required.",
      select: "Select…"
    },
    zh: {
      title: "白川乡问卷调查",
      nationality: "国籍（必填）",
      countryHint: "可以使用英文输入进行搜索（例如：jap、viet、thai 等）。",
      agegroup: "年龄段（必填）",
      discovery: "您是通过什么途径了解到白川乡的？（必填，可多选）",
      sns: "您在查找白川乡相关信息时使用过哪些 SNS？（必填，可多选）",
      transport: "您来白川乡时使用了哪种交通方式？（必填，可多选）",
      rentalPickup: "租车取车地点（仅限使用租车者，必填）",
      lacking: "在观光过程中，您觉得哪些设施的数量不够？（必填，可多选）",
      manners: "您从哪里了解过旅游礼仪信息？（必填，可多选）",
      next: "下一步",
      back: "返回",
      submit: "提交",
      sending: "提交中…",
      success: "提交成功！",
      error: "网络错误：",
      requiredMsg: "此问题为必填项。",
      select: "请选择"
    },
    ko: {
      title: "시라카와고 설문조사",
      nationality: "국적(필수)",
      countryHint: "알파벳으로 검색할 수 있습니다 (예: jap, viet, thai).",
      agegroup: "연령대(필수)",
      discovery: "시라카와고를 처음 알게 된 계기(필수·복수 선택 가능)",
      sns: "시라카와고 정보를 찾을 때 사용한 SNS(필수·복수 선택 가능)",
      transport: "시라카와고에 올 때 이용한 교통수단(필수·복수 선택 가능)",
      rentalPickup: "렌터카를 빌린 장소(렌터카 이용자만·필수)",
      lacking: "관광 중 부족하다고 느낀 것(필수·복수 선택 가능)",
      manners: "관광 매너 정보를 어디에서 확인하셨나요?(필수·복수 선택 가능)",
      next: "다음",
      back: "뒤로",
      submit: "전송",
      sending: "전송 중…",
      success: "전송 완료!",
      error: "네트워크 오류: ",
      requiredMsg: "이 질문은 필수 항목입니다.",
      select: "선택해 주세요",
    },
    es: {
      title: "Encuesta de Shirakawa-go",
      nationality: "Nacionalidad（obligatorio）",
      countryHint: "Puede buscar escribiendo en letras inglesas (p. ej., “jap”, “viet”, “thai”).",
      agegroup: "Grupo de edad（obligatorio）",
      discovery: "¿Cómo conoció Shirakawa-go por primera vez？（obligatorio・selección múltiple）",
      sns: "Redes sociales que utilizó para informarse sobre Shirakawa-go（obligatorio・selección múltiple）",
      transport: "Medios de transporte para llegar a Shirakawa-go（obligatorio・selección múltiple）",
      rentalPickup: "Lugar donde alquiló el coche（solo si usó coche de alquiler・obligatorio）",
      lacking: "¿Qué sintió que faltaba durante su visita？（obligatorio・selección múltiple）",
      manners: "¿Dónde consultó información sobre normas de turismo？（obligatorio・selección múltiple）",
      next: "Siguiente",
      back: "Atrás",
      submit: "Enviar",
      sending: "Enviando…",
      success: "¡Enviado correctamente!",
      error: "Error de red：",
      requiredMsg: "Esta pregunta es obligatoria．",
      select: "Seleccione…",
    },
  })[lang], [lang]);

  /* ── 各設問の選択肢（UI用ラベル配列） ── */
  const AGE_CHOICES       = getChoicesForLang(AGE_OPTIONS, lang);
  const DISCOVERY_CHOICES = getChoicesForLang(DISCOVERY_OPTIONS, lang);
  const SNS_CHOICES       = getChoicesForLang(SNS_OPTIONS, lang);
  const TRANSPORT_CHOICES = getChoicesForLang(TRANSPORT_OPTIONS, lang);
  const LACKING_CHOICES   = getChoicesForLang(LACKING_OPTIONS, lang);
  const MANNERS_CHOICES   = getChoicesForLang(MANNERS_OPTIONS, lang);

  const RENTAL_PICKUP_CHOICES = lang === "ja"
    ? RENTAL_PICKUP_CHOICES_JA
    : RENTAL_PICKUP_CHOICES_EN; // zh/ko/es はとりあえず英語版を共用

  /* ── 自動次ページ／送信タイマー ── */
  const clearAutoNext = () => {
    setAutoNextDeadline(null);
    setAutoNextSecondsLeft(null);
    setAutoNextTotalSeconds(null);
  };

  const scheduleAutoNext = (seconds) => {
    if (!seconds) return;
    const now = Date.now();
    setAutoNextDeadline(now + seconds * 1000);
    setAutoNextSecondsLeft(seconds);
    setAutoNextTotalSeconds(seconds);
  };

  // step遷移時にはカウントダウンをクリア
  const goToStep = (nextStep) => {
    clearAutoNext();
    setStep(nextStep);
  };

  /* ── 必須チェック ── */
  const stepValid = (s) => {
    if (s === 1) return nationality.trim().length > 0;
    if (s === 2) return agegroup.trim().length > 0;
    if (s === 3) return discovery.length > 0;
    if (s === 4) return snsUsed.length > 0;
    if (s === 5) {
      if (transport.length === 0) return false;
      const usedRentalCar = transport.some(t => RENTAL_LABELS.includes(t));
      if (usedRentalCar && !rentalPickup) return false;
      return true;
    }
    if (s === 6) return lacking.length > 0;
    if (s === 7) return mannersSrc.length > 0;
    return true;
  };
  const canNext = stepValid(step);

  // 自動Next / 自動Submit 本体
  useEffect(() => {
    if (!autoNextDeadline) return;

    const timer = setInterval(() => {
      const diffMs = autoNextDeadline - Date.now();
      if (diffMs <= 0) {
        clearInterval(timer);
        clearAutoNext();

        // 回答が無効なら何もしない
        if (!stepValid(step)) return;

        if (step < LAST_Q_STEP) {
          setStep(prev => Math.min(LAST_Q_STEP, prev + 1));
        } else if (step === LAST_Q_STEP) {
          // 最終ページは自動送信
          handleSubmit();
        }
      } else {
        setAutoNextSecondsLeft(Math.ceil(diffMs / 1000));
      }
    }, 200);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNextDeadline, step]); // handleSubmit は依存に入れない

  /* ── トグル（SNSの「使っていない／(None)／未使用」は単独） ── */
  const toggleMulti = (value, arr, setArr, seconds) => {
    let next;
    if (SNS_NONE_VALUES.includes(value)) {
      const hasNone = arr.some(v => SNS_NONE_VALUES.includes(v));
      next = hasNone ? [] : [value];
    } else {
      const cleared = arr.filter(v => !SNS_NONE_VALUES.includes(v));
      next = cleared.includes(value)
        ? cleared.filter(v => v !== value)
        : [...cleared, value];
    }
    setArr(next);
    if (next.length > 0) {
      scheduleAutoNext(seconds);
    } else {
      clearAutoNext();
    }
  };

  /* ── 不足項目トグル（「特にない／None／无特别不足」は単独） ── */
  const toggleLacking = (v) => {
    setLacking(prev => {
      let next;
      if (LACKING_NONE_VALUES.includes(v)) {
        const hasNone = prev.some(x => LACKING_NONE_VALUES.includes(x));
        next = hasNone ? [] : [v];
      } else {
        const cleaned = prev.filter(x => !LACKING_NONE_VALUES.includes(x));
        next = cleaned.includes(v)
          ? cleaned.filter(x => x !== v)
          : [...cleaned, v];
      }
      if (next.length > 0) {
        scheduleAutoNext(7);
      } else {
        clearAutoNext();
      }
      return next;
    });
  };

  /* ── シート送信 ── */
  async function postToSheet(status) {
    const url = "https://api.sheetbest.com/sheets/30286261-7da1-4e92-bc58-dd125a9dea2d";

    // JST（UTC+9）でのタイムスタンプ
    const timestamp_jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .replace(/\..+/, "");

    const userAgent =
      typeof navigator !== "undefined" && navigator.userAgent
        ? navigator.userAgent
        : "";

    const body = [{
      timestamp_jst,

      status,                      // "complete" | "timeout"
      progress_step: step,         // 1..7

      lang,
      nationality,

      age_group: agegroup,
      age_group_id: toId(agegroup, AGE_ID_MAP),

      discovery: discovery.join(", "),
      discovery_ids: toIds(discovery, DISCOVERY_ID_MAP).join(", "),

      sns_used: snsUsed.join(", "),
      sns_ids: toIds(snsUsed, SNS_ID_MAP).join(", "),

      transport: transport.join(", "),
      transport_ids: toIds(transport, TRANSPORT_ID_MAP).join(", "),

      rental_pickup: rentalPickup,
      rental_pickup_id: rentalPickup ? toId(rentalPickup, RENTAL_PICKUP_ID_MAP) : "",

      lacking_items: lacking.join(", "),
      lacking_ids: toIds(lacking, LACKING_ID_MAP).join(", "),

      manners_sources: mannersSrc.join(", "),
      manners_ids: toIds(mannersSrc, MANNERS_ID_MAP).join(", "),

      user_agent: userAgent,
    }];

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  }

  /* ── 全リセット ── */
  function resetAll() {
    setStep(0);
    setLang("ja");
    setNationality("");
    setAgegroup("");
    setDiscovery([]);
    setSnsUsed([]);
    setTransport([]);
    setRentalPickup("");
    setLacking([]);
    setMannersSrc([]);
    setResult("");
    setSubmitted(false);
    clearAutoNext();
    lastActivityRef.current = Date.now();

    // 新しい回答開始ごとに背景を取り直す
    setGateBg(BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]);
    setAnswerBg(BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]);
  }

  /* ── 送信 ── */
  async function handleSubmit() {
    try {
      clearAutoNext();
      setResult(L.sending);
      await postToSheet("complete");
      setResult(L.success);
      setSubmitted(true);

      // 3秒後に最初の画面へ
      setTimeout(() => {
        resetAll();
      }, 3000);
    } catch (e) {
      setResult(L.error + (e?.message || String(e)));
    }
  }

  /* ── 無操作タイムアウト（部分でも送信） ── */
  async function handleAutoTimeoutSubmit() {
    if (autoSubmittingRef.current) return;
    autoSubmittingRef.current = true;
    try { await postToSheet("timeout"); } catch (_) {}
    resetAll();
    autoSubmittingRef.current = false;
  }

  /* ── 無操作監視 ── */
  useEffect(() => {
    const mark = () => { lastActivityRef.current = Date.now(); };
    const evs = ["click","keydown","mousemove","touchstart","change","scroll","visibilitychange"];
    evs.forEach(e => window.addEventListener(e, mark, { passive: true }));
    const t = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= TIMEOUT_MS) {
        clearInterval(t);
        handleAutoTimeoutSubmit();
      }
    }, 1000);
    return () => { clearInterval(t); evs.forEach(e => window.removeEventListener(e, mark)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [step, lang, nationality, agegroup, discovery, snsUsed, transport, rentalPickup, lacking, mannersSrc]);

  /* ── 送信後の「ありがとうございました」画面 ── */
  if (submitted) {
    let title, msg, note;
    if (lang === "ja") {
      title = "ご回答ありがとうございました！";
      msg   = "アンケートへのご協力に感謝いたします。";
      note  = "数秒後に最初の画面に戻ります。";
    } else if (lang === "zh") {
      title = "非常感谢您的回答！";
      msg   = "感谢您参与本次问卷调查。";
      note  = "几秒钟后将自动返回到开始画面。";
    } else if (lang === "ko") {
      title = "응답해 주셔서 감사합니다!";
      msg   = "설문조사에 참여해 주셔서 감사합니다.";
      note  = "잠시 후 처음 화면으로 돌아갑니다.";
    } else if (lang === "es") {
      title = "¡Muchas gracias por su respuesta!";
      msg   = "Agradecemos su colaboración con la encuesta.";
      note  = "En unos segundos volverá automáticamente a la pantalla inicial.";
    } else {
      title = "Thank you very much!";
      msg   = "We appreciate your cooperation with the survey.";
      note  = "You will be returned to the start in a few seconds.";
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          background: answerBg,
          transition: "background 0.6s ease",
          padding: 16,
          fontFamily: "system-ui, sans-serif"
        }}
      >
        <CenteredCard>
          <div>
            <h2 style={{ marginBottom: 12 }}>{title}</h2>
            <p>{msg}</p>
            <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>{note}</p>
          </div>
        </CenteredCard>
      </div>
    );
  }

  /* ── 残り時間バーの表示条件 ── */
  const showProgressBar =
    autoNextSecondsLeft != null &&
    autoNextTotalSeconds != null &&
    step >= FIRST_Q_STEP &&
    step <= LAST_Q_STEP &&
    stepValid(step);

  const fraction = showProgressBar
    ? Math.max(0, Math.min(1, autoNextSecondsLeft / autoNextTotalSeconds))
    : null;

  const isGate = step === 0;

  /* ── UI本体 ── */
  return (
    <div
      style={{
        minHeight: "100vh",
        ...(isGate
          ? {
              backgroundImage: `url(${gateBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {
              background: answerBg,
            }),
        transition: "background 0.6s ease",
        padding: "20px 12px 32px",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* 上部の共通タイトル */}
        <header style={{ textAlign: "center", marginBottom: 16 }}>
          {isGate ? (
            <>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#444",
                  marginBottom: 4
                }}
              >
                {TITLES[titleIndex].lang}
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  margin: 0
                }}
              >
                {TITLES[titleIndex].text}
              </h1>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#444",
                  marginBottom: 4
                }}
              >
                {lang.toUpperCase()}
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  margin: 0
                }}
              >
                {L.title}
              </h1>
            </>
          )}
        </header>

        {/* 中身は従来どおり */}
        {/* 0 言語ゲート */}
        {step === 0 && (
          <CenteredCard>
            <h2 style={{ margin: "6px 0 16px", lineHeight: 1.4 }}>
              言語を選んでください / Please select your language / 请选择语言 / 언어를 선택해 주세요 / Elija el idioma
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              <button onClick={() => { setLang("ja"); setStep(FIRST_Q_STEP); }} style={gateBtn}>日本語</button>
              <button onClick={() => { setLang("en"); setStep(FIRST_Q_STEP); }} style={gateBtn}>English</button>
              <button onClick={() => { setLang("zh"); setStep(FIRST_Q_STEP); }} style={gateBtn}>简体中文</button>
              <button onClick={() => { setLang("ko"); setStep(FIRST_Q_STEP); }} style={gateBtn}>한국어</button>
              <button onClick={() => { setLang("es"); setStep(FIRST_Q_STEP); }} style={gateBtn}>Español</button>
            </div>
            <div style={{ marginTop: 12, opacity:.6, fontSize:12 }}>Demo mode</div>
          </CenteredCard>
        )}

        {/* 1 国籍 */}
        {step === 1 && (
          <Section
            title={L.nationality}
            required
            progress={{cur: 1, total: TOTAL_STEPS}}
            nextLabel={L.next}
            nextDisabled={!canNext}
            onBack={() => goToStep(0)}   // 言語選択画面に戻る
            onNext={() => goToStep(2)}
            backLabel={L.back}
          >
            <CountryPicker
              value={nationality}
              onChange={(v) => {
                setNationality(v);
                if (v && v.trim().length > 0) {
                  scheduleAutoNext(7);
                } else {
                  clearAutoNext();
                }
              }}
            />
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              {L.countryHint}
            </p>
            {!stepValid(1) && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 1 && stepValid(1) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="next" />
            )}
          </Section>
        )}

        {/* 2 年齢層 */}
        {step === 2 && (
          <Section
            title={L.agegroup}
            required
            progress={{cur: 2, total: TOTAL_STEPS}}
            nextLabel={L.next}
            nextDisabled={!canNext}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            backLabel={L.back}
          >
            <select
              value={agegroup}
              onChange={(e)=>{
                const v = e.target.value;
                setAgegroup(v);
                if (v) {
                  scheduleAutoNext(5);
                } else {
                  clearAutoNext();
                }
              }}
              style={sel}
            >
              <option value="">{L.select}</option>
              {AGE_CHOICES.map(label => (
                <option key={label}>{label}</option>
              ))}
            </select>
            {!stepValid(2) && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 2 && stepValid(2) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="next" />
            )}
          </Section>
        )}

        {/* 3 きっかけ（複数） */}
        {step === 3 && (
          <Section
            title={L.discovery}
            required
            progress={{cur: 3, total: TOTAL_STEPS}}
            nextLabel={L.next}
            nextDisabled={!canNext}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
            backLabel={L.back}
          >
            <GridChoices>
              {DISCOVERY_CHOICES.map(x => (
                <label key={x} style={chkLabel}>
                  <input
                    type="checkbox"
                    checked={discovery.includes(x)}
                    onChange={() =>
                      setDiscovery(prev => {
                        const next = prev.includes(x)
                          ? prev.filter(v => v !== x)
                          : [...prev, x];
                        if (next.length > 0) {
                          scheduleAutoNext(7);
                        } else {
                          clearAutoNext();
                        }
                        return next;
                      })
                    }
                  />
                  {x}
                </label>
              ))}
            </GridChoices>
            {!stepValid(3) && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 3 && stepValid(3) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="next" />
            )}
          </Section>
        )}

        {/* 4 SNS（「使っていない/(None)/未使用」は単独） */}
        {step === 4 && (
          <Section
            title={L.sns}
            required
            progress={{cur: 4, total: TOTAL_STEPS}}
            nextLabel={L.next}
            nextDisabled={!canNext}
            onBack={() => goToStep(3)}
            onNext={() => goToStep(5)}
            backLabel={L.back}
          >
            <GridChoices>
              {SNS_CHOICES.map(x => (
                <label key={x} style={chkLabel}>
                  <input
                    type="checkbox"
                    checked={snsUsed.includes(x)}
                    onChange={() => toggleMulti(x, snsUsed, setSnsUsed, 10)}
                  />
                  {x}
                </label>
              ))}
            </GridChoices>
            {!stepValid(4) && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 4 && stepValid(4) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="next" />
            )}
          </Section>
        )}

        {/* 5 交通手段（複数）＋レンタカーの借りた場所 */}
        {step === 5 && (
          <Section
            title={L.transport}
            required
            progress={{cur: 5, total: TOTAL_STEPS}}
            nextLabel={L.next}
            nextDisabled={!canNext}
            onBack={() => goToStep(4)}
            onNext={() => goToStep(6)}
            backLabel={L.back}
          >
            <GridChoices>
              {TRANSPORT_CHOICES.map(x => (
                <label key={x} style={chkLabel}>
                  <input
                    type="checkbox"
                    checked={transport.includes(x)}
                    onChange={() =>
                      setTransport(prev => {
                        const next = prev.includes(x)
                          ? prev.filter(v => v !== x)
                          : [...prev, x];

                        const usedRentalNext = next.some(t => RENTAL_LABELS.includes(t));

                        if (!usedRentalNext) {
                          if (next.length > 0) {
                            scheduleAutoNext(7);
                          } else {
                            clearAutoNext();
                          }
                        } else {
                          // レンタカー利用 ⇒ 借りた場所が未選択の間は自動遷移を止める
                          if (rentalPickup) {
                            scheduleAutoNext(7);
                          } else {
                            clearAutoNext();
                          }
                        }
                        return next;
                      })
                    }
                  />
                  {x}
                </label>
              ))}
            </GridChoices>

            {/* レンタカーを選んだ人向けの追加質問 */}
            {transport.some(t => RENTAL_LABELS.includes(t)) && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  {L.rentalPickup} <span style={{ color: "crimson" }}>*</span>
                </label>
                <select
                  value={rentalPickup}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRentalPickup(v);
                    if (v) {
                      scheduleAutoNext(7);
                    } else {
                      clearAutoNext();
                    }
                  }}
                  style={sel}
                >
                  <option value="">{L.select}</option>
                  {RENTAL_PICKUP_CHOICES.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
                {!rentalPickup && step === 5 && (
                  <ReqMsg>{L.requiredMsg}</ReqMsg>
                )}
              </div>
            )}

            {!stepValid(5) && transport.length === 0 && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 5 && stepValid(5) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="next" />
            )}
          </Section>
        )}

        {/* 6 不足項目（「特にない/None/无特别不足」は単独） */}
        {step === 6 && (
          <Section
            title={L.lacking}
            required
            progress={{cur: 6, total: TOTAL_STEPS}}
            nextLabel={L.next}
            nextDisabled={!canNext}
            onBack={() => goToStep(5)}
            onNext={() => goToStep(7)}
            backLabel={L.back}
          >
            <GridChoices>
              {LACKING_CHOICES.map(x => (
                <label key={x} style={chkLabel}>
                  <input
                    type="checkbox"
                    checked={lacking.includes(x)}
                    onChange={() => toggleLacking(x)}
                  />
                  {x}
                </label>
              ))}
            </GridChoices>
            {!stepValid(6) && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 6 && stepValid(6) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="next" />
            )}
          </Section>
        )}

        {/* 7 マナー確認（最後：送信, 20秒で自動送信） */}
        {step === 7 && (
          <Section
            title={L.manners}
            required
            progress={{cur: 7, total: TOTAL_STEPS}}
            nextLabel={L.submit}
            nextDisabled={!canNext}
            onBack={() => goToStep(6)}
            onNext={handleSubmit}
            backLabel={L.back}
          >
            <GridChoices>
              {MANNERS_CHOICES.map(x => (
                <label key={x} style={chkLabel}>
                  <input
                    type="checkbox"
                    checked={mannersSrc.includes(x)}
                    onChange={() =>
                      setMannersSrc(prev => {
                        const next = prev.includes(x)
                          ? prev.filter(v => v !== x)
                          : [...prev, x];
                        if (next.length > 0) {
                          scheduleAutoNext(20);   // 最後は20秒
                        } else {
                          clearAutoNext();
                        }
                        return next;
                      })
                    }
                  />
                  {x}
                </label>
              ))}
            </GridChoices>
            {!stepValid(7) && <ReqMsg>{L.requiredMsg}</ReqMsg>}
            {autoNextSecondsLeft != null && step === 7 && stepValid(7) && (
              <AutoNextNotice lang={lang} seconds={autoNextSecondsLeft} mode="submit" />
            )}
            <p style={{ marginTop: 8 }}>{result}</p>
          </Section>
        )}
      </div>

      {/* 画面下部の残り時間バー */}
      <AutoProgressBar fraction={fraction} />
    </div>
  );
}

/* 共通UI */
function CenteredCard({ children }) {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <div style={{
        width: 520, maxWidth: "92vw",
        background: "rgba(0,0,0,0.55)",   // ★ 半透明
        backdropFilter: "blur(6px)",      // ★ 追加：背景をぼかす
        color: "#fff",
        borderRadius: 24, padding: "28px 24px",
        boxShadow: "0 8px 30px rgba(0,0,0,.35)", textAlign: "center"
      }}>
        {children}
      </div>
    </div>
  );
}

function Section({
  title, children, required,
  progress, onBack, onNext, nextLabel, nextDisabled, backLabel,
}) {
  return (
    <section style={{ marginBottom: 32, fontSize: 17 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h2 style={{ fontSize: 18, margin: "8px 0 10px", fontWeight: 700 }}>
          {title} {required && <span style={{ color:"crimson", fontSize: 14 }}>*</span>}
        </h2>
        <div style={{ opacity:.7, fontSize:14 }}>{progress.cur}/{progress.total}</div>
      </div>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        {children}
      </div>

      <Nav
        onBack={onBack}
        onNext={onNext}
        nextLabel={nextLabel}
        nextDisabled={nextDisabled}
        backLabel={backLabel}
      />
    </section>
  );
}

function Nav({ onBack, onNext, nextLabel, nextDisabled, backLabel }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 8
    }}>
      {onBack ? (
        <button onClick={onBack} style={{ padding: "8px 16px" }}>
          {backLabel ?? "戻る"}
        </button>
      ) : <span />}

      {onNext && (
        <button
          onClick={onNext}
          disabled={!!nextDisabled}
          style={{ padding: "8px 16px", fontWeight: 600 }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

/* 自動遷移の注意書き */
function AutoNextNotice({ lang, seconds, mode }) {
  if (seconds == null) return null;
  const isSubmit = mode === "submit";

  if (lang === "ja") {
    return (
      <p style={{ marginTop: 8, fontSize: 16, opacity: 0.8 }}>
        {seconds}秒後に自動的に{isSubmit ? "回答を送信します" : "次のページへ遷移します"}。
        （「戻る」ボタンで戻ることができます）
      </p>
    );
  }
  if (lang === "zh") {
    return (
      <p style={{ marginTop: 8, fontSize: 16, opacity: 0.8 }}>
        {seconds}秒后将自动{isSubmit ? "提交您的回答" : "跳转到下一页"}。
        （您可以通过“返回”按钮返回上一页）
      </p>
    );
  }
  if (lang === "ko") {
    return (
      <p style={{ marginTop: 8, fontSize: 16, opacity: 0.8 }}>
        {seconds}초 후에 자동으로
        {isSubmit ? " 응답이 전송됩니다" : " 다음 페이지로 이동합니다"}.
        (「뒤로」 버튼으로 이전 화면으로 돌아갈 수 있습니다)
      </p>
    );
  }
  if (lang === "es") {
    return (
      <p style={{ marginTop: 8, fontSize: 16, opacity: 0.8 }}>
        En {seconds} segundos
        {isSubmit ? " se enviarán sus respuestas automáticamente" : " pasaremos automáticamente a la siguiente página"}。
        (Puede volver a la pantalla anterior con el botón “Atrás”)
      </p>
    );
  }
  return (
    <p style={{ marginTop: 8, fontSize: 16, opacity: 0.8 }}>
      We will {isSubmit ? "submit your answers" : "move to the next page"} automatically in {seconds} seconds.
      (You can still go back with the Back button.)
    </p>
  );
}

/* 下部の残り時間バー（だんだん色が増える版） */
function AutoProgressBar({ fraction }) {
  if (fraction == null || Number.isNaN(fraction)) return null;

  const clamped = Math.min(Math.max(fraction, 0), 1);
  const progress = 1 - clamped;

  const alpha = 0.15 + 0.55 * progress; // 0.15～0.7
  const barColor = `rgba(0, 0, 0, ${alpha})`;
  const widthPercent = progress * 100;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "6px 12px",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "#f3f3f3",
          borderRadius: 9999,
          overflow: "hidden",
          height: 8,
          boxShadow: "0 0 4px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            width: `${widthPercent}%`,
            height: "100%",
            background: barColor,
            transition: "width 0.3s linear, background-color 0.3s linear",
          }}
        />
      </div>
    </div>
  );
}

/* スタイル */
const gateBtn = {
  width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid #2a2a2a",
  background: "#1e1e1e", color: "#fff", fontWeight: 700, cursor: "pointer",
  boxShadow: "0 6px 12px rgba(0,0,0,.35)"
};
const sel = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd" };
const chkLabel = { display:"inline-flex", alignItems:"center", gap:8, padding:"6px 8px" };
const GridChoices = ({children}) => (
  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:10 }}>
    {children}
  </div>
);
const ReqMsg = ({children}) => (
  <div style={{ color:"crimson", marginTop:6 }}>{children}</div>
);
