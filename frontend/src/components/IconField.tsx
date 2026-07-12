import clsx from 'clsx';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes
} from 'react';

interface IconFieldBaseProps {
  label?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  trailingIconLabel?: string;
  onTrailingIconClick?: () => void;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
  labelClassName?: string;
}

export type IconInputFieldProps = IconFieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
    multiline?: false;
    inputRef?: Ref<HTMLInputElement>;
  };

export type IconTextareaFieldProps = IconFieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> & {
    multiline: true;
    inputRef?: Ref<HTMLTextAreaElement>;
  };

export type IconFieldProps = IconInputFieldProps | IconTextareaFieldProps;

function descriptionIds(
  id: string,
  describedBy: string | undefined,
  hint: string | undefined,
  error: string | undefined
) {
  return [describedBy, hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
}

function FieldFrame({
  id,
  label,
  required,
  disabled,
  leadingIcon,
  trailingIcon,
  trailingIconLabel,
  onTrailingIconClick,
  error,
  hint,
  wrapperClassName,
  labelClassName,
  multiline,
  children
}: IconFieldBaseProps & {
  id: string;
  required?: boolean;
  disabled?: boolean;
  multiline: boolean;
  children: ReactNode;
}) {
  return (
    <div className={clsx('grid gap-2', disabled && 'opacity-70', wrapperClassName)}>
      {label && (
        <label className={clsx('text-sm font-semibold', labelClassName)} htmlFor={id}>
          {label}
          {required && (
            <span className="ml-1 text-[var(--danger)]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <span
            className={clsx(
              'pointer-events-none absolute left-3 z-10 text-muted',
              multiline ? 'top-3.5' : 'top-1/2 -translate-y-1/2'
            )}
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}

        {children}

        {trailingIcon &&
          (onTrailingIconClick ? (
            <button
              className={clsx(
                'absolute right-0.5 z-10 grid h-11 w-11 place-items-center rounded-md border border-transparent bg-transparent p-0 text-muted transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
                multiline ? 'top-2' : 'top-1/2 -translate-y-1/2'
              )}
              type="button"
              onClick={onTrailingIconClick}
              disabled={disabled}
              aria-label={trailingIconLabel ?? 'Ação do campo'}
            >
              {trailingIcon}
            </button>
          ) : (
            <span
              className={clsx(
                'pointer-events-none absolute right-3 z-10 text-muted',
                multiline ? 'top-3.5' : 'top-1/2 -translate-y-1/2'
              )}
              aria-hidden="true"
            >
              {trailingIcon}
            </span>
          ))}
      </div>

      {hint && (
        <p id={`${id}-hint`} className="text-xs leading-5 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold leading-5 text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function IconField(props: IconInputFieldProps): JSX.Element;
export function IconField(props: IconTextareaFieldProps): JSX.Element;
export function IconField(props: IconFieldProps) {
  const generatedId = useId().replace(/:/g, '');

  if (props.multiline) {
    const {
      multiline: _multiline,
      inputRef,
      id = `icon-field-${generatedId}`,
      label,
      leadingIcon,
      trailingIcon,
      trailingIconLabel,
      onTrailingIconClick,
      error,
      hint,
      wrapperClassName,
      labelClassName,
      className,
      style,
      disabled,
      required,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...textareaProps
    } = props;
    const describedBy = descriptionIds(id, ariaDescribedBy, hint, error);

    return (
      <FieldFrame
        id={id}
        label={label}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        trailingIconLabel={trailingIconLabel}
        onTrailingIconClick={onTrailingIconClick}
        error={error}
        hint={hint}
        wrapperClassName={wrapperClassName}
        labelClassName={labelClassName}
        disabled={disabled}
        required={required}
        multiline
      >
        <textarea
          {...textareaProps}
          ref={inputRef}
          id={id}
          className={clsx('form-control min-h-24 resize-y disabled:cursor-not-allowed', className)}
          style={{
            ...style,
            ...(leadingIcon ? { paddingInlineStart: '2.75rem' } : {}),
            ...(trailingIcon ? { paddingInlineEnd: '2.75rem' } : {})
          }}
          disabled={disabled}
          required={required}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          aria-describedby={describedBy}
        />
      </FieldFrame>
    );
  }

  const {
    multiline: _multiline,
    inputRef,
    id = `icon-field-${generatedId}`,
    label,
    leadingIcon,
    trailingIcon,
    trailingIconLabel,
    onTrailingIconClick,
    error,
    hint,
    wrapperClassName,
    labelClassName,
    className,
    style,
    disabled,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...inputProps
  } = props;
  const describedBy = descriptionIds(id, ariaDescribedBy, hint, error);

  return (
    <FieldFrame
      id={id}
      label={label}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      trailingIconLabel={trailingIconLabel}
      onTrailingIconClick={onTrailingIconClick}
      error={error}
      hint={hint}
      wrapperClassName={wrapperClassName}
      labelClassName={labelClassName}
      disabled={disabled}
      required={required}
      multiline={false}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={id}
        className={clsx('form-control disabled:cursor-not-allowed', className)}
        style={{
          ...style,
          ...(leadingIcon ? { paddingInlineStart: '2.75rem' } : {}),
          ...(trailingIcon ? { paddingInlineEnd: '2.75rem' } : {})
        }}
        disabled={disabled}
        required={required}
        aria-invalid={ariaInvalid ?? Boolean(error)}
        aria-describedby={describedBy}
      />
    </FieldFrame>
  );
}
