
//export {Card, Deck, Stack, Slot}; //for modules later

const games = [];
let game;

const suits = ['clubs', 'spades', 'hearts', 'diamonds'];
const suits_ch = ['C', 'S', 'H', 'D'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'B'];
let new_slot_id=0;
let new_stack_id=103;
let currentRenderStyle = 'SVG';

let startTime = null;
let timerInterval = null;

function registerGame(config) {
    const game = new Game(config);
    games.push(game);
    //console.log('game', games.length, game.name);
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();
    document.getElementById('elapsed-time').textContent = '0:00';
}

function startGame(no) {
    game = games[no];
    game.showTitle();
    game.init();
    startTimer();
}        
    
function startGameName(name) {
    const g = games.find(g => g.name === name);
    if(!g){
        console.warn(`Game "${name}" not found`);
        return;
    }
    
    game = g;
    game.showTitle();
    game.init();
}        
    
class Game {
    constructor(config) {
        //console.log('game', config.name);
        this.name = config.name;
        this.layout = config.layout;
        this.deal = config.deal;
        this.init = config.init;
        this.draggable = config.draggable;
        this.drop = config.drop;
        this.after = config.after;
        this.auto = config.auto;
        this.victory = config.victory;
        this.allSlots = [];
    }
    
    getSlot(id) {
        const slot = this.allSlots.find(s => s.id === id);
        return slot;
    }
    
    findSlots(type) {
        const slots = this.allSlots.filter(s => s.type === type);
        return slots;
    }
    
    showTitle() {
        document.getElementById('title').textContent = this.name;
    }
}

class Card {
    constructor(rank, suit, faceUp = true) {
        this.rank = rank;
        this.suit = suit;
        this.faceUp = faceUp;
        this.slotId = 0;
        this.index = 0;
        this.isCard = !(faceUp && rank === 'B'); //use face-up backs as empty slots
        this.element = cardGraphic(this);
        this.element.setAttribute('draggable', false);
        this.element.classList.add('card');
    }
    
    flip() {
        this.faceUp = ! this.faceUp;
    }
    
    showFace(faceUp = true) {
        this.faceUp = faceUp;
    }
    
    newElement() {
        this.element.remove;
        this.element = cardGraphic(this);
        this.element = updateCardElement(this);
        return this.element;
    }
    
    isBlack() { return (this.suit === 'clubs') || (this.suit === 'spades'); }
    isRed() { return (this.suit === 'hearts') || (this.suit === 'diamonds'); }
    
    isOppositeColor(targetCard) {
        return (this.isRed() && targetCard.isBlack()) || (this.isBlack() && targetCard.isRed());
    }
    
    nextRank() {
        const idx = ranks.indexOf(this.rank);
        if( idx === null || idx < 0 ) return null;
        else if ( idx < ranks.length - 2 ) return ranks[idx + 1];
        else return null;
    }
    
    prevRank() {
        const idx = ranks.indexOf(this.rank);
        if( idx === null || idx < 1 ) return null;
        else if ( idx < ranks.length - 1 ) return ranks[idx - 1];
        else return null;
    }
    
}

