import {shuffle} from "./shuffle.js";
import {Card} from "./match_card.js";

export class Deck {
    constructor() {
        this.cards = [];
    }
    
    // 배열로 주어진 카드 목록으로 카드 클래스를 생성해 덱에 넣는다.
    from_data(Cards) {
        for (let id of Cards) {
            this.cards.push(new Card(id, this.cards.length));
        }
        this.shuffle();
    }

    // 덱에 카드를 추가한다
	add_card(card) {
        this.cards.push(card);
    }

    add_cards(cards) {
        this.cards = [...this.cards, ...cards];
        console.log('added cards', cards);
        shuffle(this.cards);
    }

    // 덱에서 카드를 드로우한다.
    draw() {
        return this.cards.shift();
    }

    length() {
        return this.cards.length;
    }

    // 덱의 카드들을 셔플한다.
    shuffle() {
        shuffle(this.cards);
    }
}