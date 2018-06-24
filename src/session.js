import moment from 'moment/moment';
export const H_mm = 'H:mm';

export default class Session {
    constructor(start, end) {
        this.start = moment(start).format(H_mm);
        this.end = moment(end).format(H_mm);
    }
}