import inquirer from "inquirer";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
// import { findIndex } from "rxjs";
import url from "url";

// Define __dirname for ES Modules
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
let pokemonNames;
let pokemonArray;

//successeded to get out the name and url for pokemon::
async function fetchData(pokemonNames) {
  const response = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0"
  );
  const data = await response.json(); // Waits for the JSON data to be parsed
  pokemonArray = data.results;

  let foundName = pokemonArray.find((poke) => poke.name == pokemonNames);
  let foundUrl = foundName ? foundName.url : false;
  urlFetchdata(foundUrl);
  // console.log(foundUrl);
}
async function namePrompt() {
  await inquirer
    .prompt([
      {
        type: "input",
        name: "username",
        message: "Enter your Pokemon Name:",
      },
    ])
    .then((answers) => {
      pokemonNames = answers.username.trim();
    });
  fetchData(pokemonNames);
}
namePrompt();
//get out the information from url
async function urlFetchdata(foundUrl) {
  const statsInfo = await fetch(foundUrl);
  let data = await statsInfo.json();
  infoPrompt(data);
}
//make a list to choose which information i want
async function infoPrompt(data) {
  await inquirer
    .prompt([
      {
        type: "list",
        name: "pokemonInfo ",
        message: "Pokemon Info to DownLoad:",
        choices: ["stats", "sprites", "artwork", "all"],
      },
    ])

    .then((answers) => {
      const selectedInfo = answers["pokemonInfo "].trim();
      handleSelectedInfo(selectedInfo, data);
    });
}

// Function to download and save an image from a URL
async function downloadImage(url, filePath) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image from ${url}`);
    }

    const buffer = await response.buffer(); // Convert ArrayBuffer to Buffer
    await fs.writeFile(filePath, buffer); // Save it to the specified path
    console.log(`Image saved to ${filePath}`);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}

// Handle selected Pokémon info and save to a text file
async function handleSelectedInfo(selectedInfo, data) {
  const folderPath = path.join(__dirname, pokemonNames); // Folder for Pokémon data

  // Ensure the folder exists or create it
  await fs.mkdir(folderPath, { recursive: true });

  try {
    if (selectedInfo === "stats" || selectedInfo === "all") {
      // Save stats to a text file
      const statsFilePath = path.join(folderPath, "stats.txt");
      const statsText = data.stats
        .map((stat) => `${stat.stat.name}: ${stat.base_stat}`)
        .join("\n");
      await fs.writeFile(statsFilePath, statsText);
      console.log(`Stats saved to ${statsFilePath}`);
    }

    if (selectedInfo === "sprites" || selectedInfo === "all") {
      // Download and save sprites images
      if (data.sprites.front_default) {
        const frontSpritePath = path.join(folderPath, "front_sprite.png");
        await downloadImage(data.sprites.front_default, frontSpritePath);
      }
      if (data.sprites.back_default) {
        const backSpritePath = path.join(folderPath, "back_sprite.png");
        await downloadImage(data.sprites.back_default, backSpritePath);
      }
    }

    if (selectedInfo === "artwork" || selectedInfo === "all") {
      // Download and save artwork image
      if (
        data.sprites.other["official-artwork"] &&
        data.sprites.other["official-artwork"].front_default
      ) {
        const artworkPath = path.join(folderPath, "official_artwork.png");
        await downloadImage(
          data.sprites.other["official-artwork"].front_default,
          artworkPath
        );
      }
    }
  } catch (error) {
    console.error("Error handling selected info:", error);
  }
}
