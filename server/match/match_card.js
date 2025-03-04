import CardIndex from "../data/cards.json" with { type: "json" };

const CardType = {
    UNIT : 0,
    SKILL : 1,
    TRAP : 2
};

const Faction = {
    LEAGUE : 0,
    FLARE : 1,
    WATER : 2,
    EARTH : 3,
    LIGHT : 4,
    VIRTUAL : 5
}

export class Card {
    constructor(index = 0, id) {
        // deck에서의 id이다.
        this.id = id;
        // DB에서의 카드 정보의 id를 통해 카드 정보를 설정한다.
        this.set_info(index);
    }

    //Sets the card index.
    set_info(index) {
        this.index = index;
        var protocard = CardIndex[this.index];
        for(var prop in protocard) {
            if('prop' !== 'name') {
                this[prop] = protocard[prop]; //Copies over the properties from the protocard
            }
        }
        if(protocard !== undefined)
            this.original_name = protocard['name'];
    }
}