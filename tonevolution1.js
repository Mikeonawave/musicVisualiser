/*/////////////////////////
////various variables ////
///////////////////////*/

/*setting up canvas*/
var canvas = document.querySelector("canvas");
var canvasCtx = canvas.getContext('2d')

//XHR and audioAPI:
var url;
var req;
var songBuffer;

//playback only:
var startedAt;
var pausedAt;
var playFrom = 240;
var paused = true;

//interactive elements
var toggle = document.querySelector(".toggle");

//sizes
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
canvas.width = WIDTH - 20;
canvas.height = HEIGHT - 20;

//visualization
var bufferLength;
var dataArray;

/////////////////////////////
/*Initialize audio Context*/
///////////////////////////

// AudioBufferSourceNode created as "soundSourceNode"
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();
var soundSourceNode;


// wiring analyser to speakers
analyser.connect(audioCtx.destination);

/*-------*/
/* XHR  */
/*-----*/
function loadAudioTrack(url) {
	if (url = 'undefined'){
		url = "JesseBru-DreamWarrior(128 kbps).mp3";
	}
	req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.responseType = "arraybuffer";

	// decodeAudioData called asynchronously with success callback f.
	req.onload = function(){
		audioCtx.decodeAudioData(req.response , function(buffer){ //feed req.response in decodeAudioData
			songBuffer = buffer; // songBuffer: to be used in createConnectBuffer() 
		}, this.onDecodeError);
	}
	req.send();
};

/*--------------------*/
/* playback control  */
/*------------------*/

//toggleplayback button centred
toggle.style.top = (HEIGHT / canvas.height) - (toggle.style.height / 2) + 'px';
toggle.style.left = (WIDTH / canvas.width) - (toggle.style.width / 2) + 'px';

function createConnectBuffer() {
	soundSourceNode = audioCtx.createBufferSource();
	soundSourceNode.buffer = songBuffer;
	soundSourceNode.connect(analyser);
}

function play() {
	createConnectBuffer();
	startedAt = audioCtx.currentTime;
	soundSourceNode.start(0, playFrom);
	console.log("playing");
}

function setPausePoint() {
	pausedAt = audioCtx.currentTime;
	playFrom += ( pausedAt - startedAt );
}

//playNote function: unused (for now)
function playNote(hertz) {
	var oscillator = audioCtx.createOscillator();
	oscillator.connect(analyser);
	oscillator.frequency.setValueAtTime(hertz, audioCtx.currentTime)
	oscillator.start();
	// setTimeout(oscillator.stop(), 1000);
};

function togglePlayback() {
	if (paused) {
		play();
		paused = false;
		toggle.innerHTML = "||";
		
	} else {
		paused = true;
		soundSourceNode.stop();
		setPausePoint();
		toggle.innerHTML = ">";
	}
}
	

// window.setTimeout(play, 5000) // for auto-play at 

toggle.onclick = togglePlayback;

document.addEventListener("keydown", (e)=> (e.key === " ") ? togglePlayback() : console.log(e.key));



/*------------------------*/
/* canvas visualization  */
/*----------------------*/

//sets window size for frequency components of fast fourier transform
analyser.fftSize = 2**9; //always 2^x with x < 16
bufferLength = analyser.frequencyBinCount; // number of frequency "slices" 

/*create typed array as 8-bit uns. integer for manipulating buffer content */
dataArray = new Uint8Array(bufferLength);

// tabula rasa:
canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

/*graphic parameters*/
var centerX = canvas.width/2;
var centerY = canvas.height / 2; //dist. from bottom viewport
var x, y;
var rightX;
var leftX;
var bass = 3; //frequency bin that better correlates with "subwoofer"

var sideoffset = 30; //offset from each of the viewport edges
var sliceWidth = (canvas.width/2 - sideoffset*2) / bufferLength;

// var arr400 = [];

function paint(){
	
	canvasCtx.fillStyle = 'rgb(20, 20, 40)';
	canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
	// start plotting frequencies
	canvasCtx.lineWidth = Math.floor(sliceWidth - 1);
	rightX = canvas.width / 2;
	leftX = rightX;
	
	//plot central bass squares
	canvasCtx.save()
	
	canvasCtx.translate(centerX, centerY);
	canvasCtx.lineWidth = 4;
	canvasCtx.strokeStyle = "#a63716";
	
	canvasCtx.rotate((Math.PI / 180) * 45); // rotate
	canvasCtx.rect(0, 0, dataArray[bass], dataArray[bass]);
	canvasCtx.stroke();
	
	canvasCtx.rotate((Math.PI / 180) * 180); // rotate
	canvasCtx.rect(0, 0, dataArray[bass], dataArray[bass]);
	canvasCtx.stroke();
		
	canvasCtx.restore();

	//side "arrows"
	for (var i = 0; i < bufferLength; i++){
		
		//upper right portion 
		canvasCtx.strokeStyle = "rgb(100, " + i*2 + ", 190)";
		canvasCtx.beginPath();
		canvasCtx.moveTo(rightX, centerY);
		// y = dataArray[i] >= 128 ? dataArray[i] - 127 : 0;
		canvasCtx.lineTo(rightX + dataArray[i], centerY - dataArray[i]);
		canvasCtx.lineTo(rightX + dataArray[i] * 2, centerY);
		canvasCtx.stroke();
		 
		//bottom right portion
		canvasCtx.beginPath();
		canvasCtx.moveTo(rightX, centerY);
		canvasCtx.lineTo(rightX + dataArray[i], centerY + dataArray[i]);
		canvasCtx.lineTo(rightX + dataArray[i] * 2, centerY); 
		canvasCtx.stroke();
		
		//upper left portion
		canvasCtx.beginPath();
		canvasCtx.moveTo(leftX, centerY);
		canvasCtx.lineTo(leftX - dataArray[i], centerY - dataArray[i]);
		canvasCtx.lineTo(leftX - dataArray[i] * 2, centerY);
		canvasCtx.stroke();
		
		//bottom left portion
		canvasCtx.beginPath();
		canvasCtx.moveTo(leftX, centerY);
		canvasCtx.lineTo(leftX - dataArray[i], centerY + dataArray[i]);
		canvasCtx.lineTo(leftX - dataArray[i] * 2, centerY);
		canvasCtx.stroke();
		
		//increment line starting point (at every frequency bin)
		rightX += sliceWidth;
		leftX -= sliceWidth;
	}
}

/* ------------------------------
draw(animate(draw)) function 
-------------------------------*/

function draw() {
	drawVisual = requestAnimationFrame(draw);
	
	//copies current waveform in the arg (dataArray)
	analyser.getByteFrequencyData(dataArray); 
	
	paint();

};

loadAudioTrack();
draw();









