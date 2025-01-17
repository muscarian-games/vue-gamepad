/**
 * Build all nested properties similar to lodash's _.set function
 *
 * set(object, ['x', 'y', 'z'], 'default')
 * console.log(object.x.y.z);
 *  => default
 *
 * @param obj object to build properties for
 * @param keys list of keys to nest
 * @param value value to set
 */
export function set<T>(obj: any, keys: Array<any>, value: any): Array<T> {
  obj[keys[0]] = obj[keys[0]] || {};
  const tmp = obj[keys[0]];

  if (keys.length > 1) {
    keys.shift();
    set(tmp, keys, value);
  } else {
    obj[keys[0]] = value;
  }

  return obj;
}

/**
 * Get value from a nested object similar to lodash's _.get function
 *
 * get({ x: { y: 0 } }, ['x', 'y', 'z'], [])
 * => []
 *
 * @param obj object to get properties from
 * @param keys list of keys to use
 * @param default value if nothing was found
 */
export function get<T>(obj: any, keys: Array<any>, def: any = undefined): Array<T> {
  const tmp = obj[keys[0]];

  if (keys.length > 1 && tmp) {
    keys.shift();
    return get(tmp, keys) || def;
  }

  return tmp || def;
}