class Deck {
    constructor(decks = 1) {
        this.cards = [];
        for(let i=0; i<decks; i++){
            for (const suit of suits) {
                for (let rank of ranks.slice(0,13)) { 
                    this.cards.push(new Card(rank, suit, false));
                }
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    size() {
        return this.cards.length;
    }
    
    deal() {
        const card = this.cards.pop();
        return card;
    }
    
    dealTo(dest, faceUp = false) {
        const card = this.cards.pop();
        card.showFace(faceUp);
        dest.stack.add(card);
    }
}

class Stack {
    constructor() {
        this.cards = [];
        this.id = new_stack_id;
        new_stack_id = new_stack_id + 1;
    }

    add(card) {
        this.cards.push(card);
    }

    addMultiple(cards) {
        this.cards.push(...cards);
    }

    remove(count = 1) {
        return this.cards.splice(this.cards.length - count, count);
    }

    top() {
        return this.cards[this.cards.length - 1];
    }
    
    pop() {
        const card = this.top();
        this.cards.pop();
        return card;
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    getCards() {
        return this.cards;
    }
    
    size() {
        return this.cards.length;
    }
    
    faceUp() {
        return !isEmpty() && this.top().faceUp;
    }

    faceDown() {
        return !this.isEmpty() && !this.top().faceUp;
    }
    
    showFace(faceUp = true) {
        this.top().showFace(faceUp);
    }
    
    flip() {
        this.cards.reverse();
        for(const card of this.cards){
            card.flip();
        }
    }
   
}

class Slot {
    constructor(id, type, layout = 'stack', fmax = -1) {
        this.type = type; // e.g. 'tableau', 'foundation', 'stock', 'waste'
        this.layout = layout; // 'stack', 'fan-down', etc.
        this.stack = new Stack();
        this.element = document.createElement('div');
        this.element.classList.add('slot', type);
        this.element.title = type;
        this.id = id;//new_slot_id;
        new_slot_id = new_slot_id + 1;
        this.fanMax = fmax;
        this.element.setAttribute('draggable', false);

     // Drag-and-drop event listeners
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
        });

        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            pushUndo();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const fromSlot = getSlotById(data.fromSlotId);
            if (!fromSlot){
                return;
            }
            const movingCards = fromSlot.stack.cards.splice(data.cardIndex);
            if(game.drop(fromSlot, this, movingCards)){ //if valid drop
                this.stack.cards.push(...movingCards);
                const autoSlots = game.after(fromSlot);
                autoMoveSlots(autoSlots);
                showVictory();
            }
            else{
                fromSlot.stack.cards.push(...movingCards);
            }
            this.updateTitle();
            fromSlot.render();
            this.render();
        });
    }
    
    render() {
        const container = this.element;
        container.innerHTML = '';
        container.appendChild(createSlotElement(this));
    }
    
    isEmpty() {
        return this.stack.isEmpty();
    }
    
    size() {
        return this.stack.size();
    }
    
    top() {
        return this.stack.top();
    }
    
    moveTop(dest) {
        if(!this.isEmpty()){
            const card = this.stack.pop();
            dest.stack.add(card);
            this.render();
            dest.render();
        }
    }
    
    dealTo(dest, faceUp = false) { // same as Deck
        if(!this.isEmpty()){
            const card = this.stack.pop();
            card.showFace(faceUp);
            dest.stack.add(card);
            this.render();
            dest.render();
        }
    }
    
    showFace(faceUp = true) {
        this.top().showFace(faceUp);
    }
    
    faceDown() {
        return this.stack.faceDown();
    }
    
    flipTop() {
        if(!this.isEmpty()){
            this.top().flip();
            this.render();
        }
    }
    
    flipStack(){
        this.stack.flip();
        this.render();
    }
    
    moveStack(dest) {
        if(!this.isEmpty()){
            dest.stack.addMultiple(this.stack.cards);
            this.stack.remove(this.size());
            this.render();
        }
    }

    updateTitle() {
      if( this.layout === 'stack' ){
          this.element.title = `${this.type} (${this.size()})`;
      }
    }

    update() {
        this.stack.cards.forEach((card, index) => {
            card.index = index;
            card.slotId = this.id;
            card.slot = this;
            updateCardElement(card);
        });            
    }
}

function createEmptySlotElement(slot) {
    const card = new Card('B', 'diamonds');
    card.slot=slot;
    const el = updateCardElement(card);
    el.classList.add('slot');
    return card.element;
}

function cardGraphic_txt(card) {
    const rank = card.faceUp ? card.rank : 'B';    
    const s = card.faceUp ? suits.indexOf(card.suit) : 0;
    const suits_ch = {
        0: '♣', // Clubs
        1: '♠', // Spades
        2: '♥', // Hearts
        3: '♦', // Diamonds
    };
    const cardEl = document.createElement('div');
    // Red suits in red, black suits in black
    if (card.isRed()) {
        cardEl.style.color = 'red';
    } else {
        cardEl.style.color = 'black';
    }

    if(card.rank == 'B' && card.suit == "diamonds") {
        cardEl.style.backgroundColor = '#a09030';
    }
    else if(card.rank == 'B'){
        cardEl.style.backgroundColor = '#0a40a0';
    }
    else{        
        // Rank (top-left)
        const rankTop = document.createElement('div');
        rankTop.textContent = `${card.rank}${suits_ch[s]}`;
        rankTop.style.textAlign = 'left';
        rankTop.style.fontSize = '1.5em';

        // Suit symbol (center)
        const suitCenter = document.createElement('div');
        suitCenter.textContent = suits_ch[s];
        suitCenter.style.fontSize = '2.5em';
        suitCenter.style.textAlign = 'center';
        suitCenter.style.margin = '4px 0';

        // Rank again (bottom-right)
        const rankBottom = document.createElement('div');
        rankBottom.textContent = `${suits_ch[s]}${card.rank}`;
        rankBottom.style.textAlign = 'right';
        rankBottom.style.fontSize = '1.5em';

        // Append to card
        cardEl.appendChild(rankTop);
        cardEl.appendChild(suitCenter);
        cardEl.appendChild(rankBottom);
        
        cardEl.style.backgroundColor = 'white';
    }
    
    // Optional: style like a playing card
    cardEl.style.border = '1px solid #c0c0c0';
    cardEl.style.borderRadius = '6px';
    cardEl.style.width = '60px';
    cardEl.style.height = '85px';
    cardEl.style.padding = '4px';
    cardEl.style.display = 'flex';
    cardEl.style.flexDirection = 'column';
    cardEl.style.justifyContent = 'space-between';
    cardEl.style.fontFamily = 'monospace';
    cardEl.classList.add('card');
    return cardEl;
}

