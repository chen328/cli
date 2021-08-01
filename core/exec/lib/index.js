"use strict";

const Package = require("@gufai/package");
const log = require("@gufai/log");
const path = require("path");
const cp = require("child_process");

const SETTINGS = {
  init: "@gufai/init",
};

const CACHE_DIR = "dependencies";

async function exec(projectName, options, command) {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let pkg;
  log.verbose("targetPath--", process.env.CLI_TARGET_PATH);
  log.verbose("homePath--", homePath);
  const cmdObj = arguments[arguments.length - 2]; //拿options 参数
  const commandObj = arguments[arguments.length - 1];
  const packageName = SETTINGS[commandObj.name()]; //npm 包名
  const packageVersion = "latest";

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); //生成缓存路径
    storeDir = path.resolve(targetPath, "node_modules");
    console.log("storeDir :>> ", targetPath, storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      //更新package
      await pkg.update();
    } else {
      //安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
    const rootFile = pkg.getRootFilePath();
    if (rootFile) {
      try {
        // require(rootFile).call(null, Array.from(arguments))
        //过滤不需要属性
        let arg = Array.from(arguments);
        const cmd = arg[arg.length - 1];
        const newObjecj = Object.create(null);
        Object.keys(cmd).forEach((key) => {
          if (
            cmd.hasOwnProperty(key) &&
            !key.startsWith("_") &&
            key !== "parent" //自身非原型链,不是内置属性
          ) {
            newObjecj[key] = cmd[key];
          }
        });
        arg[arg.length - 1] = newObjecj;
        const code = `require('${rootFile}').call(null, ${JSON.stringify(arg)})`;
        //开启子进程 加快速度 利用资源
        const child = spawn("node", ["-e", code], {
          cwd: process.cwd(),
          stdio: "inherit", //子进程标准打印
        });
        child.on("error", (e) => {
          log.error("命令执行错误" + e.message);
          process.exit(1);
        });
        child.on("exit", (e) => {
          log.verbose("命令执行成功" + e);
          process.exit(e);
        });
      } catch (error) {
        log.error(error.message);
      }
    }
  }
}

function spawn(command, args, options) {
  //window 下执行 ("cmd",['/c','node','-e',code])
  const isWin32 = process.platform === "win32";
  const cmd = isWin32 ? "cmd" : command;
  const cmdArgs = isWin32 ? ["/c"].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

module.exports = exec;
