const path = require("path");
const fs = require('fs');
const os = require('os');
const zlib = require("zlib");
const { createCanvas, loadImage } = require('canvas');
const reat = function (num, len) {
    return ('0'.repeat(len) + num).slice(-len);
};
exports.gzip = function (source) {
    let sourcePath = path.join(__dirname, source);
    let gzipPath = `${sourcePath}.gz`;
    let gzip = zlib.createGzip();
    let rs = fs.createReadStream(sourcePath);
    let ws = fs.createWriteStream(gzipPath);
    rs.pipe(gzip).pipe(ws);
};

const contentTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    html: 'text/html',
    xml: 'text/xml',
    json: 'application/json',
    js: 'application/javascript',
    css: 'text/css',
    tif: 'image/tiff',
    css: 'text/css',
    wav: 'audio/x-wav',
    mp3: 'audio/mpeg',
};

const fileStat = async function (root, files, route) {
    let list = [];
    files.forEach((file) => {
        list.push(new Promise((resolve, reject) => {
            fs.stat(root + file.replace(route.expression, ''), (err, stat) => err ? reject(err) : resolve(stat.mtime || stat.ctime))
        }));
    });
    return Promise.all(list);
};

const fileRead = function (root, files, route) {
    let list = [];
    files.forEach((file) => {
        list.push(new Promise((resolve, reject) => {
            fs.readFile(root + file.replace(route.expression, ''), 'utf-8', (err, data) => err ? reject(err) : resolve(data))
        }));
    });
    return Promise.all(list);
};

const fileExists = async function (file) {
    return new Promise((resolve) => {
        fs.access(file, function (error) {
            resolve(error ? false : true);
        });
    });
};



const sendFile = function (ctx, stat, file) {
    try {
        let [_, ext] = file.match(/.*\.(.*)$/);
        let { res, req } = ctx;
        let mims = req.headers['if-modified-since'];
        let mtus = (stat.mtime || stat.ctime).toUTCString()
        if (!mims || mims != mtus) {
            res.setHeader("Last-Modified", mtus);
        } else {
            return ctx.sendHTML('Not Modified', 304);
        }
        let encoding = req.headers["accept-encoding"];
        let rs = fs.createReadStream(file);
        let compress, compressType;
        if (['mp3', 'wav'].indexOf(ext) > -1) {
            ctx.completed = true;
            return rs.pipe(res);
        } else if (encoding && encoding.match(/\bgzip\b/)) {
            compress = zlib.createGzip();
            compressType = "gzip";
        } else if (encoding && encoding.match(/\bdeflate\b/)) {
            compress = zlib.createDeflate();
            compressType = "deflate";
        } else {
            ctx.completed = true;
            return rs.pipe(res);
        }
        res.setHeader("Content-Encoding", compressType);
        res.setHeader("Content-Type", contentTypes[ext] || 'text/html');
        rs.pipe(compress).pipe(res);
        ctx.completed = true;
    } catch (err) {
        console.error(err);
        ctx.sendHTML(err.message);
        ctx.completed = true;
    }
};

const sendMergeFile = async function ({ ctx, options, route, path }) {
    let { req, res } = ctx;
    let uri = req.url.split('?')[0];
    let [_, ext] = uri.match(/.*\.(.*)$/);
    let files = uri.split(',');
    let dates = await fileStat(path, files, route);
    let mims = req.headers['if-modified-since'];
    let date = Math.max.apply(null, dates);
    let mtus = new Date(date).toUTCString();
    if (!mims || mims != mtus) {
        res.setHeader("Last-Modified", mtus);
    } else {
        return ctx.sendHTML('Not Modified', 304);
    }
    res.setHeader("Content-Type", (contentTypes[ext] || 'text/html') + ';charset=utf-8');
    let encoding = req.headers["accept-encoding"];
    let datas = await fileRead(path, files, route);
    ctx.completed = true;
    if (encoding && encoding.match(/\bgzip\b/)) {
        res.setHeader("Content-Encoding", "gzip");
        res.end(zlib.gzipSync(Buffer.from(datas.join(os.EOL)), 'uft-8'));
    } else if (encoding && encoding.match(/\bdeflate\b/)) {
        res.setHeader("Content-Encoding", "deflate");
        res.end(zlib.deflateSync(Buffer.from(datas.join(os.EOL)), 'uft-8'));
    } else {
        res.end(datas.join(os.EOL));
    }
};