function cardGraphic_utf8(card) {
    const rank = card.rank;    
    const s = suits.indexOf(card.suit);
    const cardDiv = document.createElement('div');
    cardDiv.style.fontSize = '58px';
    cardDiv.style.lineHeight = '1';
    cardDiv.style.width = '1.2em';
    cardDiv.style.height = '1.4em';
    cardDiv.style.display = 'inline-flex';
    cardDiv.style.alignItems = 'center';
    cardDiv.style.justifyContent = 'center';
    cardDiv.style.border = '1px solid #c0c0c0';
    cardDiv.style.borderRadius = '8px';
    cardDiv.style.background = 'white';
    cardDiv.style.userSelect = 'none'; // Prevent highlighting

    const symbols = {
        0: ['🃑','🃒','🃓','🃔','🃕','🃖','🃗','🃘','🃙','🃚','🃛','🃝','🃞'],
        1: ['🂡','🂢','🂣','🂤','🂥','🂦','🂧','🂨','🂩','🂪','🂫','🂭','🂮'],
        2: ['🂱','🂲','🂳','🂴','🂵','🂶','🂷','🂸','🂹','🂺','🂻','🂽','🂾'],
        3: ['🃁','🃂','🃃','🃄','🃅','🃆','🃇','🃈','🃉','🃊','🃋','🃍','🃎']
    };

    let symbol;
    if(card.rank == 'B' && card.suit == "diamonds"){
        cardDiv.style.background = '#a09030';
        cardDiv.style.color = 'white';
        symbol = ' '; 
    }
    else if (card.rank == 'B') {
        // Simple Unicode pattern for back
        cardDiv.style.background = '#0a40a0';
        cardDiv.style.color = 'white';
        symbol = '▒'; 
    } else {
        const rankOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        const idx = rankOrder.indexOf(card.rank);
        const s = suits.indexOf(card.suit);
        if(card.isRed()){
            cardDiv.style.color = 'red';
        }
        else{
            cardDiv.style.color = 'black';
        }
        symbol = symbols[s][idx];
    }

    cardDiv.textContent = symbol;
    cardDiv.classList.add('card');
    return cardDiv;
}

function cardGraphic_png(card) {
    const el = document.createElement('div');
    const cardWidth = 73;
    const cardHeight = 98;
    const rank = card.rank;
    const s = suits.indexOf(card.suit);
    const r = ranks.indexOf(rank);
    const x = (r * cardWidth)+2;    
    const y = (s * cardHeight)+2;
    el.style.backgroundImage = `url(cards.png)`;
    el.style.backgroundPosition = `-${x}px -${y}px`;
    el.style.width = `${cardWidth-4}px`;
    el.style.height = `${cardHeight-4}px`;
    el.classList.add('card');
    return el;
}

const svgNS = "http://www.w3.org/2000/svg";

// Suit metadata
const suits_svg = {
  spades:   { symbol: "♠", color: "#111" },
  clubs:    { symbol: "♣", color: "#111" },
  hearts:   { symbol: "♥", color: "#c1172c" },
  diamonds: { symbol: "♦", color: "#c1172c" }
};

// Pip columns (0..100)
const X = {
  IL: 30,  // inner left
  C: 50,   // center
  IR: 70,  // inner right
};

