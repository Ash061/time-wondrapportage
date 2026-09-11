export function sentenceList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} en ${items.at(-1)}`;
}

export function endSentence(text) {
  const clean = text.trim();
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function lineFor(sectionName, values, detail) {
  const prefixes = {
    T: 'Wondbed: ',
    I: 'Waargenomen: ',
    M: 'Wondvocht: ',
    E: 'Wondranden en huid rondom: '
  };

  const parts = [];
  if (sectionName === 'M' && values.length) {
    const amount = values.find((value) => value === 'de wond is droog' || value.endsWith('wondvocht'));
    const colors = values.filter((value) => value !== amount);
    let moisture = amount || '';
    if (colors.length) moisture += `${moisture ? ', ' : ''}${sentenceList(colors)} van kleur`;
    parts.push(capitalize(moisture));
  } else if (values.length) {
    parts.push(capitalize(sentenceList(values)));
  }
  if (detail) parts.push(capitalize(endSentence(detail)));
  if (!parts.length) return `${sectionName}: Niet beschreven.`;

  const first = endSentence(parts[0]);
  const rest = parts.slice(1).map(endSentence).join(' ');
  return `${sectionName}: ${prefixes[sectionName]}${first}${rest ? ` ${rest}` : ''}`;
}

export function formatObservedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date).replace(',', ' om');
}

export function buildReport({ location, observedAt, sections }) {
  const heading = [];
  const cleanLocation = location.trim();
  const moment = formatObservedAt(observedAt);
  if (cleanLocation) heading.push(`Wondlocatie: ${cleanLocation}.`);
  if (moment) heading.push(`Observatie: ${moment} uur.`);

  const lines = ['T', 'I', 'M', 'E'].map((key) =>
    lineFor(key, sections[key].values, sections[key].detail)
  );
  return [...heading, ...lines].join('\n');
}
