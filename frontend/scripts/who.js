// Who the app is talking about, in the current language.
//
// The demo family cooks for "Mom". A real account says who they cook for on My plan
// (profiles.for_whom, care_for, care_for_name), so the app says "Dad", "Grandma", "Ma" or "you".
// Strings use {who} after "for" / "para" / "為" and {whose} before a noun ("Dad’s plan").
import { lang } from './i18n.js';

const WORDS = {
  mom: { en: ['Mom', 'Mom’s'], zh: ['媽媽', '媽媽的'], es: ['mamá', 'su'] },
  dad: { en: ['Dad', 'Dad’s'], zh: ['爸爸', '爸爸的'], es: ['papá', 'su'] },
  grandma: { en: ['Grandma', 'Grandma’s'], zh: ['嫲嫲', '嫲嫲的'], es: ['la abuela', 'su'] },
  grandpa: { en: ['Grandpa', 'Grandpa’s'], zh: ['爺爺', '爺爺的'], es: ['el abuelo', 'su'] },
  partner: { en: ['your partner', 'your partner’s'], zh: ['伴侶', '伴侶的'], es: ['tu pareja', 'su'] },
  child: { en: ['your child', 'your child’s'], zh: ['孩子', '孩子的'], es: ['tu hijo o hija', 'su'] },
  other: { en: ['your loved one', 'your loved one’s'], zh: ['家人', '家人的'], es: ['tu ser querido', 'su'] },
  family: { en: ['your family', 'your family’s'], zh: ['家人', '家人的'], es: ['tu familia', 'su'] },
  me: { en: ['you', 'your'], zh: ['你', '你的'], es: ['ti', 'tu'] },
};

const code = () => (lang() === 'es' ? 'es' : lang() === 'en' ? 'en' : 'zh');

/** 'me' | 'mom' | 'dad' | ... | 'family' (a caregiver who hasn't said who yet). */
export function whoKind(profile, isDemo) {
  if (isDemo) return 'mom';
  if (profile?.forWhom === 'me') return 'me';
  if (profile?.forWhom === 'family') return profile.careFor || 'family';
  return 'family';
}

/** { who, whose, Who, isMe } for t(key, vars). A name they gave ("Ma") wins over the relation word. */
export function whoVars(profile, isDemo) {
  const kind = whoKind(profile, isDemo);
  const l = code();
  let [who, whose] = WORDS[kind][l];
  const name = !isDemo && kind !== 'me' ? String(profile?.careForName || '').trim() : '';
  if (name) {
    who = name;
    whose = l === 'en' ? `${name}’s` : l === 'zh' ? `${name}的` : 'su';
  }
  return { who, whose, Who: who.charAt(0).toUpperCase() + who.slice(1), isMe: kind === 'me' };
}
