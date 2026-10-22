import { Injectable } from '@nestjs/common';

/** Từ điển món ăn Anh -> Việt (dùng để dịch tiêu đề + tìm kiếm tiếng Việt). */
const EN_VI: Record<string, string> = {
  chicken: 'gà', breast: 'ức gà', thigh: 'đùi gà', leg: 'chân gà',
  beef: 'thịt bò', pork: 'thịt heo', lamb: 'thịt dê', turkey: 'thịt gà tây',
  fish: 'cá', salmon: 'cá hồi', tuna: 'cá ngừ', cod: 'cá tuyết', shrimp: 'tôm', prawn: 'tôm',
  egg: 'trứng', eggs: 'trứng', bacon: 'thịt xông khói', ham: 'thịt chua', sausage: 'xúc xích',
  rice: 'cơm', noodles: 'bún/mì', pasta: 'mì Ý', bread: 'bánh mì', dumpling: 'bánh xếp',
  salad: 'salad', soup: 'súp', stew: 'hầm', curry: 'cà ri', casserole: 'nồi hầm',
  potato: 'khoai tây', tomato: 'cà chua', onion: 'hành', garlic: 'tỏi', carrot: 'cà rốt',
  broccoli: 'bông cải xanh', spinach: 'rau chân trôi', kale: 'cải xanh', lettuce: 'xà lách',
  mushroom: 'nấm', pepper: 'ớt', chili: 'ớt cay', ginger: 'gừng', cucumber: 'dưa chuột',
  cheese: 'phô mai', milk: 'sữa', yogurt: 'sữa chua', butter: 'bơ', cream: 'kem',
  sugar: 'đường', honey: 'mật ong', chocolate: 'sô cô la',
  lentil: 'đậu lăng', bean: 'đậu', chickpea: 'đậu xanh', tofu: 'đậu phụ',
  apple: 'táo', banana: 'chuối', lemon: 'chanh', orange: 'cam', berry: 'quả mọng',
  roasted: 'nướng', grilled: 'nướng', baked: 'nướng', fried: 'chiên', boiled: 'luộc',
  steamed: 'hấp', spicy: 'cay', creamy: 'kem béo', crunchy: 'giòn', sweet: 'ngọt',
  pizza: 'bánh pizza', sandwich: 'bánh mì kẹp', burger: 'bánh hamburger',
  cupcake: 'bánh cupcake', cake: 'bánh', cookie: 'bánh quy', smoothie: 'sinh tố',
  flakes: 'vụn', with: 'với',
  and: 'và', the: '', of: 'của', in: 'trong', on: 'trên', a: '', an: '',
};

/** Từ điển Việt -> Anh để tra cứu Spoonacular. */
const VI_EN: Record<string, string> = {
  'gà': 'chicken', 'ức gà': 'chicken breast', 'đùi gà': 'chicken thigh',
  'thịt bò': 'beef', 'thịt heo': 'pork', 'cá': 'fish', 'cá hồi': 'salmon',
  'tôm': 'shrimp', 'trứng': 'egg', 'thịt xông khói': 'bacon', 'xúc xích': 'sausage',
  'cơm': 'rice', 'bún': 'rice noodles', 'mì': 'noodles', 'mì Ý': 'pasta',
  'bánh mì': 'bread', 'salad': 'salad', 'súp': 'soup', 'hầm': 'stew',
  'cà ri': 'curry', 'khoai tây': 'potato', 'cà chua': 'tomato', 'hành': 'onion',
  'tỏi': 'garlic', 'cà rốt': 'carrot', 'bông cải xanh': 'broccoli', 'rau chân trôi': 'spinach',
  'cải xanh': 'kale', 'xà lách': 'lettuce', 'nấm': 'mushroom', 'ớt': 'pepper',
  'gừng': 'ginger', 'dưa chuột': 'cucumber', 'phô mai': 'cheese', 'sữa': 'milk',
  'sữa chua': 'yogurt', 'bơ': 'butter', 'kem': 'cream', 'đường': 'sugar',
  'mật ong': 'honey', 'sô cô la': 'chocolate', 'đậu lăng': 'lentil',
  'đậu': 'beans', 'đậu phụ': 'tofu', 'táo': 'apple', 'chuối': 'banana',
  'chanh': 'lemon', 'cam': 'orange', 'yogurt': 'yogurt', 'nướng': 'roasted',
  'chiên': 'fried', 'luộc': 'boiled', 'hấp': 'steamed', 'cay': 'spicy',
  'ngọt': 'sweet', 'bánh': 'cake', 'sinh tố': 'smoothie', 'pizza': 'pizza',
  'thực đơn': 'meal plan', 'món': 'dish', 'thực phẩm': 'food',
};

