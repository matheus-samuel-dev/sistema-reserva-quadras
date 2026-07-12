import clsx from 'clsx';
import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from 'react';

const placementClasses = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2'
} as const;

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: keyof typeof placementClasses;
  delay?: number;
  className?: string;
  wrapperClassName?: string;
}

export function Tooltip({ content, children, placement = 'top', delay = 180, className, wrapperClassName }: TooltipProps) {
  const generatedId = useId().replace(/:/g, '');
  const tooltipId = `tooltip-${generatedId}`;
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
      timerRef.current = null;
    }, Math.max(0, delay));
  };

  const showImmediately = () => {
    clearTimer();
    setOpen(true);
  };

  const hide = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => () => clearTimer(), []);

  const child = Children.only(children);
  const describedBy = [child.props['aria-describedby'], tooltipId].filter(Boolean).join(' ');
  const trigger = cloneElement(child, { 'aria-describedby': describedBy });

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') hide();
  };

  return (
    <span
      className={clsx('relative inline-flex', wrapperClassName)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={showImmediately}
      onBlurCapture={hide}
      onKeyDownCapture={handleKeyDown}
    >
      {trigger}
      <span
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={clsx(
          'glass-panel pointer-events-none absolute z-[70] w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-md px-2.5 py-1.5 text-center text-xs font-semibold leading-5 text-[var(--text)] transition duration-150',
          placementClasses[placement],
          open ? 'visible opacity-100' : 'invisible opacity-0',
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
