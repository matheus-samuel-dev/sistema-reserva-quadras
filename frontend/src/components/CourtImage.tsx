import { ImageOff, Volleyball } from 'lucide-react';
import { useEffect, useState } from 'react';
import courtsSheet from '../assets/courts/playspace-courts-sheet.webp';

const courtPanels: Record<string, { column: number; row: number }> = {
  'c-aurora': { column: 0, row: 0 },
  'c-pulse': { column: 1, row: 0 },
  'c-summit': { column: 2, row: 0 },
  'c-tennis': { column: 0, row: 1 },
  'c-volei': { column: 1, row: 1 },
  'c-neon': { column: 2, row: 1 }
};

const panelForModality = (modality: string) => {
  const index = [...modality.normalize('NFKC')]
    .reduce((hash, character) => (hash * 31 + character.codePointAt(0)!) >>> 0, 0) % 6;
  return { column: index % 3, row: Math.floor(index / 3) };
};

const safeDataImagePattern = /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/=\s]+$/i;

export function getSafeCourtImageSource(image?: string) {
  const normalized = image?.trim();
  if (!normalized) return undefined;
  if (safeDataImagePattern.test(normalized)) return normalized;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function CourtImage({
  courtId,
  courtName,
  modality,
  image,
  alt,
  className = ''
}: {
  courtId: string;
  courtName: string;
  modality?: string;
  image?: string;
  alt?: string;
  className?: string;
}) {
  const customSource = getSafeCourtImageSource(image);
  const [customImageFailed, setCustomImageFailed] = useState(false);
  const [artImageFailed, setArtImageFailed] = useState(false);
  const panel = courtPanels[courtId] ?? (modality ? panelForModality(modality) : undefined);
  const accessibleAlt = alt ?? `Vista da ${courtName}${modality ? `, preparada para ${modality}` : ''}`;
  const showCustomImage = Boolean(customSource && !customImageFailed);
  const showFallback = !showCustomImage && (artImageFailed || !panel);

  useEffect(() => {
    setCustomImageFailed(false);
  }, [customSource]);

  useEffect(() => {
    setArtImageFailed(false);
  }, [courtId, modality]);

  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,var(--panel-soft),var(--surface-2))] ${className}`}>
      {showCustomImage ? (
        <img
          src={customSource}
          alt={accessibleAlt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setCustomImageFailed(true)}
        />
      ) : showFallback ? (
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
            onError={() => setArtImageFailed(true)}
          />
        </div>
      )}
    </div>
  );
}
