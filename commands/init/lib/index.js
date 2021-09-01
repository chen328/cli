"use strict";

const Command = require("@gufai/command");
const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const semver = require("semver");
const log = require("@gufai/log");
const getProjectTemplate = require("./getProjectTemplate");
const Package = require("@gufai/package");
const useHome = require("user-home");
const { spinnerStart, execAsync } = require("@gufai/utils");
const kebabCase = require("kebab-case");
const glob = require("glob");
const ejs = require("ejs");

const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";
const WHITE_COMMND = ["npm", "cnpm", "yarn"];

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
    this.templateInfo = {};
    this.templateNpm = null;
  }
  async exec() {
    try {
      //1.准备阶段
      const projectInfo = await this.prepare();
      if (projectInfo) {
        log.verbose("projectInfo >>", projectInfo);
        this.projectInfo = projectInfo;
      }
      //2.下载模版
      await this.downloadTemplate();
      //3.安装模板
      await this.installTemplate();
    } catch (error) {}
  }

  //检查命令是否在白名单
  checkCommand(cmd) {
    if (WHITE_COMMND.includes(cmd)) {
      return cmd;
    }
    return null;
  }

  async downloadTemplate() {
    //通过项目模板API获取项目信息
    //egg.js搭建后端系统 -> npm储存项目模板 -> 项目模板存储mongndb数据库中 -> 通过egg.js获取数据库数据通过api返回
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    );
    const targetPath = path.resolve(useHome, ".cli-dev", "template");
    const storePath = path.resolve(
      useHome,
      ".cli-dev",
      "template",
      "node_modules"
    );
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    this.templateNpm = new Package({
      targetPath,
      storePath,
      packageName: npmName,
      packageVersion: version,
    });
    if (!(await this.templateNpm.exists())) {
      const spinner = spinnerStart("正在下载模板...");
      await this.templateNpm.install();
      spinner.stop(true);
      log.success("下载模板成功");
    } else {
      const spinner = spinnerStart("正在更新模板...");
      await this.templateNpm.update();
      spinner.stop(true);
      log.success("更新模板成功");
    }
  }

  async installTemplate() {
    if (this.templateInfo) {
      if (
        this.templateInfo.type &&
        this.templateInfo.type === TEMPLATE_TYPE_CUSTOM
      ) {
        //自定义安装
        await this.installCustomTemplate();
      } else {
        //标准安装
        await this.installNormalTemplate();
      }
    } else {
      throw new Error("项目模板信息不存在!");
    }
  }

  async execCommand(commandStr, errMsg = "执行异常") {
    if (commandStr) {
      const cmdArr = commandStr.split(" ");
      const cmd = this.checkCommand(cmdArr[0]);
      const args = cmdArr.slice(1);
      const result = await execAsync(cmd, args, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      if (result !== 0) {
        throw new Error("依赖安装异常");
      }
      return result;
    }
  }
  //ejs 模板渲染替换
  async ejsRender(option = { ignore: ["node_modules/**", "public/**"] }) {
    const dir = process.cwd();
    const projectInfo = this.projectInfo;
    return new Promise((resolve, reject) => {
      //匹配所有文件
      glob(
        "**",
        {
          cwd: dir,
          nodir: true,
          ignore: option.ignore || '',
        },
        (err, files) => {
          if (err) {
            reject(err);
          }
          Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file);
              return new Promise((res, rej) => {
                //替换文件中替换符
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) {
                    rej(err);
                  } else {
                    fse.writeFileSync(filePath, result);
                    res(result);
                  }
                });
              });
            })
          )
            .then(() => {
              resolve()
            })
            .catch((err) => {
              log.verbose(err)
              reject(err)
            });
        }
      );
    });
  }

  async installNormalTemplate() {
    console.log("安装标准");
    const spinner = spinnerStart("正在安装模板...");
    try {
      //拷贝模板代码至目录
      const templatePath = path.resolve(
        this.templateNpm.cacheFilePath,
        "template"
      );
      const currentPath = process.cwd();
      fse.ensureDirSync(templatePath); //目录不存在时创建
      fse.ensureDirSync(currentPath);
      fse.copySync(templatePath, currentPath);
    } catch (e) {
      throw e;
    } finally {
      spinner.stop(true);
    }
    const { installCommand, startCommand, ignore } = this.templateInfo;
    //获取模板配置中忽略项
    const templateIgnore = ignore ? ignore : [];
    const option = {
      ignore: ["node_modules/**", "public/**", ...templateIgnore],
    };
    await this.ejsRender(option);
    //依赖安装
    await this.execCommand(installCommand, "依赖安装异常");
    //启动命令执行
    await this.execCommand(startCommand, "启动名称异常");
  }

  async installCustomTemplate() {
    console.log("安装自定义");
  }

  async prepare() {
    //判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error("项目模板不存在");
    }
    this.template = template;
    const localPath = process.cwd();
    //1.判断当前目录是否为空
    if (!this.isCwdEmpty(localPath)) {
      //是否强制创建
      let ifContinue = false;
      if (!this.force) {
        ifContinue = (
          await inquirer.prompt({
            type: "confirm",
            name: "ifContinue",
            message: "当前文件夹不为空,是否继续创建项目",
            default: false,
          })
        ).ifContinue;
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
          name: "type",
        });
        console.log("clearDir :>> ", clearDir);
        //清空文件夹
        if (clearDir) {
          //TODO:  fse.emptyDirSync(localPath)  测试不清空
        }
      }
    }
    return await this.getProjectInfo();
  }

  async getProjectInfo() {
    function isVaildName(v) {
      return !/^[a-zA-Z]+([-_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
    }
    let projectInfo = {};
    let isProjectNameVaild = false;
    if (!isVaildName(this.projectName)) {
      isProjectNameVaild = true;
      projectInfo.projectName = this.projectName;
    }
    //选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: TYPE_COMPONENT,
      choices: [
        { name: "项目", value: TYPE_COMPONENT },
        { name: "组件", value: TYPE_PROJECT },
      ],
    });
    this.template = this.template.filter((item) => item.tag.includes(type));
    if (type === TYPE_COMPONENT) {
      const projectNamePrompt = {
        type: "input",
        name: "projectName",
        message: "请输入项目名称",
        default: "",
        validate: function (v) {
          //不合法名称提示
          var done = this.async();
          setTimeout(function () {
            if (isVaildName(v)) {
              done("请输入合法的项目名称");
              return;
            }
            done(null, true);
          }, 100);
        },
        filter: function (v) {
          return v;
        },
      };
      let promptArr = [
        {
          type: "input",
          name: "projectVersion",
          message: "请输入项目版本号",
          default: "1.0.0",
          validate: function (v) {
            //不合法提示
            var done = this.async();
            setTimeout(function () {
              if (!semver.valid(v)) {
                done("请输入合法的项目名称");
                return;
              }
              done(null, true);
            }, 100);
          },
          filter: function (v) {
            return semver.valid(v) || v;
          },
        },
        {
          type: "list",
          name: "projectTemplate",
          message: "请选择项目模板",
          choices: this.createTemplateChoice(),
        },
      ];
      if (!isProjectNameVaild) {
        promptArr.unshift(projectNamePrompt);
      }
      const project = await inquirer.prompt(promptArr);
      projectInfo = {
        type,
        ...projectInfo,
        ...project,
      };
    } else if (type === TYPE_PROJECT) {
    }
    //生产classname
    if (projectInfo.projectName) {
      projectInfo.name = projectInfo.projectName;
      projectInfo.version = projectInfo.projectVersion;
      projectInfo.className = kebabCase(projectInfo.projectName).replace(
        /^-/,
        ""
      );
    }
    //获取项目的基本信息
    return projectInfo;
  }

  isCwdEmpty(localPath) {
    //文件夹读取 过滤
    const fileList = fs
      .readdirSync(localPath)
      .filter(
        (file) => !file.startsWith(".") && !["node_modules"].includes(file)
      );
    return !fileList || fileList.length === 0;
  }

  createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }));
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.Command = Command;
