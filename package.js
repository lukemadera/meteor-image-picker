Package.describe({
  name: 'lukemadera:image-picker',
  version: '0.0.1',
  summary: 'Image crop & resize from camera (capture), file upload or by URL, cross platform (Web, Cordova)',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/lukemadera/meteor-image-picker',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');

  api.use('templating@1.0.0');
  api.use('blaze@2.0.0');
  api.use('reactive-var@1.0.5');
  api.use('mdg:camera@1.2.0');

  api.addFiles([
    'image-picker.html',
    'image-picker.css',
  ], 'client');
  api.addFiles([
    'image-picker.js'
  ]);

  api.export('lmImagePicker');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('lukemadera:image-picker');
  api.addFiles('image-picker-tests.js');
});
