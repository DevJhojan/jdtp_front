/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          900: "#0c4a6e",
        },
      },
      boxShadow: {
        soft: "0px 10px 30px rgba(15, 23, 42, 0.25)",
      },
    },
  },
  plugins: [],
};
