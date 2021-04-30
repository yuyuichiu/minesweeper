/*
JS:
Manual cell size mode

Issue:
Performance get really bad on board size > 50
Recursion blows up if revealing too much cells
Displaying too much mine at the end lags too.
Square opening (issue?)
*/
var flagMode = false;
var lost = false;
var won = false;
var animation = true;
var called = 0;
// Difficulty: Easy: 8*8 & 10 mines | Medium: 16*16 & 50 mines | Hard: 25*25 & 250 mines
var mode = "easy";

/* JQuery */
$(document).ready(function(){
    // Mine cell on click [old: $(".mine-cell").click]
    $(document).on("click", ".mine-cell", function(){
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
            }
        }
    })

    // Left+Right click on revealed number cells
    $(document).on("mousedown", ".mine-cell", function(e){
        // e.buttons for left = 1, right = 2, 1+2=3 (left+right)
        if(e.buttons === 3){
            // Get cell row and column index
            let domRow = this.parentNode.rowIndex;
            let domCol = this.cellIndex;
            console.log(domRow + " " + domCol);
    
            // Reveal number around
            myBoard.cleave(domRow,domCol);
        }
    })

    // Right click flagging [dynamic version]
    $(document).on("contextmenu", ".mine-cell",function(e){
        let domRowIndex = this.parentNode.rowIndex;
        let domColIndex = this.cellIndex;

        e.preventDefault();
        // Flag cell and display the flag, while game is running
        if(!(won) && !(lost)){
            let action = myBoard.flag(domRowIndex,domColIndex);
            myBoard.displayFlag(domRowIndex, domColIndex, action);
        }
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

    // Reset Button Onclick function
    $(".reset-btn").click(function(){
        myBoard.resetBoard(myBoard.vlen,myBoard.hlen,myBoard.mines);
    })

    // Custom Reset Button Onclick Function
    $(".custom-reset-btn").click(function(){
        let userV = document.getElementById("customV").value;
        let userH = document.getElementById("customH").value;
        let userM = document.getElementById("customM").value;
        let msg = document.getElementById("msg");
        
        // Some validations before proceeding
        if(!(userV) && !(userH) && !(userM)){
            msg.innerText = "Insufficient Data.";
            return
        }
        else if(userV > 1000 || userH > 1000){
            msg.innerText = "Please limit the board to 50*50";
            return
        }
        else if(userV % 1 !== 0 || userH % 1 !== 0 || userM % 1 !== 0){
            msg.innerText = "Please provide Integer";
            return
        }
        else if(userV * userH - 9 - 5 - userM < 0){
            // Area - Immute area - Minimum safe space - MineCount >= 0 -> valid
            msg.innerText = "Please provide wider space to put mines";
            return
        }
        else if(userH < 1){
            msg.innerText = "There is no game without any mines.";
            return
        }
        else{
            msg.innerText = "Custom Board Generated";
        }

        // Build a customized board
        myBoard.resetBoard(userV, userH, userM);
    })

    // Mode button onclick - change board based on default layout
    $(".mode-btn").click(function(){
        let modeBtn = document.getElementsByClassName("mode-btn")[0];
        if(mode === "easy"){
            mode = "medium";
            this.innerText = "Medium";
            myBoard.resetBoard(16,16,50);
            modeBtn.style.border = "2px solid rgb(114, 74, 0)";
            modeBtn.style.background = "rgb(255, 163, 77)";
        }
        else if(mode === "medium"){
            mode = "hard";
            this.innerText = "Hard";
            myBoard.resetBoard(25,25,250);
            modeBtn.style.border = "2px solid red";
            modeBtn.style.background = "rgb(150, 23, 23)";
        }
        else{
            mode = "easy";
            this.innerText = "Easy";
            myBoard.resetBoard(8,8,10);
            modeBtn.style.border = "2px solid rgb(21, 133, 6)";
            modeBtn.style.background = "rgb(103, 228, 31)";
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
    }
    
    boardGenerate(vlen, hlen, mines){
        this.vlen = vlen || 8;    // vertical(y) length
        this.hlen = hlen || 8;    // horizontal(x) length
        this.board = [];          // the real board with mines and numbers
        this.displayBoard = [];   // the top layer board for display
        this.revealed = 0;       // record revealed cells
        this.mines = mines || 10; // mine count, default 10
        this.minePos = [];        // for mine random generation
        this.clock = 0;            // time counter to record game length

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
        // Timer to test code run time
        let codeStartTime = new Date();
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
                            // Skip cases with invalid cell value
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

        document.getElementsByClassName("mine-count")[0].innerText = "M: " + this.mines;
        // Runtime testing
        let codeEndTime = new Date();
        let codeRuntime = (codeEndTime - codeStartTime) / 1000;
        console.log("Mine generation runtime: " + codeRuntime + "s");
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
        // Runtime testing Variables
        let codeStartTime = new Date();


        // Exit if already lost
        if(lost || won){ return }        
        // Exit if cell is revealed
        if(this.board[vPos][hPos] === this.displayBoard[vPos][hPos]){ return }

        // Generate mine on first click
        if(this.revealed === 0){
            this.generateMines(vPos, hPos);
            // Activate timer
            this.gameTimer = setInterval(clockUpdate, 1000);
        }

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
                    let index = v * this.hlen + h;
                    cells[index].innerText = this.board[v][h] === " " ? "0" : this.board[v][h];
                }
            }
            lost = true;
            clearInterval(this.gameTimer);
        }

        // Reveal cell
        this.reveal(vPos, hPos);

        // Trigger WIN event when successfully revealed all non-mine cells
        if(this.revealed >= this.vlen * this.hlen - this.mines){
            // Congratulation Messages
            document.getElementById("title").innerText = "You Win!";
            // Display all mines in a victory fashion
            let cells = document.getElementsByClassName("mine-cell");
            for(let v = 0; v < this.vlen; v++){
                for(let h = 0; h < this.hlen; h++){
                    if(this.board[v][h] === "X"){
                        let index = v * this.hlen + h;
                        cells[index].style.background = "rgb(255, 247, 128)";
                        cells[index].innerText = "🍀";
                    }
                }
            }
            won = true;
            clearInterval(this.gameTimer);
        }

        // Runtime testing
        let codeEndTime = new Date();
        let codeRuntime = (codeEndTime - codeStartTime) / 1000;
        console.log(called);
        console.log("Engage runtime: " + codeRuntime + "s");
        console.log(this.revealed);
    }

    // Special action for exposed numbers
    cleave(vPos, hPos){
        let vOffset = [-1,-1,-1,0,0,1,1,1];
        let hOffset = [-1,0,1,-1,1,-1,0,1];
        // Proceed if not an exposed number
        if(/[0-8]/.test(String(this.displayBoard[vPos][hPos]))){
            // Exit if not flagged all surrounding mines accurately
            for(let i = 0; i < 8; i++){
                // Handle surrounding loop
                let lookupV = vPos + vOffset[i];
                let lookupH = hPos + hOffset[i];
                console.log(lookupV + " " + lookupH);
                if(lookupV > this.vlen-1 || lookupH > this.hlen-1 || lookupV < 0 || lookupH < -0){
                    console.log("Invalid cell detected, skipped");
                    continue;
                }
                // The actual check
                if(this.board[lookupV][lookupH] === "X" && this.displayBoard[lookupV][lookupH] !== "F"){
                    console.log("Inaccurate flag");
                    return
                }
            }

            // Test passes, reveal surrounding unrevealed cells
            for(let i = 0; i < 8; i++){
                // Handle surrounding loop
                let lookupV = vPos + vOffset[i];
                let lookupH = hPos + hOffset[i];
                if(lookupV > this.vlen-1 || lookupH > this.hlen-1 || lookupV < 0 || lookupH < -0){
                    console.log("Invalid cell detected, skipped");
                    continue;
                }
                // reveal unrevealed cells
                if(this.board[lookupV][lookupH] !== this.displayBoard[lookupV][lookupH]){
                    this.reveal(lookupV,lookupH);
                }
            }
        }
        else{ console.log("Number reveal not triggered"); }
    }

    // Reveal the cell, called by engage() or recursively
    /* !!!Source of evil for performance issue!!! */
    reveal(vPos, hPos){   
        called += 1;

        /* Rule: if empty, force reveal near number and recur empty  */
        /* else if number, reveal itself (means it can stop here) */
        /* else if mine caused by recursive calls, ignore it directly */
        
        // Directly exit when position is a mine
        if(this.board[vPos][hPos] === "X"){ return }
        // Record reveal history for unrevealed cell
        let toFind = vPos + "+" + hPos;
        // Exit if the cell is revealed already.
        if(this.board[vPos][hPos] === this.displayBoard[vPos][hPos]){
            return }
        else { this.revealed += 1; }

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
        let index = v * this.hlen + h;
        // The top-layer cell disappears
        if(animation){
            cells[index].style.transform = "rotateZ(180deg) scale(0)";
        }
        else{
            cells[index].style.transition = "none";
            cells[index].style.opacity = "0";
        }
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
            case("5"):
                hiddenCells[index].style.color = "rgb(221, 0, 85)";
                break;
            case("6"):
                hiddenCells[index].style.color = "rgb(233, 212, 22)";
                break;
            case("7"):
                hiddenCells[index].style.color = "rgb(0, 217, 255)";
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
        let index = v * this.hlen + h;

        if(action === "add flag")
            cells[index].innerHTML = "<img src='icon/myFlag2.png' class='flag-icon'>";
        else
            cells[index].innerHTML = "";
    }

    // Resetting the game
    resetBoard(vLen, hLen, mineNum){
        let htmlBoard = document.getElementsByClassName("board")[0];
        let htmlHiddenBoard = document.getElementsByClassName("hidden-board")[0];
        called = 0;
        
        // Clear current HTML table (board & hidden-board)
        while(htmlBoard.firstChild){
            // Clear child of the table while any exists
            htmlBoard.removeChild(htmlBoard.firstChild);
        }
        while(htmlHiddenBoard.firstChild){
            // Clear child of the lower table while any exists
            htmlHiddenBoard.removeChild(htmlHiddenBoard.firstChild);
        }

        // Add new items into HTML table
        for(let tv = 0; tv < vLen; tv++){
            // Add table rows (<tr>)
            let newRow = htmlBoard.insertRow(-1);
            let newHiddenRow = htmlHiddenBoard.insertRow(-1);
            // Add table cells (<td>)
            for(let th = 0; th < hLen; th++){
                let newCell = newRow.insertCell(-1);
                let newHiddenCell = newHiddenRow.insertCell(-1);
                // Declare class to new cells
                newCell.className = "mine-cell mine-cell-hover";
                newHiddenCell.className = "hidden-mine-cell";
            }
        }

        // Generate new board in javascript
        won = false;
        lost = false;
        this.boardGenerate(vLen,hLen,mineNum);
        document.getElementById("title").innerText = "Welcome to Minesweeper!"
        
        // Update time-count and mine-count in HTML display
        document.getElementsByClassName("mine-count")[0].innerText = "M: -";
        clearInterval(this.gameTimer);
        document.getElementsByClassName("time-count")[0].innerText = "🕑: 0";
    }
}

// For setInterval to execute
function clockUpdate(){
    if(myBoard.clock < 1000){
        myBoard.clock += 1;     }
    else{
        myBoard.clock = "---";  }
    document.getElementsByClassName("time-count")[0].innerText = "🕑: " + myBoard.clock;
}

myBoard = new MineField();
myBoard.boardGenerate(8,8,12);



/*
console.log(myBoard.mines);
myBoard.boardDisplay();
myBoard.topLayerBoardDisplay();

// Left + right click event listener
var mouseTrack = {};
var cells = document.getElementsByClassName("mine-cell");
cells.onmousedown = cells.onmouseup = holding;

function holding(e){
    e = e || event;
    if(e.buttons === 3){
        // Get cell row and column index
        let domRow = this.parentNode.rowIndex;
        let domCol = this.cellIndex;
        console.log(domRow + " " + domCol);

        // Reveal number around
        myBoard.cleave(domRow,domCol);
    }
}

*/

