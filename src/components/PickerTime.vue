<template>
  <div :class="[calendarClass, 'vdp-datepicker__calendar']" v-show="showTimeView" :style="calendarStyle"
       @mousedown.prevent>
    <slot name="beforeCalendarHeader"></slot>
    <header>
      <span class="day__time_btn" @click="showDayCalendar" :class="allowedToShowView('day') ? 'up' : ''">
        {{ isYmd ? currMonthName : currYearName }}-{{ isYmd ? currYearName : currMonthName }}-{{ currDayName }}</span>
    </header>
    <div class="day-labels d-flex">
      <span class="cell flex day-header">Giờ</span>
      <span class="cell flex day-header">Phút</span>
    </div>
    <div class="label-separator"></div>
    <div class="d-flex">
      <div class="cell-block hour-times">
        <div class="time cell"
              v-for="day in days"
              :key="day.timestamp"
              :class="dayClasses(day)"
              @click="selectHour(day)">
        <span>{{ dayCellContent(day) }}</span>
      </div>
      </div>
      <div class="cell-block hour-times">
        <div class="time cell"
              v-for="day in days"
              :key="day.timestamp"
              :class="dayClasses(day)"
              @click="selectTime(day)">
        <span>{{ dayCellContent(day) }}</span>
      </div>
      </div>
    </div>
  </div>
</template>
<script>
import {langYearSuffix, makeDateUtils, rtlLangs, ymdLangs} from '../utils/DateUtils';
import {addDays, getDate, getDay, getDaysInMonth, isSameMonth, lastDayOfMonth, subDays} from 'date-fns';

