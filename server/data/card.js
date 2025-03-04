export class Card {
    constructor(index = 0) {
        this.name = "";
        this.original_name = "";
        this.type = 0;
        this.faction = 0;
        this.blocks = [];
        this.skill_pieces = [];
        this.image = "";
        this.effect = {};
        this.state = {};
        // DB에서의 카드 정보의 id
        this.set_index(index);
    }

	//Sets the card index.
    set_index(index) {
        this.index = index;
        this.update();
    }

    //Makes the instance card a copy of a card defined in CardIndex, giving the instance
    //card the CardIndex's property values.
    update() {
        var protocard = CardIndex[this.index];
        for(var prop in protocard) {
            //if('prop' !== 'name') {
            //    this[prop] = protocard[prop]; //Copies over the properties from the protocard
            //}
            console.log(prop);
        }
        if(protocard !== undefined)
            this.original_name = protocard['name'];
    }
}