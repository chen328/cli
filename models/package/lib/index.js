'use strict';

const path = require("path")
const {
    isObject
} = require("@gufai/utils")
const pkgDir = require("pkg-dir").sync;
const formatPath = require("@gufai/format-path")
const npminstall = require('npminstall');
const { getRegistry, getNpmLatestVersion } = require("@gufai/get-npm-info");
const pathExists = require("path-exists").sync;
const fse = require('fs-extra');

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
        //package存储路径
        this.storePath = options.storePath;
        //package name
        this.packageName = options.packageName;
        //version
        this.packageVersion = options.packageVersion;
        //缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    async prepare() {
        if (this.storePath && !pathExists(this.storePath)) {
            fse.mkdirpSync(this.storePath)
        }
        if (this.packageVersion === "latest") {
            this.packageVersion = await getNpmLatestVersion(this.packageName);
        }
    }

    //判断当前package是否存在
    async exists() {
        if (this.storePath) {
            await this.prepare();
            return pathExists(this.cacheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }

    get cacheFilePath() {
        return path.resolve(this.storePath, `_${this.packageName}@${this.packageVersion}@${this.packageName}`)
    }

    getSpecificCacheFilePath(version) {
        return path.resolve(this.storePath, `_${this.packageName}@${version}@${this.packageName}`)
    }

    //安装package
    async install() {
        await this.prepare();
        return npminstall({
            root: this.targetPath,
            storeDir: this.storePath,
            registry: getRegistry(),
            pkgs: [
                { name: this.packageName, version: this.packageVersion },
            ],
        })
    }
    //更新package
    async update() {
        await this.prepare();
        /*
          1.获取最新的npm模块版本号
          2.查询最新版本号对应的路径是否存在
          3.不存在安装最新版本
         */
        const latestPackageVersion = await getNpmLatestVersion(this.packageName);
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
        if (!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storePath,
                registry: getRegistry(),
                pkgs: [
                    { name: this.packageName, version: latestPackageVersion },
                ],
            })
            this.packageVersion = latestPackageVersion
        }
    }
    //获取入口文件的路径
    getRootFilePath() {
        function _rootPath(targetPath) {
            //1.获取package.json所在文件目录
            const dir = pkgDir(targetPath);
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
        if (this.storePath) {
           return _rootPath(this.cacheFilePath)
        } else {
           return  _rootPath(this.targetPath)
        }


    }

}

module.exports = Package;