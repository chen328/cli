#!/use/bin/env node

const importLocal = require("import-local");
const colors = require("colors");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

if (importLocal(__filename)) {
  require("npmlog").info("cli", "正在使用cli本地版本");
} else {
  require("../lib")(process.argv.slice(2));
}

//注册命令
const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 <command> [options]")
//   .command({
//     command: 'configure <key> [value]',
//     aliases: ['config', 'cfg'],
//     desc: 'Set a config variable',
//     builder: (yargs) => yargs.default('value', 'true'),
//     handler: (argv) => {
//       console.log(`setting ${argv.key} to ${argv.value}`)
//     }
//   })
  .help().argv;

console.log(argv, "注册命令".red);
