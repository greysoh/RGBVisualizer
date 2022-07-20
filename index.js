let audioCanvas = null; // Canvas elements, gets initialized later
let audioCanvasCtx = null;

let inc = 0; // Used for spread_mv mode

let disabledOpts = false;
let disabledRGBDraw = false;
let disabledFrameDraw = false;

// Options for the audio visualizer
const opts = {
  rgbmode: "spread",
  rgbcolor: "#ffffff",
  pregen: true,
  bakchoice: "solid",
  bakOpts: {
    solid: "#000000",
    photo: "",
  },
  param: ""
};

const eventListeners = [];

document.RGBVolumeApi = {
  getAudioCanvas: () => audioCanvas,
  getAudioCanvasCtx: () => audioCanvasCtx,

  getOpts: () => opts,
  setOpts: (newOpts) => opts = newOpts,

  getAutoOptsToggle: () => autoOpsToggle,
  toggleAutoOpts: () => disabledOpts ? disabledOpts = false : disabledOpts = true,

  getDrawRGBToggle: () => drawRGBToggle,
  toggleDrawRGB: () => disabledRGBDraw ? disabledRGBDraw = false : disabledRGBDraw = true,

  getDrawFrameToggle: () => drawFrameToggle,
  toggleDrawFrame: () => disabledFrameDraw ? disabledFrameDraw = false : disabledFrameDraw = true,

  getEventListeners: () => eventListeners,
  addEventListener: (event, callback) => eventListeners.push({ event, callback }),
};

// Precalculate gradient - blows up the browser if done otherwise
const gradientGenSafe = gradient(
  [255, 0, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 255, 255],
  [0, 0, 255],
  [255, 0, 255],
  [255, 0, 0]
);

/**
 * Returns an RGB gradient
 * @param {number} ratio Float in range of 0 to 1, representing which value to get
 * @returns {number[]} RGB values
 */
function generateRGB(ratio) {
  let gradientGen = [];

  if (opts.pregen) {
    gradientGen = gradientGenSafe;
  } else {
    gradientGen = gradient(
      [255, 0, 0],
      [255, 255, 0],
      [0, 255, 0],
      [0, 255, 255],
      [0, 0, 255],
      [255, 0, 255],
      [255, 0, 0]
    );
  }

  let index = Math.round((ratio * gradientGen.length) / 2);
  let fruitLoopCount = 1;

  while (index > gradientGen.length - 1) {
    if (index - gradientGen.length * fruitLoopCount <= 0) {
      index -= gradientGen.length;
    } else {
      index -= gradientGen.length * fruitLoopCount;
    }

    fruitLoopCount++;
  }

  return gradientGen[index];
}

