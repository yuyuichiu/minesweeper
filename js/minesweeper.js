/*
Client Side
Generate Layout
Flag cells

Js side
Avoid first hit
jQuery onclick event, extract html rowIndex
numbers on empty cell near mine
rule of expanding


$(document).ready(function(){
    $(".mine-cell").click(function(){
        let domRowIndex = this.parentNode.rowIndex;
        let domColIndex = this.cellIndex;

        myBoard.method(board[domRowIndex][domColIndex]);
    })

    // Unload the loading screen
    $(".loading-screen").css("display","none");
});
*/

class MineField{
    constructor(){
        this.board = [];
        this.displayBoard = [];
        this.mines = 10; // default mine countz
        this.minePos = []; // for mine random generation
    }
    
    boardGenerate(vlen, hlen, mines){
        this.board = [];
        this.displayBoard = [];
        this.mines = mines || 10;
        if(this.mines > vlen*hlen) throw "Mine exceeds Field Area."

        // Board generation
        for(let v = 0; v < vlen; v++){
            if(!(this.board[v])) // crearte subarray for rows
                this.board[v] = [];
                this.displayBoard[v] = [];
            for(let h = 0; h < hlen; h++){ // create subarray col space
                this.board[v][h] = " ";
                this.displayBoard[v][h] = " ";
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

        // Add number to cell
        for(let v = 0; v < vlen; v++){
            for(let h = 0; h < hlen; h++){
                // Count surrounding mines of non-mine cells
                if(this.board[v][h] !== "X"){
                    let minecount = 0;
                    // Loop through surrounding cells
                    for(let voffset = v-1; voffset <= v+1; voffset++){
                        for(let hoffset = h-1; hoffset <= h+1; hoffset++){
                            // Skip cases with invaild cell value
                            if(voffset > vlen-1 || hoffset > hlen-1 || voffset < 0 || hoffset < 0)
                                continue;
                            else if(!(this.board[voffset][hoffset]))
                                continue;
                            // Check for mines
                            else if(this.board[voffset][hoffset] === "X")
                                minecount++;
                        }
                    }
                    if(minecount > 0)
                        this.board[v][h] = String(minecount);
                }
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

    topLayerBoardDisplay(){
        console.log("=======Board - Top Layer=======");
        for(let v = 0; v < this.displayBoard.length; v++){
            console.log(String(Number(v)+1) + " || " + this.displayBoard[v] + " ||");
        }
    }

    engage(vPos,hPos){
        // Lose scenario
        if(this.board[vPos][hPos] == "X"){
            /* Things to do when lost */
            console.log("You lose");
            // show lose screen and ask if play again
        }
        // Reveal Cell
        this.reveal(vPos, hPos);

        // Check win condition
        if(this.board.filter(a => a === "X").length === 0){
            /* Things to do when win */
            console.log("You win");
            // show win screen, statistics and ask if play again
        }
    }

    reveal(vPos, hPos){
        //Reveal itself
        if(this.displayBoard[vPos][hPos] === " "){
            this.displayBoard[vPos][hPos] === this.board[vPos][hPos];
        }
    }
}

myBoard = new MineField();
myBoard.boardGenerate(8,8,10);
myBoard.boardDisplay();
myBoard.topLayerBoardDisplay();

/*
console.log(myBoard.mines);

*/

