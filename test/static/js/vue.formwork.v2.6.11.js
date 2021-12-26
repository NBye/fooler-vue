(function (exports) {
	exports.cookie = {};
	exports.cookie.set = function (name, value, timeout, path) {
		if (timeout) {
			var exp = new Date();
			exp.setTime(exp.getTime() + timeout * 1000);
			var expires = ";expires=" + exp.toGMTString();
		} else {
			var expires = '';
		}
		document.cookie = name + "=" + escape(value) + ';path=' + (path || '/') + expires;
	};
	exports.cookie.get = function (name) {
		var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
		if ((arr = document.cookie.match(reg)))
			return unescape(arr[2]);
		else
			return null;
	};
	exports.cookie.del = function (name) {
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		var cval = window.cookie.get(name);
		if (cval !== null) {
			document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
		}
	};


	exports.Proxy = exports.Proxy || function (target, handler) {
		if (typeof target !== 'function') {
			throw new TypeError('Only support function proxy in this polyfill');
		}

		function __Proxy__() {
			if (this instanceof __Proxy__) {
				// 实例化
				var obj;
				if (typeof handler.construct === 'function') {
					obj = handler.construct(target, arguments);
					if (obj && typeof obj === 'object') {
						return obj;
					} else {
						throw new TypeError('Proxy handler\'s construct must return an object');
					}
				} else if (handler.construct == null) {
					obj = target.apply(this, arguments);
					if (obj && typeof obj === 'object') {
						return obj;
					} else {
						return this;
					}
				} else {
					throw new TypeError('Proxy handler\'s construct must be a function');
				}
			} else {
				// 函数调用
				if (typeof handler.apply === 'function') {
					return handler.apply(target, this, arguments);
				} else if (handler.apply == null) {
					return target.apply(this, arguments);
				} else {
					throw new TypeError('Proxy handler\'s apply must be a function');
				}
			}
		}
		Object.setPrototypeOf(__Proxy__, target);   // 复制原对象的[[Prototype]]
		Object.assign(__Proxy__, target);           // 复制原对象的属性
		__Proxy__.prototype = target.prototype;     // 复制原对象的原型
		return __Proxy__;
	};
	exports.Object.assign || (exports.Object.assign = function (obj) {
		for (var i = 1; i < arguments.length; i++) {
			var data = arguments[i];
			for (var k in data) {
				obj[k] = data[k];
			}
		}
		return obj;
	});
	exports.Object.entries || (exports.Object.entries = function (obj) {
		var list = [];
		for (var k in obj) {
			var v = obj[k];
			list.push([k, v]);
		}
		return list;
	});
	exports.Object.keys || (exports.Object.keys = function (obj) {
		var list = [];
		for (var k in obj) {
			list.push(k);
		}
		return list;
	});
	exports.Object.values || (exports.Object.values = function (obj) {
		var list = [];
		for (var k in obj) {
			list.push(obj[k]);
		}
		return list;
	});
	exports.isWeixin = function () {
		var wx = navigator.userAgent.toLowerCase()
		if (/MicroMessenger/i.test(wx)) {
			return true
		} else {
			return false
		}
	};
	var Delay = function (callback, timeout, times) {
		this.id = Delay.id++;
		this.times = times === undefined ? Infinity : (times || 1);
		this.callback = callback;
		this.timeout = timeout || 0;
		this.timer = null;
		this.call = function (args, self) {
			if (this.times > 0) {
				this.times--;
				this.callback.apply(self, args);
			} else {
				delete Delay.delays[this.id];
			}
		}
	}
	Delay.id = 0;
	Delay.delays = {};
	Delay.from = function (callback, timeout, times) {
		var delay = new Delay(callback, timeout, times);
		Delay.delays[delay.id] = delay;
		var func = new Function('//延迟函数\n'
			+ '    var self = this;\n'
			+ '    var args = arguments;'
			+ '    var delay = Delay.delays[' + delay.id + '];\n'
			+ '    if(!delay){return;}\n'
			+ '    clearTimeout(delay.timer);\n'
			+ '    delay.timer=setTimeout(function(){\n'
			+ '        delay.call(args,self);\n'
			+ '    },delay.timeout);\n');
		return func;
	};

	/**
	 * 
	 * @param String type 格式化表达式
	 * @param Number offset_second 偏移时间(秒)
	 */
	Date.prototype.format = function (type, offset_second) {
		if (offset_second) {
			this.setTime(this.getTime() + offset_second * 1000)
		}
		var y = this.getFullYear() + '';
		var m = this.getMonth() + 1;
		m = (m > 9 ? m : ('0' + m));
		var d = this.getDate();
		d = (d > 9 ? d : ('0' + d));
		var h = this.getHours();
		h = (h > 9 ? h : ('0' + h));
		var i = this.getMinutes();
		i = (i > 9 ? i : ('0' + i));
		var s = this.getSeconds();
		s = (s > 9 ? s : ('0' + s));
		var ntype = '';
		while (true) {
			if (/yyyy/.test(type)) {
				ntype = type.replace(/yyyy/g, y);
			} else if (/yy/.test(type)) {
				ntype = type.replace(/yy/g, y.substr(2));
			} else if (/mm/.test(type)) {
				ntype = type.replace(/mm/g, m);
			} else if (/m/.test(type)) {
				ntype = type.replace(/m/g, parseInt(m));
			} else if (/dd/.test(type)) {
				ntype = type.replace(/dd/g, d);
			} else if (/d/.test(type)) {
				ntype = type.replace(/d/g, parseInt(d));
			} else if (/hh/.test(type)) {
				ntype = type.replace(/hh/g, h);
			} else if (/h/.test(type)) {
				ntype = type.replace(/h/g, parseInt(h));
			} else if (/ii/.test(type)) {
				ntype = type.replace(/ii/g, i);
			} else if (/i/.test(type)) {
				ntype = type.replace(/i/g, parseInt(i));
			} else if (/ss/.test(type)) {
				ntype = type.replace(/ss/g, s);
			} else if (/s/.test(type)) {
				ntype = type.replace(/s/g, parseInt(s));
			}
			if (ntype === type) {
				break;
			}
			type = ntype;
		}
		return ntype;
	};
	Date.prototype.past = function (data) {
		var date = data.date;
		var timestamp = data.timestamp;
		var str = data.str;
		if (str) {
			date = new Date(str);
		} else if (timestamp) {
			date = new Date();
			date.setTime(timestamp * 1000);
		} else if (!date) {
			throw new Error('Date.past not find date.');
		}
		var xtimer = parseInt((this.getTime() - date.getTime()) / 1000);
		if (xtimer < 60) {
			return '刚刚';
		} else if (xtimer < 3600) {
			return Math.round(xtimer / 60) + '分钟前';
		} else if (xtimer < 3600 * 24) {
			return Math.round(xtimer / 3600) + '小时前';
		} else if (xtimer < 3600 * 24 * 4) {
			return Math.round(xtimer / (3600 * 24)) + '天前';
		} else {
			return date.format('yyyy-mm-dd');
		}
	}
	var isFunc = function (callback) {
		return typeof callback === 'function';
	};
	var isObject = function (data) {
		return typeof data === 'object' && !Array.isArray(data);
	};
	var foreach = function (data, callback, self) {
		if (!data) {

		} else if (data.length === undefined) {
			for (var k in data) {
				if (callback.call(self, data[k], k) === true) {
					return data[k];
				}
			}
		} else {
			for (var i = 0; i < data.length; i++) {
				if (callback.call(self, data[i], i) === true) {
					return data[i];
				}
			}
		}
	};
	var httpGetTrf = function (dd, kk) {
		var ks = [], kl = 0, vs = [];
		if (isObject(dd)) {
			for (var k in dd) {
				var i = parseInt(k);
				if (isObject(dd[k]) || Array.isArray(dd[k])) {
					foreach(dd[k], httpGetTrf, dd[k]);
				}
				if (/^[0-9]+$/.test(k) && (k[0] !== '0' || k === '0') && ks.indexOf(i) < 0) {
					ks.push(i);
				}
				kl += 1, vs.push(dd[k]);
			}
			ks.sort();
			ks.length === kl && ks[0] === 0 && ks[kl - 1] === kl - 1 && (this[kk] = vs);
		}
	};
	var httpBuildQuery = function (data, p) {
		var querys = [];
		for (var k in data) {
			if (typeof data[k] === 'object') {
				querys.push(httpBuildQuery(data[k], p ? p + '[' + k + ']' : k));
			} else if (typeof data[k] === 'string' || typeof data[k] === 'number') {
				querys.push((p ? p + '[' + k + ']' : k) + '=' + encodeURIComponent(data[k]));
			}
		}
		return querys.join('&');
	};
	var httpBuildUrl = function (url, data) {
		var query = httpBuildQuery(data);
		if (query) {
			return url + (url.indexOf('?') > -1 ? '&' : '?') + httpBuildQuery(data);
		} else {
			return url;
		}
	};
	var httpUrlArgs = function (url) {
		url = url ? url : window.location.href;
		var data = {}, sear = url.split('?')[1] || '';
		foreach(sear ? sear.split('&') : [], function (t) {
			var td = data;
			var ps = t.split('=');
			if (ps[0]) {
				var ks = ps[0].match(/\[([^]]*)\]/g);
				var nm = '[' + ps[0].match(/^[^[]+/)[0] + ']';
				var vs = decodeURIComponent(ps[1]);
				ks ? (ks.unshift(nm)) : (ks = [nm]);
				foreach(ks, function (k, i) {
					k = k.substring(1, k.length - 1);
					td[k] || (td[k] = (i === ks.length - 1) ? vs : {});
					td = td[k];
				});
			}
		});
		foreach(data, httpGetTrf, data);
		return data;
	};
	var storage = function (key, data, version, timeout) {
		if (data === undefined) {
			return storage.get(key, version);
		} else {
			try {
				return storage.set(key, data, version, timeout);
			} catch (e) {
				console.warn(e);
			}
		}
	};
	storage.get = function (key, version) {
		if (storage['v:' + key]) {
			return storage['v:' + key];
		}
		var string = localStorage.getItem(key);
		var data = null;
		try {
			data = (new Function('return ' + string))();
			data = (version === data.version && data.timeout && data.timeout >= (new Date().getTime() / 1000)) ? data.data : undefined;
		} catch (e) {
			data = string;
		}
		storage['v:' + key] = data;
		return data;
	};
	storage.set = function (key, data, version, timeout) {
		if (data === null || data === undefined) {
			localStorage.removeItem(key);
		} else {
			localStorage.setItem(key, JSON.stringify({ data: data, version: version, timeout: parseInt(new Date().getTime() / 1000) + (timeout || 3600 * 24 * 30) }));
		}
		delete storage['v:' + key];
	};
	storage.del = function (key) {
		storage.set(key);
	};
	var request = {
		headers: {
			"Premium-Version": (function () { try { eval('class PremiumVersion{async test(){};async test2(){await this.test()}}'); return true; } catch (err) { return false } })()
		},
		component: function (path, loadeds) {
			return new Promise(function (resolve, reject) {
				var buf = '', xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
				xhr.onreadystatechange = function () {
					if (xhr.readyState === 4) {
						buf += xhr.responseText;
						if (xhr.status === 200) {
							resolve(JSON.parse(buf));
						} else if (xhr.status > 200) {
							reject(new Error(buf))
						}
					}
				};
				xhr.onerror = function (err) {
					reject(err);
				};
				xhr.open('GET', client.host + path + '.com?v=' + Date.now(), true);
				xhr.setRequestHeader("Loadeds", JSON.stringify(loadeds));
				for (var k in request.headers) {
					var v = request.headers[k];
					xhr.setRequestHeader(k, v);
				}
				xhr.send();
			});
		},
		components: function (paths) {
			paths.forEach(function (path, i) {
				paths[i] = request.component(path);
			});
			return Promise.all(paths);
		},
		get: function (url, type, headers) {
			return new Promise(function (resolve, reject) {
				request.ajax(url, null, function (data) {
					if (data.err !== 0) {
						var err = new Error(data.message);
						err.err = data.err;
						reject(err);
					} else {
						resolve(data.data);
					}
				}, type, headers);
			});
		},
		post: function (url, data, type, headers) {
			return new Promise(function (resolve, reject) {
				request.ajax(url, data, function (data) {
					if (data.err !== 0) {
						var err = new Error(data.message);
						err.err = data.err;
						reject(err);
					} else {
						resolve(data.data);
					}
				}, type, headers);
			});
		},
		ajax: function (url, data, callback, type, headers) {
			var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
			var buf = '';
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					buf += xhr.responseText;
					if (xhr.status === 200) {
						try {
							data = (new Function('return ' + buf))();
						} catch (e) {
							data = buf;
						}
						isFunc(callback) && callback(data, xhr);
					} else if (xhr.status >= 400) {
						try {
							data = (new Function('return ' + buf))();
						} catch (e) {
							data = buf;
						}
						isFunc(callback) && callback({ err: 502, message: data.message || ('网络请求失败:' + xhr.status), data: {} }, xhr);
					}
				}
			};
			xhr.onerror = function (e) {
			};
			xhr.open(data ? 'POST' : 'GET', url, true);
			headers = Object.entries(Object.assign({ "origin-href": location.href }, request.headers, headers));
			for (var k in headers) {
				var v = headers[k];
				xhr.setRequestHeader(k, v);
			}
			if (!type || type === 'json') {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				xhr.send(data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null);
			} else {
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.send(data ? httpBuildQuery(data) : null);
			}
		}
	};
	var _require = typeof require == 'function' ? require : new Function('console.error("not require func!")');
	var require = new Proxy(new Function(), {
		set: function (target, key, val, receiver) {
			request.headers[key] = val;
			return Reflect.set(target, key, val, receiver);
		},
		apply: function (target, ctx, args) {
			if (!/^\//.test(args[0])) {
				return _require(args[0]);
			}
			var fucn = new Function();
			fucn.module = args[0] ? args[0].split('.js')[0] : 'Anonymous';
			return new Proxy(fucn, {
				get: function (target, propKey, receiver) {
					return function (args) {
						return new Promise(function (resolve, reject) {
							if (/^\//.test(target.module)) {
								target.module = target.module.substr(1);
							}
							request.ajax('/' + target.module + ':' + propKey, args || {}, function (data) {
								if (data.err !== 0) {
									var error = new Error(data.message);
									error.stack = data.data ? data.data.error : '';
									error.err = data.err;
									reject(error);
								} else {
									resolve(data.data);
								}
							}, 'json');
						});
					}
				},
				construct: function (target, args) {
					return new Proxy({ module: target.module, args: args[0] }, {
						get: function (target, propKey, receiver) {
							return function (args) {
								return new Promise(function (resolve, reject) {
									if (/^\//.test(target.module)) {
										target.module = target.module.substr(1);
									}
									var url = httpBuildUrl('/' + target.module + '.' + propKey, target.args);
									request.ajax(url, args || {}, function (data) {
										if (data.err !== 0) {
											var error = new Error(data.message);
											error.stack = data.data ? data.data.error : '';
											error.err = data.err;
											reject(error);
										} else {
											resolve(data.data);
										}
									}, 'json');
								});
							}
						},
					});
				}
			});
		}
	});
	exports.Object.defaultValue = function (obj, assign) {
		for (var k in obj) {
			assign[k] !== undefined && (obj[k] = assign[k]);
		}
		return obj;
	};
	exports.httpBuildQuery = httpBuildQuery;
	exports.httpUrlArgs = httpUrlArgs;
	exports.httpBuildUrl = httpBuildUrl;
	exports.storage = storage;
	exports.request = request;
	exports.require = require;
	exports.Delay = Delay;
})(window);