// Pip rows (0..150)
const Y = {
  T:  32,  // top row
  TC: 48,  // top center
  U:  54,  // upper-mid row
  H:  61,  // higher
  M:  75,  // middle
  L:  87,  //lower
  D:  94,  // lower-mid row
  BC: 102,  // bottom center
  B: 118   // bottom row
};

const pipLayouts = {
  "A":  [[X.C,  Y.M]],

  "2":  [[X.C,  Y.T],
         [X.C,  Y.B]],

  "3":  [[X.C,  Y.T],
         [X.C,  Y.M],
         [X.C,  Y.B]],

  "4":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.IL, Y.B], [X.IR, Y.B]],

  "5":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.C,  Y.M],
         [X.IL, Y.B], [X.IR, Y.B]],

  "6":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.IL, Y.M], [X.IR, Y.M],
         [X.IL, Y.B], [X.IR, Y.B]],

  "7":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.IL, Y.M], [X.IR, Y.M],
         [X.IL, Y.B], [X.IR, Y.B],
         [X.C,  Y.U]],

  "8":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.IL, Y.H], [X.IR, Y.H],
         [X.IL, Y.L], [X.IR, Y.L],
         [X.IL, Y.B], [X.IR, Y.B]],

  "9":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.IL, Y.H], [X.IR, Y.H],
         [X.IL, Y.L], [X.IR, Y.L],
         [X.IL, Y.B], [X.IR, Y.B],
         [X.C,  Y.M]],

  "10":  [[X.IL, Y.T], [X.IR, Y.T],
         [X.IL, Y.H], [X.IR, Y.H],
         [X.IL, Y.L], [X.IR, Y.L],
         [X.IL, Y.B], [X.IR, Y.B],
         [X.C,  Y.TC], [X.C,  Y.BC]],
};

function addFaceClone(svgElement, card) {
  const flipy = card.suit == "hearts" || card.suit == "diamonds";
  const rank = card.rank == 'J' ? "jack" : card.rank == 'Q' ? "queen" : "king";
  const symbol = document.getElementById("facecard");
  if (!symbol) return; //throw new Error("#facecard symbol missing");

  // wrapper that receives the rank class
  const wrapper = document.createElementNS(svgNS, "g");
  wrapper.classList.add(rank);
  if(!flipy){
      wrapper.setAttribute("transform", `translate(50,75) scale(0.46 0.46)`);
  }
  else{
    wrapper.setAttribute("transform", `translate(50,75) scale(-0.46 0.46)`);
  }

  // create up-group and clone element children (skip text nodes)
  const up = document.createElementNS(svgNS, "g");
  Array.from(symbol.childNodes).forEach(node => {
    if (node.nodeType === 1) { // Element only
      const clone = node.cloneNode(true);
      up.appendChild(clone);
    }
  });

  // center, scale and recenter the artwork (top and bottom)
  const dn = up.cloneNode(true);
  dn.setAttribute("transform", `rotate(180 0 0)`);

  // frame
  const frme = document.createElementNS(svgNS, "rect");
  frme.setAttribute("x", 20); frme.setAttribute("y", 20);
  frme.setAttribute("width", 60); frme.setAttribute("height", 110);
  frme.setAttribute("rx", 8); frme.setAttribute("ry", 8);
  frme.setAttribute("fill", "white"); frme.setAttribute("stroke", "black");
  frme.setAttribute("transform", `translate(-106,-164) scale(2.12 2.19)`); //-106 -164 212 329
  wrapper.appendChild(frme);

  wrapper.appendChild(up);
  wrapper.appendChild(dn);
  svgElement.appendChild(wrapper);
  return wrapper;
}

