import React from "react";
import { cn } from "../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-primary text-primary-foreground shadow hover:bg-primary-hover":
                            variant === "primary",
                        "border border-primary text-primary hover:bg-primary/10":
                            variant === "secondary",
                        "text-secondary hover:text-primary-foreground hover:bg-surface-elevated":
                            variant === "ghost",
                        "h-8 px-4 text-xs": size === "sm",
                        "h-12 px-6 py-2": size === "md",
                        "h-14 px-8 text-base": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
