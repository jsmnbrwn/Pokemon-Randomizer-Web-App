import readline from "readline";
import { distance } from 'fastest-levenshtein';


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function generateNumber(){
    return Math.floor((Math.random() * 1025)) + 1;

}

async function fetchPokemon(id){
    const url = "https://pokeapi.co/api/v2/pokemon/" + id;
    const urlv2 = "https://pokeapi.co/api/v2/pokemon-species/" + id;
    
    const response = await fetch(url);
    const responsev2 = await fetch(urlv2);

    const data = await response.json();
    const datav2 = await responsev2.json();

    const editedPokedex = datav2.flavor_text_entries
        .filter(e => e.language.name === "en")[0].flavor_text
        .replace(new RegExp(data.name, "i"), "________");

    const pokemon = {
        id: id,
        name: data.name,
        types: data.types.map(t => t.type.name),
        height: data.height,
        weight: data.weight,
        abilities: data.abilities.map(s => s.ability.name),
        stats: data.stats.map(s => [s.stat.name, s.base_stat]),
        pokedex: editedPokedex,
        generation: datav2.generation.name,
        sprite: data.sprites.front_default
    };


    return pokemon;

}

async function getAllPokemonNames(){
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    const data = await response.json();
    const pokemonMasterList = data.results.map(p => p.name);
    return pokemonMasterList;
}

async function checkCloseAnswer(answer,pokemonMasterList){

    let closestPokemon = null;
    let minDistance = Infinity;

    for (const name of pokemonMasterList){
        const d = distance(answer, name);
        if (d < minDistance) {
            minDistance = d;
            closestPokemon = name;
        }
    }

    if (minDistance < 4 && minDistance > 0) return closestPokemon;
    return null;
}

function askQuestion(prompt){
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

async function giveHint(hintTable,points){
    
    console.log("\nYour current points are: " + points + "\n");
    
    for (let i = 1; i < 16; i++){
        if (hintTable[i].revealed == false){
            console.log(i + " : " + hintTable[i].hintName + " : " + (hintTable[i].value * -1));
        } else {
            console.log(i + " : " + hintTable[i].data);
        }
    }

    const hintNum = await askQuestion("\nWhich hint would you like?: ");

    if (Number(hintNum) > 0 && Number(hintNum) < 15) {
        hintTable[hintNum].revealed = true;
        return [hintTable[hintNum].data, points - hintTable[hintNum].value];
    } else {
        return [-1, points];
    };

}


async function general(){

    let guessed = false;
    var points = 25;

    const number = generateNumber();
    const pokemonData = await fetchPokemon(number);
    const pokemonMasterList = await getAllPokemonNames();


    const hintTable = {
        1: {hintName : "Height", data : pokemonData.height, value: 2, revealed: false},
        2: {hintName : "Weight", data : pokemonData.weight, value: 2, revealed: false},
        3: {hintName : "Number Of Types", data : pokemonData.types.length, value: 3, revealed: false},
        4: {hintName : "Type(s)", data : pokemonData.types, value: 8, revealed: false},
        5: {hintName : "Abilities", data : pokemonData.abilities, value: 5, revealed: false},
        6: {hintName : "Sprite", data : pokemonData.sprite, value: 15, revealed: false},
        7: {hintName : "HP", data : pokemonData.stats[0][1], value: 1, revealed: false},
        8: {hintName : "Atk", data : pokemonData.stats[1][1], value: 1, revealed: false},
        9: {hintName : "Def", data : pokemonData.stats[2][1], value: 1, revealed: false},
        10: {hintName : "Sp Atk", data : pokemonData.stats[3][1], value: 1, revealed: false},
        11: {hintName : "Sp Def", data : pokemonData.stats[4][1], value: 1, revealed: false},
        12: {hintName : "Speed", data : pokemonData.stats[5][1], value: 1, revealed: false},
        13: {hintName : "Generation", data : pokemonData.generation, value: 4, revealed: false},
        14: {hintName : "Pokedex Entry", data : pokemonData.pokedex, value: 10, revealed: false},
        15: {hintName: "Exit", data: "", value: 0, revealed: false}
    };



    while (!guessed){
            const answer = (await askQuestion("\nGuess your pokemon, or type H to get a hint: ")).toLowerCase();
            
            if (answer == "h") {
                const resultOfHint = await giveHint(hintTable,points);
                
                if (resultOfHint[0] == -1) {
                    console.log("Incorrect hint value, your points are unchanged.\n");
                } else {

                    if (resultOfHint[1] < 0){
                        console.log("\nGame over! Less than 0 points.\n");
                        console.log("The pokemon was.... " + pokemonData.name);
                        return;
                    } else {
                        console.log("\n")
                        console.log(resultOfHint[0]);
                        console.log("\nYour new points are " + resultOfHint[1]);
                        points = resultOfHint[1];
                    }
                }

        } else {
                if (answer == pokemonData.name){
                    console.log("\nCongratulations! You guessed the pokemon!");
                    guessed = true;
                    return;
                } else {
                    const res = await checkCloseAnswer(answer,pokemonMasterList);
                    if (res == null){
                        console.log("\nIncorrect answer... try again.\n");
                    } else {
                        console.log("\nIncorrect answer... did you mean " + res + "?");
                    }
                }
            }
        }
    }


async function main(){
    while (true) {
        await general();
    }
    rl.close();
}

main();
