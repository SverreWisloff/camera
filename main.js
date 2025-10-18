const video = document.getElementById('video');
const videoSelect = document.getElementById('videoSource');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const message = document.getElementById('message');
const mirrorBtn = document.getElementById('mirrorBtn');

let currentStream = null;
let isMirrored = false;

function log(msg){message.textContent = msg}

async function getDevices(){
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d=>d.kind==='videoinput');
    videoSelect.innerHTML = '';
    videoDevices.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Camera ${videoSelect.length+1}`;
      videoSelect.appendChild(opt);
    });
  }catch(err){
    console.error('enumerateDevices error',err);
    log('Could not list devices: ' + err.message);
  }
}

async function start(){
  if(currentStream){ stop(); }
  const constraints = {
    video: { deviceId: videoSelect.value ? { exact: videoSelect.value } : undefined }
  };
  try{
    log('Requesting camera access...');
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    log('');
    await getDevices();
  }catch(err){
    console.error('getUserMedia error',err);
    if(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'){
      log('Camera access denied. Please allow camera permissions.');
    }else{
      log('Error accessing camera: ' + err.message);
    }
  }
}

function stop(){
  if(!currentStream) return;
  currentStream.getTracks().forEach(t=>t.stop());
  video.srcObject = null;
  currentStream = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  log('Stopped');
}

startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
videoSelect.addEventListener('change', ()=>{
  // If currently streaming, restart with new device
  if(currentStream) start();
});

// Initialize: request basic permission to get device labels if available
async function init(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    log('getUserMedia is not supported by this browser.');
    startBtn.disabled = true;
    return;
  }

  try{
    // Try to get a small stream to prompt permissions so labels become available
    const s = await navigator.mediaDevices.getUserMedia({video:true, audio:false});
    s.getTracks().forEach(t=>t.stop());
  }catch(e){
    // ignore: user may deny; enumerateDevices may still list device ids but without labels
  }

  await getDevices();

  // Initialize mirror state from localStorage
  try{
    const saved = localStorage.getItem('camera_mirrored');
    if(saved === '1'){
      setMirror(true);
    }
  }catch(e){
    // ignore localStorage errors
  }
}

function setMirror(state){
  isMirrored = !!state;
  if(isMirrored){
    video.classList.add('mirrored');
    mirrorBtn.classList.add('active');
    mirrorBtn.textContent = 'Unmirror';
  }else{
    video.classList.remove('mirrored');
    mirrorBtn.classList.remove('active');
    mirrorBtn.textContent = 'Mirror';
  }
  try{ localStorage.setItem('camera_mirrored', isMirrored ? '1' : '0'); }catch(e){}
}

mirrorBtn.addEventListener('click', ()=> setMirror(!isMirrored));

init();
