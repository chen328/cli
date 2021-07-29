'use strict';

const Package = require("@gufai/package");
const log = require("@gufai/log")
const path = require("path")

const SETTINGS = {
    init: "@gufai/init"
}

const CACHE_DIR = "dependencies";

async function exec(projectName, options, command) {

    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    let storeDir = "";
    let pkg;
    log.verbose('targetPath--', process.env.CLI_TARGET_PATH)
    log.verbose('homePath--', homePath)
    const cmdObj = arguments[arguments.length - 2];//拿options 参数
    const commandObj = arguments[arguments.length - 1];
    const packageName = SETTINGS[commandObj.name()]; //npm 包名
    const packageVersion = 'latest';

    if (!targetPath) {
        targetPath = path.resolve(homePath, CACHE_DIR); //生成缓存路径
        storeDir = path.resolve(targetPath, "node_modules")
        console.log('storeDir :>> ', targetPath, storeDir);
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        });
        if (await pkg.exists()) {
            //更新package
            await pkg.update()
        } else {
            //安装package
           await pkg.install()
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        });
        const rootFile = pkg.getRootFilePath();
        if (rootFile) { require(rootFile).apply(null, arguments) }
    }



}


module.exports = exec;


