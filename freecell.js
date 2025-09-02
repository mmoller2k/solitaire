
const game_freecell = {
name: 'Freecell',

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
      { id: 'c1', type: 'cell' },
      { id: 'c2', type: 'cell' },
      { id: 'c3', type: 'cell' },
      { id: 'c4', type: 'cell' },
      { id: 'space', type: 'spacer', layout: 'blank' },
      { id: 'f1', type: 'foundation' },
      { id: 'f2', type: 'foundation' },
      { id: 'f3', type: 'foundation' },
      { id: 'f4', type: 'foundation' }
    ]
  },
  {
    slots: [
      { id: 't1', type: 'cascade', layout: 'fan-down' },
      { id: 't2', type: 'cascade', layout: 'fan-down' },
      { id: 't3', type: 'cascade', layout: 'fan-down' },
      { id: 't4', type: 'cascade', layout: 'fan-down' },
      { id: 't5', type: 'cascade', layout: 'fan-down' },
      { id: 't6', type: 'cascade', layout: 'fan-down' },
      { id: 't7', type: 'cascade', layout: 'fan-down' },
      { id: 't8', type: 'cascade', layout: 'fan-down' },
    ]
  }
],

deal: [
    { id: 't1', count: 7, faceUp: true },
    { id: 't2', count: 7, faceUp: true },
    { id: 't3', count: 7, faceUp: true },
    { id: 't4', count: 7, faceUp: true },
    { id: 't5', count: 6, faceUp: true },
    { id: 't6', count: 6, faceUp: true },
    { id: 't7', count: 6, faceUp: true },
    { id: 't8', count: 6, faceUp: true },
],

init() {
    const deck = new Deck();
    deck.shuffle();
    layoutSlots(game.layout);
    dealCards(game.deal, deck);
    renderGame();
},

draggable(card) {
    if(!card.slot)return false;
    const dragCards = card.slot.stack.cards.slice(card.index);
    if (dragCards.length > this._countEmpty() + 1) return false;
    return this._isValidSequence(dragCards);
},

drop(fromSlot, targetSlot, draggedCards) {
    if (targetSlot.type === 'cell') return targetSlot.isEmpty() && draggedCards.length == 1;

    if (targetSlot.type === 'foundation') {
    // Only allow one card at a time
        if (draggedCards.length !== 1) return false;
        return this._foundationReady(draggedCards[0], targetSlot);
    }

    if(targetSlot.type === 'cascade'){
        if (targetSlot.isEmpty()) return true;
        const topDragged = draggedCards[0]; // first card in the moving stack
        const topTarget = targetSlot.top(); // top card currently in slot (or null if empty)
        return ( (topTarget.prevRank() === topDragged.rank) && (topDragged.isOppositeColor(topTarget)) );
    }
    return false;
},


after(fromSlot, clickEvent = false) {
  if (!clickEvent) return null;
  if (fromSlot.type === 'cascade') {
    const card = fromSlot.top();
    if (this._getReadyFoundation(card)) return game.findSlots('cascade');
    else{
        const dest = this._getEmptyCell()
        if (dest){
            fromSlot.moveTop(dest);
        }
        return null;
    }
  }
  return null;
},

auto(fromSlot) {
    const foundationSlots = game.findSlots('foundation');
    const cells = game.findSlots('cell');
    if(fromSlot.isEmpty())return false;
    const card = fromSlot.top();
    for (const slot of foundationSlots) {
        if (this._foundationReady(card, slot)) {
            fromSlot.moveTop(slot);
            return true;
        }
    }
    return false;
},

victory() {
    const foundations = game.findSlots('foundation');
    return foundations.every(stack => stack.size() === 13);
},

_isValidSequence(cards) {
    for (let i = 0; i < cards.length - 1; i++) {
        if (cards[i].prevRank() !== cards[i + 1].rank) {
            return false;
        }
        if(!cards[i].isOppositeColor(cards[i+1])) return false;
    }
    return true;
},

_getEmptyCell() {
    const slots = [];
    slots.push(...game.findSlots('cell'));
    slots.push(...game.findSlots('cascade'));
    for( const slot of slots) {
        if( slot.isEmpty() ) return slot;
    };
    return null;
},

_countEmpty() {
    let n = 0;
    const slots = [];
    slots.push(...game.findSlots('cell'));
    slots.push(...game.findSlots('cascade'));
    for( const slot of slots) {
        if( slot.isEmpty() ) n++;
    };
    return n;
},

_getReadyFoundation(card) {
    const foundationSlots = game.findSlots('foundation');
    for( const slot of foundationSlots ){
        const f = this._foundationReady(card, slot);
        if(f) return slot;
    };
    return null;
},

_foundationReady(card, slot) {
    if ( slot.isEmpty() && card.rank === 'A' ) return true; //Ace
    if ( slot.isEmpty() ) return false;
    if ( card.suit === slot.top().suit && card.rank === slot.top().nextRank()) return true;
    return false;
},

};

document.addEventListener('DOMContentLoaded', registerGame(game_freecell.getConfig()));


