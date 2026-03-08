"use strict";

function updateTextInput(id, val) {
    console.log(id.replace("slider", "val"));
    document.getElementById(id.replace("slider", "val")).innerText = val;
    console.log(id, val);
}

function resizeCrop(id, val) {
    if (id == "slider_w") {
        document.getElementById("sub").width = val / 2;
    } else if (id == "slider_h") {
        document.getElementById("sub").height = val / 2;
    }
}

function resetSlidersAndCanvas() {
    document.getElementById("slider_w").max = window.videoWidth;
    document.getElementById("slider_w").value = window.videoWidth / 2;
    document.getElementById("slider_h").max = window.videoHeight;
    document.getElementById("slider_h").value = window.videoHeight / 2;
    document.getElementById("slider_x").max = window.videoWidth / 2;
    document.getElementById("slider_x").value = window.videoWidth / 4;
    document.getElementById("slider_y").max = window.videoHeight / 2;
    document.getElementById("slider_y").value = window.videoHeight / 4;

    document.getElementById("val_w").innerText = document.getElementById("slider_w").value;
    document.getElementById("val_h").innerText = document.getElementById("slider_h").value;
    document.getElementById("val_x").innerText = document.getElementById("slider_x").value;
    document.getElementById("val_y").innerText = document.getElementById("slider_y").value;

    sub.width = document.getElementById("slider_w").value / 2;
    sub.height = document.getElementById("slider_h").value / 2;
    window.w_ratio = ori.width / window.videoWidth;
    window.h_ratio = ori.height / window.videoHeight;
}

function computeFrame() {
    ctx_ori.drawImage(video, 0, 0, document.body.clientWidth, document.body.clientHeight);
    ctx_sub.clearRect(0, 0, sub.width, sub.height);
    ctx_sub.drawImage(ori, document.getElementById("slider_x").value * window.w_ratio, document.getElementById("slider_y").value * window.h_ratio, ori.width, ori.height, 0, 0, ori.width / 2, ori.height / 2);
}

function timerCallback() {
    if (video.paused || video.ended) {
        return;
    }
    computeFrame();
    setTimeout(function () {
        timerCallback();
    }, 0);
}

var video = document.getElementById("src");

//canvas for displaying original image
var ori = document.getElementById("ori");
ori.width = document.body.clientWidth;
ori.height = document.body.clientHeight;
var ctx_ori = ori.getContext('2d');

// global variables
window.w_ratio = 1;
window.h_ratio = 1;
window.videoHeight = 480;
window.videoWidth = 640;
window.angle = 270;

//canvas for displaying cropped image
var sub = document.getElementById("sub");
var ctx_sub = sub.getContext('2d');


let constraints = {
    video: {
        facingMode: {
            /* "environment" for rear camera, "user for front camera" */
            ideal:"environment"
        }
    },
    audio: false
};

navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
        var videoTracks = stream.getVideoTracks();
        console.log('Got stream with constraints:', constraints);
        console.log('Using video device: ' + videoTracks[0].label);
        stream.onended = function () {
            console.log('Stream ended');
        };
        window.stream = stream; // make variable available to browser console
        video.srcObject = stream;
        video.play();
    })
    .catch(function (err) {
        if (error.name === 'ConstraintNotSatisfiedError') {
            console.log('The resolution ' + constraints.video.width.exact + 'x' +
                constraints.video.width.exact + ' px is not supported by your device.');
        } else if (error.name === 'PermissionDeniedError') {
            console.log('Permissions have not been granted to use your camera and ' +
                'microphone, you need to allow the page access to your devices in ' +
                'order for the demo to work.');
        }
        console.log('getUserMedia error: ' + error.name, error);
    });

video.addEventListener("playing", () => {
    if ((window.angle / 90) % 2 != 0) {
        window.videoWidth = Math.max(video.videoHeight, video.videoWidth);
        window.videoHeight = Math.min(video.videoHeight, video.videoWidth);
    } else {
        window.videoWidth = Math.min(video.videoHeight, video.videoWidth);
        window.videoHeight = Math.max(video.videoHeight, video.videoWidth);

    }
    resetSlidersAndCanvas();
});

video.addEventListener('canplay', function (ev) {
    timerCallback();
}, false);

window.addEventListener('resize', function (event) {
    ori.width = document.body.clientWidth;
    ori.height = document.body.clientHeight;
    window.w_ratio = ori.width / window.videoWidth;
    window.h_ratio = ori.height / window.videoHeight;
}, true);

window.addEventListener("orientationchange", function () {
    console.log("the orientation of the device is now " + screen.orientation.angle);
    window.angle = screen.orientation.angle;
    if ((window.angle / 90) % 2 != 0) {
        window.videoWidth = Math.max(video.videoHeight, video.videoWidth);
        window.videoHeight = Math.min(video.videoHeight, video.videoWidth);
    } else {
        window.videoWidth = Math.min(video.videoHeight, video.videoWidth);
        window.videoHeight = Math.max(video.videoHeight, video.videoWidth);
    }
    resetSlidersAndCanvas();
});

let sliders=document.getElementsByTagName('input');
for(let slider of sliders){
  slider.addEventListener('change',function(){
    updateTextInput(slider.id,slider.value);
    if(slider.id=="slider_w" || slider.id=="slider_h"){
      resizeCrop(slider.id,slider.value);
    }
  },true);
}
