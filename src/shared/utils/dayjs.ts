import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
export default dayjs;

export const getStartOfDay = (date: Date): Date => {
  return dayjs(date).startOf('day').toDate();
};

export const getEndOfDay = (date: Date): Date => {
  return dayjs(date).endOf('day').toDate();
};

export const getStartOfWeek = (date: Date): Date => {
  // start of week is monday
  const firstDayOfWeek = dayjs(date).startOf('isoWeek').toDate();
  return getStartOfDay(firstDayOfWeek);
};

export const getEndOfWeek = (date: Date): Date => {
  // end of week is sunday
  const lastDayOfWeek = dayjs(date).endOf('isoWeek').toDate();
  return getEndOfDay(lastDayOfWeek);
};

export const startOfLast24Hours = (): Date => {
  const startDate = dayjs().subtract(24, 'hours').toDate();
  return startDate;
};
