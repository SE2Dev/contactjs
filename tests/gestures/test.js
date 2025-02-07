"use strict";
import { PointerListener, Tap, Press, Pan, TwoFingerPan, Pinch, Rotate } from "../../dist/contact.js";

var animationFrameId = null;

var rectangle;
var ticking = false;

var START_X;
var START_Y;

var TAP_ACTIVE = false;
var PRESS_ACTIVE = false;

var PINCHACTIVE = false;
var ROTATIONACTIVE = false;
var TWOFINGERPANACTIVE = false;

var transform = {
  translate: { x: 0, y: 0 },
  scale: {
    x: 1,
    y: 1,
    z: 1
  },
  rotate: {
    x: 0,
    y: 0,
    z: 0,
    angle: 0
  }
};


function loadContact() {

  rectangle = document.getElementById("rectangle");

  START_X = rectangle.getBoundingClientRect().left;
  START_Y = rectangle.getBoundingClientRect().top;

  /*var pinch = new Pinch(rectangle);
  var twoFingerPan = new TwoFingerPan(rectangle);
  pinch.block(twoFingerPan);
  twoFingerPan.block(pinch);*/

  var pointerListener = new PointerListener(rectangle, {
    //"DEBUG" : true, 
    "DEBUG_POINTERMANAGER": true,
    //"DEBUG_GESTURES" : true,
    supportedGestures: [Pan, Tap, Press, TwoFingerPan, Pinch, Rotate],
    //supportedGestures : [TwoFingerPan, Pinch],
    pointerup: function (event, pointerListener) {
      if (pointerListener.pointerManager.hasPointersOnSurface() == false && TAP_ACTIVE == false && PRESS_ACTIVE == false) {
        resetElementTransform();
      }
    }
  });

  rectangle.addEventListener("pan", function (event) {
    //console.log("Current PointerManager");
    console.log(event.detail.pointerManager.activePointerInput);
    onPan(event);
    showOutput(event);
  });

  rectangle.addEventListener("panend", function (event) {

    showOutput(event);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);

    onEnd(event);
  });

  rectangle.addEventListener("swipe", function (event) {
    onPan(event);
    showOutput(event);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);

  });

  rectangle.addEventListener("tap", function (event) {

    TAP_ACTIVE = true;
    onTap(event);

    showOutput(event);

    setTimeout(function () {
      TAP_ACTIVE = false;
    }, 200);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);


  });


  rectangle.addEventListener("press", function (event) {

    PRESS_ACTIVE = true;
    onPress(event);

    showOutput(event);

    setTimeout(function () {
      PRESS_ACTIVE = false;
    }, 200);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);

  });


  rectangle.addEventListener("pinchstart", function (event) {
    PINCHACTIVE = true;
  });

  rectangle.addEventListener("pinch", function (event) {

    console.log("PINCH event data");
    console.log(event.detail.pointerManager.activePointerInput);
    console.log(event);

    onPinch(event);

    showOutput(event);
  });

  rectangle.addEventListener("pinchend", function (event) {

    PINCHACTIVE = false;

    onEnd(event);

    showOutput(event);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);

  });

  // ROTATION
  rectangle.addEventListener("rotatestart", function (event) {
    ROTATIONACTIVE = true;
  });

  rectangle.addEventListener("rotate", function (event) {

    onRotation(event);

    showOutput(event);
  });

  rectangle.addEventListener("rotateend", function (event) {

    ROTATIONACTIVE = false;

    onEnd(event);

    showOutput(event);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);
  });


  // TWOFINGERPAN
  rectangle.addEventListener("twofingerpanstart", function (event) {
    TWOFINGERPANACTIVE = true;
    showOutput(event);
  });


  rectangle.addEventListener("twofingerpan", function (event) {
    onTwoFingerPan(event);
    showOutput(event);
  });

  rectangle.addEventListener("twofingerpanend", function (event) {

    TWOFINGERPANACTIVE = true;

    onEnd(event);

    showOutput(event);

    setTimeout(function () {
      clearOutput(event);
    }, 1000);
  });

}


function onEnd(event) {

  if (TWOFINGERPANACTIVE == false && ROTATIONACTIVE == false) {
    resetElementTransform();
  }
}


