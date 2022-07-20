const gradient = function (...colors) {
  if (Color == undefined) throw "Color.js is required";
  if (colors.length < 2) throw "At least two colors are required";

  function convertRgbToSrgb(...args) {
    const arr = [];

    for (i of args) {
      arr.push(Math.min(i / 255, 1));
    }

    return arr;
  }

  function convertSrgbToRgb(...args) {
    const arr = [];

    for (i of args) {
      arr.push(Math.min(Math.abs(i) * 255, 255));
    }

    return arr;
  }

  const array = [];

  for (const j in colors) {
    const i = parseInt(j);

    if (colors[i + 1] == undefined) continue;

    const srgbColors = [
      convertRgbToSrgb(...colors[i]),
      convertRgbToSrgb(...colors[i + 1]),
    ];

    const color0 = new Color("srgb", srgbColors[0]);
    const color1 = new Color("srgb", srgbColors[1]);

    const steps = color0.steps(color1, {
      space: "srgb",
      outputSpace: "srgb",
      maxDeltaE: 3,
      steps: 10,
    });

    for (const k of steps) {
      const srgb = k.coords;

      const conv = convertSrgbToRgb(...srgb);

      array.push(conv);
    }
  }

  return array;
};
