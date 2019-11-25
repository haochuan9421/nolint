const fs = require("fs");
const path = require("path");
const spawn = require("cross-spawn");
const _ = require("lodash");

const pwd = process.cwd();

/**
 * 判断文件或文件夹是否已存在，只要有一个存在就返回 true
 * @param {Array | String} file
 */
function exist(file) {
  const files = Array.isArray(file) ? file : [file];
  return files.some(
    p =>
      fs.existsSync(p) &&
      (fs.statSync(p).isFile() || fs.statSync(p).isDirectory())
  );
}

/**
 * 获取 package.json 文件中某个字段的值
 * @param {String} key package.json 的某个 key
 */
function getPkgValue(key) {
  const pkgPath = path.join(pwd, "package.json");
  if (!exist(pkgPath)) {
    return "";
  }
  const pkgJSON = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return _.get(pkgJSON, key, "");
}

/**
 * 设置 package.json 文件中某个字段的值
 * @param {String} key package.json 的某个 key
 * @param {*} value 需要添加的值
 */
function setPkgValue(key, value) {
  const pkgPath = path.join(pwd, "package.json");
  if (!exist(pkgPath)) {
    return;
  }
  const pkgJSON = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  _.set(pkgJSON, key, value);
  fs.writeFileSync(pkgPath, JSON.stringify(pkgJSON, null, 2), {
    encoding: "utf8",
  });
}

/**
 * 删除 package.json 文件中某个字段
 * @param {String} key package.json 的某个 key
 */
function delPkgValue(key) {
  setPkgValue(key, undefined);
}

/**
 * 通过 `npm view` 命令获取指定 npm 包 package.json 中某个字段的值
 * @param {String} packageName 包名
 * @param {String} key package.json 的某个 key
 */
function fetchPkgValue(packageName, key) {
  const npmProcess = spawn.sync("npm", ["view", packageName, key, "--json"], {
    encoding: "utf8",
  });
  if (npmProcess.error || npmProcess.stderr) {
    return "";
  }
  const fetchedText = npmProcess.stdout.trim();
  try {
    const pkgValue = JSON.parse(fetchedText);
    return pkgValue;
  } catch (e) {
    return fetchedText;
  }
}

module.exports = {
  exist,
  getPkgValue,
  setPkgValue,
  delPkgValue,
  fetchPkgValue,
};
