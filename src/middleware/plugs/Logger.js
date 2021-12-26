const IDate = require('../../utils/IDate')

exports.start = async function ({ ctx }) {
    let money = process.memoryUsage()
    ctx.data.total_use_time = Date.now();
    ctx.data.total_use_money = money.heapUsed;
}

exports.end = async function ({ ctx }) {
    let money = process.memoryUsage()
    let total = money.heapTotal;
    let used = money.heapUsed;
    let use = used - ctx.data.total_use_money;
    let avt = (used / total).toFixed(2);
    let timer = Date.now() - ctx.data.total_use_time;
    if (timer < 1000) {
        timer = ' '.repeat(10) + timer + 'ms';
    } else {
        timer = ' '.repeat(10) + (timer / 1000).toFixed(1) + 's';
    }
    timer = timer.substr(timer.length - 4)
    console.log(`${new IDate().format('yyyy-mm-dd hh:ii:ss')} [${ctx.req.method},${ctx.res.statusCode}] use:${timer} ${ctx.req.url} money: ${use}(${avt}%)`);
}