import knex from '../knexClient';
import { getNextAppointments, getOpenings } from './queries';

describe('get openings', () => {
    beforeEach(async () => {
        await knex('events').truncate();
        await knex('events').insert([
            {
                kind: 'opening',
                starts_at: new Date('2014-08-04 09:30'),
                ends_at: new Date('2014-08-04 12:30'),
                weekly_recurring: true,
            },
            {
                kind: 'opening',
                starts_at: new Date('2014-08-10 09:30'),
                ends_at: new Date('2014-08-10 10:00'),
                weekly_recurring: false,
            }
        ]);
    });

    it('should get recursive openings', async () => {
        expect(await getOpenings(new Date('2018-01-01'))).toHaveLength(1);
    });

    it('should get openings for today', async () => {
        expect(await getOpenings(new Date('2014-08-10'))).toHaveLength(2);
    });

    it('should get openings for the next 7 days', async () => {
        expect(await getOpenings(new Date('2014-08-04'))).toHaveLength(2);
    });

    it('should not get openings for the next 8 days', async () => {
        expect(await getOpenings(new Date('2014-08-03'))).toHaveLength(1);
    });
});

describe('simple case', () => {
    beforeEach(async () => {
        await knex('events').insert([
            {
                kind: 'opening',
                starts_at: new Date('2014-08-04 09:30'),
                ends_at: new Date('2014-08-04 12:30'),
                weekly_recurring: true,
            },
            {
                kind: 'appointment',
                starts_at: new Date('2014-08-11 10:30'),
                ends_at: new Date('2014-08-11 11:30'),
            },
        ]);
    });

    it('selects appointments', async () => {
        expect(await getNextAppointments(new Date('2014-08-04'))).toHaveLength(0);
        expect(await getNextAppointments(new Date('2014-08-05'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-06'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-07'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-08'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-09'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-10'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-11'))).toHaveLength(1);
        expect(await getNextAppointments(new Date('2014-08-12'))).toHaveLength(0);

        expect(await getNextAppointments(new Date('2014-08-11'), 0)).toHaveLength(0);
        expect(await getNextAppointments(new Date('2014-08-11'), 1)).toHaveLength(1);
    });
});
