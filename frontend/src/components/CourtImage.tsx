import { ImageOff, Volleyball } from 'lucide-react';
import { useState } from 'react';
import courtsSheet from '../assets/courts/playspace-courts-sheet.webp';

const courtPanels: Record<string, { column: number; row: number }> = {
  'c-aurora': { column: 0, row: 0 },
  'c-pulse': { column: 1, row: 0 },
  'c-summit': { column: 2, row: 0 },
  'c-tennis': { column: 0, row: 1 },
  'c-volei': { column: 1, row: 1 },
  'c-neon': { column: 2, row: 1 }
};

const modalityPanels: Record<string, { column: number; row: number }> = {
  'Beach Tennis': { column: 0, row: 0 },
  Futevôlei: { column: 1, row: 0 },
  Society: { column: 2, row: 0 },
  Tênis: { column: 0, row: 1 },
  Vôlei: { column: 1, row: 1 },
  Basquete: { column: 2, row: 1 }
};

export function CourtImage({
  courtId,
  courtName,
  modality,
  alt,
  className = ''
}: {
  courtId: string;
  courtName: string;
  modality?: string;
  alt?: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const panel = courtPanels[courtId] ?? (modality ? modalityPanels[modality] : undefined);
  const accessibleAlt = alt ?? `Vista da ${courtName}${modality ? `, preparada para ${modality}` : ''}`;
  const showFallback = imageFailed || !panel;

  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,var(--panel-soft),var(--surface-2))] ${className}`}>
      {showFallback ? (
        <div
          className="absolute inset-0 grid place-items-center p-5 text-center text-muted"
          role="img"
          aria-label={`${accessibleAlt}. Imagem indisponível.`}
        >
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-[var(--surface-1)]">
              {panel ? <ImageOff className="h-5 w-5" aria-hidden="true" /> : <Volleyball className="h-5 w-5" aria-hidden="true" />}
            </div>
            <span className="mt-3 block text-xs font-semibold">Imagem indisponível</span>
          </div>
        </div>
      ) : (
        <div className="absolute left-0 top-1/2 aspect-square w-full -translate-y-1/2 overflow-hidden">
          <img
            src={courtsSheet}
            alt={accessibleAlt}
            loading="lazy"
            decoding="async"
            className="absolute max-w-none object-cover"
            style={{
              width: '300%',
              height: '200%',
              left: `-${panel.column * 100}%`,
              top: `-${panel.row * 100}%`
            }}
            onError={() => setImageFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
