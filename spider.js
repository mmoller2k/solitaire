
const game_spider = {
name: 'Spider',

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
      { id: 's1', type: 'spacer', layout: 'blank' },
      { id: 'f1', type: 'foundation' },
      { id: 'f2', type: 'foundation' },
      { id: 'f3', type: 'foundation' },
      { id: 'f4', type: 'foundation' },
      { id: 'f5', type: 'foundation' },
      { id: 'f6', type: 'foundation' },
      { id: 'f7', type: 'foundation' },
      { id: 'f8', type: 'foundation' }
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
      { id: 't7', type: 'tableau', layout: 'fan-down' },
      { id: 't8', type: 'tableau', layout: 'fan-down' },
      { id: 't9', type: 'tableau', layout: 'fan-down' },
      { id: 't10', type: 'tableau', layout: 'fan-down' }
    ]
  }
],

deal: [
    { id: 't1', count: 5, faceUp: false },
    { id: 't2', count: 5, faceUp: false },
    { id: 't3', count: 5, faceUp: false },
    { id: 't4', count: 5, faceUp: false },
    { id: 't5', count: 4, faceUp: false },
    { id: 't6', count: 4, faceUp: false },
    { id: 't7', count: 4, faceUp: false },
    { id: 't8', count: 4, faceUp: false },
    { id: 't9', count: 4, faceUp: false },
    { id: 't10', count: 4, faceUp: false },
    { id: 't1', count: 1, faceUp: true },
    { id: 't2', count: 1, faceUp: true },
    { id: 't3', count: 1, faceUp: true },
    { id: 't4', count: 1, faceUp: true },
    { id: 't5', count: 1, faceUp: true },
    { id: 't6', count: 1, faceUp: true },
    { id: 't7', count: 1, faceUp: true },
    { id: 't8', count: 1, faceUp: true },
    { id: 't9', count: 1, faceUp: true },
    { id: 't10', count: 1, faceUp: true },
    { id: 'stock', count: -1, faceUp: false }
],

init() {
    const deck = new Deck(2);
    deck.shuffle();
    layoutSlots(game.layout);
    dealCards(game.deal, deck);
    renderGame();
},

draggable(card) {
    if(!card.slot)return false;
    const dragCards = card.slot.stack.cards.slice(card.index);
    return this._isValidSequence(dragCards);
},

drop(fromSlot, targetSlot, draggedCards) {
    if (targetSlot.type === 'stock') return false;

    const topDragged = draggedCards[0]; // first card in the moving stack
    const topTarget = targetSlot.top(); // top card currently in slot (or null if empty)

    if(!this._isValidSequence(draggedCards)) return false;
    if( targetSlot.type === 'foundation' ){
        console.log('foun', draggedCards.length);
        return draggedCards.length === 13;
    }
    if (!topTarget) {
        // Empty tableau: any valid sequence, not only kings may be placed
        return this._isValidSequence(draggedCards); //topDragged.rank === 'K';
    }

    // Check rank adjacency
    return topTarget.prevRank() === topDragged.rank;
},


after(fromSlot) {
  if (fromSlot.type === 'tableau') {
    if (fromSlot.faceDown()) {
        fromSlot.flipTop();
    }
  }
  else if(fromSlot.id === 'stock') {
    dealCards(this._dealMore, fromSlot);
    fromSlot.updateTitle();
  }
  return null; //nothing for auto
},

auto(fromSlot) {
    return null;
},

victory() {
    const foundations = game.findSlots('foundation');
    let empty = 0;
    for(const slot of foundations){
        empty += slot.isEmpty() ? 1 : 0;
    }
    
    return empty === 0;
},

_isValidSequence(cards) {
    for (let i = 0; i < cards.length - 1; i++) {
        if (cards[i].prevRank() !== cards[i + 1].rank) {
            return false;
        }
        // Uncomment for same-suit restriction
        if (cards[i].suit !== cards[i + 1].suit) {
            return false;
        }
    }
    return true;
},

_dealMore: [
    { id: 't1', count: 1, faceUp: true },
    { id: 't2', count: 1, faceUp: true },
    { id: 't3', count: 1, faceUp: true },
    { id: 't4', count: 1, faceUp: true },
    { id: 't5', count: 1, faceUp: true },
    { id: 't6', count: 1, faceUp: true },
    { id: 't7', count: 1, faceUp: true },
    { id: 't8', count: 1, faceUp: true },
    { id: 't9', count: 1, faceUp: true },
    { id: 't10', count: 1, faceUp: true }
]

};

document.addEventListener('DOMContentLoaded', registerGame(game_spider.getConfig()));