function cardGraphic_svg(card) {
  const suit = suits_svg[card.suit];
  const rank = card.rank;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 150");

  // background
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", 0); rect.setAttribute("y", 0);
  rect.setAttribute("width", 100); rect.setAttribute("height", 150);
  rect.setAttribute("rx", 8); rect.setAttribute("ry", 8);
  rect.setAttribute("fill", "white"); rect.setAttribute("stroke", "black");
  svg.appendChild(rect);
  
  if(card.rank == 'B' && card.suit == "diamonds") {
        rect.setAttribute("fill", "#a93");
  }
  else if(card.rank == 'B') {
    rect.setAttribute("fill", "#04a");
    const b0 = document.createElementNS(svgNS, "use");
    const b1 = document.createElementNS(svgNS, "use");
    const b2 = document.createElementNS(svgNS, "use");
    const b3 = document.createElementNS(svgNS, "use");
    b0.setAttribute("href", "#cardback");
    b1.setAttribute("href", "#cardback");
    b2.setAttribute("href", "#cardback");
    b3.setAttribute("href", "#cardback");
    b0.setAttribute("transform", `translate(50,75) scale(0.46 0.46)`);
    b1.setAttribute("transform", `translate(50,75) scale(-0.46 0.46)`);
    b2.setAttribute("transform", `translate(50,75) scale(-0.46 -0.46)`);
    b3.setAttribute("transform", `translate(50,75) scale(0.46 -0.46)`);

    svg.appendChild(b0);
    svg.appendChild(b1);
    svg.appendChild(b2);
    svg.appendChild(b3);
  }
  else {

      // corners
      const topRank = document.createElementNS(svgNS, "text");
      topRank.textContent = rank;
      topRank.setAttribute("x", 6); topRank.setAttribute("y", 18);
      topRank.setAttribute("font-size", "18"); topRank.setAttribute("fill", suit.color);
      svg.appendChild(topRank);

      const topSuit = document.createElementNS(svgNS, "text");
      topSuit.textContent = suit.symbol;
      topSuit.setAttribute("x", 6); topSuit.setAttribute("y", 32);
      topSuit.setAttribute("font-size", "14"); topSuit.setAttribute("fill", suit.color);
      svg.appendChild(topSuit);

      const cornerBR = document.createElementNS(svgNS, "g");
      cornerBR.setAttribute("transform", "rotate(180 92 135)");
      const brRank = document.createElementNS(svgNS, "text");
      brRank.textContent = rank; brRank.setAttribute("x", 90); brRank.setAttribute("y", 137);
      brRank.setAttribute("font-size", "18"); brRank.setAttribute("fill", suit.color);
      const brSuit = document.createElementNS(svgNS, "text");
      brSuit.textContent = suit.symbol; brSuit.setAttribute("x", 90); brSuit.setAttribute("y", 151);
      brSuit.setAttribute("font-size", "12"); brSuit.setAttribute("fill", suit.color);
      cornerBR.appendChild(brRank); cornerBR.appendChild(brSuit);
      svg.appendChild(cornerBR);

      // pips
      const r = ranks.indexOf(rank);
      if(r < 10){
          const pips = pipLayouts[rank];
          pips.forEach(([x, y]) => {
            const t = document.createElementNS(svgNS, "text");
            t.textContent = suit.symbol;
            t.setAttribute("x", x);
            t.setAttribute("y", y);
            if(rank == 'A' && card.suit == 'spades'){
                t.setAttribute("font-size", "64");
            }
            else{
                t.setAttribute("font-size", "32");
            }
            t.setAttribute("fill", suit.color);
            t.setAttribute("text-anchor", "middle");
            t.setAttribute("dominant-baseline", "middle");
            const flipx = y > Y.M;
            if (flipx) t.setAttribute("transform", `rotate(180 ${x} ${y})`);
            svg.appendChild(t);
          });
      }
      else { //face cards
        addFaceClone(svg, card);
      }
  }
  const wrap = document.createElement("div");
  svg.setAttribute("display", "inline-block");
  wrap.style.width = "75px";
  wrap.style.height = "inline";
  wrap.classList.add('card');
  wrap.appendChild(svg);
  return wrap;
}

function cardGraphic(card) {

    //console.log('gx',card.rank,card.suit);
    if (currentRenderStyle === 'image') {
        return cardGraphic_png(card);
    } else if (currentRenderStyle === 'unicode') {
        return cardGraphic_utf8(card);
    } else if (currentRenderStyle === 'text') {
        return cardGraphic_txt(card);
    } else if (currentRenderStyle === 'SVG') {
        return cardGraphic_svg(card);
    }
}

