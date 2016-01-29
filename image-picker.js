lmImagePicker ={};

_imagePicker ={
  opts: {},
  optsDefaults: {
    classes: {
      btns: 'lm-image-picker-btn-style',
      image: '',
      imageConverted: '',
      imageCont: ''
    },
    types: {
      upload: true,
      camera: true,
      byUrl: true
    },
    JcropOpts: {
      aspectRatio: 1,
      minSize: [ 100, 100 ],
      // Can not set max if display size is different than actual.
      // maxSize: [ 800, 800 ]
    },
    resizeMax: {
      width: 800,
      height: 800
    },
    // fileDir: '/'
    fileDir: '/Users/lukemadera/Downloads',
    quality: '75'
  },
  Jcrop: null,
  imgDisplayData: { }
};

_imagePicker.saveImage =function(templateInst) {
  var imageData = templateInst.imageData.get();
  Meteor.call("lmImagePickerConvertImage", imageData, function(err, base64Data) {
    if(_imagePicker.opts.onImageSaved) {
      _imagePicker.opts.onImageSaved(null, base64Data);
    }
    _imagePicker.resetImage(templateInst);
  });
};

_imagePicker.showImage =function(templateInst, imageUrl) {
  var imageData =templateInst.imageData.get();
  if( imageData.src !== imageUrl ) {
    var ids =_imagePicker.formIds(templateInst);

    // Need to load a SECOND image that has NO set height and width
    // to get the ACTUAL image dimensions.
    var imgEleDimensions = document.getElementById(ids.imageDimensions);
    imgEleDimensions.onload = function() {
      _imagePicker.imgDisplayData.actualWidth =imgEleDimensions.width;
      _imagePicker.imgDisplayData.actualHeight =imgEleDimensions.height;

      templateInst.imageData.set({
        src: imageUrl,
        resizeMax: _imagePicker.opts.resizeMax,
        fileDir: _imagePicker.opts.fileDir,
        quality: _imagePicker.opts.quality,
        dimenions: {
          width: imgEleDimensions.width,
          height: imgEleDimensions.height
        },
        coords: {
          x1: 0,
          x2: imgEleDimensions.width,
          y1: 0,
          y2: imgEleDimensions.height,
          width: imgEleDimensions.width,
          height: imgEleDimensions.height
        }
      });
    };
    imgEleDimensions.src =imageUrl;

    // Can not initialize jcrop until image has loaded.
    var imgEle = document.getElementById(ids.image);
    imgEle.onload = function() {
      _imagePicker.imgDisplayData.displayHeight =imgEle.height;
      _imagePicker.imgDisplayData.displayWidth =imgEle.width;
      _imagePicker.initJcrop(templateInst, '#'+ids.image);
    };
    imgEle.src =imageUrl;
  }
};

_imagePicker.removeImage =function(templateInst) {
  templateInst.imageData.set({
    src: null
  });
  var ids =_imagePicker.formIds(templateInst);
  var imgEle = document.getElementById(ids.image);
  imgEle.src ='';
  // Reset styles (that jcrop added?).
  imgEle.style.width ='100%';
  imgEle.style.height ='auto';
  var imgEleDimensions = document.getElementById(ids.imageDimensions);
  imgEleDimensions.src ='';
  if( _imagePicker.Jcrop ) {
    _imagePicker.Jcrop.destroy();
  }
};

_imagePicker.initJcrop =function(templateInst, imageSelector) {
  var showCoords =function(coords) {
    var imageData = templateInst.imageData.get();
    imageData.coords =_imagePicker.getAdjustedCropCoords(coords);
    templateInst.imageData.set(imageData);
  };

  var JcropOpts =_imagePicker.opts.JcropOpts;
  JcropOpts.onSelect = showCoords;

  $(imageSelector).Jcrop(JcropOpts, function() {
    _imagePicker.Jcrop =this;
  });
};

// The displayed image may have "width 100%" or a set width or height
// so the crop coordinates will be relative to the display size, not the
// ACTUAL size. So we need to adjust them to the actual size.
_imagePicker.getAdjustedCropCoords = function(coords) {
  var xRatio = _imagePicker.imgDisplayData.actualWidth /
   _imagePicker.imgDisplayData.displayWidth;
  var yRatio = _imagePicker.imgDisplayData.actualHeight /
   _imagePicker.imgDisplayData.displayHeight;
  var adjustedCoords ={
    x1: Math.round( coords.x * xRatio ),
    x2: Math.round( coords.x2 * xRatio ),
    y1: Math.round( coords.y * yRatio ),
    y2: Math.round( coords.y2 * yRatio ),
    width: Math.round( coords.w * xRatio ),
    height: Math.round( coords.h * yRatio )
  };
  return adjustedCoords;
};