exports.sendFile = async function ({ ctx, options, route }) {
    let { req, res } = ctx;
    let { static, upload, cache, styles } = options.static;
    let path = /upload/.test(req.url) ? upload : static;
    let root = /^\./.test(path) ? (options.root + '/') : '';
    let uri = req.url.split('?')[0];
    if (uri.indexOf(',') > -1) {//如果是合并文件读取
        return sendMergeFile({ ctx, options, route, path: root + path });
    }
    if (uri == '/favicon.ico') {
        uri = root + uri;
    } else {
        uri = root + path + uri.replace(route.expression, '');
    }
    let stylekey = options.static['style-key'];
    let [file, ext] = uri.match(/.*\.(.*)$/);
    let stat = fs.statSync(file);
    if (!await fileExists(file)) {
        ctx.sendHTML('Not Found', 404);
    } else if (ctx.GET(stylekey) || ctx.GET('width') || ctx.GET('height')) {
        let cachename = Buffer.from(req.url).toString('base64').replace(/\//g, '-');
        let cachefile = (/^\./.test(cache) ? (options.root + '/' + cache) : cache) + '/' + cachename + '.' + ext;
        if (await fileExists(cachefile)) {
            sendFile(ctx, stat, cachefile)
        } else {
            let style = {
                width: parseInt(ctx.GET('width') || 0),
                height: parseInt(ctx.GET('height') || 0),
                fill: ctx.GET('fill') || 'cover',
            };
            let stylename = ctx.GET(stylekey);
            if (stylename && !styles[stylename]) {
                return ctx.sendHTML('Not Found Style', 404);
            } else if (stylename && styles[stylename]) {
                Object.assign(style, styles[stylename]);
            }
            let image = await loadImage(file);
            let { width, height } = image
            style.width > width && (style.width = width);
            style.height > height && (style.height = height);
            let sx = 0, sy = 0, dw, dh;
            if (!style.width) {
                style.width = style.height / height * width;
            } else if (!style.height) {
                style.height = style.width / width * height;
            }
            style.width = Math.round(style.width);
            style.height = Math.round(style.height);
            let wv = style.width / width;
            let hv = style.height / height;
            if (style.fill == 'cover') {
                if (wv < hv) { //往窄裁剪
                    sy = 0;
                    dh = height;
                    dw = Math.round(style.width * dh / style.height);
                    sx = Math.round((width - dw) / 2);
                } else if (wv > hv) { //往宽裁剪
                    sx = 0;
                    dw = width;
                    dh = Math.round(style.height * dw / style.width);
                    sy = Math.round((height - dh) / 2);
                } else {
                    dw = width;
                    dh = height;
                }
            } else {
                if (wv < hv) {
                    sx = 0;
                    dw = width;
                    dh = Math.round(style.height * dw / style.width);
                    sy = Math.round((height - dh) / 2);
                } else if (wv > hv) {
                    sy = 0;
                    dh = height;
                    dw = Math.round(style.width * dh / style.height);
                    sx = Math.round((width - dw) / 2);
                } else {
                    dw = width;
                    dh = height;
                }
            }
            if (dw == style.width && dh == style.height) {
                return sendFile(ctx, stat, file);
            }
            const canvas = createCanvas(style.width, style.height)
            const cvs = canvas.getContext('2d')
            cvs.drawImage(image, sx, sy, dw, dh, 0, 0, style.width, style.height)
            let data = canvas.toDataURL();
            data = Buffer.from(data.split('base64,')[1], 'base64');
            fs.writeFileSync(cachefile, data)
            sendFile(ctx, stat, cachefile)
        }
    } else {
        sendFile(ctx, stat, file);
    }
};

exports.uploadBase64 = async function ({ ctx, options, route }) {
    let path = options.static.upload;
    let root = /^\./.test(path) ? (options.root + '/') : '';
    let body = ctx.req._buff_content.toString();
    return new Promise((resolve, reject) => {
        let find = body.match(/^data:([^;]+);base64,/);
        if (!find) {
            throw new Error('请传入正确的base64文本');
        }
        let ext, [head, type] = find;
        for (let k in contentTypes) {
            if (contentTypes[k] == type) {
                ext = k;
            }
        }
        if (!ext) {
            throw new Error('不支持的文件类型:' + type);
        }
        let buff = Buffer.from(body.substr(head.length), 'base64');
        let date = new Date();
        let y = reat(date.getFullYear(), 4);
        let m = reat(date.getMonth() + 1, 2);
        let d = reat(date.getDate(), 2);
        let h = reat(date.getHours(), 2);
        let i = reat(date.getMinutes(), 2);
        let s = reat(date.getSeconds(), 2);
        let v = reat(date.getTime() % 1000, 3);
        let r = reat(parseInt(Math.random() * 1000), 3);
        let name = `/${y}/${m}/${d}/${(parseInt(h + i + s + v + r)).toString(32)}.${ext}`;
        let dirs = `${root + path}`;
        let file = `${root + path}`;
        [y, m, d].forEach(m => {
            file += '/' + m;
            try {
                fs.mkdirSync(file);
            } catch (e) { }
        });
        fs.writeFile(dirs + name, buff, { flag: 'ax' }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve('/static/upload' + name);
            }
        })
    }).then((url) => {
        ctx.sendJSON({ err: 0, message: 'success', data: { url } });
    }).catch(err => {
        ctx.sendJSON({ err: 500, message: err.message, data: { stack: err.stack } });
    });

}

exports.uploadFile = async function ({ ctx, options, route }) {
    let path = options.static.upload;
    let root = /^\./.test(path) ? (options.root + '/') : '';
    let task = [], data = {};
    Object.values(ctx.FILES()).forEach(o => {
        task.push(new Promise((resolve, reject) => {
            let date = new Date();
            let y = reat(date.getFullYear(), 4);
            let m = reat(date.getMonth() + 1, 2);
            let d = reat(date.getDate(), 2);
            let h = reat(date.getHours(), 2);
            let i = reat(date.getMinutes(), 2);
            let s = reat(date.getSeconds(), 2);
            let v = reat(date.getTime() % 1000, 3);
            let r = reat(parseInt(Math.random() * 1000), 3);
            let ext = /\./.test(o.filename) ? ('.' + o.filename.split('.').pop()) : '';
            let name = `/${y}/${m}/${d}/${(parseInt(h + i + s + v + r)).toString(32)}${ext}`;
            let dirs = `${root + path}`;
            let file = `${root + path}`;
            [y, m, d].forEach(m => {
                file += '/' + m;
                try {
                    fs.mkdirSync(file);
                } catch (e) { }
            });
            fs.writeFile(dirs + name, o.data, { flag: 'ax' }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    data[o.name] = route.expression + name;
                    resolve();
                }
            })
        }));
    });
    return Promise.all(task).then(() => {
        ctx.sendJSON({ err: 0, message: 'success', data });
    }).catch(err => {
        ctx.sendJSON({ err: 500, message: err.message, data: { stack: err.stack } });
    });
};