export default {
  props: {
    showTimeView: Boolean,
    selectedDate: Date,
    pageDate: Date,
    pageTimestamp: Number,
    fullMonthName: Boolean,
    allowedToShowView: Function,
    dayCellContent: {
      type: Function,
      default: day => day.date,
    },
    disabledDates: Object,
    highlighted: Object,
    calendarClass: [String, Object, Array],
    calendarStyle: Object,
    language: Object,
    mondayFirst: Boolean,
    useUtc: Boolean,
  },
  data() {
    const constructedDateUtils = makeDateUtils(this.useUtc, this.language);
    return {
      utils: constructedDateUtils,
    };
  },
  watch: {
    language(newLanguage) {
      this.utils = makeDateUtils(this.useUtc, newLanguage);
    },
    useUtc(newUtc) {
      this.utils = makeDateUtils(newUtc, this.language);
    },
  },
  computed: {
    isRtl() {
      return rtlLangs.indexOf(this.language) !== -1;
    },
    /**
     * Returns an array of day names
     * @return {String[]}
     */
    daysOfWeek() {
      return this.utils.getDaysOfWeek(this.mondayFirst);
    },
    /**
     * Returns the day number of the week less one for the first of the current month
     * Used to show amount of empty cells before the first in the day calendar layout
     * @return {Number}
     */
    blankDays() {
      const d = this.pageDate;
      const dObj = this.useUtc
        ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
        : new Date(d.getFullYear(), d.getMonth(), 1, d.getHours(), d.getMinutes());
      if (this.mondayFirst) {
        return this.utils.getDay(dObj) > 0 ? this.utils.getDay(dObj) - 1 : 6;
      }
      return this.utils.getDay(dObj);
    },
    /**
     * @return {Object[]}
     */
    days() {
      const d = this.pageDate;
      // set up a new date object to the beginning of the current 'page'
      const firstDay = this.useUtc
        ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
        : new Date(d.getFullYear(), d.getMonth(), 1, 12, 0);

      const lastDay = lastDayOfMonth(firstDay);
      const daysInMonth = getDaysInMonth(firstDay);

      const firstDayOfWeek = getDay(firstDay);
      let showBefore = firstDayOfWeek - (this.mondayFirst ? 1 : 0);
      showBefore = showBefore < 0 ? 6 : showBefore;

      const lastDayOfWeek = getDay(lastDay);
      const showAfter = this.mondayFirst ? (7 - lastDayOfWeek) % 7 : 6 - lastDayOfWeek;

      const startWith = subDays(firstDay, showBefore);

      const indexes = [];

      for (let i = 0; i < showBefore + daysInMonth + showAfter; ++i) {
        indexes.push(i);
      }

      return indexes.map((value) => addDays(startWith, value)).map((date) => ({
        date: getDate(date),
        timestamp: date.getTime(),
        isSelected: this.isSelectedDate(date),
        isDisabled: this.isDisabledDate(date) || !isSameMonth(date, firstDay),
        isHighlighted: this.isHighlightedDate(date),
        isHighlightStart: this.isHighlightStart(date),
        isHighlightEnd: this.isHighlightEnd(date),
        isToday: this.utils.compareDates(date, new Date()),
        isWeekend: this.utils.getDay(date) === 0 || this.utils.getDay(date) === 6,
        isSaturday: this.utils.getDay(date) === 6,
        isSunday: this.utils.getDay(date) === 0,
      }));
    },
    /**
     * Gets the name of the month the current page is on
     * @return {String}
     */
    currDayName() {
      return parseInt(this.utils.getDate(this.pageDate).toString()) + 1;
    },
    /**
     * Gets the name of the month the current page is on
     * @return {String}
     */
    currMonthName() {
      return parseInt(this.utils.getMonth(this.pageDate).toString()) + 1;
    },
    /**
     * Gets the name of the year that current page is on
     * @return {Number}
     */
    currYearName() {
      const yearSuffix = langYearSuffix[this.language] || '';
      return `${this.utils.getFullYear(this.pageDate)}${yearSuffix}`;
    },
    /**
     * Is this language using year/month/day format?
     * @return {Boolean}
     */
    isYmd() {
      return ymdLangs.indexOf(this.language) !== -1;
    },
    /**
     * Is the left hand navigation button disabled?
     * @return {Boolean}
     */
    isLeftNavDisabled() {
      return this.isRtl
        ? this.isNextMonthDisabled(this.pageTimestamp)
        : this.isPreviousMonthDisabled(this.pageTimestamp);
    },
    /**
     * Is the right hand navigation button disabled?
     * @return {Boolean}
     */
    isRightNavDisabled() {
      return this.isRtl
        ? this.isPreviousMonthDisabled(this.pageTimestamp)
        : this.isNextMonthDisabled(this.pageTimestamp);
    },
  },
  methods: {
    selectHour(date) {
      if (date.isDisabled) {
        this.$emit('selectedDisabled', date);
        return false;
      }
      this.$emit('selectHour', date);
    },
    selectTime(date) {
      if (date.isDisabled) {
        this.$emit('selectedDisabled', date);
        return false;
      }
      this.$emit('selectTime', date);
    },
    /**
     * @return {Number}
     */
    getPageMonth() {
      return this.utils.getMonth(this.pageDate);
    },
    /**
     * Emit an event to show the month picker
     */
    showDayCalendar() {
      this.$emit('showDayCalendar');
    },
    /**
     * Change the page month
     * @param {Number} incrementBy
     */
    changeMonth(incrementBy) {
      const date = this.pageDate;
      this.utils.setMonth(date, this.utils.getMonth(date) + incrementBy);
      this.$emit('changedMonth', date);
    },
    /**
     * Decrement the page month
     */
    previousMonth() {
      if (!this.isPreviousMonthDisabled()) {
        this.changeMonth(-1);
      }
    },
    /**
     * Is the previous month disabled?
     * @return {Boolean}
     */
    isPreviousMonthDisabled() {
      if (!this.disabledDates || !this.disabledDates.to) {
        return false;
      }
      const d = this.pageDate;
      return this.utils.getMonth(this.disabledDates.to) >= this.utils.getMonth(d) &&
        this.utils.getFullYear(this.disabledDates.to) >= this.utils.getFullYear(d);
    },
    /**
     * Increment the current page month
     */
    nextMonth() {
      if (!this.isNextMonthDisabled()) {
        this.changeMonth(+1);
      }
    },
    /**
     * Is the next month disabled?
     * @return {Boolean}
     */
    isNextMonthDisabled() {
      if (!this.disabledDates || !this.disabledDates.from) {
        return false;
      }
      const d = this.pageDate;
      return this.utils.getMonth(this.disabledDates.from) <= this.utils.getMonth(d) &&
        this.utils.getFullYear(this.disabledDates.from) <= this.utils.getFullYear(d);
    },
    /**
     * Whether a day is selected
     * @param {Date}
     * @return {Boolean}
     */
    isSelectedDate(dObj) {
      return this.selectedDate && this.utils.compareDates(this.selectedDate, dObj);
    },
    /**
     * Whether a day is disabled
     * @param {Date}
     * @return {Boolean}
     */
    isDisabledDate(date) {
      let disabledDates = false;

      if (typeof this.disabledDates === 'undefined') {
        return false;
      }

      if (typeof this.disabledDates.dates !== 'undefined') {
        this.disabledDates.dates.forEach((d) => {
          if (this.utils.compareDates(date, d)) {
            disabledDates = true;
            return true;
          }
        });
      }
      if (typeof this.disabledDates.to !== 'undefined' && this.disabledDates.to && date < this.disabledDates.to) {
        disabledDates = true;
      }
      if (typeof this.disabledDates.from !== 'undefined' && this.disabledDates.from && date > this.disabledDates.from) {
        disabledDates = true;
      }
      if (typeof this.disabledDates.ranges !== 'undefined') {
        this.disabledDates.ranges.forEach((range) => {
          if (typeof range.from !== 'undefined' && range.from && typeof range.to !== 'undefined' && range.to) {
            if (date < range.to && date > range.from) {
              disabledDates = true;
              return true;
            }
          }
        });
      }
      if (typeof this.disabledDates.days !== 'undefined' && this.disabledDates.days.indexOf(this.utils.getDay(date)) !==
        -1) {
        disabledDates = true;
      }
      if (typeof this.disabledDates.daysOfMonth !== 'undefined' &&
        this.disabledDates.daysOfMonth.indexOf(this.utils.getDate(date)) !== -1) {
        disabledDates = true;
      }
      if (typeof this.disabledDates.customPredictor === 'function' && this.disabledDates.customPredictor(date)) {
        disabledDates = true;
      }
      return disabledDates;
    },
    /**
     * Whether a day is highlighted (only if it is not disabled already except when highlighted.includeDisabled is true)
     * @param {Date}
     * @return {Boolean}
     */
    isHighlightedDate(date) {
      if (!(this.highlighted && this.highlighted.includeDisabled) && this.isDisabledDate(date)) {
        return false;
      }

      let highlighted = false;

      if (typeof this.highlighted === 'undefined') {
        return false;
      }

      if (typeof this.highlighted.dates !== 'undefined') {
        this.highlighted.dates.forEach((d) => {
          if (this.utils.compareDates(date, d)) {
            highlighted = true;
            return true;
          }
        });
      }

      if (this.isDefined(this.highlighted.from) && this.isDefined(this.highlighted.to)) {
        highlighted = date >= this.highlighted.from && date <= this.highlighted.to;
      }

      if (typeof this.highlighted.days !== 'undefined' && this.highlighted.days.indexOf(this.utils.getDay(date)) !==
        -1) {
        highlighted = true;
      }

      if (typeof this.highlighted.daysOfMonth !== 'undefined' &&
        this.highlighted.daysOfMonth.indexOf(this.utils.getDate(date)) !== -1) {
        highlighted = true;
      }

      if (typeof this.highlighted.customPredictor === 'function' && this.highlighted.customPredictor(date)) {
        highlighted = true;
      }

      return highlighted;
    },
    dayClasses(day) {
      return {
        selected: day.isSelected,
        disabled: day.isDisabled,
        highlighted: day.isHighlighted,
        today: day.isToday,
        weekend: day.isWeekend,
        sat: day.isSaturday,
        sun: day.isSunday,
        'highlight-start': day.isHighlightStart,
        'highlight-end': day.isHighlightEnd,
      };
    },
    /**
     * Whether a day is highlighted and it is the first date
     * in the highlighted range of dates
     * @param {Date}
     * @return {Boolean}
     */
    isHighlightStart(date) {
      return this.isHighlightedDate(date) &&
        (this.highlighted.from instanceof Date) &&
        (this.utils.getFullYear(this.highlighted.from) === this.utils.getFullYear(date)) &&
        (this.utils.getMonth(this.highlighted.from) === this.utils.getMonth(date)) &&
        (this.utils.getDate(this.highlighted.from) === this.utils.getDate(date));
    },
    /**
     * Whether a day is highlighted and it is the first date
     * in the highlighted range of dates
     * @param {Date}
     * @return {Boolean}
     */
    isHighlightEnd(date) {
      return this.isHighlightedDate(date) &&
        (this.highlighted.to instanceof Date) &&
        (this.utils.getFullYear(this.highlighted.to) === this.utils.getFullYear(date)) &&
        (this.utils.getMonth(this.highlighted.to) === this.utils.getMonth(date)) &&
        (this.utils.getDate(this.highlighted.to) === this.utils.getDate(date));
    },
    /**
     * Helper
     * @param  {mixed}  prop
     * @return {Boolean}
     */
    isDefined(prop) {
      return typeof prop !== 'undefined' && prop;
    },
  },
}
// eslint-disable-next-line
;
</script>
