import type { RecommendationItem, TasteInput } from "./types";

export const mockRecommendations: RecommendationItem[] = [
  {
    id: 1,
    rank: 1,
    name: "せとか",
    description:
      "濃厚な甘さと華やかな香りが特徴の柑橘です。果汁感も強く、甘さ重視の人に向いています。",
    imageUrl: "/other_images/no_image.png",
    features: {
      brix: 6,
      acid: 2,
      bitterness: 1,
      aroma: 5,
      moisture: 5,
      texture: 3,
    },
    amazonUrl: "https://www.amazon.co.jp/s?k=%E3%81%9B%E3%81%A8%E3%81%8B+%E6%9F%91%E6%A9%98",
    rakutenUrl: "https://search.rakuten.co.jp/search/mall/%E3%81%9B%E3%81%A8%E3%81%8B+%E6%9F%91%E6%A9%98/",
    satofuruUrl: "https://www.google.com/search?q=site%3Asatofull.jp+%E3%81%9B%E3%81%A8%E3%81%8B+%E6%9F%91%E6%A9%98",
  },
  {
    id: 2,
    rank: 2,
    name: "不知火",
    description:
      "甘味と酸味のバランスがよく、しっかりした食べごたえがあります。ほどよい酸味も楽しみたい人に向いています。",
    imageUrl: "/other_images/no_image.png",
    features: {
      brix: 5,
      acid: 3,
      bitterness: 1,
      aroma: 4,
      moisture: 4,
      texture: 4,
    },
    amazonUrl: "https://www.amazon.co.jp/s?k=%E4%B8%8D%E7%9F%A5%E7%81%AB+%E6%9F%91%E6%A9%98",
    rakutenUrl: "https://search.rakuten.co.jp/search/mall/%E4%B8%8D%E7%9F%A5%E7%81%AB+%E6%9F%91%E6%A9%98/",
    satofuruUrl: "https://www.google.com/search?q=site%3Asatofull.jp+%E4%B8%8D%E7%9F%A5%E7%81%AB+%E6%9F%91%E6%A9%98",
  },
  {
    id: 3,
    rank: 3,
    name: "甘平",
    description:
      "粒感と甘さが印象的な柑橘です。ぷりっとした食感や濃い味を求める人におすすめです。",
    imageUrl: "/other_images/no_image.png",
    features: {
      brix: 6,
      acid: 2,
      bitterness: 1,
      aroma: 4,
      moisture: 4,
      texture: 5,
    },
    amazonUrl: "https://www.amazon.co.jp/s?k=%E7%94%98%E5%B9%B3+%E6%9F%91%E6%A9%98",
    rakutenUrl: "https://search.rakuten.co.jp/search/mall/%E7%94%98%E5%B9%B3+%E6%9F%91%E6%A9%98/",
    satofuruUrl: "https://www.google.com/search?q=site%3Asatofull.jp+%E7%94%98%E5%B9%B3+%E6%9F%91%E6%A9%98",
  },
];

export function getMockRecommendations(_input?: TasteInput): RecommendationItem[] {
  return mockRecommendations;
}
