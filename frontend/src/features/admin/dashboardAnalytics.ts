import type { Reservation } from '../../lib/types';

export type ModalityChartDatum = {
  key: string;
  name: string;
  reservas: number;
};

export type PeakHourChartDatum = {
  hour: string;
  label: string;
  reservas: number;
};

const smallWords = new Set(['a', 'as', 'da', 'das', 'de', 'do', 'dos', 'e', 'em']);
const labelCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

const cleanModalityName = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ');

export const modalityKey = (value: string) => cleanModalityName(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

export const formatModalityName = (value: string) => {
  const cleaned = cleanModalityName(value).replace(/_/g, ' ');
  if (!cleaned) return '';

  return cleaned
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word ? word[0].toLocaleUpperCase('pt-BR') + word.slice(1) : word;
    })
    .join(' ');
};

/**
 * Agrupa diretamente a fonte real de reservas. `preferredLabels` serve apenas
 * para escolher a grafia apresentada; nunca limita quais modalidades entram.
 */
export function aggregateReservationsByModality(
  reservations: Array<Pick<Reservation, 'modality'>>,
  preferredLabels: string[] = []
): ModalityChartDatum[] {
  const labels = new Map<string, string>();
  const totals = new Map<string, number>();

  preferredLabels.forEach((value) => {
    const key = modalityKey(value);
    const label = formatModalityName(value);
    if (key && label && !labels.has(key)) labels.set(key, label);
  });

  reservations.forEach((reservation) => {
    const key = modalityKey(String(reservation.modality ?? ''));
    if (!key) return;
    if (!labels.has(key)) labels.set(key, formatModalityName(String(reservation.modality)));
    totals.set(key, (totals.get(key) ?? 0) + 1);
  });

  return Array.from(totals, ([key, reservas]) => ({
    key,
    name: labels.get(key) ?? formatModalityName(key),
    reservas
  })).sort((a, b) => b.reservas - a.reservas || labelCollator.compare(a.name, b.name));
}

export function aggregatePeakHours(
  reservations: Array<Pick<Reservation, 'startTime'>>,
  limit = 6
): PeakHourChartDatum[] {
  const totals = reservations.reduce(
    (map, reservation) => map.set(reservation.startTime, (map.get(reservation.startTime) ?? 0) + 1),
    new Map<string, number>()
  );

  return Array.from(totals, ([hour, reservas]) => ({
    hour,
    label: hour.endsWith(':00') ? `${hour.slice(0, 2)}h` : hour,
    reservas
  }))
    .sort((a, b) => b.reservas - a.reservas || a.hour.localeCompare(b.hour))
    .slice(0, limit);
}
