/*!
 * vue-gamepad v2.0.0-beta.6
 * (c) 2022 Aaron Kirkham <aaron@kirkh.am>
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.VueGamepad = factory());
}(this, (function () { 'use strict';

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var ButtonNames = [
        'button-a', 'button-b', 'button-x', 'button-y',
        'shoulder-left', 'shoulder-right', 'trigger-left', 'trigger-right',
        'button-select', 'button-start',
        'left-stick-in', 'right-stick-in',
        'button-dpad-up', 'button-dpad-down', 'button-dpad-left', 'button-dpad-right',
        'vendor',
    ];
    var PositiveAxisNames = [
        'left-analog-right', 'left-analog-down',
        'right-analog-right', 'right-analog-down',
    ];
    var NegativeAxisNames = [
        'left-analog-left', 'left-analog-up',
        'right-analog-left', 'right-analog-up',
    ];
    var DefaultOptions = {
        analogThreshold: 0.5,
        buttonNames: ButtonNames,
        buttonInitialTimeout: 200,
        buttonRepeatTimeout: 200,
        injectClasses: true,
        classPrefix: 'v-gamepad',
    };
    function getAxisNameFromValue(axis, value) {
        if (value > 0)
            return PositiveAxisNames[axis];
        return NegativeAxisNames[axis];
    }
    function getAxisNames(axis) {
        return [PositiveAxisNames[axis], NegativeAxisNames[axis]];
    }

    function set(obj, keys, value) {
        obj[keys[0]] = obj[keys[0]] || {};
        var tmp = obj[keys[0]];
        if (keys.length > 1) {
            keys.shift();
            set(tmp, keys, value);
        }
        else {
            obj[keys[0]] = value;
        }
        return obj;
    }
    function get(obj, keys, def) {
        if (def === void 0) { def = undefined; }
        var tmp = obj[keys[0]];
        if (keys.length > 1 && tmp) {
            keys.shift();
            return get(tmp, keys) || def;
        }
        return tmp || def;
    }

    function VueGamepadFactory (options) {
        if (options === void 0) { options = DefaultOptions; }
        return (function () {
            function VueGamepad() {
                var _this = this;
                this.events = {};
                this.holding = {};
                this.currentLayer = '';
                this.prevLayers = {};
                this.vnodeLayers = {};
                var onConnected = function () {
                    document.body.classList.add(options.classPrefix + "-connected");
                    if (typeof options.onGamepadConnected === 'function') {
                        options.onGamepadConnected();
                    }
                };
                window.addEventListener('gamepadconnected', onConnected);
                window.addEventListener('gamepaddisconnected', function () {
                    var gamepads = _this.getGamepads();
                    if (gamepads.length === 0) {
                        document.body.classList.remove(options.classPrefix + "-connected");
                    }
                    if (typeof options.onGamepadDisconnected === 'function') {
                        options.onGamepadDisconnected();
                    }
                });
                var isChrome = Boolean(window.chrome);
                if (isChrome) {
                    var previousNumber_1 = 0;
                    setInterval(function () {
                        var gamepads = navigator.getGamepads();
                        if (gamepads.length !== previousNumber_1) {
                            if (gamepads.length > previousNumber_1) {
                                onConnected();
                            }
                            previousNumber_1 = gamepads.length;
                        }
                    }, 6 * 1000);
                }
                requestAnimationFrame(this.update.bind(this));
            }
            VueGamepad.prototype.getGamepads = function () {
                var gamepads = navigator.getGamepads();
                return __spreadArrays(gamepads).filter(function (pad) { return pad !== null; });
            };
            VueGamepad.prototype.validBinding = function (binding, vnode) {
                var _a;
                if (typeof binding.arg === 'undefined') {
                    return 0;
                }
                var isFunction = typeof binding.value === 'function';
                var hasOnClickCallback = typeof ((_a = vnode.props) === null || _a === void 0 ? void 0 : _a.onClick) === 'function';
                if (!isFunction && !hasOnClickCallback) {
                    return 1;
                }
                return 2;
            };
            VueGamepad.prototype.getVNodeLayer = function (vnode) {
                for (var layer in this.vnodeLayers) {
                    var found = this.vnodeLayers[layer].find(function (vn) { return vn === vnode; });
                    if (found) {
                        return layer;
                    }
                }
                return '';
            };
            VueGamepad.prototype.addListener = function (event, modifiers, callback, vnode) {
                var action = modifiers.released ? 'released' : 'pressed';
                var repeat = !!modifiers.repeat;
                var layer = this.getVNodeLayer(vnode);
                var events = get(this.events, [layer, action, event], []);
                if (events.length === 0) {
                    set(this.events, [layer, action, event], []);
                }
                this.events[layer][action][event].push({ vnode: vnode, repeat: repeat, callback: callback });
                if (options.injectClasses && vnode.el) {
                    vnode.el.classList.add(options.classPrefix, options.classPrefix + "--" + event);
                }
            };
            VueGamepad.prototype.removeListener = function (event, modifiers, callback, vnode) {
                var action = modifiers.released ? 'released' : 'pressed';
                var layer = this.getVNodeLayer(vnode);
                var events = get(this.events, [layer, action, event], []);
                if (events.length === 0) {
                    return;
                }
                events = events.filter(function (e) { return e.callback !== callback; });
                if (events.length > 0) {
                    set(this.events, [layer, action, event], events);
                }
                else {
                    delete this.events[layer][action][event];
                }
            };
            VueGamepad.prototype.createLayer = function (layer, vnode) {
                var _this = this;
                if (typeof this.vnodeLayers[layer] === 'undefined') {
                    this.vnodeLayers[layer] = [];
                }
                if (vnode.dirs) {
                    this.vnodeLayers[layer].push(vnode);
                }
                if (Array.isArray(vnode.children)) {
                    vnode.children.forEach(function (child) { return _this.createLayer(layer, child); });
                }
            };
            VueGamepad.prototype.destroyLayer = function (layer) {
                if (layer === this.currentLayer) {
                    this.currentLayer = this.prevLayers[layer];
                }
                delete this.prevLayers[layer];
                delete this.vnodeLayers[layer];
                delete this.events[layer];
            };
            VueGamepad.prototype.switchToLayer = function (layer) {
                if (layer === void 0) { layer = ''; }
                if (layer === this.currentLayer) {
                    return;
                }
                if (layer !== '') {
                    this.prevLayers[layer] = this.currentLayer;
                }
                this.currentLayer = layer;
            };
            VueGamepad.prototype.switchToDefaultLayer = function () {
                return this.switchToLayer('');
            };
            VueGamepad.prototype.runPressedCallbacks = function (buttonName, gamepad) {
                var events = get(this.events, [this.currentLayer, 'pressed', buttonName], []);
                var firstPress = typeof this.holding[buttonName] === 'undefined';
                var currentTime = Date.now();
                var event = events[events.length - 1];
                if (firstPress || (event && event.repeat && (currentTime - this.holding[buttonName]) >= options.buttonRepeatTimeout)) {
                    this.holding[buttonName] = currentTime;
                    if (firstPress) {
                        this.holding[buttonName] += (options.buttonInitialTimeout - options.buttonRepeatTimeout);
                    }
                    if (event) {
                        event.callback.call(null, { buttonName: buttonName, gamepad: gamepad });
                    }
                }
            };
            VueGamepad.prototype.runReleasedCallbacks = function (buttonName, gamepad) {
                delete this.holding[buttonName];
                var events = get(this.events, [this.currentLayer, 'released', buttonName], []);
                if (events.length > 0) {
                    var event_1 = events[events.length - 1];
                    event_1.callback.call(null, { buttonName: buttonName, gamepad: gamepad });
                }
            };
            VueGamepad.prototype.update = function () {
                var _this = this;
                var gamepads = this.getGamepads();
                gamepads.forEach(function (gamepad) {
                    gamepad.buttons.forEach(function (button, index) {
                        var buttonName = options.buttonNames[index];
                        if (button.pressed) {
                            _this.runPressedCallbacks(buttonName, gamepad);
                        }
                        else if (typeof _this.holding[buttonName] !== 'undefined') {
                            _this.runReleasedCallbacks(buttonName, gamepad);
                        }
                    });
                    gamepad.axes.forEach(function (value, index) {
                        if (value >= options.analogThreshold || value <= -(options.analogThreshold)) {
                            var axisName = getAxisNameFromValue(index, value);
                            _this.runPressedCallbacks(axisName, gamepad);
                        }
                        else {
                            getAxisNames(index)
                                .filter(function (axisName) { return _this.holding[axisName]; })
                                .forEach(function (axisName) { return _this.runReleasedCallbacks(axisName, gamepad); });
                        }
                    });
                });
                requestAnimationFrame(this.update.bind(this));
            };
            return VueGamepad;
        }());
    }

    function bindErrStr(result) {
        if (result === 0)
            return 'missing directive arg (v-gamepad:button)';
        else if (result === 1)
            return 'missing directive callback (v-gamepad:button="callback")';
        return '';
    }
    var index = {
        install: function (app, options) {
            if (!('getGamepads' in navigator)) {
                return console.error('vue-gamepad: your browser does not support the Gamepad API!');
            }
            var VueGamepad = VueGamepadFactory(__assign(__assign({}, DefaultOptions), options));
            var gamepad = new VueGamepad();
            app.config.globalProperties.$gamepad = gamepad;
            app.directive('gamepad', {
                mounted: function (el, binding, vnode) {
                    var _a;
                    var result = gamepad.validBinding(binding, vnode);
                    if (result !== 2) {
                        console.error("vue-gamepad: '" + binding.arg + "' was not bound. (" + bindErrStr(result) + ")");
                        return console.log(el);
                    }
                    var callback = typeof binding.value === 'function' ? binding.value : (_a = vnode.props) === null || _a === void 0 ? void 0 : _a.onClick;
                    gamepad.addListener(binding.arg, binding.modifiers, callback, vnode);
                },
                beforeUnmount: function (_el, binding, vnode) {
                    var _a;
                    if (gamepad.validBinding(binding, vnode) !== 2) {
                        return;
                    }
                    var callback = typeof binding.value === 'function' ? binding.value : (_a = vnode.props) === null || _a === void 0 ? void 0 : _a.onClick;
                    gamepad.removeListener(binding.arg, binding.modifiers, callback, vnode);
                },
            });
            app.directive('gamepad-layer', {
                beforeMount: function (el, binding, vnode) {
                    if (typeof binding.value === 'undefined') {
                        console.error("vue-gamepad: Failed to create layer. (invalid layer value)");
                        return console.log(el);
                    }
                    gamepad.createLayer(binding.value, vnode);
                },
                unmounted: function (_el, binding) {
                    if (typeof binding.value === 'undefined') {
                        return;
                    }
                    gamepad.destroyLayer(binding.value);
                },
            });
        },
    };

    return index;

})));
