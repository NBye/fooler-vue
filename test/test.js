const FoolerVue = require('../src/fooler-vue');

const app = new FoolerVue({
    p: 9999,
    root: __dirname,
    proxy: {
        prefix: /^\/proxy/,
    },
    static: {
        "prefix": /^\/static/,
        "static": "./static/",
        "upload": "./upload/",
        "cache": "./cache/",
        "style-key": "style",
        "styles": {
            "icon": {
                "width": 80,
                "height": 80,
                "fill": "cover"
            },
            "small": {
                "width": 240,
                "fill": "contain"
            },
            "normal": {
                "width": 460,
                "fill": "contain"
            },
            "big": {
                "width": 1024,
                "fill": "contain",
                "quality": 0.9
            },
            "large": {
                "width": 2560,
                "fill": "contain"
            },
            "original": {
                "width": 3840,
                "fill": "contain"
            }
        }
    },
    component: {
        "path": "./component",
        "babel": {
            "presets": [
                "@babel/preset-env"
            ]
        },
        "less": true
    },
    gzip: false,
    processes: 1
});


app.run();