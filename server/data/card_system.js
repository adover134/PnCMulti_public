export class CardSystem {
    constructor() {
        // how many cards does this player has?
        // this.cards[0] == 3이면 cards.json의 첫 번째 카드를 3장 가졌음을 의미함
        this.cards = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];

        // 기본 덱 10장
        this.basic_deck = [0, 0, 1, 1, 2, 3, 9, 18, 28, 29];
        // this.basic_deck = [0, 0, 1, 2, 3, 9, 18, 28, 28, 29];

        // 플레이어가 소유하는 덱 목록 - 기본 덱 하나만 있다.
        this.deck = [Object.assign([], this.basic_deck)];

        this.chosen_deck = 0;

        this.gem = [0, 0];
        this.pieces = 0;
    }

    add_deck(cards) {
        this.deck.push(cards);
    }

    get_deck(deck_id) {
        return this.deck[deck_id];
    }

    set_deck(deck_id, cards) {
        this.deck[deck_id] = cards;
    }
}