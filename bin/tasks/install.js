const path = require("path");
const fs = require("fs");
const spawn = require("cross-spawn");
const chalk = require("chalk");
const inquirer = require("inquirer");
const ora = require("ora");
const _ = require("lodash");
const utils = require("../../utils/index");

const pwd = process.cwd();
const spinner = ora("正在计算需要安装的 npm 包...\n");

module.exports = function installDependencies(config) {
  return Promise.resolve().then(() => {
    spinner.start();
    let modules = ["eslint@latest", "eslint-plugin-nolint@latest"];

    if (config.styleguide) {
      modules = modules.concat([
        "stylelint@11.x",
        "stylelint-config-recommended@latest",
      ]);
    }

    if (config.prettier) {
      modules = modules.concat([
        "prettier@latest",
        "eslint-config-prettier@latest",
        "eslint-plugin-prettier@latest",
      ]);
    }

    if (config.prettier && config.styleguide) {
      modules = modules.concat([
        "stylelint-config-prettier@latest",
        "stylelint-prettier@latest",
      ]);
    }

    if (config.styleguide !== "eslint:recommended") {
      const pkg = `eslint-config-${config.styleguide}@latest`;
      modules.push(pkg);

      let peerDep = "";
      const peerDeps = utils.fetchPkgValue(pkg, "peerDependencies");
      if (Array.isArray(peerDeps)) {
        peerDep = peerDeps[0] || {};
      } else {
        peerDep = peerDeps || {};
      }

      Object.keys(peerDep).forEach(peerPkg => {
        modules.push(`${peerPkg}@${peerDep[peerPkg]}`);
      });
    }

    if (config["git-eslint"] || config["git-stylelint"]) {
      const nodelt10 = _.get(process, "versions.node", [0]).split(".")[0] < 10;
      modules = modules.concat([
        "husky@3",
        nodelt10 ? "commitizen@3" : "commitizen@4",
        nodelt10
          ? "cz-conventional-changelog@2"
          : "cz-conventional-changelog@3",
      ]);

      if (!utils.exist(path.join(pwd, ".git"))) {
        spawn.sync("git", ["init"]);
      }
      if (!utils.exist(path.join(pwd, ".gitignore"))) {
        fs.writeFileSync(
          path.join(pwd, ".gitignore"),
          "node_modules\n.DS_Store\n",
          {
            encoding: "utf8",
          }
        );
      }
    }

    const dep =
      utils.fetchPkgValue(
        "eslint-plugin-nolint",
        `${config.project}PeerDependencies`
      ) || {};
    Object.keys(dep).forEach(pkg => {
      const ipkg = `${pkg}@${dep[pkg]}`;
      modules.push(ipkg);

      let peerDep = "";
      const peerDeps = utils.fetchPkgValue(ipkg, "peerDependencies");
      if (Array.isArray(peerDeps)) {
        peerDep = peerDeps[0] || {};
      } else {
        peerDep = peerDeps || {};
      }

      Object.keys(peerDep).forEach(peerPkg => {
        modules.push(`${peerPkg}@${peerDep[peerPkg]}`);
      });
    });

    spinner.stop();

    // 去重
    modules = modules.filter(
      (item, index, array) =>
        array.findIndex(
          str =>
            str.substr(0, str.lastIndexOf("@")) ===
            item.substr(0, item.lastIndexOf("@"))
        ) === index
    );

    return inquirer
      .prompt([
        {
          type: "list",
          name: "tool",
          message: `现在安装\n  ${chalk.greenBright(modules.join("\n  "))}`,
          default: "yarn",
          choices: [
            { name: "yarn", value: "yarn" },
            { name: "npm", value: "npm" },
            { name: "暂不安装", value: "no" },
          ],
        },
      ])
      .then(answers => {
        if (!utils.exist(path.join(pwd, "package.json"))) {
          spawn.sync("npm", ["init", "-y"]);
        }

        if (answers.tool === "npm") {
          spawn.sync("npm", ["i", "--save-dev"].concat(modules), {
            stdio: "inherit",
          });
        } else if (answers.tool === "yarn") {
          spawn.sync("yarn", ["add", "--dev"].concat(modules), {
            stdio: "inherit",
          });
        } else {
          console.log(
            chalk.green(`你稍后必须安装这些 npm 包\n${modules.join(" ")}`)
          );
        }
      });
  });
};
