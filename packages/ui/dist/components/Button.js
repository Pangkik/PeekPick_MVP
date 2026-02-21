"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
exports.Button = react_1.default.forwardRef(({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (react_1.default.createElement("button", { ref: ref, className: (0, cn_1.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50", {
            "bg-primary text-primary-foreground shadow hover:bg-primary-hover": variant === "primary",
            "border border-primary text-primary hover:bg-primary/10": variant === "secondary",
            "text-secondary hover:text-primary-foreground hover:bg-surface-elevated": variant === "ghost",
            "h-8 px-4 text-xs": size === "sm",
            "h-12 px-6 py-2": size === "md",
            "h-14 px-8 text-base": size === "lg",
        }, className), ...props }));
});
exports.Button.displayName = "Button";
