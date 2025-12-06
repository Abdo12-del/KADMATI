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
        // New Organic Soft UI Colors
        'brand-primary': 'hsl(225 100% 59%)', // #306BFF
        'brand-primary-light': 'hsl(225 100% 75%)', // Lighter shade for gradients
        'brand-primary-dark': 'hsl(225 66% 25%)', // Darker shade for text/accents
        'brand-background': 'hsl(210 20% 98%)', // Very light gray/off-white
        'brand-card-bg': 'hsl(0 0% 100%)', // Pure white for cards
        'brand-text-dark': 'hsl(210 10% 20%)', // Dark gray for main text
        'brand-text-muted': 'hsl(210 10% 40%)', // Medium gray for muted text
        'brand-success': 'hsl(120 60% 70%)', // Pastel green
        'brand-warning': 'hsl(40 90% 70%)', // Pastel orange
        'brand-danger': 'hsl(0 80% 70%)', // Pastel red
        'brand-info': 'hsl(200 70% 70%)', // Pastel cyan/blue
      },
      borderRadius: {
        lg: "1rem", // 16px
        md: "0.75rem", // 12px
        sm: "0.5rem", // 8px
        xl: "1.5rem", // 24px
        '2xl': '2rem', // 32px for very rounded elements
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.02)', // Soft, subtle shadow
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)', // Larger soft shadow
        'soft-inset': 'inset 2px 2px 5px rgba(0, 0, 0, 0.05), inset -2px -2px 5px rgba(255, 255, 255, 0.8)', // Soft inset for pressed effect
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
        cairo: ['Cairo', 'sans-serif'],
        'ibm-plex-arabic': ['IBM Plex Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;