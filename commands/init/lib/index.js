"use strict";

const Command = require("@gufai/command");
const fs = require("fs");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const semver = require("semver");

const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;

  }
  async exec() {
    try {
      //1.准备阶段
      await this.prepare();
      //2.下载模版
      //3.安装模板
    } catch (error) {

    }
  }

  async prepare() {
    const localPath = process.cwd();
    //1.判断当前目录是否为空
    if (!this.isCwdEmpty(localPath)) {
      //是否强制创建
      let ifContinue = false
      if (!this.force) {
        ifContinue = (await inquirer.prompt({
          type: "confirm",
          name: "ifContinue",
          message: "当前文件夹不为空,是否继续创建项目",
          default: false
        })).ifContinue
        if (!ifContinue) return;
      }

      if (this.force || ifContinue) {
        //2.启动强制更新
        //再次确认
        const { clearDir } = await inquirer.prompt({
          type: "confirm",
          name: "clearDir",
          message: "是否确认清空当前目录下的文件",
          default: false,
          name: "type"
        });
        console.log('clearDir :>> ', clearDir);
        //清空文件夹
        if (clearDir) {
          //TODO:  fse.emptyDirSync(localPath)  测试不清空
        }
      }
    }
    console.log('getProjectInfo :>>1 ');
    await this.getProjectInfo();

  }

  async getProjectInfo() {
    //选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: TYPE_COMPONENT,
      choices: [
        { name: "项目", value: TYPE_COMPONENT },
        { name: "组件", value: TYPE_PROJECT }
      ]
    })
    console.log('getProjectInfo :>>2 ', type);
    if (type === TYPE_COMPONENT) {
      const params = await inquirer.prompt([{
        type: "input",
        name: "projectName",
        message: "请输入项目名称",
        default: "",
        validate: function (v) {
          //不合法名称提示
          var done = this.async();
          setTimeout(function () {
            if (!/^[a-zA-Z]+([-_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done('请输入合法的项目名称');
              return;
            }
            done(null, true);
          }, 100);

        },
        filter: function (v) {
          return v
        }
      }, {
        type: "input",
        name: "projectVersion",
        message: "请输入项目版本号",
        default: "1.0.0",
        validate: function (v) {
          //不合法提示
          var done = this.async();
          setTimeout(function () {
            if (!semver.valid(v)) {
              done('请输入合法的项目名称');
              return;
            }
            done(null, true);
          }, 100);

        },
        filter: function (v) {
          return semver.valid(v) || v
        }
      }])
      console.log('params :>> ', params);
    } else if (type === TYPE_PROJECT) {

    }
    //获取项目的基本信息
  }

  isCwdEmpty(localPath) {
    //文件夹读取 过滤
    const fileList = fs.readdirSync(localPath).filter(file => !file.startsWith(".") && !["node_modules"].includes(file));
    return !fileList || fileList.length === 0;
  }

}

function init(argv) {
  // projectName, options, command
  // console.log(projectName, options,process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}

module.exports = init;
module.exports.Command = Command;
