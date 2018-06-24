import moment from 'moment/moment';
import knex from '../knexClient';

export const getOpenings = async (date, days = 7) => {
    const dateParam = moment(date);
    return await knex
        .select('starts_at', 'ends_at', 'kind', 'weekly_recurring')
        .from('events')
        .where('kind', 'opening')
        .andWhere(function () {
            this
                .where('weekly_recurring', true)
                .orWhereBetween('starts_at', [dateParam.startOf('day').toDate(), dateParam.clone().add(days, 'days').toDate()]);
        });
};

export const getNextAppointments = async (date, days = 7) => {
    const dateParam = moment(date);
    return await knex.select('starts_at', 'ends_at', 'kind')
        .from('events')
        .where('kind', 'appointment')
        .andWhereBetween('starts_at', [dateParam.startOf('day').toDate(), dateParam.clone().add(days, 'days').toDate()]);
};
