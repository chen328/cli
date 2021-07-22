'use strict';

const Package = require("@gufai/package");
const log = require("@gufai/log")

const SETTINGS = {
    init : "@gufai/init"
} 

function exec(projectName, options, command) {

    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose('targetPath--', process.env.CLI_TARGET_PATH)
    log.verbose('homePath--', homePath)
    const cmdObj = arguments[arguments.length - 2];//拿options 参数
    const commandObj = arguments[arguments.length - 1];
    const packageName = SETTINGS[commandObj.name()]; //npm 包名
    const packageVersion = 'latest';

    if(!targetPath){
        targetPath = ""; //生成缓存路径
    }

    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion
    });
    console.log(pkg.getRootFilePath());
   
}


module.exports = exec;


