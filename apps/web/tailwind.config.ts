import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
    ],
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
        },
    },
    plugins: [],
};
export default config;
