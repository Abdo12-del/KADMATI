import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom colors based on new theme (pastel-like)
        'dark-blue': 'hsl(225 66% 35%)', // #1F3A93 - for strong accents/text
        'light-blue': 'hsl(210 73% 60%)', // #4A90E2 - for buttons/highlights
        'platform-orange': 'hsl(36 90% 55%)', // #F5A623 - for primary actions
        'platform-red': 'hsl(359 97% 41%)', // #D0021B - for destructive actions
        'platform-green': 'hsl(90 69% 48%)', // #7ED321 - for success
        'light-gray': 'hsl(210 29% 97%)', // #F4F6F8 - for backgrounds/muted elements
        'pastel-blue': 'hsl(210 60% 85%)', // A softer blue
        'pastel-green': 'hsl(120 40% 85%)', // A softer green
        'pastel-orange': 'hsl(30 80% 85%)', // A softer orange
        'soft-white': 'hsl(0 0% 98%)', // Off-white for neumorphism base
      },
      borderRadius: {
        lg: "0.5rem", // 8px
        md: "0.375rem", // 6px
        sm: "0.25rem", // 4px
        xl: "0.75rem", // 12px
        '2xl': '1rem', // 16px for more rounded elements
      },
      boxShadow: {
        'soft-neumorphism': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff', // Custom shadow for neumorphism
        'soft-neumorphism-inset': 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff', // Inset for pressed state
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        inter: ['Inter', 'sans-serif'], // Added Inter
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;