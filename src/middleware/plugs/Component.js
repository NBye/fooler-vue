const fs = require('fs');
const zlib = require("zlib");
const Path = require("path");
const cached = {};
const fileRead = async function (path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data.toString());
            }
        });
    });
};
const readComponentPart = function (conf, path) {
    return new Promise((resolve, reject) => {
        if (cached[path]) {
            resolve(cached[path]);
        } else if (/\.js$/.test(path) && conf.babel) {
            require("@babel/core").transformFile(path, conf.babel, (err, res) => {
                if (err) {
                    return reject(err);
                }
                cached[path] = {
                    code: err ? '' : res.code.toString(),
                    v: new Date()
                };
                resolve(cached[path]);
            });
        } else {
            fs.readFile(path, 'utf-8', (err, data) => {
                cached[path] = {
                    code: err ? '' : data.toString(),
                    v: new Date() //没有必要使用文件的修改时间，使用加入缓存时间即可。
                };
                resolve(cached[path]);
            });
        }
    });
};
const getComponent = function (root, path, callback, components, options, conf) {
    path[path.length - 1] == '/' && (path = path.slice(0, -1));
    components[path] = false;
    let name = Path.basename(path);
    Promise.all([
        readComponentPart(conf, `${root}${conf.path}${path}/${name}.html`),
        readComponentPart(conf, `${root}${conf.path}${path}/${name}.js`),
        readComponentPart(conf, `${root}${conf.path}${path}/${name}.css`),
        readComponentPart(conf, `${root}${conf.path}${path}/${name}.json`),
    ]).then(returns => {
        let [html, js, css, json] = returns;
        returns.forEach(o => {
            o.v > options.v && (options.v = o.v);
        });
        json = JSON.parse(json.code);
        if (json.depends) {
            json.depends.forEach((path) => {
                !components[path] && options.loadeds.indexOf(path) < 0 && getComponent(root, path, callback, components, options, conf);
            });
        }
        components[path] = {
            html: html.code,
            code: js.code,
            css: css.code,
            type: json.type || 'page',
            browser: json.browser
        }
        for (let ing of Object.values(components)) {
            if (ing === false) {
                return;
            }
        }
        callback(components);
    }).catch(err => {
        callback(null, err);
    });
};
const getLoadeds = function (req) {
    return JSON.parse(req.headers.loadeds || '[]');
};
exports.loadComponent = async function ({ ctx, options }) {
    let conf = Object.assign({}, options.component);
    let root = /^\./.test(conf.path) ? (options.root + '/') : '';
    //如果前端支持ES6就无需开启babel
    conf.babel = ctx.req.headers['premium-version'] == 'true' ? false : conf.babel;
    let { req, res } = ctx;
    let path = req.url.split('?')[0].slice(0, -4);
    res.setHeader('Content-type', 'application/json;charset=UTF-8');
    let option = { v: 0, loadeds: getLoadeds(req) };
    return new Promise((resolve) => {
        getComponent(root, path, (components, err) => {
            if (components) {
                let mims = req.headers['if-modified-since'];
                let mtus = option.v.toGMTString()
                if (!mims || mims != mtus) {
                    res.setHeader("Last-Modified", mtus);
                } else {
                    return ctx.sendHTML('Not Modified', 304);
                }
                if (/gzip/.test(req.headers["accept-encoding"])) {
                    ctx.completed = true;
                    res.writeHead(200, { 'content-encoding': 'gzip' });
                    let output = zlib.createGzip();
                    output.pipe(res);
                    output.write(JSON.stringify(components), () => {
                        output.end();
                    });
                } else {
                    ctx.sendJSON(components);
                }
            } else {
                console.error(err);
                res.setHeader('info', err.message);
                ctx.sendHTML(`Component ${path}.com is not defined`, 404);
            }
            resolve();
        }, {}, option, conf);
    });
};
exports.loadView = async function ({ ctx, options }) {
    conf = options.component;
    let root = /^\./.test(conf.path) ? (options.root + '/') : '';
    let { req, res } = ctx;
    let path = req.url.split('?')[0]
    path === '/' && (path = '/index');
    path[path.length - 1] == '/' && (path = path.slice(0, -1));
    try {
        let name = Path.basename(path);
        let json = JSON.parse(await fileRead(`${root}${conf.path}${path}/${name}.json`));
        let vfmk = fs.statSync(`${root}${conf.path}${path}/${name}.json`).mtime;
        let sources = [];
        if (typeof json.sources === 'string') {
            json.sources = JSON.parse(await fileRead(`${root}${conf.path}/${json.sources}`));
        }
        (json.sources || []).forEach(link => {
            if (typeof link == 'object' && link.type == 'script') {
                sources.push(`<script src="${link.src}" type="text/javascript"></script>`);
            } else if (typeof link == 'object' && link.type == 'style') {
                sources.push(`<link href="${link.src}" rel="stylesheet" type="text/css" />`);
            } else if (/\.js$/.test(link)) {
                sources.push(`<script src="${link}" type="text/javascript"></script>`);
            } else {
                sources.push(`<link href="${link}" rel="stylesheet" type="text/css" />`);
            }
        });
        let html = `<!DOCTYPE html>
<html>
	<head>
		<title></title>
		<meta charset="UTF-8">
        <meta id="gptouchviewport" name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" >
        <link rel="shortcut icon" href="/static/favicon.ico" />
		<script>
            var client={
                "host":"${(req.connection.encrypted || req.headers['x-forwarded-proto'] == 'https') ? 'https:' : 'http:'}//${req.headers['host']}"
            };
            if (!window.Promise) {
                document.write('<script src="//cdn.jsdelivr.net/npm/es6-promise@4.1.1/dist/es6-promise.min.js"><\\/script>');
                document.write('<script>ES6Promise.polyfill()<\\/script>');
            }
            ${json.framework ? await fileRead(`${root}${conf.path}/${json.framework}`) : ''}
		</script>
		${sources.join('\n')}
	</head>
	<body>
	</body>
</html>`;
        res.setHeader('Content-type', 'text/html;charset=UTF-8');
        let mims = req.headers['if-modified-since'];
        let mtus = vfmk.toUTCString()
        if (!mims || mims != mtus) {
            res.setHeader("Last-Modified", mtus);
        } else {
            return ctx.sendHTML('Not Modified', 304);
        }
        if (/gzip/.test(ctx.req.headers["accept-encoding"])) {
            ctx.completed = true;
            res.writeHead(200, { 'content-encoding': 'gzip' });
            let output = zlib.createGzip();
            output.pipe(res);
            output.write(html, () => {
                output.end();
            });
        } else {
            ctx.sendHTML(html);
        }
    } catch (err) {
        console.error(err);
        res.setHeader('info', err.message);
        ctx.sendHTML(`Component ${path} is not defined`, 404);
    };
};