import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus, X } from "lucide-react";
import useModalFocus from "../../hooks/useModalFocus";
export function Button({
  to,
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const cls = `btn btn-${variant} ${className}`;
  if (to)
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}
export function Container({ children, className = "" }) {
  return <div className={`container-rj ${className}`}>{children}</div>;
}
export function SectionHeading({ eyebrow, title, children, to, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {children && <p className="lede">{children}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {action}
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <Link to="/">Home</Link>
      {items.map((item, i) => (
        <span key={i}>
          <span aria-hidden="true">/</span>
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function PageHero({ eyebrow, title, children }) {
  return (
    <section className="page-hero">
      <Container>
        <Breadcrumb items={[{ label: eyebrow || title }]} />
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <p className="lede">{children}</p>}
      </Container>
    </section>
  );
}
export function PriceDisplay({ price, oldPrice, large = false }) {
  return (
    <div className={`price ${large ? "price-large" : ""}`}>
      <strong>
        {new Intl.NumberFormat("en-GH", {
          style: "currency",
          currency: "GHS",
        }).format(Number(price) || 0)}
      </strong>
      {Number(oldPrice) > Number(price) && (
        <del aria-label="Previous price">
          {new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
          }).format(oldPrice)}
        </del>
      )}
    </div>
  );
}
export function QuantitySelector({
  value,
  max,
  onChange,
  name = "product",
  disabled = false,
}) {
  return (
    <div className="quantity">
      <button
        type="button"
        aria-label={`Decrease ${name} quantity`}
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <output aria-label={`${name} quantity`}>{value}</output>
      <button
        type="button"
        aria-label={`Increase ${name} quantity`}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function Alert({ children, error = false }) {
  return (
    <div
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  heading: Heading = "h2",
  children,
  to = "/shop",
  action = "Browse products",
}) {
  return (
    <div className="empty-state">
      <Heading>{title}</Heading>
      <p>{children}</p>
      <Button to={to}>
        {action}
        <ArrowRight size={17} />
      </Button>
    </div>
  );
}
export function Skeleton({ count = 4 }) {
  return (
    <div className="product-grid" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function Drawer({ open, onClose, title, children }) {
  const ref = useModalFocus(open, onClose);
  if (!open) return null;
  return (
    <div className="drawer-overlay">
      <button
        className="drawer-backdrop"
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="drawer-panel"
      >
        <div className="flex items-center justify-between gap-4">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close drawer"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
export function FormField({ label, name, error, hint, children }) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && (
        <p id={`${name}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function FormSection({ number, title, children }) {
  return (
    <section className="form-section">
      <h2>
        {number && <span>{number}</span>}
        {title}
      </h2>
      <div className="form-section-body">{children}</div>
    </section>
  );
}

export function FormControl({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  options,
  multiline,
  ...props
}) {
  const shared = {
    id: name,
    name,
    value,
    onChange,
    "aria-invalid": Boolean(error),
    "aria-describedby":
      [hint && `${name}-hint`, error && `${name}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
    ...props,
  };
  return (
    <FormField label={label} name={name} hint={hint} error={error}>
      {options ? (
        <select {...shared}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...shared} rows={4} />
      ) : (
        <input {...shared} />
      )}
    </FormField>
  );
}
