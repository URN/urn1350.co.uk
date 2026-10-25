import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

import { WEEKDAYS } from '../../utils/schedule';
import {
  crossesMidnight,
  dateToRadio,
  dayLabel,
  formatHour,
  radioRange,
  radioToDate,
  toRadio,
} from './radioWeek';

const typeClass = (type) => (type === 'automation' ? 'is-automation' : `is-${type || 'daytime'}`);
// Type colours come from the --tt-* tokens in account.scss; these two run dark, so light text.
const DARK_TYPES = ['after-dark', 'automation'];

/** Hour of day for a slot header; times past midnight run on to 32:00 in this view. */
function slotHour(arg) {
  const t = arg.time;
  const hours = t ? (t.days || 0) * 24 + Math.round((t.milliseconds || 0) / 3600000) : arg.date.getHours();
  return hours % 24;
}

/** A radio-day range the calendar may hold: inside one radio day and not across midnight. */
function validRange(r) {
  return r.rs >= 0 && r.re <= 24 && r.re > r.rs && !crossesMidnight(r.rs, r.re);
}

function onKeyOpen(open) {
  return (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };
}

/**
 * The weekly timetable as a draggable calendar. Shows move and resize in whole hours, can't
 * land on another show or run past midnight, and clicking (or dragging across) empty time
 * starts a new slot.
 */
export default function ScheduleCalendar({ schedule, now, draft, ghost, onOpen, onCreate, onMove }) {
  const events = useMemo(() => {
    const list = [];
    WEEKDAYS.forEach((day) => {
      (schedule[day] || []).forEach((slot) => {
        const r = toRadio(day, slot.start, slot.end);
        list.push({
          id: String(slot.id),
          title: slot.name,
          start: radioToDate(r.radioDay, r.rs),
          end: radioToDate(r.radioDay, r.re),
          className: `acct-ev ${typeClass(slot.type)}${draft?.id === slot.id ? ' is-selected' : ''}`,
          color: `var(--tt-${slot.type || 'daytime'})`,
          contrastColor: DARK_TYPES.includes(slot.type) ? '#fff' : 'var(--ink)',
          extendedProps: { slot: { ...slot, day } },
        });
      });
    });
    if (ghost) {
      list.push({
        id: 'ghost',
        title: ghost.name || 'New show',
        start: radioToDate(ghost.radioDay, ghost.rs),
        end: radioToDate(ghost.radioDay, ghost.re),
        editable: false,
        className: `acct-ev acct-ev--ghost${ghost.clash ? ' is-clash' : ''}`,
        color: 'var(--ext)',
        contrastColor: ghost.clash ? 'var(--butter)' : '#fff',
        extendedProps: { ghost: true },
      });
    }
    return list;
  }, [schedule, draft, ghost]);

  return (
    <FullCalendar
      plugins={[timeGridPlugin, interactionPlugin, classicThemePlugin]}
      initialView="timeGridWeek"
      initialDate={radioToDate(WEEKDAYS[0], 0)}
      now={now}
      nowIndicator={!!now}
      headerToolbar={false}
      firstDay={1}
      allDaySlot={false}
      slotMinTime="08:00:00"
      slotMaxTime="32:00:00"
      slotDuration="01:00:00"
      snapDuration="01:00:00"
      height="auto"
      slotMinHeight={40}
      expandRows
      editable
      selectable
      selectMirror
      eventResizableFromStart
      events={events}
      eventOverlap={(still) => !!still.extendedProps.ghost}
      selectOverlap={(still) => !!still.extendedProps.ghost}
      eventAllow={(span) => validRange(dateToRadio(span.start, span.end))}
      selectAllow={(span) => validRange(dateToRadio(span.start, span.end))}
      dayHeaderContent={(arg) => (
        <span className="acct-cal__day">
          {arg.date.toLocaleDateString('en-GB', { weekday: 'short' })}
          {arg.isToday ? <small>Today</small> : null}
        </span>
      )}
      slotHeaderContent={(arg) => formatHour(slotHour(arg))}
      slotHeaderClass={(arg) => (slotHour(arg) === 0 ? 'is-midnight' : '')}
      eventContent={(arg) => {
        const r = dateToRadio(arg.event.start, arg.event.end);
        return (
          <span className="acct-ev__body">
            <span className="acct-ev__name">{arg.event.title}</span>
            {r.re - r.rs > 1 ? <span className="acct-ev__time">{radioRange(r.rs, r.re)}</span> : null}
          </span>
        );
      }}
      eventClass={(arg) => {
        const r = dateToRadio(arg.event.start, arg.event.end);
        return r.re - r.rs === 1 ? 'is-short' : '';
      }}
      eventDidMount={(arg) => {
        if (arg.event.extendedProps.ghost) return;
        const r = dateToRadio(arg.event.start, arg.event.end);
        const label = `${dayLabel(r.radioDay, r.rs)}, ${arg.event.title}, ${radioRange(r.rs, r.re)}`;
        arg.el.setAttribute('tabindex', '0');
        arg.el.setAttribute('role', 'button');
        arg.el.setAttribute('aria-label', label);
        arg.el.title = label;
        arg.el.onkeydown = onKeyOpen(() => onOpen(arg.event.extendedProps.slot));
      }}
      eventClick={(arg) => {
        if (!arg.event.extendedProps.ghost) onOpen(arg.event.extendedProps.slot);
      }}
      select={(arg) => {
        arg.view.calendar.unselect();
        onCreate(dateToRadio(arg.start, arg.end));
      }}
      eventDrop={(arg) => onMove(arg.event.extendedProps.slot, dateToRadio(arg.event.start, arg.event.end), arg.revert)}
      eventResize={(arg) => onMove(arg.event.extendedProps.slot, dateToRadio(arg.event.start, arg.event.end), arg.revert)}
    />
  );
}
