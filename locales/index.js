const osLocale = require("os-locale");

const zh = require("./zh.js"); // 中文
const en = require("./en.js"); // English

// 全部语言包
const locales = { zh, en };
// 用户当前的语言环境
const locale = osLocale
  .sync()
  .replace(/(_|-).*/, "")
  .toLowerCase();

// 当前语言包
const i18n = locales[locale];

module.exports = i18n;
