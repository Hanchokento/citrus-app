// frontend/lib/mock-data.ts
// Worker / R2 接続前にフロント画面を確認するための仮データ

import type {
  CitrusDetails,
  CitrusFeatures,
  RecommendationItem,
  TasteInput,
} from "./types";

export const MOCK_FEATURES: CitrusFeatures[] = [
  {
    id: 1,
    name: "温州みかん",
    brix: 5,
    acid: 3,
    bitterness: 1,
    aroma: 3,
    moisture: 5,
    texture: 3,
    season: "winter",
  },
  {
    id: 2,
    name: "不知火",
    brix: 6,
    acid: 2,
    bitterness: 1,
    aroma: 4,
    moisture: 5,
    texture: 4,
    season: "winter,spring",
  },
  {
    id: 3,
    name: "せとか",
    brix: 6,
    acid: 2,
    bitterness: 1,
    aroma: 5,
    moisture: 5,
    texture: 3,
    season: "winter,spring",
  },
  {
    id: 4,
    name: "甘平",
    brix: 6,
    acid: 2,
    bitterness: 1,
    aroma: 4,
    moisture: 4,
    texture: 5,
    season: "winter",
  },
  {
    id: 5,
    name: "はっさく",
    brix: 3,
    acid: 4,
    bitterness: 5,
    aroma: 3,
    moisture: 3,
    texture: 5,
    season: "winter,spring",
  },
  {
    id: 6,
    name: "甘夏",
    brix: 4,
    acid: 5,
    bitterness: 4,
    aroma: 4,
    moisture: 4,
    texture: 4,
    season: "spring,summer",
  },
];

export const MOCK_DETAILS: CitrusDetails[] = [
  {
    id: 1,
    name: "温州みかん",
    description:
      "日本で最も親しまれている定番の柑橘です。甘さと酸味のバランスがよく、皮がむきやすく手軽に食べられます。",
    imageUrl: "/other_images/no_image.png",
  },
  {
    id: 2,
    name: "不知火",
    description:
      "濃厚な甘さとほどよい酸味が特徴の柑橘です。ジューシーで食べごたえがあり、甘さ重視の人にも人気があります。",
    imageUrl: "/other_images/no_image.png",
  },
  {
    id: 3,
    name: "せとか",
    description:
      "とろけるような食感、強い甘み、華やかな香りが特徴です。高級感のある味わいを楽しみたい人に向いています。",
    imageUrl: "/other_images/no_image.png",
  },
  {
    id: 4,
    name: "甘平",
    description:
      "粒感のあるしっかりした食感と濃い甘さが魅力です。ぷりっとした食感や満足感を重視する人におすすめです。",
    imageUrl: "/other_images/no_image.png",
  },
  {
    id: 5,
    name: "はっさく",
    description:
      "しっかりした果肉と独特の苦味が特徴です。甘いだけでなく、さっぱりした大人っぽい味を好む人に向いています。",
    imageUrl: "/other_images/no_image.png",
  },
  {
    id: 6,
    name: "甘夏",
    description:
      "爽やかな酸味とほろ苦さが特徴の柑橘です。さっぱりした味わいが好きな人や、春夏らしい軽い後味を求める人に合います。",
    imageUrl: "/other_images/no_image.png",
  },
];

function getDistance(input: TasteInput, item: CitrusFeatures): number {
  const keys: (keyof TasteInput)[] = [
    "brix",
    "acid",
    "bitterness",
    "aroma",
    "moisture",
    "texture",
  ];

  return Math.sqrt(
    keys.reduce((sum, key) => {
      const diff = input[key] - item[key];
      return sum + diff * diff;
    }, 0)
  );
}

function buildAmazonUrl(name: string): string {
  const q = encodeURIComponent(`${name} 柑橘 みかん 生果`);
  return `https://www.amazon.co.jp/s?k=${q}`;
}

function buildRakutenUrl(name: string): string {
  const q = encodeURIComponent(`${name} 柑橘 みかん 家庭用 贈答`);
  return `https://search.rakuten.co.jp/search/mall/${q}/`;
}

function buildSatofuruUrl(name: string): string {
  const q = encodeURIComponent(`site:satofull.jp ${name} みかん 柑橘`);
  return `https://www.google.com/search?q=${q}`;
}

export function getMockRecommendations(input: TasteInput): RecommendationItem[] {
  const ranked = [...MOCK_FEATURES]
    .sort((a, b) => getDistance(input, a) - getDistance(input, b))
    .slice(0, 3);

  return ranked.map((feature, index) => {
    const detail = MOCK_DETAILS.find((item) => item.id === feature.id);

    return {
      id: feature.id,
      rank: index + 1,
      name: detail?.name ?? feature.name,
      description: detail?.description ?? "説明文を準備中です。",
      imageUrl: detail?.imageUrl ?? "/other_images/no_image.png",
      features: {
        brix: feature.brix,
        acid: feature.acid,
        bitterness: feature.bitterness,
        aroma: feature.aroma,
        moisture: feature.moisture,
        texture: feature.texture,
      },
      amazonUrl: buildAmazonUrl(feature.name),
      rakutenUrl: buildRakutenUrl(feature.name),
      satofuruUrl: buildSatofuruUrl(feature.name),
    };
  });
}
