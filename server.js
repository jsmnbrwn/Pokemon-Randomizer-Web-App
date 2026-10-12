import express from 'express';
import { distance } from 'fastest-levenshtein';
const app = express();

app.use(express.json());
app.use(express.static('public'));

let gameState = {
    pokemon: null,
    points: 25,
    guessed: false,
    hintTable: null,
}


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





////////


app.post('/api/new-game', async (req, res) => {
    const number = generateNumber();
    const pokemonData = await fetchPokemon(number);

    gameState.pokemon = pokemonData;
    gameState.points = 25;
    gameState.guessed = false;
    gameState.hintTable = {
        1: {hintName : "Height", data : pokemonData.height, value: 2, revealed: false},
        2: {hintName : "Weight", data : pokemonData.weight, value: 2, revealed: false},
        3: {hintName : "Number Of Types", data : pokemonData.types.length, value: 2, revealed: false},
        4: {hintName : "Type(s)", data : pokemonData.types, value: 6, revealed: false},
        5: {hintName : "Abilities", data : pokemonData.abilities, value: 5, revealed: false},
        6: {hintName : "Sprite", data : pokemonData.sprite, value: 15, revealed: false},
        7: {hintName : "HP", data : pokemonData.stats[0][1], value: 1, revealed: false},
        8: {hintName : "Atk", data : pokemonData.stats[1][1], value: 1, revealed: false},
        9: {hintName : "Def", data : pokemonData.stats[2][1], value: 1, revealed: false},
        10: {hintName : "Sp Atk", data : pokemonData.stats[3][1], value: 1, revealed: false},
        11: {hintName : "Sp Def", data : pokemonData.stats[4][1], value: 1, revealed: false},
        12: {hintName : "Speed", data : pokemonData.stats[5][1], value: 1, revealed: false},
        13: {hintName : "Generation", data : pokemonData.generation, value: 4, revealed: false},
        14: {hintName : "Pokedex Entry", data : pokemonData.pokedex, value: 8, revealed: false}
    };

    res.json({
        points: gameState.points,
        guessed: gameState.guessed,
    });

});


app.get('/api/hint', (req, res) => {
    if (!gameState.hintTable || !gameState.pokemon){
        return res.status(400).json({ Error: 'no active game'});
    }

    const type = Number(req.query.type);

    if (gameState.points - gameState.hintTable[type].value >= 0){
        gameState.points -= gameState.hintTable[type].value;
        gameState.hintTable[type].revealed = true;
    }

    let revealedHints = [];

    for (let i = 1; i < 15; i++){
        if (gameState.hintTable[i].revealed == true){
            revealedHints.push(gameState.hintTable[i]);
        }
    }

    res.json({
        points: gameState.points,
        hints: revealedHints,
        guessed: gameState.guessed,
    });
});


app.get('/api/submitGuess', async (req, res) => {
    let closestPokemon = null;
    const guess = req.query.guess.toLowerCase();
    if (guess == gameState.pokemon.name.toLowerCase()) {
        gameState.guessed = true
    } else {
        let pokemonMasterList = await getAllPokemonNames();
        closestPokemon = await checkCloseAnswer(guess,pokemonMasterList);
        if (closestPokemon == null){
            gameState.points -= 1;
        }
        
    }

    res.json({
        guessed: gameState.guessed,
        closestPokemon: closestPokemon,
        points: gameState.points,
    })
});

app.get('/api/concede', async (req, res) => {

     res.json({
        gameState: gameState,
    });
})



app.listen(3000, () => console.log('Running on http://localhost:3000'));