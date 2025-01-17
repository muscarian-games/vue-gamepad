import { App, DirectiveBinding, VNode } from 'vue';
import { DefaultOptions } from './options';
import VueGamepadFactory, { BindingResult } from './gamepad';

function bindErrStr(result: BindingResult) {
  if (result === BindingResult.InvalidArg) return 'missing directive arg (v-gamepad:button)';
  else if (result === BindingResult.InvalidCallback) return 'missing directive callback (v-gamepad:button="callback")';
  return '';
}

export default {
  install(app: App, options?: Partial<VueGamepadOptions>): void {
    // we need basic gamepad api support to work
    if (!('getGamepads' in navigator)) {
      return console.error('vue-gamepad: your browser does not support the Gamepad API!');
    }

    const VueGamepad = VueGamepadFactory({ ...DefaultOptions, ...options });
    const gamepad = new VueGamepad();

    app.config.globalProperties.$gamepad = gamepad;

    // v-gamepad directive
    app.directive('gamepad', {
      // NOTE: since 3.0.0-beta.15, beforeMount in children are called before the parent which breaks our layer stuff
      //       we use mounted now so the layer directive has a chance to bind before this
      mounted(el: any, binding: DirectiveBinding, vnode: VNode) {
        const result = gamepad.validBinding(binding, vnode);
        if (result !== BindingResult.Ok) {
          console.error(`vue-gamepad: '${binding.arg}' was not bound. (${bindErrStr(result)})`);
          return console.log(el);
        }

        // if binding doesn't contain any callback function, use the onClick callback
        const callback = typeof binding.value === 'function' ? binding.value : vnode.props?.onClick;
        gamepad.addListener(binding.arg as string, binding.modifiers, callback, vnode);
      },
      beforeUnmount(_el: any, binding: DirectiveBinding, vnode: VNode) {
        if (gamepad.validBinding(binding, vnode) !== BindingResult.Ok) {
          return;
        }

        const callback = typeof binding.value === 'function' ? binding.value : vnode.props?.onClick;
        gamepad.removeListener(binding.arg as string, binding.modifiers, callback, vnode);
      },
    });

    // v-gamepad-layer directive
    app.directive('gamepad-layer', {
      beforeMount(el: any, binding: DirectiveBinding, vnode: VNode) {
        if (typeof binding.value === 'undefined') {
          console.error(`vue-gamepad: Failed to create layer. (invalid layer value)`);
          return console.log(el);
        }

        gamepad.createLayer(binding.value, vnode);
      },
      // we use unmounted instead of beforeUnmount so that all other directives have a chance to
      // cleanup before the layer is destroyed.
      unmounted(_el: any, binding: DirectiveBinding) {
        if (typeof binding.value === 'undefined') {
          return;
        }

        gamepad.destroyLayer(binding.value);
      },
    });
  },
}