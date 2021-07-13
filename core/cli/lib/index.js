"use strict";

module.exports = core;
//relative link
const path = require("path");
const semver = require("semver");
const log = require("@gufai/log");
const colors = require("colors");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const argv = require("minimist")(process.argv.slice(2));
const dotenv = require("dotenv");

//absolute link
const pkg = require("../package.json");
const constant = require("./constant");

async function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUseHome();
    formatArgv();
    checkEnv();
    checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
}

async function checkGlobalUpdate() {
  //1.获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  //2.调用npm API,获取所有版本号
  //3.提取所有版本号,比对哪些版本号是大于当前版本号
  //4.获取最新的版本号,提示用户更新到该版本
  const { getNpmSemverVersion } = require("@gufai/get-npm-info");
  const versions = await getNpmSemverVersion(currentVersion, npmName);
  if (
    versions &&
    versions.length > 0 &&
    semver.gte(versions[0], currentVersion)
  ) {
    //最新版本大于现在版本
    log.warn(
      `请手动更新${npmName},当前版本${currentVersion},最新版本${versions[0]}, command: npm install -g npmName`
        .yellow
    );
  }
}

//检查环境变量
function checkEnv() {
  //TODO: 项目目录下有环境配置读取项目的 否则读取根目录的
  const dotenvPath = path.resolve(userHome, ".env");
  if (pathExists(dotenvPath)) {
    //设置环境变量
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
  //debug mode log
  log.verbose("环境变量", process.env.CLI_HOME_PATH);
}

//环境变量默认配置
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  //没有配置 读取设置默认
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

//格式化入参
function formatArgv() {
  console.log(argv);
  checkArgvs();
}

//开启debug 打印
function checkArgvs() {
  if (argv.debug) {
    process.env.LOG_LEVERL = "verbose";
    log.level = process.env.LOG_LEVERL;
  }
  log.verbose("open debug log".red);
}

//获取用户主目录的路径
function checkUseHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error("当前登录用户主目录不存在".red);
  }
}

//检查root权限
function checkRoot() {
  if (process.getuid && process.getuid() === 0) {
    //是root权限 报错
    throw new Error(
      `当前uid ${
        process.getuid && process.getuid()
      } 为运行为root主账号权限,需要更换`.red
    );
  }
}

//检查node版本号
function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  // current >= lowerVersion
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(`cli 需要安装v${lowestVersion} 以上版本的node`.red);
  }
}
//检查版本号
function checkPkgVersion() {
  log.info("version ->", pkg.version);
}