(function (Vue) {
	Vue._datax = {};
	Vue._methods = {
		$get: function (url, type, headers) {
			var self = this;
			self.onXhr = true;
			return new Promise(function (resolve, reject) {
				request.ajax(url, null, function (data) {
					self.onXhr = false;
					if (data.err !== 0) {
						var err = new Error(data.message);
						err.err = data.err;
						reject(err);
					} else {
						resolve(data.data);
					}
				}, type, headers);
			});
		},
		$post: function (url, data, type, headers) {
			var self = this;
			self.onXhr = true;
			return new Promise(function (resolve, reject) {
				request.ajax(url, data, function (data) {
					self.onXhr = false;
					if (data.err !== 0) {
						var err = new Error(data.message);
						err.err = data.err;
						reject(err);
					} else {
						resolve(data.data);
					}
				}, type, headers);
			});
		},
		$range: function (n) {
			return new Array(n);
		},
		$height: function () {
			return window.screen.height + 'px';
		},
		$reload: function () {
			var self = this;
			['__beforeMount', '__mounted'].forEach(function (funcname) {
				self[funcname] && self[funcname]();
			});
		},
		$back: function () {
			window.history.back();
		},
		$href: function (url) {
			window.location.hash = url
		},
		$open: function (url) {
			this.$href(url);
		},
		$location: function (url) {
			this.$href(url);
		},
		$safe: function (name, args) {
			var self = this;
			if (!self.safed[name]) {
				self.safed[name] = true;
				self[name](args, function () {
					delete self.safed[name];
				});
			}
		}
	};
	var defined = {};
	function downloadComponent(initcom, callback) {
		request.component(initcom, Object.keys(defined)).then(function (coms) {
			Object.entries(coms).forEach(function (one) {
				var name = one[0], com = one[1];
				defined[name] = true;
				name = name.substring(1).replace(/\//g, '-');
				var initdat = { safed: {}, browser: com.browser };
				var methods = Object.assign({}, Vue._methods);
				var exports = (new Function('var exports={__data:{}};\nvar module={exports:exports}\n' + com.code
					+ '\nreturn module.exports;'))();
				var keys = [];
				if (typeof exports == 'function') {
					exports = new exports();
					let proto = exports;
					while (proto && proto.constructor.name != 'Object') {
						Object.getOwnPropertyNames(proto).forEach(function (key) {
							if (!/^__.+__$/.test(key) && keys.indexOf(key) < 0) {
								keys.push(key);
							}
						});
						proto = proto.__proto__;
					}
				} else {
					keys = Object.keys(exports);
				}
				keys.forEach(function (key) {
					var val = exports[key];
					if (key == 'constructor') {
						//构造器过
					} else if (typeof val == 'function') {
						methods[key] = val;
					} else if (key == '__data') {
						Object.assign(initdat, val);
					} else if (!/^__/.test(key)) {
						initdat[key] = val;
					}
				});
				//初始化组件
				Vue.component(name, {
					props: exports.__props || [],
					template: com.html,
					data: new Function('return Object.assign({datax:Vue._datax},' + JSON.stringify(initdat) + ');'),
					methods: methods,
					watch: exports.__watch || {},
					computed: exports.__computed || {},
					created: function () {
						try {
							this.__beforeCreate && this.__beforeCreate();
							this.__created && this.__created();
						} catch (err) { this.$onerror && this.$onerror(err) }
					},
					beforeMount: function () {
						try {
							if (this.browser && typeof this.browser.title === 'string') {
								document.title = this.browser.title;
							}
							this.__beforeMount && this.__beforeMount();
						} catch (err) { this.$onerror && this.$onerror(err) }
					},
					mounted: function () {
						try {
							this.__mounted && this.__mounted();
						} catch (err) { this.$onerror && this.$onerror(err) }
					},
					beforeUpdate: function () {
						try {
							this.__beforeUpdate && this.__beforeUpdate();
						} catch (err) { this.$onerror && this.$onerror(err) }
					},
					updated: function () {
						try {
							this.__updated && this.__updated();
						} catch (err) { this.$onerror && this.$onerror(err) }
					},
					beforeDestroy: function () {
						try {
							this.__beforeDestroy && this.__beforeDestroy();
						} catch (err) { this.$onerror && this.$onerror(err) }
					},
					destroyed: function () {
						try {
							this.$el && this.$el.remove();
							this.__destroyed && this.__destroyed();
						} catch (err) { this.$onerror && this.$onerror(err) }
					}
				});
				//初始化样式
				if (com.css) {
					var style = document.createElement('style');
					style.innerHTML = com.css;
					document.head.appendChild(style);
				}
			});
			callback('ok');
		}).catch(function (err) {
			console.error(err);
			//callback('er');
		});
	};

	Vue.defined = function (name, callback) {
		if (defined[name]) {
			callback('ed');
		} else {
			downloadComponent(name, callback);
		}
	};
	window.onload = function () {
		var initcom = location.pathname[location.pathname.length - 1] == '/' ? location.pathname.slice(0, -1) : location.pathname;
		initcom || (initcom = '/index');
		Vue.defined(initcom, function (p) {
			var ininame = initcom.substring(1).replace(/\//g, '-');
			var el = document.createElement('div');
			el.className = 'com-root';
			el.innerHTML = '<' + ininame + '></' + ininame + '>';
			document.body.appendChild(el);
			Vue.$root = new Vue({ el: el });
		});
	}
})(Vue);