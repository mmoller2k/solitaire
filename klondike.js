
//import {Deck, Slot} from './cards2,js'; //for modules later

const game_klondike = {
name: 'Klondike',

getConfig() {
    return {
        name: this.name,
        layout: this.layout,
        deal: this.deal,
        init: this.init,
        draggable: this.draggable.bind(this),
        drop: this.drop.bind(this),
        after: this.after.bind(this),
        auto: this.auto.bind(this),
        victory: this.victory.bind(this)
    };
},

layout: [
  {
    slots: [
      { id: 'stock', type: 'stock' },
      { id: 'waste', type: 'waste', layout: 'fan-right', fmax: 3 },
      { id: 'space', type: 'spacer', layout: 'blank' },
      { id: 'f1', type: 'foundation' },
      { id: 'f2', type: 'foundation' },
      { id: 'f3', type: 'foundation' },
      { id: 'f4', type: 'foundation' }
    ]
  },
  {
    slots: [
      { id: 't1', type: 'tableau', layout: 'fan-down' },
      { id: 't2', type: 'tableau', layout: 'fan-down' },
      { id: 't3', type: 'tableau', layout: 'fan-down' },
      { id: 't4', type: 'tableau', layout: 'fan-down' },
      { id: 't5', type: 'tableau', layout: 'fan-down' },
      { id: 't6', type: 'tableau', layout: 'fan-down' },
      { id: 't7', type: 'tableau', layout: 'fan-down' }
    ]
  }
],

deal: [
    { id: 't2', count: 1, faceUp: false },
    { id: 't3', count: 2, faceUp: false },
    { id: 't4', count: 3, faceUp: false },
    { id: 't5', count: 4, faceUp: false },
    { id: 't6', count: 5, faceUp: false },
    { id: 't7', count: 6, faceUp: false },
    { id: 't1', count: 1, faceUp: true },
    { id: 't2', count: 1, faceUp: true },
    { id: 't3', count: 1, faceUp: true },
    { id: 't4', count: 1, faceUp: true },
    { id: 't5', count: 1, faceUp: true },
    { id: 't6', count: 1, faceUp: true },
    { id: 't7', count: 1, faceUp: true },
    { id: 'stock', count: -1, faceUp: false }
],    

init() {
    const deck = new Deck();
    deck.shuffle();
    layoutSlots(this.layout);
    dealCards(this.deal, deck);
    renderGame();
},

draggable(card) {
    //console.log(card.id, card.faceUp && card.isCard);
    return card.faceUp && card.isCard;
},

drop(fromSlot, toSlot, cards) {
  if (!cards.length) return false;

  const movingCard = cards[0];

  // Prevent dropping onto the draw/deck pile
  if (toSlot.type === 'stock') return false;
  if (fromSlot.type === 'stock' && toSlot.type === 'waste') return true;

  // --- Foundation ---
  if (toSlot.type === 'foundation') {
    // Only allow one card at a time
    if (cards.length !== 1) return false;
    return this._foundationReady(movingCard, toSlot);
  }

  // --- Tableau ---
  if (toSlot.type === 'tableau') {
    const top = toSlot.top();
    if (!top) {
      // Can only place a King on an empty tableau
      return movingCard.rank === 'K';
    }
    // Must be opposite color and descending rank
    return movingCard.isOppositeColor(top) && movingCard.rank === top.prevRank();
  }

  // Don't allow dropping elsewhere (like waste → deck)
  return false;
},

after(fromSlot, clickEvent = false) {
  const waste = game.getSlot('waste');
  if (fromSlot.type === 'tableau') {
    if (fromSlot.faceDown()) { //auto flip next card
        fromSlot.flipTop();
        return null;
    }
    else{ //click to auto complete
        const slots = [];
        slots.push( game.getSlot('waste') ); // Try waste pile first
        slots.push(...game.findSlots('tableau')); // Then tableau slots
        if(clickEvent) return slots;
        return null;
        //this._autoMoveSlots(slots);
    }
  }
  else if (fromSlot.type === 'stock') { //click stock
    if(!fromSlot.isEmpty()){ //move stock to waste
        fromSlot.moveTop(waste);
        fromSlot.updateTitle();
        waste.flipTop();
        return null;
    }
    else{ // if stock is empty
        waste.moveStack(fromSlot); //refill from waste
        fromSlot.flipStack();
        fromSlot.updateTitle();
        return null;
    }
  }
  else if (fromSlot.type === 'waste') { //move waste to foundation
        return [fromSlot]; //call auto
        //this._autoMove(fromSlot);
  }
},

auto(fromSlot) {
    const foundationSlots = game.findSlots('foundation');
    if(fromSlot.isEmpty())return false;
    const card = fromSlot.top();
    for (const slot of foundationSlots) {
        if (this._foundationReady(card, slot)) {
            fromSlot.moveTop(slot);
            if(fromSlot.faceDown()){
                fromSlot.flipTop();
            }
            return true;
        }
    }
    return false;
},

victory() {
    const foundations = game.findSlots('foundation');
    return foundations.every(stack => stack.size() === 13);
},

//********* Helper functions *********
_foundationReady(card, slot) {
    if ( slot.isEmpty() && card.rank === 'A' ) return true; //Ace
    if ( slot.isEmpty() ) return false;
    if ( card.suit === slot.top().suit && card.rank === slot.top().nextRank()) return true;
    else return false;
    
},

};

document.addEventListener('DOMContentLoaded', registerGame(game_klondike.getConfig()));


