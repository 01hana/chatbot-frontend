module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // ← 關閉跟 Prettier 衝突的規則
  ],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error", // ← 讓 ESLint 報 Prettier 格式錯誤
  },
};
