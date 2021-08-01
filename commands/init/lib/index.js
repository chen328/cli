"use strict";

const Command = require("@gufai/command");

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
  }
  exec() {}
}

function init(argv) {
  // projectName, options, command
  // console.log(projectName, options,process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}

module.exports = init;
module.exports.Command = Command;
