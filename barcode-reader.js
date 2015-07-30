define(['gwtModuleLoader!zxing'], function (Barcode) {

  var lastTick = null;
  var periodMs = 42; // 24fps

  var video = document.querySelector('#barcodeVideo');
  var barcodeCanvas = document.createElement('canvas');
  var context = barcodeCanvas.getContext('2d');

  var width = 0;
  var height = 0;

  var stopped = false;
  var localMediaStream = null;
  var callback = null;

  var start = function(cb) {

    callback = cb;
    stopped = false;

	
	navigator.mediaDevices = navigator.mediaDevices
		|| ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
	   getUserMedia: function(c) {
		 return new Promise(function(y, n) {
		   (navigator.mozGetUserMedia ||
			navigator.webkitGetUserMedia).call(navigator, c, y, n);
		 });
	   }
	} : null);
    
    var constraints = { audio: false, video: true };
    
	navigator.mediaDevices.getUserMedia(constraints)
	.then(function (stream) {
      localMediaStream = stream;
      video.onloadedmetadata = function (e) {

        setTimeout(function() {
          width = video.videoWidth;
          height = video.videoHeight;

          barcodeCanvas.style.width = width + 'px';
          barcodeCanvas.width = width;
          barcodeCanvas.style.height = height + 'px';
          barcodeCanvas.height = height;

          processImage()
        }, 1000);

      };
      video.src = window.URL.createObjectURL(localMediaStream);

    })
    .catch(function (e) {
      console.log('rejected!', e)
    });
  };

  var stop = function() {
  	if (localMediaStream) {
  	  localMediaStream.stop();
    }
    stopped = true;
  };


  var processImage = function () {
    lastTick = performance.now();

    context.drawImage(video, 0, 0);

    var data = context.getImageData(0, 0, width, height);

    var rgbaPixels = data.data;
    var result = Barcode.decode(rgbaPixels, width, height);
    var end = performance.now();
    

    if (result) {
      stop();
      callback("Call to decode took " + (end - lastTick) + " milliseconds.", result);
      return;
    }

    if (stopped) {
      return;
    }

	callback("Call to decode took " + (end - lastTick) + " milliseconds.");

    var timeSinceLastTick = end - lastTick;
    if (timeSinceLastTick >= periodMs) {
      setTimeout(processImage, 0);
    }
    else {
      setTimeout(processImage, periodMs - timeSinceLastTick);
    }
  };


  return {
    start: start,
    stop: stop
  }
});
