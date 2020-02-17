'use strict';

module.exports = {
   // Currently ESLint requires shared config packages to be prefixed with `eslint-config`
   // to be resolved. Since we re using a shared config in a standards mono-repo, we have
   // to use the full relative file path.
   extends: [ './node_modules/@creativepenguin/standards/eslint/node.js' ],

   overrides: [
      {
         files: [ 'lib/**/*.ts' ],

         rules: {
            'no-new': 'off',
         },
      },
   ],
};