/** Từ điển bổ sung dùng để dịch tiêu đề -> tiếng Việt (thứ tự ưu tiên cụm từ dài). */
const PHRASE_VI: Array<[RegExp, string]> = [
  [/\bchicken breast\b/gi, 'ức gà'],
  [/\bbaked\b/gi, 'nướng'],
  [/\broasted\b/gi, 'nướng'],
  [/\bgrilled\b/gi, 'nướng'],
  [/\bfried\b/gi, 'chiên'],
  [/\bboiled\b/gi, 'luộc'],
  [/\bsteamed\b/gi, 'hấp'],
  [/\bwith\b/gi, 'với'],
  [/\band\b/gi, 'và'],
  [/\bthe\b/gi, ''],
  [/\bof\b/gi, 'của'],
];

@Injectable()
export class SpoonacularService {
  private readonly apiKey =
    process.env.SPOONACULAR_API_KEY || '504908e802674b22bf594b67461590be';
  private readonly base = 'https://api.spoonacular.com';

  /** Tìm công thức theo từ khoá (tiếng Việt hoặc tiếng Anh). */
  async searchRecipes(query: string, number = 10) {
    const enQuery = this.viToEn(query);
    const url = `${this.base}/recipes/complexSearch?query=${encodeURIComponent(
      enQuery,
    )}&number=${number}&addRecipeNutrition=true&apiKey=${this.apiKey}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        return { error: `Spoonacular trả về ${res.status}`, status: res.status };
      }
      const data: any = await res.json();
      return (data.results || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        titleVi: this.enToVi(r.title),
        image: r.image,
        imageType: r.imageType ?? null,
        calories: r.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount ?? (r.calories ?? null),
        protein: r.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount ?? null,
        carbs: r.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount ?? null,
        fat: r.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount ?? null,
        readyInMinutes: r.readyInMinutes ?? null,
        servings: r.servings ?? null,
        summary: r.summary ?? '',
      }));
    } catch (e: any) {
      return { error: e?.message || 'Spoonacular lỗi', status: 500 };
    }
  }

  /** Chi tiết công thức (nguyên liệu + cách làm) — dịch tên nguyên liệu. */
  async recipeDetail(id: number) {
    const url = `${this.base}/recipes/${id}?apiKey=${this.apiKey}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        // Fallback: trả thông tin cơ bản từ search nếu chi tiết bị hạn chế
        return {
          id,
          titleVi: `Công thức #${id}`,
          error: `Spoonacular chi tiết trả ${res.status} (quota/rate-limit). Hãy thử lại sau 60s.`,
          status: res.status,
        };
      }
      const r: any = await res.json();
      return {
        id: r.id,
        title: r.title,
        titleVi: this.enToVi(r.title),
        image: r.image,
        readyInMinutes: r.readyInMinutes ?? null,
        servings: r.servings ?? null,
        summary: r.summary ?? '',
        ingredients: (r.extendedIngredients || []).map((i: any) => ({
          name: i.name,
          nameVi: this.enToVi(i.name),
          amount: i.amount,
          unit: i.unit,
        })),
        steps: (r.instructions || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean)
          .map((s: string) => this.enToVi(s)),
        nutrition: r.nutrition
          ? {
              calories: r.nutrition.calories ?? null,
              protein: r.nutrition.protein ?? null,
              carbs: r.nutrition.carbs ?? null,
              fat: r.nutrition.fat ?? null,
            }
          : null,
      };
    } catch (e: any) {
      return { error: e?.message || 'Spoonacular lỗi', status: 500 };
    }
  }

  /** Việt -> Anh (tra cứu cụm từ dài trước). */
  viToEn(query: string): string {
    const lower = query.toLowerCase().trim();
    if (!lower) return 'chicken';
    const keys = Object.keys(VI_EN).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (lower.includes(k)) return VI_EN[k];
    }
    return query.trim();
  }

  /** Anh -> Việt (dịch cụm từ rồi từ đơn). */
  enToVi(text: string): string {
    let out = text;
    for (const [re, vi] of PHRASE_VI) out = out.replace(re, vi);
    const keys = Object.keys(EN_VI).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      out = out.replace(new RegExp(`\\b${k}\\b`, 'gi'), EN_VI[k]);
    }
    return out
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;!?])/g, '$1')
      .trim();
  }
}
