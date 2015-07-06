var Q = require('q');
var os = require("os");
var _ = require("lodash");
var exec = require('child_process').exec;

var tags = require('./tags');

var execFind = function(folder) {
    var deffered = Q.defer();
    var command = "((git ls-files ; git ls-files --others --exclude-standard) || find . -type f)";

    // Call exec function
    exec(command, { cwd: folder }, function(error, stdout, stderr) {
        if(error) {
            error.message += command + ' (exited with error code ' + error.code + ')';
            error.stdout = stdout;
            error.stderr = stderr;

            return deffered.reject(error);
        }
        return deffered.resolve({
            stdout: stdout,
            stderr: stderr
        });
    });

    return deffered.promise;
};

module.exports = function(codebox) {
    var workspace = codebox.workspace;
    var workspaceRoot = codebox.workspace.root();
    var events = codebox.events;
    var project = codebox.rpc.get("project");

    codebox.rpc.service("ctags", {
        list: function() {
            if (project) {
                return project.files()
                .then(function(files) {
                    return tags.get(workspaceRoot, files);
                });
            } else {
                return execFind(workspaceRoot)
                .get('stdout')
                .then(function(stdout) {
                    var files = _.compact(stdout.split(os.EOL));

                    return _.filter(files, function(file) {
                        if (file[0] != "/") file = "/"+file;
                        return true;
                    });
                })
                .then(function(files) {
                    return tags.get(workspaceRoot, files);
                });
            }
        }
    });
};