/**
https://github.com/SaneMethod/HUp/blob/master/hup.js#L307

Convenience function for the reassembly of a file read in chunks as a data
 url, and returns a single dataURL base64 encoded string.
*/
_imagePicker.reassembleChunkedDataURL =function(parts) {
  var dataURL;

  dataURL = parts[0];
  for (var i=1, len=parts.length; i < len; i++) {
    dataURL += parts[i].split(',')[1];
  }
  return dataURL;
};

/**
http://artandlogic.com/2015/12/filereader-chunking-and-base64-dataurls/

Calculate what the value of this.end should be when the file read is chunked, as special handling is needed
when we're using the 'readAsDataURL' read_method to align reads on multiples of 6, as a result of how base64
encoding works (that is, each character encodes 6 bits of information - if we fail to align the chunks with a
multiple of 6, the base64 beyond the first chunk will end up represented in a way that cannot be trivially
combined with the initial chunk).
*/
_imagePicker.calculateChunkEnd = function(start, chunkSize, fileSize) {
  var end = Math.min( ( start + chunkSize ), fileSize);
  if (end !== fileSize) {
    end -= end % 6;
  }
  return end;
};


/**
http://stackoverflow.com/questions/24647563/reading-line-by-line-file-in-javascript-on-client-side
http://dojo4.com/blog/processing-huge-files-with-an-html5-file-input
*/
_imagePicker.readFileChunksToBase64 =function(file, fileType, callback) {
  // var reader = new FileReader();
  
  var reader;
  var fileSize = file.size;
  var chunkSize = 100 * 1024;   // 100 kb
  var base64Chunks =[];
  // var offset = 0;
  var start =0;
  var end;
  var blob, chunk;
  
  var saveChunk = function(evt) {
    if (evt.target.error) {
      console.error(evt.target.error);
    }
    else {
      base64Chunks.push(evt.target.result);
    }
    if( end < fileSize ) {
      start =end;
      readChunk(file);
    }
    else {
      console.info('~' + ( base64Chunks.length / 10 ) + 'MB - ' + base64Chunks.length + ' (100 kb) chunks');
      var content =_imagePicker.reassembleChunkedDataURL(base64Chunks);
      callback(content);
    }
  };

  var readChunk = function (file) {
    end = ( ( start + chunkSize ) >= fileSize ) ? fileSize : ( start + chunkSize );
    end =_imagePicker.calculateChunkEnd(start, chunkSize, fileSize);
    blob = file.slice(start, end, fileType);
    reader = new FileReader();
    reader.onload =saveChunk;
    reader.readAsDataURL(blob);
  };

  readChunk(file);
};

/**
http://stackoverflow.com/questions/26733070/cordova-capture-video-and-retrieve-base64-data
*/
_imagePicker.fileToDataUrl =function(file, callback) {

  file = new window.File(file.name, file.localURL, file.type,
   file.lastModifiedDate, file.size);
  
  // Need to read in chunks to prevent crash for big files.
  // var reader = new FileReader();
  // reader.onload = function (readerEvt) {
  //   callback(readerEvt.target.result);
  // };
  // reader.readAsDataURL(file);

  _imagePicker.readFileChunksToBase64(file, file.type, callback);
};