function addCardEvents(card, el) {
    if (el.draggable) {
        el.addEventListener('dragstart', (e) => {
            if(!el.draggable) {
                e.preventDefault(); // stop phantom drags
                return;            
            }
            const movingCards = card.slot.stack.cards.slice(card.index);
            e.dataTransfer.setData('text/plain', JSON.stringify({
                fromSlotId: card.slot.id,
                cardIndex: card.index
            }));
            card.slot.element.classList.add('drag-source');
            // Create a preview container
            const preview = document.createElement('div');
            preview.style.position = 'absolute';
            preview.style.top = '-9999px';   // Far offscreen
            preview.style.left = '-9999px';
            preview.style.zIndex = '-1'; // hide from layout
            preview.style.pointerEvents = 'none';
            preview.style.boxShadow = '4px 4px 8px rgba(0, 0, 0, 0.3)';
            preview.style.borderRadius = '8px';
            preview.style.overflow = 'visible';  // allow cards to fan out
            preview.style.opacity = '0.9';

            // Add each card's visual to the preview
            movingCards.forEach((c, i) => {
                const cardEl = cardGraphic(c);
                cardEl.style.position = 'absolute';
                cardEl.style.top = `${i * 24}px`;
                cardEl.style.left = `${i * 2}px`;
                cardEl.style.boxShadow = '2px 2px 4px rgba(0, 0, 0, 0.2)';
                cardEl.style.borderRadius = '6px';
                cardEl.style.transform = 'rotate(-1deg) scale(1.8)';
                preview.appendChild(cardEl);
            });

            document.body.appendChild(preview);

            e.dataTransfer.setDragImage(preview, 30, 30);

            // Cleanup after short delay
            setTimeout(() => document.body.removeChild(preview), 0);
            
            e.target.addEventListener('dragend', () => {
              preview.remove();
            });                                
        });

        el.addEventListener('dragend', (e) => {
            const json = e.dataTransfer.getData('text/plain');
            if(json.length == 0) return;
            const data = JSON.parse(json);
            const fromSlot = getSlotById(data.fromSlotId);
            fromSlot.element.classList.remove('drag-source');
        });
    }
    
    el.addEventListener('click', () => {
        if(el.isCard && !el.isFaceUp){
            card.slot.flipTop();
        }
        pushUndo();
        const autoSlots=game.after(card.slot); //handle clicks on empty slots
        autoMoveSlots(autoSlots);
    });
}

function updateCardElement(card) {
    const el = card.element;
    card.id = `card-${card.rank}-${card.suit}`;
    el.setAttribute('draggable', game.draggable(card));
    addCardEvents(card, el);
    return el;
}

function createSlotElement(slot) {

    const container = document.createElement('div');
    container.innerHTML = '';
    let fmax = slot.size();

    if (slot.layout === 'blank') {
        const spacer = document.createElement('div');
        spacer.classList.add('slot-spacer');
        container.appendChild(spacer);
        return container;
    }

    if (slot.isEmpty()) {
        container.appendChild(createEmptySlotElement(slot));
        return container;
    }
    
    if(slot.fanMax > 0 && slot.fanMax < slot.size()) {
        fmax = slot.fanMax;
    }

    slot.update();
    const cards = slot.stack.cards.slice(slot.size() - fmax);

    cards.forEach((card, index) => {
        const back = cardGraphic(new Card('B','clubs', false));
        addCardEvents(card, back);
        const cardEl = card.faceUp ? card.element : back;
        cardEl.style.position = 'absolute';

        if (slot.layout === 'fan-down') {
            cardEl.style.top = `${index * 20}px`;
            cardEl.style.left = `${index * 1}px`;
        } else if (slot.layout === 'fan-right') {
            cardEl.style.left = `${index * 12}px`;
            cardEl.style.top = `${index * 1}px`;
        }
        else{
            cardEl.style.left = `0px`;
            cardEl.style.top = `0px`;
        }
        container.appendChild(cardEl);
    });
    return container;
}

function isRed(suit) {
    return suit === 'hearts' || suit === 'diamonds';
}

function isBlack(suit) {
    return suit === 'clubs' || suit === 'spades';
}

function getSlotById(id) {
    for (const slot of game.allSlots) {
        if (slot.id === id) return slot;
    }
}
    
function renderGame(){
    for (const slot of game.allSlots) { //Object.values(game.slots).flat()) {
        slot.update();
        slot.render();
    }
}

