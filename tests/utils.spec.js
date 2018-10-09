import { set, get } from '../lib/utils';

describe('Utils', () => {
  describe('set', () => {
    it('should build the nested object properties', () => {
      const obj = {};
      set(obj, ['x', 'y', 'z'], { key: 'value' });
      expect(obj.x.y.z.key).toEqual('value');
    })
  })

  describe('get', () => {
    it('should return an empty array', () => {
      expect(get({}, ['a', 'b', 'c'], [])).toHaveLength(0);
    })
  })
})