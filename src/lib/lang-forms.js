// Grammar helpers for translated copy: plural forms (Slovenian has a dual,
// Croatian a "few" form) and "in <month>" phrases (Slovenian and Croatian
// inflect the month name). Used by beaches, explore and villa.

// forms: { en: { one, other }, sl: { one, two, few, other }, ... } or plain strings.
// Categories follow Intl.PluralRules; a missing category falls back to `other`.
export function plural(forms, n, lang = 'en') {
  const f = forms[lang] ?? forms.en;
  if (typeof f === 'string') return f.replaceAll('{n}', n);
  let cat = 'other';
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {}
  return (f[cat] ?? f.other).replaceAll('{n}', n);
}

const IN_MONTH = {
  en: ['in January', 'in February', 'in March', 'in April', 'in May', 'in June', 'in July', 'in August', 'in September', 'in October', 'in November', 'in December'],
  de: ['im Januar', 'im Februar', 'im März', 'im April', 'im Mai', 'im Juni', 'im Juli', 'im August', 'im September', 'im Oktober', 'im November', 'im Dezember'],
  sl: ['v januarju', 'v februarju', 'v marcu', 'v aprilu', 'v maju', 'v juniju', 'v juliju', 'v avgustu', 'v septembru', 'v oktobru', 'v novembru', 'v decembru'],
  hr: ['u siječnju', 'u veljači', 'u ožujku', 'u travnju', 'u svibnju', 'u lipnju', 'u srpnju', 'u kolovozu', 'u rujnu', 'u listopadu', 'u studenom', 'u prosincu'],
  it: ['a gennaio', 'a febbraio', 'a marzo', 'ad aprile', 'a maggio', 'a giugno', 'a luglio', 'ad agosto', 'a settembre', 'a ottobre', 'a novembre', 'a dicembre'],
};

// "in July" / "im Juli" / "v juliju" / "u srpnju" / "a luglio" for month 1-12.
export function inMonth(m, lang = 'en') {
  return (IN_MONTH[lang] || IN_MONTH.en)[(m - 1 + 12) % 12];
}
