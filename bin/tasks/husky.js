const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const del = require("del");
const utils = require("../../utils/index");

const pwd = process.cwd();

module.exports = function createGitHooks(config) {
  if (!config["git-eslint"] && !config["git-stylelint"]) {
    return Promise.resolve();
  }
  return Promise.resolve()
    .then(() => {
      const hasRcFile = utils.exist(
        [".huskyrc", ".huskyrc.json", ".huskyrc.js"].map(item =>
          path.join(pwd, item)
        )
      );
      const pkgValue = utils.getPkgValue("husky");

      if (hasRcFile || pkgValue) {
        return inquirer
          .prompt([
            {
              type: "confirm",
              message: chalk.yellow(
                "检测到当前项目已存在 husky 配置，是否清除"
              ),
              default: true,
              name: "del",
            },
          ])
          .then(answers => {
            if (answers.del) {
              hasRcFile && del.sync([".huskyrc*"]);
              pkgValue && utils.delPkgValue("husky");
            } else {
              return Promise.reject(new Error("未清除已存在的 husky 配置！"));
            }
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      const scripts = [];
      config["git-eslint"] && scripts.push("npm run eslint");
      config["git-stylelint"] && scripts.push("npm run stylelint");
      const huskyConfig = {
        hooks: {
          "pre-commit": scripts.join(" && "),
        },
      };
      return huskyConfig;
    })
    .then(huskyConfig => {
      fs.writeFileSync(
        path.join(pwd, ".huskyrc.js"),
        `module.exports = ${JSON.stringify(huskyConfig, null, 2)}\n`,
        {
          encoding: "utf8",
        }
      );

      utils.setPkgValue(
        "config.commitizen.path",
        "./node_modules/cz-conventional-changelog"
      );

      utils.setPkgValue("scripts.commit", "git-cz");
      utils.setPkgValue("scripts['commit:force']", "git-cz -n");

      const esFileExt = [
        "js",
        "jsx",
        "ts",
        "tsx",
        ...(config.project === "vue" ? ["vue"] : []),
      ];
      config["git-eslint"] &&
        utils.setPkgValue(
          "scripts.eslint",
          `git diff --cached --name-only --diff-filter=d | grep -E '\\.(${esFileExt.join(
            "|"
          )})$' | xargs eslint`
        );

      const cssFileExt = [
        "css",
        "scss",
        "less",
        ...(config.project === "wxapp" ? ["wxss"] : []),
        ...(config.project === "vue" ? ["vue"] : []),
        ...(config.project === "react" ? ["js", "jsx", "ts", "tsx"] : []),
      ];
      config["git-stylelint"] &&
        utils.setPkgValue(
          "scripts.stylelint",
          `git diff --cached --name-only --diff-filter=d | grep -E '\\.(${cssFileExt.join(
            "|"
          )})$' | xargs stylelint`
        );
    });
};
