/* */ 
(function(process) {
  (function() {
    var fsUtil = require("fs"),
        name = require("./package.json!systemjs-json").name;
    if (fsUtil.existsSync('.git') === true && fsUtil.existsSync('./node_modules/' + name) === false) {
      require("child_process").spawn(process.platform.indexOf('win') === 0 ? process.execPath.replace('node.exe', 'npm.cmd') : 'npm', ['install', '--force', name], {
        env: process.env,
        cwd: process.cwd(),
        stdio: 'inherit'
      }).on('error', console.log).on('close', console.log);
    }
  })();
})(require("process"));
