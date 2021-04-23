/*
Client Side:
Generate Layout
Flag cells
Disable revealed cells' onclick function

Js side:
Avoid first hit
Things to do when win and lose
win condition
*/
var flagMode = false;

$(document).ready(function(){
    $(".mine-cell").click(function(){
        let domRowIndex = this.parentNode.rowIndex;
        let domColIndex = this.cellIndex;

        if(flagMode){
            myBoard.flag(domRowIndex,domColIndex); }
        else{
            myBoard.engage(domRowIndex,domColIndex); }
        
        myBoard.test(domRowIndex,domColIndex);
    })

    // Toggler between flag mode on & off.
    $(".flag-btn").click(function(){
        flagMode = flagMode ? false : true;
        console.log(flagMode);
    })

    // Unload the loading screen
    $(".loading-screen").css("display","none");
});

class MineField{
    constructor(){
        this.mines = 10; // default mine count
        this.minePos = []; // for mine random generation
    }
    
    boardGenerate(vlen, hlen, mines){
        this.vlen = vlen;         // vertical(y) length
        this.hlen = hlen;         // horizontal(x) length
        this.board = [];          // the real board with mines and numbers
        this.displayBoard = [];   // the top layer board for display
        this.revealed = [];       // record revealed cells
        this.mines = mines || 10;  // mine count, default 10
        if(this.mines > this.vlen*this.hlen) throw "Mine exceeds Field Area."

        // Board generation
        for(let v = 0; v < this.vlen; v++){
            if(!(this.board[v]))
                this.board[v] = []; //subarray for each row
                this.displayBoard[v] = [];
            for(let h = 0; h < this.hlen; h++){ // create subarray col space
                this.board[v][h] = " ";
                this.displayBoard[v][h] = "_";
            }
        }
        return this.board;
    }
    
    generateMines(initialV, initialH){ // arguments = first hit position
        // Setup immute range based of cells around initial hit
        let immuteRadius = 1;
        let immuteCells = [];
        // Add affected cell position into immuteCells array
        for(let irV = initialV - immuteRadius; irV <= initialV + immuteRadius; irV++){
            for(let irH = initialH - immuteRadius; irH <= initialH + immuteRadius; irH++){
                // Vaildation check for position
                if(irV < this.vlen && irH < this.hlen && irV >= 0 && irH >= 0){
                    immuteCells.push(irV + " " + irH); }
            }
        }
        console.log(immuteCells);

        // Put mines randomly on board
        while(this.minePos.length < this.mines){
            let randV = Math.floor(Math.random() * this.vlen);
            let randH = Math.floor(Math.random() * this.hlen);
            // Put mine and record position if cell is valid
            if(this.board[randV][randH] !== "X"){ // not a mine
                // Check if selected cell is not in immute range
                if(immuteCells.filter(x => x === randV + " " + randH).length === 0){
                    // Put mine to field
                    this.board[randV][randH] = "X";
                    this.minePos.push(String(randV + " " + randH));
                }   
            }
        }
    
        // Add number to cell
        for(let v = 0; v < this.vlen; v++){
            for(let h = 0; h < this.hlen; h++){
                // Count surrounding mines of non-mine cells
                if(this.board[v][h] !== "X"){
                    let minecount = 0;
                    // Loop through surrounding cells
                    for(let voffset = v-1; voffset <= v+1; voffset++){
                        for(let hoffset = h-1; hoffset <= h+1; hoffset++){
                            // Skip cases with invaild cell value
                            if(voffset > this.vlen-1 || hoffset > this.hlen-1 || voffset < 0 || hoffset < 0)
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

        this.boardDisplay();
        return this.board
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
        // Generate mine on first click
        if(this.revealed.length === 0){
            this.generateMines(vPos, hPos); }

        // Lose scenario
        if(this.board[vPos][hPos] == "X"){
            /* Things to do when lost */
            console.log("You lose");
            // show lose screen and ask if play again
        }

        // Reveal Cell
        this.reveal(vPos, hPos);
        this.topLayerBoardDisplay();

        // Check win condition
        if(this.board.filter(a => a === "X").length === 0){ // fix this
            /* Things to do when win */
            console.log("You win");
            // show win screen, statistics and ask if play again
        }
    }

    reveal(vPos, hPos){        
        /* Rule: if empty, force reveal near number and recur empty  */
        /* else if number, reveal itself (means it can stop here) */
        /* else if mine caused by recursive calls, ignore it directly */
        
        // Directly exit when position is a mine
        if(this.board[vPos][hPos] === "X"){ return }
        // Record reveal history for unrevealed cell
        let toFind = vPos + "+" + hPos;
        if(this.revealed.filter(x => x === toFind).length === 0){
            this.revealed.push(toFind);}
        // Exit if the cell is revealed already.
        else { return }

        // Reveal itself
        if(this.displayBoard[vPos][hPos] === "_"){
            this.displayBoard[vPos][hPos] = this.board[vPos][hPos];
            this.test(vPos, hPos);
        }

        // If Blank, loop and reveal surroundings
        if(this.board[vPos][hPos] === " "){
            for(let vTemp = vPos - 1; vTemp <= vPos + 1; vTemp++){
                for(let hTemp = hPos - 1; hTemp <= hPos + 1; hTemp++){
                    // recursive on valid cell
                    if(vTemp < this.vlen && hTemp < this.hlen && vTemp >= 0 && hTemp >=0){
                        this.reveal(vTemp,hTemp);
                    }
                }
            }
        }
    }

    flag(vPos, hPos){
        // Toggle between flagged and unflagged
        this.displayBoard[vPos][hPos] = this.displayBoard[vPos][hPos] === "F" ? "_" : "F";
        
        // Disable / Enable DOM element from bring clickable
        // and display a flag icon.
    }

    test(v,h){
        let cells = document.getElementsByClassName("mine-cell");
        let index = v * this.vlen + h;
        cells[index].style.transform = "rotateZ(180deg) scale(0)";
        cells[index].className = cells[index].className.replace(/mine-cell-hover/,"");
        cells[index].innerText = this.board[v][h];
    }
}

myBoard = new MineField();
myBoard.boardGenerate(8,8,10);
myBoard.boardDisplay();
myBoard.topLayerBoardDisplay();

/*
console.log(myBoard.mines);

*/

