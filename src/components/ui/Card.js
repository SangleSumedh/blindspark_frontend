export function Card({ children, className = "" }) {
  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`text-xl font-bold text-white tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={`text-sm text-zinc-400 mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return <div className={`mt-6 flex items-center ${className}`}>{children}</div>;
}
