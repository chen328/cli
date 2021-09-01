"use strict";

const Spinner = require("cli-spinner").Spinner;

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

function spinnerStart(msg = "loading...", str = "|/-\\") {
  const spinner = new Spinner(msg + " %s");
  spinner.setSpinnerString(str);
  spinner.start();
  return spinner;
}

function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve()), timeout);
}

//兼容win 开启子进程 执行node
function exec(command, args, options) {
  //window 下执行 ("cmd",['/c','node','-e',code])
  const isWin32 = process.platform === "win32";
  const cmd = isWin32 ? "cmd" : command;
  const cmdArgs = isWin32 ? ["/c"].concat(command, args) : args;
  return require("child_process").spawn(cmd, cmdArgs, options || {});
}

function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options);
    p.on("error", (e) => {
      reject(e);
    });
    p.on("exit", (e) => {
      resolve(e);
    });
  });
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync
};
