import { existsSync } from "https://deno.land/std@0.91.0/fs/mod.ts";

const path = Deno.args[0] || prompt("Enter path for Wallpaper Engine metadata:\n>");
const downloadMap = Deno.args[1] || prompt("Would you like to download the mapping utility? (Y/n)\n>");

console.log("Locating Wallpaper Engine metadata...");

if (!existsSync(path)) {
  console.log("File not found!");
}

const data = JSON.parse(await Deno.readTextFile(path));
let lively = { info: {}, properties: {}, map: {} };

console.log("Parsing Wallpaper Engine metadata...");
lively.info.AppVersion = "0.9.5.1"; // I have no idea what this means
lively.info.Title = data.title;
lively.info.Thumbnail = data.preview;
lively.info.Desc = data.description;
lively.info.Author = "None";
lively.info.License = "None";
lively.info.Contact = "None";

if (data.general.supportsaudioprocessing) {
  lively.info.Type = 2;
} else {
  lively.info.Type = 1;
}

lively.info.FileName = data.file;
lively.info.IsAbsolutePath = false;

const indexes = { num: [], val: [] };

console.log("Getting Wallpaper Engine properties...");
for (const i of Object.keys(data.general.properties)) {
  indexes.num.push(data.general.properties[i].index);
  indexes.val.push(i);
}

console.log("Sorting Wallpaper Engine properties...");

for (let i = 0; i < indexes.num.length - 1; i++) {
  for (let j = 0; j < indexes.num.length - i - 1; j++) {
    if (indexes.num[j] > indexes.num[j + 1]) {
      let temp = indexes.num[j];
      indexes.num[j] = indexes.num[j + 1];
      indexes.num[j + 1] = temp;

      temp = indexes.val[j];
      indexes.val[j] = indexes.val[j + 1];
      indexes.val[j + 1] = temp;
    }
  }
}

console.log("Parsing Wallpaper Engine properties...");
for (const i of indexes.val) {
  if (i == "schemecolor") continue;
  const wallpaperProp = data.general.properties[i];

  console.log(`Converting ${i}: type ${wallpaperProp.type}`);

  if (wallpaperProp.type == "bool") {
    
    lively.properties[i] = {
      type: "checkbox",
      value: wallpaperProp.value,
      text: wallpaperProp.text,
    };
  } else if (wallpaperProp.type == "combo") {
    let comboData = { labels: [], values: [] };

    for (const j of wallpaperProp.options) {
      comboData.labels.push(j.label);
      comboData.values.push(j.value);
    }

    lively.properties[i] = {
      type: "dropdown",
      value: Math.max(comboData.values.indexOf(wallpaperProp.value), 0),
      text: wallpaperProp.text,
      items: comboData.labels,
    };

    lively.map[i] = comboData.values;
  } else if (wallpaperProp.type == "color") {
    const newVal = wallpaperProp.value.split(" ");

    newVal[0] = Math.min(Math.round(newVal[0] * 255), 255);
    newVal[1] = Math.min(Math.round(newVal[1] * 255), 255);
    newVal[2] = Math.min(Math.round(newVal[2] * 255), 255);

    const hex = newVal.map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    });

    lively.properties[i] = {
      text: wallpaperProp.text,
      type: "color",
      value: "#" + hex.join(""),
    };
  } else if (wallpaperProp.type == "textinput") {
    lively.properties[i] = {
      type: "textbox",
      value: wallpaperProp.value,
      text: wallpaperProp.text,
    };
  }
}

console.log("Writing Wallpaper Engine metadata...");
await Deno.writeTextFile(
    "./LivelyInfo.json",
    JSON.stringify(lively.info, null, 2)
);

await Deno.writeTextFile(
    "./LivelyProperties.json",
    JSON.stringify(lively.properties, null, 2)
);

await Deno.writeTextFile(
    "./BridgeMap.json",
    JSON.stringify(lively.map, null, 2)
);

console.log("Done!");