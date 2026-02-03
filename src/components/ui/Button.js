export function Button({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "md", 
  className = "", 
  disabled = false,
  type = "button"
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 focus:ring-emerald-500",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 focus:ring-zinc-600",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white",
    outline: "border border-zinc-700 hover:bg-zinc-800 text-zinc-300"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
    icon: "p-2"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
