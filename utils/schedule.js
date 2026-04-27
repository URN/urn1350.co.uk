import YAML from 'yaml';

function toHour(value) {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseScheduleYaml(rawYaml) {
  if (!rawYaml) return null;

  const doc = YAML.parseDocument(rawYaml, { uniqueKeys: false });
  const result = {};

  if (!doc || !doc.contents || !Array.isArray(doc.contents.items)) {
    return result;
  }

  doc.contents.items.forEach((dayItem) => {
    const dayName = dayItem && dayItem.key ? dayItem.key.value : null;
    const dayMap = dayItem && dayItem.value && dayItem.value.items;

    if (!dayName || !Array.isArray(dayMap)) {
      return;
    }

    result[dayName] = dayMap.map((showItem, index) => {
      const showName = showItem && showItem.key ? showItem.key.value : '';
      const meta = showItem && showItem.value ? showItem.value.toJSON() : {};
      return {
        id: `${dayName}-${index}`,
        name: showName,
        start: toHour(meta.start),
        end: toHour(meta.end),
        type: meta.type || 'daytime',
      };
    });
  });

  return result;
}
