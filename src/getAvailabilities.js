import Availability from './availability';
import moment from 'moment/moment';
import { getNextAppointments, getOpenings } from './queries';
import Session, { H_mm } from './session';

const _30 = 30;
/**
 * Get the availabilities for the next 7 days.
 * @param date date of the first day
 * @returns {Promise<Availability>} Array of Availabilities (7 items)
 */
export default async function getAvailabilities(date) {
    const appointmentsSessionsByDayOfWeek = await getAppointmentSessionsByDayOfWeek(date);
    const allOpeningsOfTheWeek = await getOpenings(date);

    const slotsByDayOfWeek =
        Object.entries(openingsByDayOfTheWeek(allOpeningsOfTheWeek))
            .reduce((slotsByDayOfWeek, openingsByDayOfWeek) => {
                const dayOfWeek = openingsByDayOfWeek[0];
                const openingsOfTheDay = openingsByDayOfWeek[1];
                const appointmentSessionsOfTheDay = appointmentsSessionsByDayOfWeek[dayOfWeek];
                const slots = slotsOfTheDay(openingsOfTheDay, appointmentSessionsOfTheDay);

                return Object.assign({}, slotsByDayOfWeek, {[dayOfWeek]: sorted(uniq(slots))});
            }, {});

    return next7DaysOf(date)
        .map(day => new Availability(day.toDate(), slotsByDayOfWeek[day.day()]));
}

const slotsOfTheDay = (openingsOfTheDay, appointmentSessionsOfTheDay) =>
    openingsOfTheDay
        .reduce((sessionsOfTheDay, opening) => {
            const startOfSession = moment(opening.starts_at);
            const endOfOpening = moment(opening.ends_at);
            let sessions = sessionsOfTheDay.concat();

            while (startOfSession.clone().add(_30, 'minutes').isSameOrBefore(endOfOpening)) {
                sessions = sessions.concat(new Session(startOfSession, startOfSession.clone().add(_30, 'minutes')));
                startOfSession.add(_30, 'minutes');
            }
            return sessions;
        }, [])
        .filter(byOpeningSessionsNotOverlapping(appointmentSessionsOfTheDay))
        .map(sessions => sessions.start);

const getAppointmentSessionsByDayOfWeek = async (date) => {
    const appointments = await getNextAppointments(date);
    return appointments
        .reduce((appointmentSessions, appointment) => {
            const dayOfWeek = moment(appointment.starts_at).day();
            return Object.assign(
                {},
                appointmentSessions, {
                    [dayOfWeek]: appointmentSessions[dayOfWeek].concat(new Session(appointment.starts_at, appointment.ends_at))
                });
        }, emptyEventsByDayOfTheWeek);
};

const openingsByDayOfTheWeek = (openings) => openings
    .reduce((openingsByDay, opening) => {
        const dayOfWeek = moment(opening.starts_at).day();
        return Object.assign({}, openingsByDay, {[dayOfWeek]: openingsByDay[dayOfWeek].concat(opening)});
    }, emptyEventsByDayOfTheWeek);

const byOpeningSessionsNotOverlapping = appointmentsSessionsOfTheDay =>
    openingSession =>
        appointmentsSessionsOfTheDay.every(appointmentSession =>
            moment(openingSession.end, H_mm).isSameOrBefore(moment(appointmentSession.start, H_mm)) ||
            moment(openingSession.start, H_mm).isSameOrAfter(moment(appointmentSession.end, H_mm)));

const uniq = (arr) => Array.from(new Set(arr));

const sorted = (arr) => arr.concat().sort((a, b) => moment(a, H_mm).isAfter(moment(b, H_mm)) ? 1 : -1);

const next7DaysOf = (date) =>
    new Array(7)
        .fill(0)
        .map((_, i) => moment(date).clone().add(i, 'days'));

const emptyEventsByDayOfTheWeek = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
};
