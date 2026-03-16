/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  // Absolute path with spaces causes glob issues on Windows — use safelist as workaround
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Layout & backgrounds
    { pattern: /^(bg|text|border|ring|from|to|via)-(gray|brand|purple|green|red|amber|blue|slate)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
    { pattern: /^(bg|text|border|ring)-(white|black)$/ },
    // Opacity variants
    { pattern: /^(bg|border|ring|text)-(gray|brand|green|red|purple|amber)\/(10|20|30|40|50)$/ },
    // Spacing
    { pattern: /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24)$/ },
    // Sizing
    { pattern: /^(w|h|min-w|max-w|min-h|max-h)-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|full|screen|auto)$/ },
    // Typography
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/ },
    { pattern: /^font-(thin|light|normal|medium|semibold|bold|extrabold)$/ },
    { pattern: /^(leading|tracking)-(none|tight|snug|normal|relaxed|loose)$/ },
    // Flex & Grid
    { pattern: /^(flex|grid|inline-flex|block|hidden|items|justify|gap|col|row)/ },
    // Borders & Radius
    { pattern: /^(rounded|border)(-(none|sm|md|lg|xl|2xl|full|t|b|l|r|tl|tr|bl|br))?$/ },
    // Effects & Transitions
    { pattern: /^(shadow|opacity|transition|duration|ease|cursor|overflow|z|relative|absolute|fixed|sticky|top|bottom|left|right|inset)/ },
    // Animations
    "animate-pulse", "animate-spin", "animate-pulse-slow",
    // Common utilities
    "line-clamp-2", "truncate", "sr-only", "not-sr-only",
    "uppercase", "lowercase", "capitalize", "normal-case",
    "underline", "no-underline", "italic",
    "divide-y", "divide-gray-800",
    "space-y-1", "space-y-2", "space-y-3", "space-y-4", "space-y-6",
    "space-x-2", "space-x-3", "space-x-4",
    "aspect-video", "aspect-square",
    "object-cover", "object-contain",
    "antialiased",
    "disabled:opacity-40",
    "hover:scale-105",
    "group", "group-hover:scale-105",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        viral: {
          low:    "#22c55e",
          medium: "#f59e0b",
          high:   "#ef4444",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
