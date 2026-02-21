import type { Config } from "tailwindcss";

export const themeConfig = {
    theme: {
        extend: {
            colors: {
                background: "#121212",
                surface: {
                    DEFAULT: "#181818",
                    elevated: "#282828",
                    border: "#333333",
                },
                primary: {
                    DEFAULT: "#1DB954", // Spotify Green
                    hover: "#1AA34A",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#B3B3B3",
                    foreground: "#FFFFFF",
                },
                destructive: {
                    DEFAULT: "#E54B4B",
                    foreground: "#FFFFFF",
                },
                pending: {
                    DEFAULT: "#F5A623",
                    foreground: "#FFFFFF",
                }
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            borderRadius: {
                lg: "16px",
                md: "12px",
                sm: "8px",
            },
            boxShadow: {
                elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
            }
        },
    },
} satisfies Partial<Config>;
