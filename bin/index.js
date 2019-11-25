#!/usr/bin/env node

const program = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const updateNotifier = require("update-notifier");

const pkg = require("../package");

const createESLint = require("./tasks/eslint");
const createStylelint = require("./tasks/stylelint");
const createPrettier = require("./tasks/prettier");
const createGitHooks = require("./tasks/husky");
const createVSCodeSettings = require("./tasks/vscode");
const installDependencies = require("./tasks/install");

program.version(pkg.version, "-v, --version").parse(process.argv);

// 检测 npm 版本，提示用户更新
updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60, // 每小时
}).notify();

// 通过交互对话获取用户想要的设置
function promptUser() {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "project",
        message: "选择你当前的项目类型?",
        default: "react",
        choices: [
          { name: "React", value: "react" },
          { name: "Vue", value: "vue" },
          { name: "微信小程序", value: "wxapp" },
        ],
      },
      {
        type: "confirm",
        name: "stylelint",
        message: "使用 stylelint 来规范 CSS 文件",
        default: true,
      },
      {
        type: "confirm",
        name: "prettier",
        message: "使用 Prettier 来获得更好的代码排版",
        default: true,
      },
      {
        type: "confirm",
        name: "vscode",
        message: "你是否在使用 VSCode 作为编辑器",
        default: true,
      },
      {
        type: "confirm",
        name: "git-eslint",
        message: "Git 提交时必须通过的 ESLint 校验（by husky）",
        default: true,
      },
      {
        type: "confirm",
        name: "git-stylelint",
        message: "Git 提交时必须通过的 stylelint 校验（by husky）",
        default: true,
        when(answers) {
          return answers.stylelint;
        },
      },
      {
        type: "list",
        name: "styleguide",
        message: "选择一个你喜欢的 ESLint 基础配置?",
        choices: [
          {
            name: "Airbnb Base (https://github.com/airbnb/javascript)",
            value: "airbnb-base",
          },
          {
            name: "eslint:recommended (https://eslint.org/docs/rules/)",
            value: "eslint:recommended",
          },
          {
            name: "Standard (https://github.com/standard/standard)",
            value: "standard",
          },
        ],
      },
    ])
    .then(answers => {
      Promise.resolve()
        .then(() => installDependencies(answers))
        .then(() => createESLint(answers))
        .then(() => createStylelint(answers))
        .then(() => createPrettier(answers))
        .then(() => createGitHooks(answers))
        .then(() => createVSCodeSettings(answers))
        .catch(error => {
          console.log(chalk.red(`\n配置失败！失败原因：${error.message}\n`));
        });
    });
}

promptUser();
