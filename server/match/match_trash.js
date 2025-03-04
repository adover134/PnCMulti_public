import {shuffle} from "./shuffle.js";
import {Card} from "./match_card.js";

export class Trash {
    constructor() {
        this.cards = [];
    }

    // 트래쉬에 카드를 추가한다
	add_card(card) {
        this.cards.push(card);
    }
    // 트래쉬에 여러 카드를 추가한다
    add_cards(cards) {
        this.cards = [...cards, ...this.cards];
    }

    clean() {
        this.cards = [];
    }
}