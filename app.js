#!/usr/bin/env node

(function (undefined) {
    var colors = require( "colors");

    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;

    var url = require('url');
    var http = require("http");
    var fs = require('fs');

    //app 路径
    //var app = process.argv[1];

    //服务的基础配置
    var serverConfig = {
        port: 8080,
        ip: "127.0.0.1",
        documentRoot: "wwwroot"
    }

    //默认启动http服务的路径
    var documentRoot = process.cwd() + "/" + serverConfig.documentRoot;

    //默认文档名称
    var defaultDocument = "index.html";

    //文件的content type类型
    var contentType = {
        "*": "application/octet-stream",
        // "*"  : "text/plain",
        ".ico": "image/x-icon",
        ".jpe": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".html": "text/html",
        ".htm": "text/html",
        ".css": "text/css",
        ".txt": "text/plain",
        ".js": "application/x-javascript",
        ".woff": "application/x-font-woff",
        ".pdf": "application/pdf"
    }

    //启动服务
        function startServer() {
            //启动server
            var server = http.createServer(function (req, res) {
                var location = url.parse(req.url, true);
                var isDirectory = location.pathname.substring(location.pathname.length - 1) == "/";

                var URI = isDirectory ? (location.pathname + defaultDocument) : location.pathname;

                var filename = documentRoot + URI;
                var queryString = location.query;

                checkFile(filename, function (stats) {
                    if (stats) {
                        //如果是目录则301跳转
                        if (stats.isDirectory()) {
                            res.writeHead(301, {
                                'Location': (URI + "/")
                            });
                            res.end();
                            return;
                        }

                        //加载文件
                        fs.readFile(filename, function (err, data) {
                            if (err) {
                                res.writeHead(500, {
                                    'Content-Type': "text/html"
                                });
                                res.end("<h1>500</h1>");
                                throw err;
                            }

                            //获取扩展名
                            var ext = getExt(filename);

                            //写头部信息
                            res.writeHead(200, {
                                'Content-Type': contentType[ext] || "text/plain"
                            });
                            res.end(data);
                        });
                    } else {
                        if (isDirectory) {
                            res.writeHead(404, {
                                'Content-Type': "text/html"
                            });
                            res.write("<h1>Folder:" + location.pathname + "</h1>");

                            var dir = documentRoot + location.pathname;
                            fs.readdir(dir, function (err, files) {
                                if (err) {
                                    res.writeHead(500, {
                                        'Content-Type': "text/html"
                                    });
                                    res.end("<h1>500</h1>");
                                    throw err;
                                }
                                var html = [
                                '<div><a href="../">..</a></div>'
                            ];
                                files.forEach(function (file) {
                                    var path = dir + file;
                                    var stat = fs.lstatSync(path);

                                    var URI = location.pathname + file;
                                    html.push("<div><a href='" + URI + "'>" + URI + "</a></div>");
                                });
                                res.end(html.join(""));
                            });
                        } else {
                            res.writeHead(404, {
                                'Content-Type': "text/html"
                            });
                            res.end("<h1>404</h1>");
                        }
                    }
                });

            });

            server.listen(serverConfig.port);
        }

        //检测文件
        function checkFile(filename, callback) {
            fs.stat(filename, function (err, stats) {
                if (stats) {
                    callback(stats);
                } else {
                    callback(undefined);
                }
            });
        }

        //获取扩展名
        function getExt(filename) {
            var ext = filename.substring(filename.lastIndexOf(".")); //(filename.match("\\.\\w+$") || "*").toString().toLowerCase();
            return (ext = (ext == filename) ? "*" : ext);
        }

        //多进程
    if (cluster.isMaster) {
        // Fork workers.
        for (var i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
        cluster.on('online', function (worker, code, signal) {
            console.log(('worker ' + worker.process.pid + ' is online.').green);
        });

        cluster.on('exit', function (worker, code, signal) {
            console.log(('worker ' + worker.process.pid + ' died').red);
            //cluster.fork(); //重新拉起
        });
    } else {
        startServer();
    }
})(undefined);
