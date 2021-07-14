#!/use/bin/env node

const importLocal = require("import-local");
const colors = require("colors");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const pkg = require("../package.json");
const { program } = require("commander");

program
  .version(pkg.version)
  .name(Object.keys(pkg.bin)[0]) //脚手架名字
  .usage("<command> [options]".green) //头部命令描述
  .option("-d, --debug", "enable debug mode", false) //开启debug模式
  .option("-e, --env <name>", "get env name"); //环境变量 <xx> 获取设置参数

//注册命令
// program
//   .command("clone <source> [destination]")
//   .action((source, destination) => {
//     console.log("clone command called", source, destination);
//   });

//自定义事件监听
program.on("option:debug", function () {
  console.log("触发debug");
  //修改环境变量为debug
  // process.env.LOG_LEVERL = "verbose"
});

//对未知命令进行监听
program.on("command:*", function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = program.commands.map((cmd) => cmd.name());
  // console.log(availableCommands);
  //TODO: 对最接近的命令进行提升并退出
  // mySuggestBestMatch(operands[0], availableCommands);
  // process.exitCode = 1;
});

//命令参数
const options = program.opts();
console.log(options);

//格式化打印 最后执行
program.parse();

if (importLocal(__filename)) {
  require("npmlog").info("cli", "正在使用cli本地版本");
} else {
  require("../lib")(process.argv.slice(2));
}

//注册命令
// const argv = yargs(hideBin(process.argv))
// .usage("Usage: $0 <command> [options]")
//   .command({
//     command: 'configure <key> [value]',
//     aliases: ['config', 'cfg'],
//     desc: 'Set a config variable',
//     builder: (yargs) => yargs.default('value', 'true'),
//     handler: (argv) => {
//       console.log(`setting ${argv.key} to ${argv.value}`)
//     }
//   })
// .help().argv;

// console.log(argv, "注册参数".red);
//TODO:增加debug命令 文档
