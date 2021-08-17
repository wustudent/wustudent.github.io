function updateTextInput(id,val) {
 console.log(id.replace("slider","val")) ;
  document.getElementById(id.replace("slider","val")).innerText=val; 
  console.log(id,val);
}
function resizeCrop(id,val) {
 if(id=="x"){
   document.getElementById("sub").width=val/2;
   // document.getElementById("slider_w").max=val/2;
 }else if(id=="y"){
   document.getElementById("sub").height=val/2;
   // document.getElementById("slider_h").max=val/2;
 }
}
$(function () {
    var video = $('#src')[0]; 
  
    //canvas for displaying original image
    var ori = $('#ori')[0];
    ori.width=$("body").width();
    ori.height=$("body").height();
    var ctx_ori = ori.getContext('2d');
    window.w_ratio=1;
    window.h_ratio=1;
  
    //canvas for displaying cropped image
    var sub = $('#sub')[0];
    var ctx_sub = sub.getContext('2d');    
  
    
    constraints = {
        video: {
            facingMode:{
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
            stream.onended = function() {
                console.log('Stream ended');
            };
            window.stream = stream; // make variable available to browser console
            video.srcObject = stream;
            video.play();
        })
        .catch(function (err) {
            /* 处理error */
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
        // console.log(video.videoWidth);
        // console.log(video.videoHeight);
        $("#slider_w").prop("max",video.videoWidth);
        $("#slider_w").prop("value",video.videoWidth/2);
        $("#slider_h").prop("max",video.videoHeight);
        $("#slider_h").prop("value",video.videoHeight/2);
        $("#slider_x").prop("max",video.videoWidth/2);
        $("#slider_x").prop("value",video.videoWidth/4);
        $("#slider_y").prop("max",video.videoHeight/2);
        $("#slider_y").prop("value",video.videoHeight/4);
      
      $("#val_w").text($("#slider_w").prop("value"));
      $("#val_h").text($("#slider_h").prop("value"));
      $("#val_x").text($("#slider_x").prop("value"));
      $("#val_y").text($("#slider_y").prop("value"));
      
      sub.width=$("#slider_w").prop("value")/2;
      sub.height=$("#slider_h").prop("value")/2;
      window.w_ratio=ori.width/video.videoWidth;
      window.h_ratio=ori.height/video.videoHeight;
      
    });
    video.addEventListener('canplay', function (ev) {
        timerCallback();
    }, false);

    function computeFrame() {
        ctx_ori.drawImage(video, 0, 0,$("body").width(),$("body").height());
        // let frame=ctx_ori.getImageData(0,0,ori.width,ori.height);
      ctx_sub.clearRect(0, 0, sub.width, sub.height);
      ctx_sub.drawImage(ori, $("#slider_x").val()*window.w_ratio, $("#slider_y").val()*window.h_ratio, ori.width, ori.height, 0, 0, ori.width/2, ori.height/2);
        
      
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
});
