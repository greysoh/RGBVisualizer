"use strict";

// Bridges various live wallpaper APIs into a single interface.

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lively moment.
const map = {
  "rgbmode1": ["spread", "spread_mv", "vol", "custom_col"],
  "bakchoice": ["solid", "photo"]
}

document.bridgeProxy = {
  getPlatform() {
    if (window.wallpaperRegisterAudioListener) {
      return "WallpaperEngine";
    } else {
      return "Lively";
    }
  },

  async propsListener(callback) {
    const platform = this.getPlatform();

    if (platform === "WallpaperEngine") {
      window.wallpaperPropertyListener = {
        applyUserProperties: callback,
      };
    } else if (platform === "Lively") {
      let data = {};

      window.livelyPropertyListener = function (name, oldVal) {
        let val = oldVal;

        if (val.toString().startsWith("#")) {
          val = val.toString().substring(1);

          val = val.match(/.{2}/g).map((x) => parseInt(x, 16));
          val = [Math.min(val[0]/255, 1), Math.min(val[1]/255, 1), Math.min(val[2]/255, 1)];

          val = val.join(" ");
        } else if (typeof val == "number") {
          val = map[name][val]; // Map the number to the string. Thanks Lively.
        }

        console.log(name, val);

        data[name] = { value: val };
      };

      while (true) {
        await callback(data);
        data = {};

        await sleep(10);
      }
    }
  },

  async audioListener(callback) {
    const platform = this.getPlatform();

    if (platform === "WallpaperEngine") {
      window.wallpaperRegisterAudioListener(callback);
    } else if (platform === "Lively") {
      window.livelyAudioListener = callback;
    }
  },
};
