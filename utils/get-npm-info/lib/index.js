"use strict";

const axios = require("axios");
const urlJoin = require("url-join");
const semver = require("semver");

function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null;
  }
  const registryUrl = getRegistry(registry);
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  //请求npm url 返回 包信息
  return axios
    .get(npmInfoUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      } else {
        return null;
      }
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

function getRegistry(registry) {
  return registry || "https://registry.npmjs.org"
}

/**
 *
 * @param {string} npmName
 * @param {string} registry
 * @returns {array} 版本号数组
 */

async function getNpmVersion(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  //versions 是多个版本号为key的对象
  return data ? Object.keys(data.versions) : [];
}

//返回大于现在版本的版本数组
function getSemverVersion(baseVersion, versions) {
  return versions.filter(
    (version) => semver.satisfies(version, baseVersion) // true
  ).sort((a, b) => semver.gt(a, b));
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersion(npmName, registry);
  return getSemverVersion(baseVersion, versions);
}
//返回最新数组
async function getNpmLatestVersion(npmName, registry) {
  const versions = getNpmVersion(npmName,registry);
  if(versions){
    return versions.sort((a, b) => semver.gt(a, b))[0]
  }
  return null
}

module.exports = {
  getNpmInfo,
  getNpmVersion,
  getNpmSemverVersion,
  getRegistry,
  getNpmLatestVersion
};
