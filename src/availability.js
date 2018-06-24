export default class Availability {
    constructor(date = new Date(), slots = []) {
        this.date = date;
        this.slots = slots;
    }
}