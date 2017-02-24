var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    mime = require('mime');

function readBooks(callback) {
    fs.readFile('./books.json', 'utf-8', function(err, data) {
        if (data == '' || err) {
            console.log(err);
            callback([]);
        } else {
            callback(JSON.parse(data));
        }
    });
}

function readUsers(callback) {
    fs.readFile('./user.json', 'utf-8', function(err, data) {
        if (data == '' || err) {
            console.log(err);
            callback([]);
        } else {
            callback(JSON.parse(data));
        }
    });
}

function writeBooks(con, callback) {
    fs.writeFile('./books.json', JSON.stringify(con), callback);
}

function writeUsers(con, callback) {
    fs.writeFile('./user.json', JSON.stringify(con), callback);
}
http.createServer(function(req, res) {
    var urlObj = url.parse(req.url, true),
        pathname = urlObj.pathname,
        bookReg = /^\/book(\/\d+)?$/,
        userReg = /^\/userReg/,
        userLogin = /^\/userLogin/;
    if (pathname == '/') {
        res.setHeader('Content-Type', 'text/html;charset=utf8');
        fs.createReadStream('./index.html').pipe(res);
    } else if (bookReg.test(pathname)) {
        var id = pathname.match(bookReg)[1];
        switch (req.method) {
            case 'GET':
                if (id) {
                    readBooks(function(data) {
                        var book = data.find(function(item) {
                            return item.id == id.slice(1);
                        });
                        res.end(JSON.stringify(book));
                    });
                } else {
                    readBooks(function(result) {
                        res.end(JSON.stringify(result))
                    });
                }

                break;
            case 'POST':
                var str = '';
                req.on('data', function(chunk) {
                    str += chunk;
                });
                req.on('end', function() {
                    var book = JSON.parse(str);
                    readBooks(function(result) {
                        book.id = result.length ? result[result.length - 1].id + 1 : 1;
                        result.push(book);
                        writeBooks(result, function() {
                            res.end(JSON.stringify(book));
                        })
                    })

                })

                break;
            case 'PUT':
                if (id) {
                    var str = '';
                    req.on('data', function(chunk) {
                        str += chunk;
                    })
                    req.on('end', function() {
                        var book = JSON.parse(str);
                        readBooks(function(result) {
                            result = result.map(function(item) {
                                if (item.id == id.slice(1)) {
                                    return book;
                                }
                                return item;
                            })
                            writeBooks(result, function() {
                                res.end(JSON.stringify(book));
                            })
                        })
                    })
                }

                break;
            case 'DELETE':
                if (id) {
                    readBooks(function(result) {
                        result = result.filter(function(item) {
                            return item.id != id.slice(1);
                        })
                        writeBooks(result, function() {
                            res.end(JSON.stringify({}));
                        })
                    })
                }

                break;
        }
    } else if (userReg.test(pathname)) {
        var str = '';
        req.on('data', function(chunk) {
            str += chunk;
        });
        req.on('end', function() {
            console.log(str);
            var user = JSON.parse(str);
            readUsers(function(result) {
                user.id = result.length ? parseInt(result[result.length - 1].id) + 1 : 1;
                result.push(user);
                writeUsers(result, function() {
                    res.end(JSON.stringify(user));
                })
            })
        });
    } else if (userLogin.test(pathname)) {
        // var str = '';
        // req.on('data', function(chunk) {
        //     str += chunk;
        // });
        // req.on('end', function() {
        //     console.log(str);
        //     var user = JSON.parse(str);
        //     readUsers(function(result) {
        //         result.forEach(function(item) {
        //             if (item.name == str.name && item.password == str.password) {
        //                 res.end(JSON.stringify(user));
        //             }
        //             res.end('error');
        //         })
        //     })
        // });
    } else {
        fs.exists('.' + pathname, function(flag) {
            if (flag) {
                res.setHeader('Content-Type', mime.lookup(pathname) + ';charset=utf8');
                fs.createReadStream('.' + pathname).pipe(res);
            } else {
                res.statusCode = 404;
                res.end('not found');
            }
        })
    }
}).listen(8080);
