"use strict";

const semver = require("semver");
const color = require("color");
const log = require("@gufai/log");

const LOWEST_NODE_VERSION = "12.0.0";

class Command {
  constructor(argv) {
    console.log("Command constructor", argv);
    if (!argv) {
      throw new Error("command 参数不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("command 参数必须为数组");
    }
    if (argv.length < 1) {
      throw new Error("command 参数为空");
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => {
        this.checkNodeVersion();
      });
      chain = chain.then(() => {
        this.initArgs();
      });
      chain = chain.then(() => {
        this.init();
      });
      chain = chain.then(() => {
        this.exec();
      });

      //异常
      chain.catch((err) => {
        log.error(err.message);
      });
    });
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 2];
    this._argv = this._argv.slice(0, this._argv.length - 2);
  }

  //检查node版本号
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    // current >= lowerVersion
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(`cli 需要安装v${lowestVersion} 以上版本的node`.red);
    }
  }

  init() {
    throw new Error("init必须实现");
  }

  exec() {
    throw new Error("exec必须实现");
  }
}

module.exports = Command;
