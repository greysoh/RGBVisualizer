"use strict";

let autocorrectEnable = true;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Do not remove this line below. This is for the engine2lvly tooling.
// MAP_GEN_ID

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

        let data = {};
        data[name] = { value: val };

        callback(data);
      };
    }
  },

  async audioListener(callback) {
    const platform = this.getPlatform();

    if (platform === "WallpaperEngine") {
      window.wallpaperRegisterAudioListener(callback);
    } else if (platform === "Lively") {
      let arr = [];

      function range(num, fill) {
        let arr = [];

        for (let i = 0; i < num; i++) {
          arr.push(fill);
        }

        return arr;
      }

      window.livelyAudioListener = function(data) {
        // We get the last 64 then mirror it because Lively's visualization is broken.
        // This does make it inaccurate so I'll add an option to disable it.

        if (autocorrectEnable) {
          let tempArr = data.slice(data.length - 64);

          for (let i = 0; i < 64; i++) {
            tempArr.push(tempArr[i]);
          }

          arr = tempArr;
        } else {  
          arr = tempArr;
        }
      };

      while (true) {
        if (arr.length > 0) {
          callback(arr);
        } else {
          callback(range(128, 0));
        }

        await sleep(33.3); // 33.3ms = ~30fps. Also the update rate of Lively's engine.
      }
    }
  },
};
