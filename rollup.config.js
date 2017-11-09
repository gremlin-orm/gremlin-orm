import babel from 'rollup-plugin-babel';
import pkg from './package.json';

// CommonJS (for Node) and ES module (for bundlers) build.
// (We could have three entries in the configuration array
// instead of two, but it's quicker to generate multiple
// builds from a single configuration where possible, using
// the `targets` option which can specify `dest` and `format`)
export default {
  entry: 'src/gremlin-orm.js',
  external: ['gremlin'],
  targets: [
    {
      dest: pkg.main,
      format: 'cjs'
    },
    {
      dest: pkg.module,
      format: 'es'
    }
  ],
  plugins: [
    babel({
      exclude: ['node_modules/**']
    })
  ]
};
