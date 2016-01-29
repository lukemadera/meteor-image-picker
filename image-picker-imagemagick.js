Meteor.methods({
  lmImagePickerConvertImage: function(imageData) {
    if(Meteor.isServer) {
      return _imagePicker.convertImage(imageData);
    }
  }
});

if(Meteor.isServer) {
  // var imageMagick = Npm.require("imagemagick");
  var fs = Npm.require('fs');
  var mime =Npm.require('mime');

  _imagePicker.base64ToFile =function(dataString, fileDir) {
    // http://stackoverflow.com/questions/6926016/nodejs-saving-a-base64-encoded-image-to-disk
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var fileData = {};

    if (matches.length !== 3) {
      var errorMsg ='Invalid input string';
      console.error(errorMsg);
      return new Error(errorMsg);
    }

    fileData.type = matches[1];
    fileData.data = new Buffer(matches[2], 'base64');

    // Regular expression for image type:
    // This regular image extracts the "jpeg" from "image/jpeg"
    var imageTypeRegularExpression = /\/(.*?)$/;
    // This variable is actually an array which has 5 values,
    // The [1] value is the real image extension
    var imageTypeDetected = fileData.type.match(imageTypeRegularExpression);
    var ext = imageTypeDetected[1];

    var outputFilePath =fileDir + '/' + (Math.random() + 1).toString(36).substring(7)
     + '.' + ext;

     // Save decoded binary image to disk
    try {
      fs.writeFileSync(outputFilePath, fileData.data);
      return {
        outputFilePath: outputFilePath,
        ext: ext
      };
    }
    catch(error) {
      console.error(error);
      return null;
    }
  };

  _imagePicker.fileToBase64 =function(filePath) {
    var fileData =fs.readFileSync(filePath, { encoding: 'base64' });
    if(!fileData) {
      console.log('Error reading filePath: ', filePath);
      return null;
    }
    var mimeType =mime.lookup(filePath);
    return "data:" + mimeType + ";base64," + fileData.toString('base64');
  };

  _imagePicker.removeFile =function(filePath) {
    fs.unlink(filePath);
  };

  _imagePicker.convertImage =function(imageData) {
    var fileInfo =_imagePicker.base64ToFile(imageData.src, imageData.fileDir);
    if(!fileInfo) {
      return null;
    }
    var filePath =fileInfo.outputFilePath;
    var ext =fileInfo.ext;

    // var outputFilePath =imageData.fileDir + '/' + (Math.random() + 1).toString(36).substring(7)
    //  + '.' + ext;
    var outputFilePathCrop =filePath;
    var outputFilePathResize =outputFilePathCrop;

    // Crop.
    var err;
    err =_imagePicker.crop(imageData, filePath, outputFilePathCrop);
    if(err) {
      return err;
    }
    // Resize.
    err =_imagePicker.resize(imageData, outputFilePathCrop, outputFilePathResize);
    if(err) {
      return err;
    }

    // Convert back to base64 and remove any temp file(s).
    var base64Data =_imagePicker.fileToBase64(outputFilePathResize);
    _imagePicker.removeFile(outputFilePathResize);

    return base64Data;
  };

  _imagePicker.crop =function(imageData, filePath, outputFilePath) {
    //Format: 120x80+30+15
    var geometry = imageData.coords.width + 'x' + imageData.coords.height
     + '+' + imageData.coords.x1 + '+' + imageData.coords.y1;
    var args = [filePath, "-crop", geometry, outputFilePath];
    var err =Imagemagick.convert(args);
    if(err) {
      console.error(err);
      return err;
    }
    return null;
  };

  _imagePicker.resize =function(imageData, filePath, outputFilePath) {
    //Format: 100x200
    var geometry = imageData.resizeMax.width + 'x' + imageData.resizeMax.height + '\>';
    var args = [filePath, "-resize", geometry, '-quality', imageData.quality, outputFilePath];
    var err =Imagemagick.convert(args);
    if(err) {
      console.error(err);
      return err;
    }
    return null;
  };

}