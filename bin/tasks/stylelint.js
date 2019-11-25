const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const del = require("del");
const utils = require("../../utils/index");

const pwd = process.cwd();

module.exports = function createStylelint(config) {
  if (!config.stylelint) {
    return Promise.resolve();
  }
  return Promise.resolve()
    .then(() => {
      const hasRcFile = utils.existFile(
        [
          ".stylelintrc",
          ".stylelintrc.json",
          ".stylelintrc.yaml",
          ".stylelintrc.yml",
          ".stylelintrc.js",
          "stylelint.config.js",
        ].map(item => path.join(pwd, item))
      );
      const pkgValue = utils.getPkgValue("stylelint");

      if (hasRcFile || pkgValue) {
        return inquirer
          .prompt([
            {
              type: "confirm",
              message: chalk.yellow(
                "检测到当前项目已存在 stylelint 配置，是否清除"
              ),
              default: true,
              name: "del",
            },
          ])
          .then(answers => {
            if (answers.del) {
              hasRcFile && del.sync([".stylelintrc*", "stylelint.config.js"]);
              pkgValue && utils.delPkgValue("stylelint");
            } else {
              return Promise.reject(
                new Error("未清除已存在的 stylelint 配置！")
              );
            }
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      const stylelintConfig = {
        extends: ["stylelint-config-recommended"],
      };
      if (config.prettier) {
        stylelintConfig.extends.push("stylelint-prettier/recommended");
      }
      return stylelintConfig;
    })
    .then(stylelintConfig => {
      fs.writeFileSync(
        path.join(pwd, "stylelint.config.js"),
        `module.exports = ${JSON.stringify(stylelintConfig, null, 2)}\n`,
        {
          encoding: "utf8",
        }
      );
    });
};
