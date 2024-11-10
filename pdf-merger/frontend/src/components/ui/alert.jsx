import React from "react";

const Alert = ({ 
  variant = "info", 
  children, 
  className = "",
  onClose
}) => {
  const variants = {
    info: "bg-blue-100 text-blue-800 border-blue-300",
    success: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    error: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div
      role="alert"
      className={`px-4 py-3 rounded border ${variants[variant]} relative ${className}`}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-1 right-1 p-1 hover:opacity-70"
          aria-label="Close alert"
        >
          <span className="text-sm">×</span>
        </button>
      )}
      {children}
    </div>
  );
};

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription }; 