/*
Client Side:
Disable revealed cells' onclick function (not necessary)

Js side:
Things to do when win and lose
Timer & its display on right
Mine count display on left
User customization
*/
var flagMode = false;
var lost = false;
var won = false;

/* JQuery */
$(document).ready(function(){
    // Mine cell on click
    $(".mine-cell").click(function(){
        let domRowIndex = this.parentNode.rowIndex;
        let domColIndex = this.cellIndex;

        if(flagMode && !lost && !won){
            // Action to do on flag mode
            let action = myBoard.flag(domRowIndex,domColIndex);
            myBoard.displayFlag(domRowIndex, domColIndex, action);
        }
        else{
            // Action to do on normal mode
            if(myBoard.displayBoard[domRowIndex][domColIndex] !== "F"){
                myBoard.engage(domRowIndex,domColIndex);
                myBoard.display(domRowIndex,domColIndex);
                // myBoard.topLayerBoardDisplay();
            }
        }
    })

    // Right click flagging
    $(".mine-cell").on("contextmenu",function(e){
        let domRowIndex = this.parentNode.rowIndex;
        let domColIndex = this.cellIndex;

        e.preventDefault();
        // Action - flag
        let action = myBoard.flag(domRowIndex,domColIndex);
        myBoard.displayFlag(domRowIndex, domColIndex, action);
    })

    // Flag button Toggler between flag mode on & off.
    $(".flag-btn").click(function(){
        // switch on and off
        flagMode = flagMode === true ? false : true;
        // button display switch based on flag mode status
        if(flagMode){
            document.getElementsByClassName("fa-flag")[0].style.color = "white";
            document.getElementsByClassName("flag-btn")[0].style.background = "black";
        }
        else{
            document.getElementsByClassName("fa-flag")[0].style.color = "black";
            document.getElementsByClassName("flag-btn")[0].style.background = "inherit";
        }
        
    })

    // Unload the loading screen
    $(".loading-screen").css("height","0");
    $(".loading-screen").css("opacity","0");
});

/* Board as class object, instance => myBoard */
class MineField{
    constructor(){
        this.mines = 10; // default mine count
        this.minePos = []; // for mine random generation
    }
    
