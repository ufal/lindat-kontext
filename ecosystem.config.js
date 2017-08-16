module.exports = {
  apps:[
          {
              "exec_mode": "fork_mode",
              "cwd": "./",
              "script": "public/app.py",
              "name": "kontext" + (process.env.DPNAME || ""),
              "autorestart": true,
              "exec_interpreter": "python",
              "args": "--address 0.0.0.0 --port " + (process.env.PORT || 5000),
              "kill_timeout": 3200
          }
      ],
      "deploy" : {
          "staging" : {
              "user" : process.env.DPUSER || "kontext",
              "host" : [
                  {
                      "host": "127.0.0.1",
                      "port": "8877"
                  }
                ],
              "repo" : "https://github.com/ufal/lindat-kontext.git",
              "ref"  : "origin/kontext-dev",
              "path" : "/opt/kontext-staging/deploy",
              "pre-deploy-local": "ssh -fN -L8877:kontext-dev:22 okosarko@quest.ms.mff.cuni.cz",
              "post-deploy" : "npm install && grunt devel && DPNAME=-staging PORT=10001 pm2 startOrRestart ecosystem.config.js",
              "env" : {
                "NODE_ENV": "staging",
              }
          }
      }
};
