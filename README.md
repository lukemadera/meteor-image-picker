# lukemadera:image-picker

Pick image from camera (capture), file upload or by URL, cross platform (Web, Cordova). Then crop (Jcrop) and resize (ImageMagick) image for nice looking aspect ratios and small filesizes.


## Demo

[Demo](http://lukemadera-packages.meteor.com/image-picker-basic)

[Source](https://github.com/lukemadera/meteor-packages/tree/master/image-picker/basic)


## Dependencies

- mdg:camera
- Jcrop
- ImageMagick / classcraft:imagemagick


## Installation

## ImageMagick

Install ImageMagick on your server:

http://www.imagemagick.org/script/binary-releases.php

And / or google the operating system you're trying to install on to get
 instructions.

NOTE: you can NOT install ImageMagick on the free meteor hosting so this will
 NOT work here.

Check if it is installed by typing: `convert` on the command line.


In a Meteor app directory:
```bash
meteor add lukemadera:image-picker
```


## Usage

```html
{{> lmImagePicker opts=opts}}
```

```js
if(Meteor.isClient) {
  Template.imagePickerBasic.helpers({
    opts: function() {
      var opts ={
        // classes: {
        //   btns: 'lm-image-picker-btn-style',
        //   image: '',
        //   imageConverted: '',
        //   imageCont: ''
        // },
        // types: {
        //   upload: true,
        //   camera: true,
        //   byUrl: true
        // },
        // JcropOpts: {
        //   aspectRatio: 1,
        //   minSize: [ 100, 100 ]
        // },
        // resizeMax: {
        //   width: 800,
        //   height: 800
        // },
        // fileDir: '',
        // quality: '75',
        onImageSaved: function(err, base64Data) {
          console.log(err, base64Data);
        }
      };
      return opts;
    }
  });
}
```

Then do whatever you want (e.g. save to Amazon S3) with the `base64Data` that is returned in the `onImageSaved` callback.
