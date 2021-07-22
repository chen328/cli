"use strict";

module.exports = core;
//relative link
const path = require("path");
const semver = require("semver");
const log = require("@gufai/log");
const colors = require("colors");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const dotenv = require("dotenv");
const { program } = require("commander");
const init = require("@gufai/init");
const exec = require("@gufai/exec");

//absolute link
const pkg = require("../package.json");
const constant = require("./constant");

async function core(args) {
  try {
    // console.log(args,'args')
    prepare()
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}

//执行前准备
async function prepare(){
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUseHome();
  checkEnv();
  await checkGlobalUpdate();
}

//注册命令
function registerCommand() {
  program
    .version(pkg.version)
    .name(Object.keys(pkg.bin)[0]) //脚手架名字
    .usage("<command> [options]".green) //头部命令描述
    .option("-d, --debug", "enable debug mode", false) //开启debug模式
    .option("-tp, --targetPath <targetPath>","是否指定本地调试文件路径","")

  //注册命令
  program
    .command("init <projectName>")
    .option("-f, --force", "是否强制初始化项目")
    .action(exec);

  //debug事件监听
  program.on("option:debug", function () {
    //修改环境变量为debug
      process.env.LOG_LEVERL = "verbose";
      log.level = process.env.LOG_LEVERL;
      log.verbose("open debug log".red);
  });

  //环境变量targetPath监听
  program.on("option:targetPath", function(targetPath){
    process.env.CLI_TARGET_PATH = targetPath;
  })

  //对未知命令进行监听
  program.on("command:*", function (operands) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    log.error(`unknown command '${operands[0]}'`);
    availableCommands.length > 0 &&
      console.log(`available commands :  ${availableCommands}`.green);
    //TODO: 对最接近的命令进行提升并退出
    // mySuggestBestMatch(operands[0], availableCommands);
    // process.exitCode = 1;
  });

  //命令参数
  const options = program.opts();
  // console.log(options);

  //格式化打印 最后执行
  // if(program.args && program.args.length  < 1){
  // console.log('提示help',program.args)
  //提示help
  // program.outputHelp();
  // }
  program.parse(process.argv);
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
    semver.gt(versions[0], currentVersion)
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
