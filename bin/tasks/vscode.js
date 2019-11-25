const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const del = require("del");
const utils = require("../../utils/index");

const pwd = process.cwd();

module.exports = function createVSCodeSettings(config) {
  if (!config.vscode) {
    return Promise.resolve();
  }
  return Promise.resolve()
    .then(() => {
      const hasSettingFile = utils.exist(
        path.join(pwd, ".vscode/settings.json")
      );

      if (hasSettingFile) {
        return inquirer
          .prompt([
            {
              type: "confirm",
              message: chalk.yellow(
                "检测到当前项目已存在 VSCode 设置文件，是否清除"
              ),
              default: true,
              name: "del",
            },
          ])
          .then(answers => {
            if (answers.del) {
              del.sync([".vscode/settings.json"]);
            } else {
              return Promise.reject(
                new Error("未清除已存在的 VSCode 设置文件！")
              );
            }
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      const vscodeSettings = {
        "eslint.enable": true,
        "eslint.run": "onSave",
        "eslint.autoFixOnSave": true,
        "eslint.validate": [
          "javascript",
          "javascriptreact",
          { language: "typescript", autoFix: true },
          { language: "typescriptreact", autoFix: true },
        ],
        "typescript.validate.enable": false, // 避免 ESLint 插件和 VSCode 自带的 typescript 插件重复提示同一次错误
      };

      if (config.project === "vue") {
        vscodeSettings["eslint.validate"].push({
          language: "vue",
          autoFix: true,
        });
      }

      if (config.stylelint) {
        const styleSetting = {
          "editor.formatOnSave": true,
          ...(config.prettier
            ? { "editor.defaultFormatter": "esbenp.prettier-vscode" }
            : {}),
        };
        vscodeSettings["[css]"] = styleSetting;
        vscodeSettings["[less]"] = styleSetting;
        vscodeSettings["[scss]"] = styleSetting;
        if (config.project === "wxapp") {
          vscodeSettings["[wxss]"] = styleSetting;
        }
      }

      return vscodeSettings;
    })
    .then(eslintConfig => {
      utils.exist(path.join(pwd, ".vscode")) ||
        fs.mkdirSync(path.join(pwd, ".vscode"));

      fs.writeFileSync(
        path.join(pwd, ".vscode/settings.json"),
        JSON.stringify(eslintConfig, null, 2),
        {
          encoding: "utf8",
        }
      );
    });
};
