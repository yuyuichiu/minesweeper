# Minesweeper
A modernly designed web based minesweeper game that supports board customization and responsive layout.  
Your goal in this game is to discover every cells on the board without touching any mine!  
The position of mines are hidden, but revealing non-mine cells will give you hint on where the mines may sit in the board.

**Instructions**  
Begin by clicking on the cells. The number beneath the blank indicates how many mines are hidden in the surrounding 8 cells. You win by revealing every non-mine cells, but lose when revealing any mines.  

There are 3 types of cells:
1. Blank cells
> Means no cells are nearby, thus it automatically reveals its surroundings.
2. Number cells
> The number indicates how many mines are nearby. 
3. Mine cells
> You lose when you reveal it, avoid them at all cost.  
```javascript
[X,1, , ] // Mine, num, blank, blank
[1,2,1,1] // numbers (each represents number of mines in nearby 2*2 area)
[ ,1,X,1] // numbers and mines
```

*Flag* by right clicking, or toggle flag mode through the flag button, to flag cells.  
Flagged cells are not clickable, so it can be used as a safety marker for potential mines.  
You can remove flags by flagging it again. It is not required for you to flag cells to win the game.

**Fast reveal**  
Left+Right click on a number cell to reveal cells quicker. It can be triggered when the number of nearby flagged cells equals to the number indicated in the cell, but note that if you flagged the wrong cell you may reveal mines in the process!

**Customizable Board**  
Besides on the default difficulties, you can make your own board to play with!
You can make it super wide, tall or uneven in size as you wish.
(Maximum cells allowed: 2500 cells, but you can make it 2500*1)
