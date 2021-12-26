const zlib = require("zlib");
module.exports = async function ({ ctx }) {
    const send = ctx.send;
    ctx.send = function ({ text, status = 200, headers = {} }) {
        if (/gzip/.test(ctx.req.headers["accept-encoding"])) {
            headers['content-encoding'] = 'gzip';
            ctx.res.writeHead(status, headers);
            ctx.completed = true;
            let output = zlib.createGzip();
            output.pipe(ctx.res);
            output.write(text, () => {
                output.end();
            });
        } else {
            send.call(ctx, { text, status, headers });
        }
    }
}