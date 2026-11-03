/**
 * Indian context for GrowMitra: festivals and voice settings.
 * The app is English-only: every AI route writes customer-facing copy in
 * Indian English no matter what `language` value a client sends.
 */

export interface LanguageOption {
  id: string;
  label: string;
  native: string;
  speechCode: string; // Web Speech API / BCP-47
  promptName: string; // how the model is told to write
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'english',  label: 'English',           native: 'English',      speechCode: 'en-IN', promptName: 'Indian English (natural Indian phrasing, not American)' },
];

export function languagePrompt(languageId?: string): string {
  const chosen = LANGUAGES.find((l) => l.id === languageId) ?? LANGUAGES[0];
  return `WRITE ALL CUSTOMER-FACING COPY IN: ${chosen.promptName}. Never use Hindi, Hinglish or any other Indian language, and never write Devanagari or any other Indic script — English words only.`;
}

export interface Festival {
  id: string;
  name: string;
  greeting: string; // short native greeting the copy can open with
  dates: string[]; // ISO dates (multi-day where relevant)
  palette: string; // default poster palette id from lib/poster.ts
  hooks: string[]; // campaign angles that work for this festival
  shoppingNote: string;
}

// 2026–2027 dates for the major shopping festivals. Approximate where
// regional calendars differ; the app only needs the season, not muhurat.
export const FESTIVALS: Festival[] = [
  { id: 'ugadi', name: 'Ugadi / Telugu New Year', greeting: 'ఉగాది శుభాకాంక్షలు', dates: ['2026-03-19', '2027-04-07'], palette: 'festiveYellow',
    hooks: ['new beginnings offers', 'new collection launch', 'traditional wear restock'], shoppingNote: 'New-year purchases: clothes, gold, home items.' },
  { id: 'ramnavami', name: 'Sri Rama Navami', greeting: 'శ్రీ రామ నవమి శుభాకాంక్షలు', dates: ['2026-03-27'], palette: 'templeSaffron',
    hooks: ['prasad combos', 'traditional sweets', 'puja item bundles'], shoppingNote: 'Sweets, flowers, puja items spike.' },
  { id: 'eid', name: 'Eid al-Fitr', greeting: 'Eid Mubarak', dates: ['2026-03-21', '2027-03-10'], palette: 'eidGreen',
    hooks: ['sheer khurma & sweets pre-orders', 'eid outfit collections', 'gifting hampers'], shoppingNote: 'Sewaiyan, biryani ingredients, outfits, parfum, gifting.' },
  { id: 'akshaya', name: 'Akshaya Tritiya', greeting: 'अक्षय तृतीया की शुभकामनाएँ', dates: ['2026-05-20', '2027-05-10'], palette: 'royalGold',
    hooks: ['gold & silver booking offers', 'zero making-charge days', 'auspicious purchase reminders'], shoppingNote: 'The biggest gold-buying day of the year.' },
  { id: 'mothersday', name: "Mother's Day", greeting: 'Happy Mother’s Day', dates: ['2026-05-10', '2027-05-09'], palette: 'boutiqueRose',
    hooks: ['gift combos for amma/maa', 'saree + jewellery pairings', 'cake & flower bundles'], shoppingNote: 'Gifting across categories.' },
  { id: 'independence', name: 'Independence Day', greeting: 'Happy Independence Day', dates: ['2026-08-15', '2027-08-15'], palette: 'tricolor',
    hooks: ['tricolour specials', 'freedom-sale discounts', 'local pride campaigns'], shoppingNote: 'Sale framing works everywhere.' },
  { id: 'raksha', name: 'Raksha Bandhan', greeting: 'राखी की शुभकामनाएँ', dates: ['2026-08-28', '2027-08-17'], palette: 'festiveRed',
    hooks: ['rakhi + sweets combos', 'gifts for sisters/brothers', 'courier-ready packs'], shoppingNote: 'Rakhi, sweets, gifting.' },
  { id: 'krishna', name: 'Sri Krishna Janmashtami', greeting: 'जन्माष्टमी की शुभकामनाएँ', dates: ['2026-09-04', '2027-08-25'], palette: 'peacockTeal',
    hooks: ['butter/makhan sweets', 'kids dress collections', 'dahi-handi offers'], shoppingNote: 'Sweets, kids wear, decorations.' },
  { id: 'ganesh', name: 'Ganesh Chaturthi', greeting: 'गणपति बप्पा मोरया', dates: ['2026-09-14', '2027-09-03'], palette: 'festiveYellow',
    hooks: ['modak pre-orders', 'eco-idol bundles', 'festival decor'], shoppingNote: 'Modaks, flowers, decor, sweets.' },
  { id: 'onam', name: 'Onam', greeting: 'ഓണാശംസകൾ', dates: ['2026-08-26', '2027-08-15'], palette: 'pongalGreen',
    hooks: ['onam sadya catering', 'kasavu saree collections', 'pongal flower bundles'], shoppingNote: 'Sadya orders, sarees, flowers.' },
  { id: 'navratri', name: 'Navratri', greeting: 'जय माता दी', dates: ['2026-10-11', '2027-09-30'], palette: 'garbaFuchsia',
    hooks: ['9-days navratri colour calendar posts', 'dandiya night outfits', 'fasting menu specials'], shoppingNote: 'Ethnic wear, jewellery, fasting food.' },
  { id: 'diwali', name: 'Diwali', greeting: 'शुभ दीपावली', dates: ['2026-11-08', '2027-10-28'], palette: 'diwaliMaroon',
    hooks: ['deepavali dhamaka sales', 'gold & diamond offers', 'gift hampers', 'sweets & dry fruit boxes', 'home makeover'], shoppingNote: 'The biggest retail season: gold, clothes, sweets, electronics, gifting.' },
  { id: 'bhaidooj', name: 'Bhai Dooj', greeting: 'भाई दूज की शुभकामनाएँ', dates: ['2026-11-12'], palette: 'festiveRed',
    hooks: ['post-diwali gifting', 'sibling combo offers'], shoppingNote: 'Tail end of Diwali gifting.' },
  { id: 'christmas', name: 'Christmas', greeting: 'Merry Christmas', dates: ['2026-12-25', '2027-12-25'], palette: 'christmasPlum',
    hooks: ['cake pre-orders', 'secret santa hampers', 'party wear'], shoppingNote: 'Cakes, gifting, party supplies.' },
  { id: 'newyear', name: 'New Year', greeting: 'Happy New Year', dates: ['2026-12-31', '2027-12-31'], palette: 'midnightNavy',
    hooks: ['year-end clearance', 'new-year new-you offers', 'party combos'], shoppingNote: 'Clearance + party season.' },
  { id: 'pongal', name: 'Pongal / Sankranti / Makar Sankranti', greeting: 'பொங்கல் நல்வாழ்த்துகள்', dates: ['2027-01-15', '2026-01-14'], palette: 'pongalGreen',
    hooks: ['harvest sale', 'sweet pongal kits', 'new utensils & sugarcane'], shoppingNote: 'Sweets, utensils, new clothes.' },
  { id: 'valentines', name: "Valentine's Week", greeting: 'Happy Valentine’s Week', dates: ['2027-02-14', '2027-02-07'], palette: 'boutiqueRose',
    hooks: ['7-days rose day → kiss day calendar', 'couple combos', 'cake & gift pre-orders'], shoppingNote: 'Gifting, cakes, jewellery, dining.' },
  { id: 'holi', name: 'Holi', greeting: 'होली की शुभकामनाएँ', dates: ['2027-03-04', '2026-03-04'], palette: 'holiSplash',
    hooks: ['colour-safe skin care', 'gujiya & thandai pre-orders', 'white-wear sales'], shoppingNote: 'Colours, sweets, drinks, apparel.' },
];

