lmImagePicker ={};

_imagePicker ={
  optsDefaults: {
    imageDisplay: {
      width: 300,
      height: 230
    },
    classes: {
      btns: 'lm-image-picker-btn-style'
    },
    types: {
      upload: true,
      camera: true,
      byUrl: true
    }
  }
};

_imagePicker.showImage =function(imageUrl) {
  var ele = document.querySelector('img');
  ele.src = imageUrl;
  // if(_imagePicker.opts.onImagePicked) {
  //   _imagePicker.opts.onImagePicked(null, imageUrl);
  // }
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

if(Meteor.isClient) {

  Template.lmImagePicker.created =function() {
    this.inited =false;
    this.currentType = new ReactiveVar(null);
    this.errorByUrl = new ReactiveVar(null);
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
        imageDisplay: _imagePicker.opts.imageDisplay,
        classes: _imagePicker.opts.classes,
        types: _imagePicker.opts.types,
        currentTypes: currentTypes,
        errorByUrl: templateInst.errorByUrl.get()
      };
    }
  });

  Template.lmImagePicker.events({
    'click .lm-image-picker-btn-upload': function(evt, template) {
      template.currentType.set('upload');
      // TODO
    },
    'click .lm-image-picker-btn-camera': function(evt, template) {
      template.currentType.set('camera');
      // Need to set orienation for Android:
      // https://github.com/meteor/mobile-packages/issues/21
      MeteorCamera.getPicture({ correctOrientation: true }, function(err, data) {
        _imagePicker.showImage(data);
      });
    },
    'click .lm-image-picker-btn-by-url': function(evt, template) {
      template.currentType.set('byUrl');
    },
    'change .lm-image-picker-input-by-url, blur .lm-image-picker-input-by-url': function(evt, template) {
      var val =evt.target.value;
      var validate =_imagePicker.isImageExtension(val);
      if( !validate.valid ) {
        template.errorByUrl.set(validate.message);
      }
      else {
        _imagePicker.showImage(val);
      }
    }
  });

}