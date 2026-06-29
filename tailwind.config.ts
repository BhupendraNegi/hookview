import type { Config } from "tailwindcss";

/**
 * Design tokens lifted verbatim from the HookView design handoff
 * (~/Downloads/design_handoff_hookview/README.md). Keeping them here means
 * components reference semantic names instead of scattering raw hex.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7c5cff",
          end: "#6a45f0",
          light: "#9d7bff",
          tint: "#f0ecff",
          tintborder: "#ddd2ff",
        },
        coral: "#ff6b5e",
        app: "#f5f4fb",
        listbg: "#faf9fd",
        surface: "#ffffff",
        subtle: "#fbfaff",
        subtle2: "#faf9fe",
        border: "#ecebf3",
        border2: "#ece9f6",
        border3: "#eceaf6",
        divider: "#f1f0f7",
        ink: "#211f33",
        ink2: "#6a6781",
        muted: "#9a97ad",
        muted2: "#a6a3b8",
        mono: "#3a3850",
        mono2: "#4b4860",
        live: "#16b3a6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        badge: "7px",
        badgelg: "9px",
        item: "11px",
        btn: "12px",
        card: "16px",
        panel: "20px",
        feature: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(33,31,51,.04), 0 8px 22px rgba(33,31,51,.05)",
        cardDeep: "0 10px 30px rgba(33,31,51,.06)",
        btn: "0 12px 28px rgba(124,92,255,.42)",
        btnHover: "0 16px 34px rgba(124,92,255,.5)",
        tile: "0 6px 14px rgba(124,92,255,.32)",
        tileHover: "0 10px 24px rgba(124,92,255,.4)",
        floating: "0 6px 22px rgba(33,31,51,.14)",
      },
      keyframes: {
        ring: {
          "0%": { transform: "scale(.55)", opacity: ".55" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".2" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        up: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.6s ease-out infinite",
        blink: "blink 2.4s ease-in-out infinite",
        "floaty-slow": "floaty 11s ease-in-out infinite",
        "floaty-fast": "floaty 9s ease-in-out infinite",
        up: "up .4s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
