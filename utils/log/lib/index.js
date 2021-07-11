"use strict";

const log = require("npmlog");
//根据环境配置 设置lever  verbose时开启debugg打印
log.level = process.env.LOG_LEVEl ? process.env.LOG_LEVEl : "info";
log.heading = "cli"; //输出前缀
log.headingStyle = { fg: "red", bg: 'white' }; //自定义样式
log.addLevel("success", 2000, { fg: "green", bold: true }); //增加命令


module.exports = log;

// function log() {
//     return npmlog
// }
