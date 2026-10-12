
let gameStarted = false;

document.getElementById("guessBox").addEventListener("keypress", function(e) {
    if (e.key === "Enter"){
        submitGuess();
    }
});

document.getElementById("submitGuessBtn").addEventListener("click", submitGuess);

async function startGame(){
    
    const response = await fetch('/api/new-game', {
        method: 'POST',
    });
    const data = await response.json();
    console.log(data);

    gameStarted = true;
    document.getElementById("guessBox").disabled = false;
    const img = document.getElementById('spriteImage');
    img.src = "questionMark.jpeg";
    img.style.display = 'block';
    document.getElementById('pointsDisplay').innerText = data.points;

    const buttonResets = {
        1: "Height -2", 2: "Weight -2", 3: "Number of Types -2", 4: "Type(s) -6",
        5: "Abilities -5", 6: "Sprite -15", 7: "HP -1", 8: "Atk -1", 9: "Def -1",
        10: "Sp Atk -1", 11: "Sp Def -1", 12: "Speed -1", 13: "Generation -4", 14: "Pokedex Entry -8"
    };

    
    document.querySelectorAll('[data-hint]').forEach(button => {
        const type = parseInt(button.getAttribute('data-hint'));
        button.innerText = buttonResets[type];
        button.style.backgroundColor = '';
    })

}


function gameEnd(data){
    gameStarted = false;
    document.getElementById('spriteImage').src = data.gameState.hintTable[6].data;
    document.getElementById('spriteImage').style.display = 'block';
    document.getElementById("guessBox").disabled = true;
    alert("the pokemonw was: " + data.gameState.pokemon.name);
}


async function getHint(type,button){
    const response = await fetch(`/api/hint?type=${type}`,);
    const data = await response.json();

    document.getElementById('pointsDisplay').innerText = data.points;

    data.hints.forEach(hint => {
        if (hint.hintName === "Sprite") {
            const img = document.getElementById('spriteImage');
            img.src=hint.data;
            img.style.display = 'block';
        }
    });
    
    const revealedHint = data.hints.find(h => h.hintName === getHintName(type));
    if (revealedHint) {
        button.style.backgroundColor = '#7f7f7f';
        if (type != 6) {
            button.innerText = Array.isArray(revealedHint.data)
                ? revealedHint.data.join(', ')
                : revealedHint.data;
        } else {
            button.innerText = '✓ Sprite';
        }
    }
}

function getHintName(type) {
    const names = {
        1: "Height", 2: "Weight", 3: "Number Of Types", 4: "Type(s)",
        5: "Abilities", 6: "Sprite", 7: "HP", 8: "Atk", 9: "Def",
        10: "Sp Atk", 11: "Sp Def", 12: "Speed", 13: "Generation", 14: "Pokedex Entry"
    };
    return names[type];
}

function checkVictory(data){
    if (data.guessed == true){
        alert("Correct!")
        gameStarted = false;
        document.getElementById('spriteImage').style.display = 'none';
        // document.getElementById('hint-display').innerHTML = '';
    } else if (data.closestPokemon != null){
        alert("Did you mean " + data.closestPokemon);
    } else {
        alert("Incorrect guess");
    }

    if (data.points < 0) gameEnd(data);
}

async function submitGuess() {

    if (!gameStarted){
        alert("Start game first.");
        return;
    }

    const guess = document.getElementById("guessBox").value;
    const response = await fetch(`/api/submitGuess?guess=${guess}`,);
    const data = await response.json();

    guessBox.value = "";
    document.getElementById('pointsDisplay').innerText = data.points;

    checkVictory(data);
}

async function concede(){
    const response = await fetch(`/api/concede`,);
    const data = await response.json();
    gameEnd(data);
}