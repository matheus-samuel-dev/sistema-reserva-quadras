import clsx from 'clsx';
import { useEffect, useMemo, useState, type HTMLAttributes, type SyntheticEvent } from 'react';

const avatarPalette = ['#166534', '#155e75', '#5b21b6', '#9a3412', '#9f1239', '#334155', '#854d0e', '#0f766e'] as const;

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PS';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('pt-BR');
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase('pt-BR');
}

export function getAvatarColor(seed: string) {
  let hash = 0;
  for (const character of seed.trim().toLocaleLowerCase('pt-BR')) {
    hash = (hash * 31 + character.codePointAt(0)!) | 0;
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  name: string;
  src?: string | null;
  alt?: string;
  size?: number | string;
  imageClassName?: string;
  fallbackClassName?: string;
  onImageError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

export function Avatar({
  name,
  src,
  alt,
  size = 44,
  className,
  imageClassName,
  fallbackClassName,
  onImageError,
  style,
  ...spanProps
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);
  const fallbackColor = useMemo(() => getAvatarColor(name || initials), [initials, name]);
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const safeSrc = src && /^(https?:|data:|blob:|\/)/.test(src) ? src : undefined;

  useEffect(() => setImageFailed(false), [src]);

  return (
    <span
      {...spanProps}
      className={clsx(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-line align-middle font-black uppercase',
        className
      )}
      style={{ width: dimension, height: dimension, ...style }}
      role="img"
      aria-label={alt ?? `Avatar de ${name || 'usuário'}`}
    >
      {safeSrc && !imageFailed ? (
        <img
          className={clsx('h-full w-full object-cover', imageClassName)}
          src={safeSrc}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            setImageFailed(true);
            onImageError?.(event);
          }}
        />
      ) : (
        <span
          className={clsx('grid h-full w-full place-items-center text-sm text-white', fallbackClassName)}
          style={{ backgroundColor: fallbackColor }}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </span>
  );
}
