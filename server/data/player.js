export class Player {
    constructor(id, name, socketId) {
        this.id = id;
        this.name = name;
        this.inMatch = false;
        this.waitingForMatch = false;
        this.spectating = false;
        this.match = null;
        this.socketID = socketId;
        this.ready = false;
        this.muted = false;

        // will control the deck of player (?)
        this.cardsys = null;
    }
    set_socketID(socketID) {
        this.socketID = socketID;
    }
    leave_match() {
        this.match = null; 
        this.inMatch = false;
        return;
    }
    set_card_system(cardsys) {
        this.cardsys = cardsys;
    }
}