function layoutSlots(config) {
  game.allSlots.length = 0; // clear previous slots
  const playArea = document.getElementById('game');
  playArea.innerHTML = ''; // clear game area

  config.forEach(group => {
    const row = document.createElement('div');
    row.className = 'slot-row';
    row.style.gap = `${group.gap ?? 16}px`;
    row.classList.add('row');

    group.slots.forEach((slotConf, index) => {
      const slot = new Slot(slotConf.id, slotConf.type, slotConf.layout, slotConf.fmax);
      game.allSlots.push(slot);
      row.appendChild(slot.element);
    });

    playArea.appendChild(row);
  });
}

function snapGameState() {
        return JSON.stringify({
        slots: game.allSlots.map(slot => ({
            id: slot.id,
            cards: slot.stack.cards.map(card => ({
                rank: card.rank,
                suit: card.suit,
                faceUp: card.faceUp
            }))
        }))
    });
}

function loadGameState(snapshot) {
    const state = JSON.parse(snapshot);
    state.slots.forEach((savedSlot, i) => {
        const slot = game.allSlots.find(s => s.id === savedSlot.id);
        slot.stack.cards = savedSlot.cards.map(c => new Card(c.rank,c.suit,c.faceUp)); 
    });
    reRenderAllCards();
}

const undoStack = [];

function pushUndo() {
    undoStack.push(snapGameState());
}

function undoLastMove() {
    if (undoStack.length === 0) return;
    const snapshot = undoStack.pop();
    loadGameState(snapshot);
}

function reRenderAllCards() {
    game.allSlots.forEach(slot => {
        slot.stack.cards.forEach(card => {
            card.newElement();
        });
        slot.render();
    });
}


function showVictory() {
    if(game.victory()){
        stopTimer();
        setTimeout(() => {
            alert("🎉 Congratulations! You’ve won the game! 🎉");
        }, 200);
    }
}

function dealCards(dealScript, deck) {
  for (const step of dealScript) {
    const slot = game.getSlot(step.id);
    if (step.count < 0) {
      while (!deck.isEmpty()) {
        deck.dealTo(slot, step.faceUp);
      }
    } else {
      for (let i = 0; i < step.count; i++) {
        deck.dealTo(slot, step.faceUp);
      }
    }
    slot.updateTitle();
  }
}

function createGameMenu() {
  const menuArea = document.getElementById('game-menu');
  const menu = document.createElement("select");
  const names = games.map(g => g.name);
  names.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name; //.charAt(0).toUpperCase() + name.slice(1);
    menu.appendChild(option);
  });
  // Restore last saved game or use default
  const saved = localStorage.getItem("gameName") || "Klondike";
  menu.value = saved;
  currentGame = saved;
  //console.log('Start', currentGame);
  startGameName(currentGame);

  // Update when selection changes
  menu.addEventListener("change", () => {
    const chosen = menu.value;
    localStorage.setItem("gameName", chosen);
    currentGame = chosen;
    startGameName(currentGame);
  });

  menuArea.appendChild(menu);
}

// Create the render style menu
function createRenderMenu() {
  const statusArea = document.getElementById('render-menu');
    const undoButton = document.createElement('button');
    undoButton.textContent = 'Undo';
    undoButton.onclick = undoLastMove;
  statusArea.appendChild(undoButton);

  const menu = document.createElement("select");
  const styles = ["image", "unicode", "text", "SVG"]; // expand if you add more
  styles.forEach(style => {
    const option = document.createElement("option");
    option.value = style;
    option.textContent = style.charAt(0).toUpperCase() + style.slice(1);
    menu.appendChild(option);
  });

  // Restore last saved style or use default
  const saved = localStorage.getItem("renderStyle") || "image";
  menu.value = saved;
  currentRenderStyle = saved;
  reRenderAllCards(); // rebuild with saved style

  // Update when selection changes
  menu.addEventListener("change", () => {
    const chosen = menu.value;
    localStorage.setItem("renderStyle", chosen);
    currentRenderStyle = chosen;
    reRenderAllCards();
  });
  //menu.style.zIndex = "1000";
  //menu.style.position = "absolute";
  statusArea.appendChild(menu);
}

function autoMoveSlots(fromSlots, delay = 200) {
    if(!fromSlots) return;
    const tryMove = () => { //capture 'this'
        for (let slot of fromSlots) {
            if (game.auto(slot)) {
                setTimeout(tryMove, delay);
                return true;
            }
        }
        showVictory();
        return false;

        // If we got here, no moves possible — stop.
    }
    return tryMove();
}

window.addEventListener("DOMContentLoaded", () => {
  createGameMenu();
  createRenderMenu();
});



