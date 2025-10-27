const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");
const imgInput = document.getElementById("imgInput");
const cropBtn = document.getElementById("cropBtn");
const filterSelect = document.getElementById("filterSelect");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetBtn = document.getElementById("resetBtn");

let img = new Image();
let originalImageData;

let isSelecting = false;
let selectionStart = null, selectionEnd = null;
let selectedRect = null;

// Load image to canvas
imgInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    img.src = evt.target.result;
    img.onload = function() {
      // Resize canvas to image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resetSelection();
    };
  };
  reader.readAsDataURL(file);
});

// Crop logic using mouse
canvas.addEventListener("mousedown", (e) => {
  if (img.src) {
    isSelecting = true;
    const rect = canvas.getBoundingClientRect();
    selectionStart = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    };
    selectionEnd = null;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isSelecting && selectionStart) {
    const rect = canvas.getBoundingClientRect();
    selectionEnd = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    };
    drawImageAndSelection();
  }
});

canvas.addEventListener("mouseup", () => {
  isSelecting = false;
  selectedRect = getRect(selectionStart, selectionEnd);
  drawImageAndSelection();
});

function getRect(start, end) {
  if (!start || !end) return null;
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(start.x - end.x),
    h: Math.abs(start.y - end.y)
  };
}

function drawImageAndSelection() {
  ctx.putImageData(originalImageData, 0, 0);
  if (selectionStart && selectionEnd) {
    const rect = getRect(selectionStart, selectionEnd);
    if (!rect) return;
    ctx.save();
    ctx.strokeStyle = "#34b374";
    ctx.lineWidth = 2;
    ctx.setLineDash([6]);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  } else if (selectedRect) {
    ctx.save();
    ctx.strokeStyle = "#34b374";
    ctx.lineWidth = 2;
    ctx.setLineDash([6]);
    ctx.strokeRect(selectedRect.x, selectedRect.y, selectedRect.w, selectedRect.h);
    ctx.restore();
  }
}

// Crop the selected area
cropBtn.addEventListener("click", () => {
  if (!selectedRect || !img.src) return;
  const { x, y, w, h } = selectedRect;
  const croppedImgData = ctx.getImageData(x, y, w, h);
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(croppedImgData, 0, 0);
  originalImageData = ctx.getImageData(0, 0, w, h);
  resetSelection();
});

// Filters
applyFilterBtn.addEventListener("click", () => {
  if (!img.src) return;
  let filter = filterSelect.value;
  ctx.putImageData(originalImageData, 0, 0);

  switch (filter) {
    case "grayscale":
      applyGrayscale();
      break;
    case "brightness":
      applyBrightness(30);
      break;
    case "contrast":
      applyContrast(40);
      break;
    case "invert":
      applyInvert();
      break;
    case "sepia":
      applySepia();
      break;
    default:
      // No filter
      break;
  }
});

resetBtn.addEventListener("click", () => {
  if (!img.src) return;
  ctx.putImageData(originalImageData, 0, 0);
  resetSelection();
});

// Filter Functions

function applyGrayscale() {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    let avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
    imageData.data[i] = avg;
    imageData.data[i+1] = avg;
    imageData.data[i+2] = avg;
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyBrightness(amount) {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i]   = Math.min(255, imageData.data[i] + amount);
    imageData.data[i+1] = Math.min(255, imageData.data[i+1] + amount);
    imageData.data[i+2] = Math.min(255, imageData.data[i+2] + amount);
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyContrast(amount) {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let factor = (259 * (amount + 255)) / (255 * (259 - amount));
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i]   = truncate(factor * (imageData.data[i] - 128) + 128);
    imageData.data[i+1] = truncate(factor * (imageData.data[i+1] - 128) + 128);
    imageData.data[i+2] = truncate(factor * (imageData.data[i+2] - 128) + 128);
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyInvert() {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i]   = 255 - imageData.data[i];
    imageData.data[i+1] = 255 - imageData.data[i+1];
    imageData.data[i+2] = 255 - imageData.data[i+2];
  }
  ctx.putImageData(imageData, 0, 0);
}

function applySepia() {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    let r = imageData.data[i];
    let g = imageData.data[i+1];
    let b = imageData.data[i+2];
    imageData.data[i]   = truncate(0.393*r + 0.769*g + 0.189*b);
    imageData.data[i+1] = truncate(0.349*r + 0.686*g + 0.168*b);
    imageData.data[i+2] = truncate(0.272*r + 0.534*g + 0.131*b);
  }
  ctx.putImageData(imageData, 0, 0);
}

function truncate(value) {
  return Math.min(255, Math.max(0, value));
}

function resetSelection() {
  isSelecting = false;
  selectionStart = null;
  selectionEnd = null;
  selectedRect = null;
  drawImageAndSelection();
}