_imagePicker.fileUrlToBase64 =function(fileUrl, callback) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function() {
    var reader  = new FileReader();
    reader.onloadend = function () {
      callback(null, reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', fileUrl);
  xhr.send();
};

_imagePicker.isImageExtension =function(src) {
  var ret ={
    valid: true,
    message: ''
  };
  if(src) {
    var allowed =['jpg', 'jpeg', 'png', 'gif'];
    var ii, match =false, regEx;
    for(ii =0; ii < allowed.length; ii++) {
      regEx =new RegExp("." + allowed[ii] + "$");
      if( regEx.test(src) ) {
        match =true;
        break;
      }
    }
    if(!match) {
      ret.valid = false;
      ret.message = "jpg, .jpeg, .png, .gif files only please";
    }
  }
  return ret;
};

_imagePicker.init =function(templateInst) {
  _imagePicker.opts =templateInst.data && templateInst.data.opts || {};
  var key;
  for(key in _imagePicker.optsDefaults) {
    if(_imagePicker.opts[key] === undefined) {
      _imagePicker.opts[key] =_imagePicker.optsDefaults[key];
    }
  }

  if(!templateInst.inited) {
    templateInst.inited =true;
  }
};

_imagePicker.formIds =function(templateInst) {
  var instId = templateInst.instId.get();
  return {
    image: instId + 'Image',
    imageDimensions: instId + 'ImageDimensions',
    imageConverted: instId + 'ImageConverted'
  };
};

_imagePicker.resetImage =function(templateInst) {
  templateInst.currentType.set(null);
  templateInst.errorByUrl.set(null);
  templateInst.errorUpload.set(null);
  _imagePicker.removeImage(templateInst);
};

if(Meteor.isClient) {

  Template.lmImagePicker.created =function() {
    this.inited =false;
    this.currentType = new ReactiveVar(null);
    this.errorByUrl = new ReactiveVar(null);
    this.errorUpload = new ReactiveVar(null);
    this.imageData = new ReactiveVar({
      src: null
    });
    this.instId = new ReactiveVar((Math.random() + 1).toString(36).substring(7));
  };

  Template.lmImagePicker.helpers({
    data: function() {
      var templateInst =Template.instance();
      _imagePicker.init(templateInst);
      var currentType = templateInst.currentType.get();
      var currentTypes ={
        upload: ( currentType === 'upload' ) ? true : false,
        camera: ( currentType === 'camera' ) ? true : false,
        byUrl: ( currentType === 'byUrl' ) ? true : false,
      };
      return {
        ids: _imagePicker.formIds(templateInst),
        imageDisplay: _imagePicker.opts.imageDisplay,
        classes: _imagePicker.opts.classes,
        types: _imagePicker.opts.types,
        currentTypes: currentTypes,
        errorByUrl: templateInst.errorByUrl.get(),
        showUploadInput: ( currentTypes.upload && !Meteor.isCordova ) ?
         true : false,
        errorUpload: templateInst.errorUpload.get(),
        imageData: templateInst.imageData.get()
      };
    }
  });

  Template.lmImagePicker.events({
    'click .lm-image-picker-btn-upload': function(evt, template) {
      var templateInst =template;
      _imagePicker.removeImage(templateInst);
      template.currentType.set('upload');
      if( Meteor.isCordova ) {
        var picOpts ={
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        };
        MeteorCamera.getPicture(picOpts, function(err, data) {
          _imagePicker.showImage(templateInst, data);
        });
      }
    },
    // Need to clear image otherwise it will not change on new selection.
    'focus .lm-image-picker-input-upload': function(evt, template) {
      _imagePicker.removeImage(template);
    },
    // 'change .lm-image-picker-input-upload, blur .lm-image-picker-input-upload': function(evt, template) {
    'change .lm-image-picker-input-upload': function(evt, template) {
      var templateInst =template;
      var val =evt.target.value;
      var validate =_imagePicker.isImageExtension(val);
      if( !validate.valid ) {
        template.errorUpload.set(validate.message);
      }
      else {
        var file =evt.target.files[0];
        _imagePicker.readFileChunksToBase64(file, file.type, function(data) {
          _imagePicker.showImage(templateInst, data);
        });
      }
    },
    'click .lm-image-picker-btn-camera': function(evt, template) {
      var templateInst =template;
      _imagePicker.removeImage(templateInst);
      template.currentType.set('camera');
      // Need to set orienation for Android:
      // https://github.com/meteor/mobile-packages/issues/21
      MeteorCamera.getPicture({ correctOrientation: true }, function(err, data) {
        _imagePicker.showImage(templateInst, data);
      });
    },
    'click .lm-image-picker-btn-by-url': function(evt, template) {
      _imagePicker.removeImage(template);
      template.currentType.set('byUrl');
    },
    // Need to clear image otherwise it will not change on new selection.
    'focus .lm-image-picker-input-by-url': function(evt, template) {
      _imagePicker.removeImage(template);
    },
    'change .lm-image-picker-input-by-url, blur .lm-image-picker-input-by-url': function(evt, template) {
      var templateInst =template;
      var val =evt.target.value;
      var validate =_imagePicker.isImageExtension(val);
      if( !validate.valid ) {
        template.errorByUrl.set(validate.message);
      }
      else {
        _imagePicker.fileUrlToBase64(val, function(err, data) {
          _imagePicker.showImage(templateInst, data);
        });
      }
    },
    'click .lm-image-picker-image-save-btn': function(evt, template) {
      _imagePicker.saveImage(template);
    }
  });

}