function showOutput(event) {

  console.log(event.detail);

  const recognizer = event.detail.recognizer;

  var elementId = event.detail.recognizer.eventBaseName + "-output";

  if (recognizer.eventBaseName == "pan" && recognizer.isSwipe == true){
    elementId = "swipe-output";
  }

  console.log(elementId);

  var outputElement = document.getElementById(elementId);
  if (event.type.indexOf("start") != -1) {
    outputElement.textContent = "start";
  }
  else if (event.type.indexOf("end") != -1) {
    if (recognizer.eventBaseName == "pan" && recognizer.isSwipe == true){
      outputElement.textContent = event.detail.live.direction;
    }
    else {
      outputElement.textContent = "end";
    }
  }
  else if (event.type.indexOf("swipe") != -1) {
    outputElement.textContent = "swipe";
  }
  else {
    outputElement.textContent = "on";
  }
  document.getElementById("deltaX-global").textContent = event.detail.global.deltaX;
  document.getElementById("deltaY-global").textContent = event.detail.global.deltaY;
  document.getElementById("direction-global").textContent = event.detail.global.direction;
  document.getElementById("deltaX-live").textContent = event.detail.live.deltaX;
  document.getElementById("deltaY-live").textContent = event.detail.live.deltaY;
  document.getElementById("direction-live").textContent = event.detail.live.direction;
}

function clearOutput(event) {

  var elementId = event.detail.recognizer.eventBaseName + "-output";

  var outputElement = document.getElementById(elementId);
  outputElement.textContent = "";

  document.getElementById("swipe-output").textContent = "";

}

function resetElementTransform() {

  rectangle.className = "animate";

  transform = {
    translate: {
      x: 0,
      y: 0
    },
    scale: {
      x: 1,
      y: 1,
      z: 1
    },
    rotate: {
      x: 0,
      y: 0,
      z: 0,
      angle: 0
    }
  };

  if (ticking == true) {
    setTimeout(resetElementTransform, 1000 / 60);
  }
  else {
    requestElementUpdate(true);
  }

}

function requestElementUpdate(wait) {

  wait = wait || false;

  var transformValues = [
    "translate3d(" + transform.translate.x + "px, " + transform.translate.y + "px, 0)",
    "scale3d(" + transform.scale.x + ", " + transform.scale.y + ", " + transform.scale.z + ")",
    "rotate3d(" + transform.rotate.x + "," + transform.rotate.y + "," + transform.rotate.z + "," + transform.rotate.angle + "deg)"
  ];

  var transformString = transformValues.join(" ");

  //console.log(transformString);

  if (!ticking) {

    animationFrameId = requestAnimationFrame(function (timestamp) {

      rectangle.style.webkitTransform = transformString;
      rectangle.style.mozTransform = transformString;
      rectangle.style.transform = transformString;

      animationFrameId = null;
      ticking = false;

    });

    ticking = true;
  }

}

function onPan(event) {

  rectangle.className = "";

  var deltaX = event.detail.global.deltaX;
  var deltaY = event.detail.global.deltaY;

  transform.translate = {
    x: deltaX,
    y: deltaY
  };

  requestElementUpdate();


}


function onTwoFingerPan(event) {

  rectangle.className = "";

  var deltaX = event.detail.global.deltaX;
  var deltaY = event.detail.global.deltaY;

  transform.translate = {
    x: deltaX,
    y: deltaY
  };

  requestElementUpdate();

}


function onTap(event) {

  rectangle.className = "animate";

  transform.rotate = {
    x: 1,
    y: 0,
    z: 0,
    angle: 35
  };

  var timeout_id = setTimeout(function () {
    resetElementTransform();
  }, 300);


  requestElementUpdate();
}


function onPress(event) {

}

function onPinch(event) {

  rectangle.className = "";

  var relativeDistanceChange = event.detail.global.scale;

  // touchend has no coordinates
  if (relativeDistanceChange != null) {

    transform.scale = {
      x: relativeDistanceChange,
      y: relativeDistanceChange,
      z: 1
    };

    console.log(transform);

    requestElementUpdate();

  }

}

function onRotation(event) {

  rectangle.className = "";


  transform.rotate = {
    x: 0,
    y: 0,
    z: 1,
    angle: event.detail.global.rotation
  };

  console.log(transform);
  requestElementUpdate();

}


loadContact();
