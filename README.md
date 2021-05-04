# Minesweeper
A modern designed web-based minesweeper game that supports board customization and responsive layout. Your goal in this game is to discover every cell on the board without touching any mine! The position of mines is hidden, but revealing non-mine cells will give you hint on where the mines may sit in the board.  
Live web game hosted at: [https://maxwellyu.netlify.app/](https://maxwellyu.netlify.app/)

## How to play?
Begin by clicking on the cells. The number beneath the blank indicates how many mines are hidden in the surrounding 8 cells. You win by revealing every non-mine cell but lose when revealing any mines.

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

## Additional Features
**Fast reveal**  
Left+Right click on a number cell to reveal cells quicker. It can be triggered when the number of nearby flagged cells equals to the number indicated in the cell, but note that if you flagged the wrong cell, you may reveal mines in the process!

**Customizable Board**  
Besides on the preset difficulties, you can make your own board to play with! You can make it super wide, tall, or uneven in size as you wish.  
(Maximum cells allowed: 2500 cells, but you can make it 2500*1)

## Production Log
**Challenge**
The biggest challenge in this project is to implement an efficient algorithm to handle cell revealing.  
Since revealing blank cells involves recursive function, revealing cells slows down the game when one click reveals too many empty cells at once. Thus, I refactored my code by avoiding repetitive filters, reducing the amount needed to recur by passing array as an argument, and avoid storing and executing repetitive codes.
