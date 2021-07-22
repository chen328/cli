'use strict';

const path = require("path")
const {
    isObject
} = require("@gufai/utils")
const pkgDir = require("pkg-dir").sync;
const formatPath = require("@gufai/format-path")

class Package {
    constructor(options) {
        if (!options) {
            throw new Error("package类参数不能为空")
        }
        if (!isObject(options)) {
            throw new Error("package类参数必须是对象")
        }
        //package路径
        this.targetPath = options.targetPath;
        //package存储路劲
        // this.storePath = options.storePath;
        //package name
        this.packageName = options.packageName;
        //version
        this.packageVersion = options.packageVersion
    }

    //判断当前package是否存在
    exists() {

    }
    //安装package
    install() {

    }
    //更新package
    update() {

    }
    //获取入口文件的路径
    getRootFilePath() {
        //1.获取package.json所在文件目录
        const dir = pkgDir(this.targetPath);
        if (dir) {
            //2.读取package.json
            const pkgFile = require(path.resolve(dir, 'package.json'))
            //3.找到main/lib
            if (pkgFile && pkgFile.main) {
                //4.路径的兼容(macOS/windows)
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null

    }

}

module.exports = Package;