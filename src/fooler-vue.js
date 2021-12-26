const os = require('os');
const { Fooler } = require('fooler-core')
    , Gzip = require('./middleware/plugs/Gzip')
    , Logger = require('./middleware/plugs/Logger')
    , Component = require('./middleware/plugs/Component')
    , Static = require('./middleware/plugs/Static')
    , Proxy = require('./middleware/plugs/Proxy')
    ;

class FoolerVue {
    constructor(conf = {}) {
        this.service = new Fooler(Object.assign({
            p: 80,              //web服务端口（默认80）
            processes: 1,       //服务进程数,缺省=cpu核数
            proxy: {
                prefix: "/proxy"
            }
        }, conf || {}));
        let { route, options } = this.service;
        route.then(Logger.start)
        if (options.gzip) {
            route.then(Gzip);
        }
        // route.catch(console.error)
        route.finally(Logger.end)
        //代理请求服务
        route.GET(options.proxy.prefix || /^\/proxy/).then(Proxy)
        //静态文件服务
        route.GET(options.static.prefix || /^\/static/).then(Static.sendFile)
        //组件服务
        route.GET(/\.com$/).then(Component.loadComponent)
        route.GET(/^[A-Za-z0-9\/]+$/).then(Component.loadView)
    }

    run() {
        this.service.run();
    }
}

module.exports = FoolerVue;
