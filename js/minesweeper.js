/*
Client Side
Generate Layout
Flag cells

Js side
Avoid first hit
jQuery onclick event, extract html rowIndex
numbers on empty cell near mine
rule of expanding
*/

$(document).ready(function(){
    $(".mine-cell").click(function(){
        let domRowIndex = this.parentNode.rowIndex;
        let domColIndex = this.cellIndex;

        myBoard.method(board[domRowIndex][domColIndex]);
    })

    // Unload the loading screen
    $(".loading-screen").css("display","none");
});

class MineField{
    constructor(){
        this.board = [];
        this.mines = 10; // default mine count
        this.minePos = []; // for mine random generation
    }
    
    boardGenerate(vlen, hlen, mines){
        this.mines = mines || 10;
        if(this.mines > vlen*hlen) throw "Mine exceeds Field Area."

        // Board generation
        for(let v = 0; v < vlen; v++){
            if(!(this.board[v]))
                this.board[v] = [];
            for(let h = 0; h < hlen; h++){
                this.board[v][h] = "0";
            }
        }

        // Put mines randomly on board
        while(this.minePos.length < this.mines){
            let randV = Math.floor(Math.random() * vlen);
            let randH = Math.floor(Math.random() * hlen);
            // Put mine and record position if cell is valid
            if(this.board[randV][randH] !== "X"){
                this.board[randV][randH] = "X";
                this.minePos.push(String(randV + " " + randH));
            }
        }

        return this.board;
    }

    boardDisplay(){
        console.log("=======Board=======");
        for(let v = 0; v < this.board.length; v++){
            console.log(String(Number(v)+1) + " || " + this.board[v]);
        }
    }

    engage(vPos,hPos){
        // Lose scenario
        if(this.board[vPos][hPos] == "X"){
            /* Things to do when lost */
            console.log("You lose");
            // show lose screen and ask if play again
        }
        // Expand nearby non-mine cells, recursive if that cell is "0"
        

        // Check win condition
        if(this.board.filter(a => a === "X").length === 0){
            /* Things to do when win */
            console.log("You win");
            // show win screen, statistics and ask if play again
        }
    }
}

myBoard = new MineField();
myBoard.boardGenerate(8,8,20);
myBoard.boardDisplay();
console.log(myBoard.mines);

/*

*/