const DAY = 24 * 60 * 60 * 1000;

export interface UpcomingFestival extends Festival {
  daysUntil: number;
  isNow: boolean; // within the festival window
}

/** Festival seasons within the next `horizonDays` (earliest first). */
export function upcomingFestivals(from: Date = new Date(), horizonDays = 30): UpcomingFestival[] {
  const fromMs = from instanceof Date && Number.isFinite(from.getTime()) ? from.getTime() : Date.now();
  const horizon = Number.isFinite(horizonDays) ? horizonDays : 30;
  const out: UpcomingFestival[] = [];
  for (const f of FESTIVALS) {
    for (const d of f.dates) {
      const t = new Date(d + 'T00:00:00').getTime();
      if (!Number.isFinite(t)) continue; // skip malformed dates, never throw
      const days = Math.round((t - fromMs) / DAY);
      if (days >= -2 && days <= horizon) {
        out.push({ ...f, daysUntil: days, isNow: days <= 1 });
      }
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Keyword aliases so a owner's own words ("deepavali sale", "rakhi special") count as asking. */
const FESTIVAL_ALIASES: Record<string, string[]> = {
  diwali: ['diwali', 'deepavali', 'deewali', 'dhanteras', 'दीपावली', 'दीवाली'],
  pongal: ['pongal', 'sankranti', 'sankranthi', 'பொங்கல்', 'मकर'],
  raksha: ['rakhi', 'raksha', 'राखी', 'रक्षा'],
  ganesh: ['ganesh', 'ganpati', 'vinayaka', 'modak', 'गणेश'],
  navratri: ['navratri', 'dussehra', 'durga puja', 'garba', 'नवरात्री'],
  onam: ['onam', 'sadya', 'ഓണം'],
  eid: ['eid', 'ramzan', 'ramadan', 'eid mubarak', 'सैद'],
  christmas: ['christmas', 'xmas', 'क्रिसमस'],
  newyear: ['new year', 'newyear', 'nye', 'नववर्ष'],
  valentines: ['valentine', "valentine's", 'feb 14'],
  holi: ['holi', 'होली'],
  ugadi: ['ugadi', 'gudi padwa', 'ఉగాది'],
  akshaya: ['akshaya', 'akshay tritiya', 'अक्षय'],
  krishna: ['janmashtami', 'krishna', 'dahi handi', 'जन्माष्टमी'],
  independence: ['independence day', '15 august', 'tricolor', 'तिरंगा'],
  mothersday: ["mother's day", 'mothers day', 'मदर्स डे'],
  ramnavami: ['ram navami', 'ramnavami', 'राम नवमी'],
  bhaidooj: ['bhai dooj', 'bhaidooj', 'bhai duj'],
};

/** Festival mentioned in the owner's own words, if any. */
export function detectFestival(userText?: string): string | null {
  if (!userText || typeof userText !== 'string') return null;
  const t = userText.toLowerCase();
  for (const [id, words] of Object.entries(FESTIVAL_ALIASES)) {
    if (words.some((w) => t.includes(w))) return id;
  }
  return null;
}

function festivalBlock(f: Festival, isNow: boolean, daysUntil: number): string {
  const when = isNow ? 'happening RIGHT NOW' : `in ${daysUntil} days`;
  return `FESTIVAL THE OWNER ASKED FOR: ${f.name} — ${when}. Greeting to weave in naturally: "${f.greeting}". Angles that work: ${(f.hooks ?? []).join('; ')}. Shopping behaviour: ${f.shoppingNote}. Mention it where it helps, never in every line.`;
}

/**
 * Festival context for prompts. A festival is included ONLY when the owner
 * explicitly chose one (`festivalId`) or named it in their own words
 * (`userText`). Otherwise the model is told to keep copy evergreen —
 * no forced "Diwali dhamaka" on an ordinary Tuesday post.
 * Never throws: any odd input (non-string ids, unknown ids, invalid dates)
 * degrades to the evergreen prompt.
 */
export function festivalPrompt(festivalId?: string, userText?: string): string {
  const asked =
    typeof festivalId === 'string' && festivalId.trim() ? festivalId.trim() : detectFestival(userText);
  if (typeof asked === 'string' && asked) {
    const f = FESTIVALS.find((x) => x.id === asked);
    if (f) {
      const next = (f.dates ?? [])
        .map((d) => new Date(d + 'T00:00:00').getTime())
        .filter((t) => Number.isFinite(t))
        .map((t) => Math.round((t - Date.now()) / (24 * 60 * 60 * 1000)))
        .filter((days) => days >= -2)
        .sort((a, b) => a - b)[0];
      return festivalBlock(f, next !== undefined && next <= 1, next ?? 0);
    }
  }
  return 'FESTIVALS: The owner did NOT ask for a festival. Do NOT mention any festival, holiday or season in the copy — write evergreen, everyday-marketing angles that work any week of the year. (Wishing someone "Shubh Deepavali" unasked is a failure.)';
}

/** Exposed for UI pickers. */
export function currentFestivalSeason(from: Date = new Date()): UpcomingFestival | null {
  return upcomingFestivals(from, 21)[0] ?? null;
}
