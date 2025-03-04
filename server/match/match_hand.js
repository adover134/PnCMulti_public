export class Hand {
    constructor() {
        this.cards = [];
    }

    // 핸드에 카드를 추가한다
    add_card(card) {
        this.cards.push(card);
    }

    // 핸드에서 주어진 카드들을 제거한다.
    remove(cards) {
        let trashed = this.cards.filter((Card) => cards.includes(Card.id));
        this.cards = this.cards.filter((Card) => !cards.includes(Card.id));
        return trashed;
    }

    length() {
        return this.cards.length;
    }
}