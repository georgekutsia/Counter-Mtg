export type MtgCard = {
  id: string;
  name?: string;
  imageUrl?: string;
  text?: string;
  type?: string;
  types?: string[];
  subtypes?: string[];
  setName?: string;
  manaCost?: string;
  rarity?: string;
  foreignNames?: { language: string; name: string; multiverseid?: number }[];
};

const BASE = 'https://api.magicthegathering.io/v1/cards';

export async function fetchCardImageByName(name: string, signal?: AbortSignal, lang: 'en' | 'es' = 'en'): Promise<string | undefined> {
  if (!name || !name.trim()) return undefined;
  const qParam = lang === 'es' ? 'foreignName' : 'name';
  const url = `${BASE}?${qParam}=${encodeURIComponent(name.trim())}&pageSize=20`;
  const res = await fetch(url, { signal } as any);
  if (!res.ok) return undefined;
  const data = (await res.json()) as { cards?: MtgCard[] };
  const cards = (data.cards ?? []).filter((c) => !!c.imageUrl) as Required<MtgCard>[];
  return cards.length ? cards[0].imageUrl : undefined;
}

export async function fetchCardsByName(name: string, signal?: AbortSignal, lang: 'en' | 'es' = 'en'): Promise<MtgCard[]> {
  if (!name || !name.trim()) return [];
  const qParam = lang === 'es' ? 'foreignName' : 'name';
  const url = `${BASE}?${qParam}=${encodeURIComponent(name.trim())}&pageSize=12`;
  const res = await fetch(url, { signal } as any);
  if (!res.ok) return [];
  const data = (await res.json()) as { cards?: MtgCard[] };
  const cards = (data.cards ?? []).filter((c) => !!c.id) as MtgCard[];
  return cards;
}

export type MtgRuling = { date: string; text: string };

export async function fetchRulings(cardId: string, signal?: AbortSignal): Promise<MtgRuling[]> {
  if (!cardId) return [];
  const url = `https://api.magicthegathering.io/v1/cards/${encodeURIComponent(cardId)}/rulings`;
  const res = await fetch(url, { signal } as any);
  if (!res.ok) return [];
  const data = (await res.json()) as { rulings?: MtgRuling[] };
  return data.rulings ?? [];
}
