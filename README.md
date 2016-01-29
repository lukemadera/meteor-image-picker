# lukemadera:image-picker

Pick image from camera (capture), file upload or by URL, cross platform (Web, Cordova). Then crop (Jcrop) and resize (ImageMagick) image for nice looking aspect ratios and small filesizes.


## Demo

[Demo](http://lukemadera-packages.meteor.com/image-picker-basic)

[Source](https://github.com/lukemadera/meteor-packages/tree/master/image-picker/basic)


## Dependencies

- mdg:camera
- Jcrop
- ImageMagick


## Installation

## ImageMagick

Install ImageMagick on your server:

http://www.imagemagick.org/script/binary-releases.php

And / or google the operating system you're trying to install on to get
 instructions.

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
      };
      return opts;
    }
  });
}
```