    boardGenerate(vlen, hlen, mines){
        this.vlen = vlen || 8;    // vertical(y) length
        this.hlen = hlen || 8;    // horizontal(x) length
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
    
    // Generate Mines, called on initial hit
    generateMines(initialV, initialH){ // arguments = first hit position
    // Setup immute range based of cells around initial hit
        let immuteRadius = 1;
        let immuteCells = [];
        // Add affected cell position into immuteCells array
        for(let irV = initialV - immuteRadius; irV <= initialV + immuteRadius; irV++){
            for(let irH = initialH - immuteRadius; irH <= initialH + immuteRadius; irH++){
                // Validation check for position
                if(irV < this.vlen && irH < this.hlen && irV >= 0 && irH >= 0){
                    immuteCells.push(irV + " " + irH); }
            }
        }

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

        //this.boardDisplay();
        return this.board
    }
    
    // Internal command to print out the actual board
    boardDisplay(){
        console.log("=======Board=======");
        for(let v = 0; v < this.board.length; v++){
            console.log(String(Number(v)+1) + " || " + this.board[v]);
        }
    }

    // Internal command to print out the display board variable
    topLayerBoardDisplay(){
        console.log("=======Board - Top Layer=======");
        for(let v = 0; v < this.displayBoard.length; v++){
            console.log(String(Number(v)+1) + " || " + this.displayBoard[v] + " ||");
        }
    }

    // Action on clicked cells
    engage(vPos,hPos){
        // Exit if already lost
        if(lost || won){ return }        
        // Exit if cell is revealed
        let toFind = vPos + "+" + hPos;
        if(this.revealed.filter(x => x === toFind).length > 0){ return }

        // Generate mine on first click
        if(this.revealed.length === 0){
            this.generateMines(vPos, hPos); }

        // LOSE scenario
        if(this.board[vPos][hPos] == "X"){
            // Reveal other mine cell
            for(let mp = 0; mp < this.minePos.length; mp++){
                let mineV = this.minePos[mp].match(/.*(?=\ )/)[0];
                let mineH = this.minePos[mp].match(/(?<=\ ).*/)[0];
                this.display(Number(mineV), Number(mineH));
            }
            // Display Lose Message and try again button
            document.getElementById("title").innerText = "You Lose!";
            // Reveal other cells differently to show final result
            let cells = document.getElementsByClassName("mine-cell");
            for(let v = 0; v < this.vlen; v++){
                for(let h = 0; h < this.hlen; h++){
                    let index = v * this.vlen + h;
                    cells[index].innerText = this.board[v][h] === " " ? "0" : this.board[v][h];
                }
            }
            lost = true;
        }

        // Reveal cell
        this.reveal(vPos, hPos);

        // Trigger WIN event when successfully revealed all non-mine cells
        if(this.revealed.length >= this.vlen * this.hlen - this.mines){
            // Congratulation Messages
            document.getElementById("title").innerText = "You Win!";
            // Display all mines in a victory fashion
            let cells = document.getElementsByClassName("mine-cell");
            for(let v = 0; v < this.vlen; v++){
                for(let h = 0; h < this.hlen; h++){
                    if(this.board[v][h] === "X"){
                        let index = v * this.vlen + h;
                        cells[index].style.background = "rgb(255, 247, 128)";
                        cells[index].innerText = "🍀";
                    }
                }
            }
            // Again?


            won = true;
        }
    }

    // Reveal the cell, called by engage() or recursively
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
        if(this.displayBoard[vPos][hPos] === "_" || this.displayBoard[vPos][hPos] === "F"){
            this.displayBoard[vPos][hPos] = this.board[vPos][hPos];
            this.display(vPos, hPos);
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
    
    // Display effects on revealing the cells
    display(v,h){
        // Exit if already lost or won
        if(lost || won){ return }

        /* Display reveal results on HTML side */
        let cells = document.getElementsByClassName("mine-cell");
        let hiddenCells = document.getElementsByClassName("hidden-mine-cell");
        let index = v * this.vlen + h;
        // The top-layer cell disappears
        cells[index].style.transform = "rotateZ(180deg) scale(0)";
        cells[index].className = cells[index].className.replace(/mine-cell-hover/,"");
        cells[index].innerText = this.board[v][h];
        // and the bottom layer shows its content, with color
        hiddenCells[index].innerText = this.board[v][h];
        // Color Handling
        switch(this.board[v][h]){
            // mines
            case("X"):
                hiddenCells[index].style.background = "#222";
                hiddenCells[index].style.color = "red";
                break;
            // Different colors for numbers
            case("1"):
                hiddenCells[index].style.color = "green";
                break;
            case("2"):
                hiddenCells[index].style.color = "blue";
                break;
            case("3"):
                hiddenCells[index].style.color = "rgb(175, 0, 0)";
                break;
            case("4"):
                hiddenCells[index].style.color = "rgb(169, 0, 175)";
                break;
            default:
                hiddenCells[index].style.color = "white";
        }
    }

    // Update flag information to displayBoard variable
    flag(vPos, hPos){
        let tar = this.displayBoard[vPos][hPos];
        // Toggle between flag and un-flag
        if(tar !== "F"){
            this.displayBoard[vPos][hPos] = "F";
            return "add flag"
        }
        else{
            this.displayBoard[vPos][hPos] = "_";
            return "remove flag"
        }
    }

    // Handle display of flags
    displayFlag(v,h,action){
        /* Display/remove flag icon on HTML side */
        let cells = document.getElementsByClassName("mine-cell");
        let index = v * this.vlen + h;

        if(action === "add flag")
            cells[index].innerHTML = "<img src='icon/myFlag2.png' width='30px' height='30px'>";
        else
            cells[index].innerHTML = "";
    }

    // Reset the game
    resetBoard(vLen, hLen, mineNum){
        // Generate new board
        this.boardGenerate(vLen, hLen);
        // Renew display elements & remove display flags
        // Timer, customization issues
    }
}

myBoard = new MineField();
myBoard.boardGenerate(8,8,10);


/*
console.log(myBoard.mines);
myBoard.boardDisplay();
myBoard.topLayerBoardDisplay();

*/

