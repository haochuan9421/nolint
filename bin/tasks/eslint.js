const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const del = require("del");
const utils = require("../../utils/index");

const pwd = process.cwd();

module.exports = function createESLint(config) {
  return Promise.resolve()
    .then(() => {
      const hasRcFile = utils.existFile(
        [
          ".eslintrc.js",
          ".eslintrc.yaml",
          ".eslintrc.yml",
          ".eslintrc.json",
          ".eslintrc",
        ].map(item => path.join(pwd, item))
      );

      if (hasRcFile || utils.getPkgValue("eslintConfig")) {
        return inquirer
          .prompt([
            {
              type: "confirm",
              message: chalk.yellow(
                "检测到当前项目已存在 ESLint 配置，是否清楚"
              ),
              default: true,
              name: "del",
            },
          ])
          .then(answers => {
            if (answers.del) {
              del.sync([".eslintrc*"]);
              utils.delPkgValue("eslintConfig");
            } else {
              return Promise.reject(new Error("未清除已存在的 ESLint 配置！"));
            }
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      const eslintConfig = {
        root: true,
        extends: [`plugin:nolint/${config.project}`, config.styleguide],
      };
      if (config.prettier) {
        eslintConfig.extends.push("plugin:prettier/recommended");
      }
      return eslintConfig;
    })
    .then(eslintConfig => {
      fs.writeFileSync(
        path.join(pwd, ".eslintrc.js"),
        `module.exports = ${JSON.stringify(eslintConfig, null, 2)}\n`,
        {
          encoding: "utf8",
        }
      );
    });
};
