module.exports = {
  apps:[
          {
              "exec_mode": "fork_mode",
              "cwd": "./public",
              "script": "gunicorn",
              "name": "kontext" + (process.env.DPNAME || ""),
              "autorestart": true,
              "exec_interpreter": "python",
              "args": "-c " + process.cwd() + "/conf/gunicorn-conf.py app:application",
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
              "pre-deploy-local": "ssh -fN -L8877:kontext-dev:22 " + process.env.DPUSER + "@quest.ms.mff.cuni.cz",
              "post-deploy" : "npm install && grunt production && DPNAME=-staging PORT=10001 pm2 startOrRestart ecosystem.config.js",
              "post-deploy-local" : "lsof -t -i :8877 | xargs kill -9 ",
              "env" : {
                "NODE_ENV": "staging",
              }
          },
          "production" : {
              "user" : process.env.DPUSER || "kontext",
              "host" : [
                  {
                      "host": "127.0.0.1",
                      //different machine - different ssh key
                      "port": "8878"
                  }
                ],
              "repo" : "https://github.com/ufal/lindat-kontext.git",
              "ref"  : "origin/kontext-dev",
              "path" : "/opt/kontext/deploy",
              "pre-deploy-local": "ssh -fN -L8878:kontext-new:22 " + process.env.DPUSER + "@quest.ms.mff.cuni.cz",
              "post-deploy" : "npm install && grunt production && PORT=8090 pm2 startOrRestart ecosystem.config.js",
              "post-deploy-local" : "lsof -t -i :8878 | xargs kill -9 ",
          },
          "staging-kira" : {
              "user" : process.env.DPUSER || "kontext",
              "host" : [
                  {
                      "host": "127.0.0.1",
                      "port": "8877"
                  }
                ],
              "repo" : "https://github.com/ufal/lindat-kontext.git",
              "ref"  : "origin/kontext-dev",
              "path" : "/opt/kontext-kira/deploy",
              "pre-deploy-local": "ssh -fN -L8877:kontext-dev:22 " + process.env.DPUSER + "@quest.ms.mff.cuni.cz",
              "post-deploy" : "npm install && grunt devel && DPNAME=-kira PORT=10005 pm2 startOrRestart ecosystem.config.js",
              "post-deploy-local" : "lsof -t -i :8877 | xargs kill -9 ",
              "env" : {
                "NODE_ENV": "staging",
              }
          },
          "staging-jm" : {
              "user" : process.env.DPUSER || "kontext",
              "host" : [
                  {
                      "host": "127.0.0.1",
                      "port": "8877"
                  }
                ],
              "repo" : "https://github.com/ufal/lindat-kontext.git",
              "ref"  : "origin/issue_57",
              "path" : "/opt/kontext-jm/deploy",
              "pre-deploy-local": "ssh -fN -L8877:kontext-dev:22 " + process.env.DPUSER + "@quest.ms.mff.cuni.cz",
              "post-deploy" : "npm install && grunt devel && DPNAME=-jm PORT=10002 pm2 startOrRestart ecosystem.config.js",
              "post-deploy-local" : "lsof -t -i :8877 | xargs kill -9 ",
              "env" : {
                "NODE_ENV": "staging",
              }
          },
          "staging-ansa" : {
              "user" : process.env.DPUSER || "kontext",
              "host" : [
                  {
                      "host": "127.0.0.1",
                      "port": "8877"
                  }
                ],
              "repo" : "https://github.com/ufal/lindat-kontext.git",
              "ref"  : "origin/issue_57",
              "path" : "/opt/kontext-ansa/deploy",
              "pre-deploy-local": "ssh -fN -L8877:kontext-dev:22 " + process.env.DPUSER + "@quest.ms.mff.cuni.cz",
              "post-deploy" : "npm install && grunt devel && DPNAME=-ansa PORT=10003 pm2 startOrRestart ecosystem.config.js",
              "post-deploy-local" : "lsof -t -i :8877 | xargs kill -9 ",
              "env" : {
                "NODE_ENV": "staging",
              }
          }
      }
};
