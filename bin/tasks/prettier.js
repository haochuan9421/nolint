const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const del = require("del");
const utils = require("../../utils/index");

const pwd = process.cwd();

module.exports = function createPrettier(config) {
  if (!config.prettier) {
    return Promise.resolve();
  }
  return Promise.resolve()
    .then(() => {
      const hasRcFile = utils.exist(
        [
          ".prettierrc",
          ".prettierrc.json",
          ".prettierrc.yaml",
          ".prettierrc.yml",
          ".prettierrc.js",
          ".prettierrc.toml",
          "prettier.config.js",
        ].map(item => path.join(pwd, item))
      );
      const pkgValue = utils.getPkgValue("prettier");

      if (hasRcFile || pkgValue) {
        return inquirer
          .prompt([
            {
              type: "confirm",
              message: chalk.yellow(
                "检测到当前项目已存在 prettier 配置，是否清除"
              ),
              default: true,
              name: "del",
            },
          ])
          .then(answers => {
            if (answers.del) {
              hasRcFile && del.sync([".prettier*", "prettier.config.js"]);
              pkgValue && utils.delPkgValue("prettier");
            } else {
              return Promise.reject(
                new Error("未清除已存在的 prettier 配置！")
              );
            }
          });
      }
      return Promise.resolve();
    })
    .then(() => {
      const tpl =
        config.project === "wxapp"
          ? path.join(__dirname, "../tpl/prettierrc-wx.txt")
          : path.join(__dirname, "../tpl/prettierrc.txt");

      fs.createReadStream(tpl).pipe(
        fs.createWriteStream(path.join(pwd, ".prettierrc.js"))
      );
    });
};
