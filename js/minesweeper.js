/*
JS:
Manual cell size mode

Issue:
Performance get really bad on board size > 50
Recursion blows up if revealing too much cells
Displaying too much mine at the end lags too.
Square opening (issue?)

Cannot surround reveal blank properly
*/
var flagMode = false;
var lost = false;
var won = false;
var animation = true;
var holding = false; // For lift + right click on mouse up purpose
var vOffset = [-1,-1,-1,0,0,1,1,1];
var hOffset = [-1,0,1,-1,1,-1,0,1];
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

    // Left+Right click - onmousedown: highlight effected area
    $(document).on("mousedown", ".mine-cell", function(e){
        // e.buttons for left = 1, right = 2, 1+2=3 (left+right)
        if(e.buttons === 3 && !(won) && !(lost)){
            holding = true;

            // Highlight affected surrounding cell (CSS effect)
            let domRow = this.parentNode.rowIndex;
            let domCol = this.cellIndex;
            myBoard.highlight(domRow,domCol);
        }
    })

    // Left+Right click - onmouseup: reveal surroundings of number cell
    $(document).on("mouseup",".mine-cell", function(e){
        if(holding && e.buttons === 0 && !(won) && !(lost)){
            holding = false;

            // Attempt to reveal surrounding
            let domRow = this.parentNode.rowIndex;
            let domCol = this.cellIndex;
            myBoard.leftRightReveal(domRow,domCol);
            // Un-highlight css effect
            myBoard.highlight(domRow,domCol,"revert");
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
        let userV = Math.abs(document.getElementById("customV").value);
        let userH = Math.abs(document.getElementById("customH").value);
        let userM = Math.abs(document.getElementById("customM").value);
        let msg = document.getElementById("msg");
        
        // Some validations before proceeding
        if(!(userV) && !(userH) && !(userM)){
            msg.innerText = "Insufficient Data.";
            return
        }
        else if(userV * userH > 3000){
            msg.innerText = "Please limit to 3000 cells";
            return
        }
        else if(userV % 1 !== 0 || userH % 1 !== 0 || userM % 1 !== 0){
            msg.innerText = "Please provide Integer";
            return
        }
        else if(userV * userH - 9 - 6 - userM < 0){
            // Area - Immute area - Minimum safe space - MineCount >= 0 -> valid
            msg.innerText = "Please reverse 15 cells to put mines";
            return
        }
        else if(userH < 1){
            msg.innerText = "There is no game without any mines.";
            return
        }
        else{
            // Minimum mine adjustment for large boards
            if(userV * userH > 400 && userM/(userV*userH) < 0.15){
                userM = Math.floor(userV*userH*0.15);
                msg.innerText = "Custom Board Generated (minimum 15% mine needed for large boards)";
            }
            else{
                msg.innerText = "Custom Board Generated";
            }
            // Activate loader
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
        this.revealed = 0;        // count revealed cells
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
        
        // Mine count display & animation toggle
        document.getElementsByClassName("mine-count")[0].innerText = "M: " + String(this.mines);
        if(this.vlen * this.hlen <= 1000){
            animation = true; }
        else{ animation = false; }
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
                    let mineCount = 0;
                    // Loop through surrounding cells
                    for(let i = 0; i < 8; i++){
                        let lv = v + vOffset[i]; // Lookup V
                        let lh = h + hOffset[i]; // Lookup H
                        // Skip cases with invalid cell value
                        if(lv > this.vlen-1 || lh > this.hlen-1 || lv < 0 || lh < 0)
                            continue;
                        else if(!(this.board[lv][lh]))
                            continue;
                        // Check for mines
                        else if(this.board[lv][lh] === "X")
                            mineCount++;
                    }
                    if(mineCount > 0)
                        this.board[v][h] = String(mineCount);
                }
            }
        }

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
        
        // Exit if already lost, won or cell is revealed
        if(lost || won){ return }        
        if(this.displayBoard[vPos][hPos] === "R"){ return }

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
        this.reveal([vPos, hPos]);
        
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
        console.log("Engage runtime: " + codeRuntime + "s");
        console.log(this.revealed);
    }

    // Reveal mine cells, expects array of [v1,h1]
    reveal(r){
        /* Rule: if empty, force reveal near number and recur empty  */
        /* else if number, reveal itself (means it can stop here) */
        /* else if mine caused by recursive calls, ignore it directly */
        let cellsToRecur = []; // toReveal: r = [v1,h1,v2,h2]
        for(let i = 0; i < r.length; i = i + 2){
            // 1. Attempt to reveal itself
            let v = r[i];
            let h = r[i+1];
            /* Exit if cell is revealed or is a mine */
            if(this.board[v][h] === "X"){ continue; }
            else if(this.displayBoard[v][h] === "R"){ continue; }
            else{ this.revealed += 1; }

            /* reveal given target */
            this.displayBoard[v][h] = "R";
            this.display(v,h);


            // 2. Attempt to reveal surroundings (when target is a empty cell)
            if(this.board[v][h] == " "){
                for(let j = 0; j < 8; j++){
                    let lv = v + vOffset[j]; // Lookup V
                    let lh = h + hOffset[j]; // Lookup H
                    // Skip iteration if represents invalid cell
                    if(lv > this.vlen-1 || lh > this.hlen-1 || lv < 0 || lh < 0){ continue; }
                    // Record into array if lookup target is a unrevealed blank cell
                    else if(this.board[lv][lh] === " " && this.displayBoard[lv][lh] !== "R"){
                        cellsToRecur.push(lv);
                        cellsToRecur.push(lh);
                    }
                    // Reveal if unrevealed AND not a mine
                    if(this.displayBoard[lv][lh] === "R"){ continue; }
                    else if(this.board[lv][lh] !== "X" && this.board[lv][lh] !== " "){
                        this.displayBoard[lv][lh] = "R";
                        this.display(lv,lh);
                        this.revealed += 1;
                    }
                }
            }
        }
        
        // Recur until record becomes empty
        console.log(cellsToRecur);
        if(cellsToRecur.length > 0){
            this.reveal(cellsToRecur);
        }
        else{
            console.log("Stop recurring");
        }
    }

    // Special action for exposed numbers
    leftRightReveal(vPos, hPos){
        let flagCount = 0;
        // Proceed if cell is an exposed number
        if(this.displayBoard[vPos][hPos] === "R" && /[1-8]/.test(String(this.board[vPos][hPos]))){
            // Counting surrounding flags
            for(let i = 0; i < 8; i++){
                // Handle surrounding loop
                let lookupV = vPos + vOffset[i];
                let lookupH = hPos + hOffset[i];
                if(lookupV > this.vlen-1 || lookupH > this.hlen-1 || lookupV < 0 || lookupH < 0){
                    // Skip cells with invalid lookup value
                    continue;
                }
                // The actual check
                if(this.displayBoard[lookupV][lookupH] === "F"){
                    flagCount += 1;
                }
            }

            // When condition suffices, Reveal surrounding unrevealed cells
            if(flagCount === Number(this.board[vPos][hPos])){
                for(let i = 0; i < 8; i++){
                    // Handle surrounding loop
                    let lookupV = vPos + vOffset[i];
                    let lookupH = hPos + hOffset[i];
                    if(lookupV > this.vlen-1 || lookupH > this.hlen-1 || lookupV < 0 || lookupH < 0){
                        // Skip cells with invalid lookup value
                        continue;
                    }
                    // Help user click un-flagged cells
                    if(this.displayBoard[lookupV][lookupH] !== "F"){
                        this.engage(lookupV,lookupH);
                    }
                }
            }
        }
        else{ console.log("Number reveal not triggered"); }
    }
    
    // Display CSS effects on revealing the cells
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

    // Highlight cells in response to left+right click
    highlight(v,h,action){
        // Proceed if target is an exposed number cell
        if(/[1-8]/.test(this.displayBoard[v][h])){
            let cells = document.getElementsByClassName("mine-cell");
            // Loop through its surroundings;
            for(let i = 0; i < 8; i++){
                let lookupV = v + vOffset[i];
                let lookupH = h + hOffset[i];
                let index = lookupV * this.hlen + lookupH;
                // CHange effect for valid cells
                if(!(lookupV > this.vlen-1 || lookupH > this.hlen-1 || lookupV < 0 || lookupH < 0)){
                    if(action === "revert"){
                        cells[index].style.backgroundColor = "rgba(255,255,255,0.35)";
                    }
                    else if(this.displayBoard[lookupV][lookupH] !== "F"){
                        cells[index].style.backgroundColor = "rgba(255,255,255,0.7)";
                    }
                }
            }
        }
    }

    // Update flag information to displayBoard variable
    flag(vPos, hPos){
        let target = this.displayBoard[vPos][hPos];
        // Proceed if cell is unrevealed
        if(target !== "R"){
            // Toggle between flag and un-flag
            if(target !== "F"){
                this.displayBoard[vPos][hPos] = "F";
                return "add flag"
            }
            else{
                this.displayBoard[vPos][hPos] = "_";
                return "remove flag"
            }
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
        document.getElementsByClassName("mine-count")[0].innerText = "M: " + mineNum;
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

reveal(vPos, hPos){
        
        // Directly exit when position is a mine
        if(this.board[vPos][hPos] === "X"){ return }
        // Exit if the cell is revealed already.
        if(this.board[vPos][hPos] === this.displayBoard[vPos][hPos]){ return }
        else { this.revealed += 1; }

        // Reveal itself
        if(["_","F"].indexOf(this.displayBoard[vPos][hPos]) >= 0){
            this.displayBoard[vPos][hPos] = this.board[vPos][hPos];
            this.display(vPos, hPos);
        }

        // If Blank, loop and reveal surroundings
        if(this.board[vPos][hPos] === " "){
            for(let vTemp = vPos - 1; vTemp <= vPos + 1; vTemp++){
                for(let hTemp = hPos - 1; hTemp <= hPos + 1; hTemp++){
                    // recursive on valid cell
                    if(vTemp < this.vlen && hTemp < this.hlen && vTemp >= 0 && hTemp >= 0){
                        this.reveal(vTemp,hTemp);
                    }
                }
            }
        }
    }

*/