// Listener for audio events
document.bridgeProxy.audioListener(async function(audioArray) {
  // Check if we should start drawing anything at all
  if (disabledFrameDraw) {
    // Run all event listeners
    for (let i = 0; i < eventListeners.length; i++) {
      if (eventListeners[i].event == "start") {
        try {
          eventListeners[i].callback();
        } catch (e) {
          console.error("Caught exception in event listener: ");
          console.error(e);
  
          alert("Caught exception in event listener: " + e);
  
          // Remove the listener
          eventListeners.splice(i, 1);
        }
      }
    }
    
    return;
  }

  // Clear the canvas and set it to any color or background
  if (opts.bakchoice == "solid") {
    // If solid background, we just set the background color and fillRect().
    audioCanvasCtx.fillStyle = opts.bakOpts.solid;
    audioCanvasCtx.fillRect(0, 0, audioCanvas.width, audioCanvas.height);
  } else if (
    opts.bakchoice == "photo" &&
    typeof opts.bakOpts.photo == "string"
  ) {
    // If photo background, and we only have the URL, we need to load the image and draw it
    const imgPath = opts.bakOpts.photo;

    let background = document.createElement("img");

    background.src = imgPath;

    background.onload = function () {
      opts.bakOpts.photo = background;
      audioCanvasCtx.drawImage(
        background,
        0,
        0,
        audioCanvas.width,
        audioCanvas.height
      );
    };
  } else if (opts.bakchoice == "photo") {
    // If photo background, and we have the image, we just draw it
    audioCanvasCtx.drawImage(
      opts.bakOpts.photo,
      0,
      0,
      audioCanvas.width,
      audioCanvas.height
    );
  }

  // Initialize preload event listeners
  for (let i = 0; i < eventListeners.length; i++) {
    if (eventListeners[i].event == "start") {
      try {
        eventListeners[i].callback();
      } catch (e) {
        console.error("Caught exception in event listener: ");
        console.error(e);

        alert("Caught exception in event listener: " + e);

        // Remove the listener
        eventListeners.splice(i, 1);
      }
    }
  }

  // Check if we should draw the visualizer
  if (toggleDrawRGB) {
    return;
  }

  // Render bars along the full width of the canvas
  const barWidth = Math.round((1.0 / 128.0) * audioCanvas.width);
  const halfCount = audioArray.length / 2;

  // Iterate over the first 64 array elements (0 - 63) for the left channel audio data
  for (let i = 0; i < halfCount; ++i) {
    // Create an audio bar with its hight depending on the audio volume level of the current frequency
    // Gets the current RGB value from the gradient
    let rgb = [];

    // Various modes for the RGB color
    if (opts.rgbmode === "spread") {
      inc = 0;
      rgb = generateRGB(i / 64);
    } else if (opts.rgbmode == "spread_mv") {
      inc += 0.01;
      rgb = generateRGB((i + inc) / 64);
    } else if (opts.rgbmode == "vol") {
      rgb = generateRGB(audioArray[i]);
    } else if (opts.rgbmode == "custom_col") {
      rgb = opts.rgbcolor;
    }

    audioCanvasCtx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

    // Calculate the x, y, and height of the bar
    const height = audioCanvas.height * Math.min(audioArray[i], 1);
    audioCanvasCtx.fillRect(
      barWidth * i,
      audioCanvas.height - height,
      barWidth,
      height
    );
  }

  // Iterate over the last 64 array elements (64 - 127) for the right channel audio data
  for (let i = halfCount; i < audioArray.length; ++i) {
    // Create an audio bar with its height depending on the audio volume level
    // Using audioArray[191 - i] here to inverse the right channel for aesthetics

    // Gets the current RGB value from the gradient
    let rgb = [];

    // Various modes for the RGB color
    if (opts.rgbmode === "spread") {
      inc = 0;
      rgb = generateRGB(i / 64);
    } else if (opts.rgbmode == "spread_mv") {
      inc += 0.01;
      rgb = generateRGB((i + inc) / 64);
    } else if (opts.rgbmode == "vol") {
      rgb = generateRGB(audioArray[191 - i]);
    }

    audioCanvasCtx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

    // Calculate the x, y, and height of the bar
    const height = audioCanvas.height * Math.min(audioArray[191 - i], 1);
    audioCanvasCtx.fillRect(
      barWidth * i,
      audioCanvas.height - height,
      barWidth,
      height
    );

    // Load event listeners
    for (let i = 0; i < eventListeners.length; i++) {
      if (eventListeners[i].event == "finish") {
        try {
          eventListeners[i].callback();
        } catch (e) {
          console.error("Caught exception in event listener: ");
          console.error(e);

          alert("Caught exception in event listener: " + e);

          // Remove the listener
          eventListeners.splice(i, 1);
        }
      }
    }
  }
});

// Register the config provided by the bridge.
document.addEventListener("DOMContentLoaded", () => {
  // Get the audio canvas once the page has loaded
  audioCanvas = document.getElementById("AudioCanvas");
  // Setting internal canvas resolution to user screen resolution
  // (CSS canvas size differs from internal canvas size)
  audioCanvas.height = window.innerHeight;
  audioCanvas.width = window.innerWidth;
  // Get the 2D context of the canvas to draw on it in wallpaperAudioListener
  audioCanvasCtx = audioCanvas.getContext("2d");

  // Add listener for property changes
  document.bridgeProxy.propsListener(function(properties) {
    // If we're disabled, we don't need to do anything
    if (disabledOpts) return;

    if (properties.pregen) {
      // If pregen ever gets disabled, we tell them that this is a bad idea.
      if (
        opts.pregen !== properties.pregen.value &&
        !properties.pregen.value
      ) {
        alert(
          "WARNING: This makes it slow af, and uses lots of CPU.\n\nIf you change your mind, change it back, and reload the wallpaper."
        );
      }

      opts.pregen = properties.pregen.value;
    }

    // RGB color mode - for bar
    if (properties.rgbmode1) {
      opts.rgbmode = properties.rgbmode1.value;
    }

    // RGB color - for bar
    if (properties.rgbcolor) {
      const tempArr = properties.rgbcolor.value.split(" ");

      opts.rgbcolor = [
        Math.min(Math.round(tempArr[0] * 255), 255),
        Math.min(Math.round(tempArr[1] * 255), 255),
        Math.min(Math.round(tempArr[2] * 255), 255),
      ];
    }

    // Background choice - for background
    if (properties.bakchoice) {
      opts.bakchoice = properties.bakchoice.value;
    }

    // Background color - for background
    if (properties.bakcolor) {
      const tempArr = properties.bakcolor.value.split(" ");

      opts.bakOpts.solid = `rgb(${Math.min(
        Math.round(tempArr[0] * 255),
        255
      )}, ${Math.min(Math.round(tempArr[1] * 255), 255)}, ${Math.min(
        Math.round(tempArr[2] * 255),
        255
      )})`;
    }

    // Background photo - for background
    if (properties.photo) {
      opts.bakOpts.photo = properties.photo.value;
    }

    // Evaluate JavaScript - any
    if (properties.eval) {
      const decoded = atob(properties.eval.value);
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

      const func = new AsyncFunction(decoded);
      
      try {
        func();
      } catch (e) {
        alert("Error in eval: " + e);
      }
    }

    // JavaScript Params - any
    if (properties.param) {
      opts.param = properties.param.value;
    }
  })
});