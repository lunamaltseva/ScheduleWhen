import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { read, utils } from 'xlsx'

type YearId = 'FR' | 'SO' | 'JR' | 'SR' | 'M1' | 'M2'
type DayId = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
type StudentStatus = 'local' | 'international'
type Priority = 'any' | 'morning' | 'afternoon' | 'evening'
type DropId = 'year' | 'dept' | 'conc' | 'intl' | 'days' | 'duration' | 'prio' | null

type Student = {
  id: string
  department: string
  concentration: string
  year: YearId
  international: boolean
  meetings: Meeting[]
}

type Meeting = {
  day: DayId
  start: number
  end: number
  label: string
}

type HeatCell = {
  v: number
  available: number
  total: number
  conflicts: number
}

type BestSlot = HeatCell & {
  r: number
  c: number
  day: DayId
  time: string
  start: number
}

type Room = {
  id: string
  name: string
  cap: number
  type: string
  floor: string
}

type SuggestedRoom = Room & {
  status: 'fits' | 'limited'
}

type ChatMessage = {
  from: 'bot' | 'user'
  text: string
}

const ACCENT = '#c8a96a'
const REGISTRAR_DISCLAIMER =
  "To be 100% sure about the best time for the event, please confirm the details with the Registrar's Office."

const YEARS: Array<{ id: YearId; label: string }> = [
  { id: 'FR', label: 'Freshman' },
  { id: 'SO', label: 'Sophomore' },
  { id: 'JR', label: 'Junior' },
  { id: 'SR', label: 'Senior' },
  { id: 'M1', label: 'Master 1' },
  { id: 'M2', label: 'Master 2' },
]

const EXCEL_YEAR_TO_ID: Record<string, YearId> = {
  Freshman: 'FR',
  Sophomore: 'SO',
  Junior: 'JR',
  Senior: 'SR',
  'Masters 1st Year': 'M1',
  'Masters 2nd Year': 'M2',
}

const DEPARTMENTS = [
  { id: 'BA', name: 'Business Administration' },
  { id: 'ECO', name: 'Economics' },
  { id: 'AMI', name: 'Applied Math & Informatics' },
  { id: 'SFW', name: 'Software Engineering' },
  { id: 'ICP', name: "Int'l & Comp. Politics" },
  { id: 'JMC', name: 'Journalism & Mass Comm.' },
  { id: 'PSY', name: 'Psychology' },
  { id: 'SOC', name: 'Sociology' },
  { id: 'ANTH', name: 'Anthropology' },
  { id: 'ESCS', name: 'Environmental Studies' },
  { id: 'TCMA', name: 'Theatre & Media Arts' },
  { id: 'IBL', name: "Int'l Business Law" },
  { id: 'LAS', name: 'Liberal Arts & Sciences' },
  { id: 'LLM', name: 'Master of Laws' },
  { id: 'MAANTH', name: 'MA Anthropology' },
  { id: 'MACAS', name: 'MA Central Asian Studies' },
  { id: 'MAPAP', name: 'MA Public Admin.' },
  { id: 'MAT', name: 'MA Teaching' },
  { id: 'MBA', name: 'MBA' },
  { id: 'MSECO', name: 'MS Economics' },
] as const

const CONCENTRATIONS = [
  { id: 'DC', name: 'Digital Cultures' },
  { id: 'ES', name: 'European Studies' },
  { id: 'HR', name: 'Human Rights' },
  { id: 'MC', name: 'Mass Communications' },
  { id: 'MM', name: 'Mathematical Modeling' },
  { id: 'PC', name: 'Peace & Conflict Studies' },
  { id: 'SEDT', name: 'Social Entrepreneurship & Design Thinking' },
  { id: 'UPD', name: 'Urban Planning & Design' },
] as const

const ALL_DAYS: Array<{ id: DayId; short: string }> = [
  { id: 'Mon', short: 'M' },
  { id: 'Tue', short: 'T' },
  { id: 'Wed', short: 'W' },
  { id: 'Thu', short: 'T' },
  { id: 'Fri', short: 'F' },
  { id: 'Sat', short: 'S' },
]

const INTL_OPTIONS: Array<{ id: StudentStatus; label: string }> = [
  { id: 'local', label: 'Local students' },
  { id: 'international', label: 'International students' },
]

const DURATIONS = [30, 60, 75, 90, 120]

const SLOTS: Array<{ time: string; kind: 'class' | 'break'; label?: string }> = [
  { time: '08:00', kind: 'class' },
  { time: '09:25', kind: 'class' },
  { time: '10:50', kind: 'class' },
  { time: '12:05', kind: 'break', label: 'Lunch' },
  { time: '12:45', kind: 'class' },
  { time: '14:10', kind: 'class' },
  { time: '15:35', kind: 'class' },
  { time: '17:00', kind: 'class' },
  { time: '18:30', kind: 'class' },
  { time: '19:30', kind: 'class' },
]

const PRIORITIES: Array<{ id: Priority; icon: string; label: string; hint: string }> = [
  { id: 'any', icon: 'Any', label: 'Any time', hint: 'No preference' },
  { id: 'morning', icon: 'AM', label: 'Morning', hint: '08-12' },
  { id: 'afternoon', icon: 'PM', label: 'Afternoon', hint: '12-17' },
  { id: 'evening', icon: 'EV', label: 'Evening', hint: '17-22' },
]

const ROOMS: Room[] = [
  { id: '116', name: 'Lecture Hall 116', cap: 120, type: 'Auditorium', floor: 'Main 1F' },
  { id: '217', name: 'Room 217', cap: 40, type: 'Classroom', floor: 'Main 2F' },
  { id: '315', name: 'Room 315', cap: 24, type: 'Seminar', floor: 'Main 3F' },
  { id: 'NB-301', name: 'NB-301', cap: 80, type: 'Auditorium', floor: 'New Bldg 3F' },
  { id: 'NB-204', name: 'NB-204', cap: 30, type: 'Classroom', floor: 'New Bldg 2F' },
]

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const formatWindow = (slot: Pick<BestSlot, 'day' | 'time' | 'start'>, duration: number) =>
  `${slot.day} ${slot.time}-${minutesToTime(slot.start + duration)}`

const toPercent = (value: number) => `${Math.round(value * 100)}%`

const parseMeetings = (label: string): Meeting[] => {
  const meetings: Meeting[] = []
  const pattern = /((?:Mon|Tue|Wed|Thu|Fri|Sat)(?:\/(?:Mon|Tue|Wed|Thu|Fri|Sat))*)\s+(\d{1,2}:\d{2})/g
  for (const match of label.matchAll(pattern)) {
    const days = match[1].split('/') as DayId[]
    const start = timeToMinutes(match[2])
    for (const day of days) {
      meetings.push({ day, start, end: start + 75, label })
    }
  }
  return meetings
}

const loadStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${import.meta.env.BASE_URL}Fall_2026_Students.xlsx`)
  if (!response.ok) {
    throw new Error(`Could not load student schedule data (${response.status})`)
  }

  const buffer = await response.arrayBuffer()
  const workbook = read(buffer)
  const sheet = workbook.Sheets['Fall 2026 Students'] ?? workbook.Sheets[workbook.SheetNames[0]]
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rows
    .map((row) => {
      const rawYear = String(row.Year ?? '')
      const year = EXCEL_YEAR_TO_ID[rawYear]
      if (!year) return null

      const courseLabels = Object.entries(row)
        .filter(([key, value]) => key.startsWith('Course') && String(value).trim())
        .map(([, value]) => String(value))

      return {
        id: String(row['Student ID'] ?? ''),
        department: String(row.Department ?? ''),
        concentration: String(row.Concentration ?? ''),
        year,
        international: String(row.International ?? '').toLowerCase() === 'yes',
        meetings: courseLabels.flatMap(parseMeetings),
      }
    })
    .filter((student): student is Student => Boolean(student))
}

const bucket = (value: number) => {
  if (value < 0.3) return 'bg-[#003366]'
  if (value < 0.55) return 'bg-[#4b75b0]'
  if (value < 0.78) return 'bg-[#8fa8d0]'
  return 'bg-[#d8e3f3]'
}

const inPriorityWindow = (slot: BestSlot, priority: Priority) => {
  if (priority === 'any') return true
  const hour = Math.floor(slot.start / 60)
  if (priority === 'morning') return hour < 12
  if (priority === 'afternoon') return hour >= 12 && hour < 17
  return hour >= 17
}

const makeHeatmap = (
  students: Student[],
  days: DayId[],
  duration: number,
): HeatCell[][] =>
  SLOTS.map((slot) => {
    if (slot.kind === 'break') {
      return days.map(() => ({ v: -1, available: 0, total: students.length, conflicts: 0 }))
    }

    const start = timeToMinutes(slot.time)
    const end = start + duration

    return days.map((day) => {
      const conflicts = students.filter((student) =>
        student.meetings.some(
          (meeting) => meeting.day === day && meeting.start < end && meeting.end > start,
        ),
      ).length
      const available = students.length - conflicts
      return {
        v: students.length ? available / students.length : 0,
        available,
        total: students.length,
        conflicts,
      }
    })
  })

const formatWeek = (offset: number) => {
  const today = new Date(2026, 4, 25)
  const monday = new Date(today)
  monday.setDate(today.getDate() + offset * 7)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} - ${fmt(friday)}`
}

const weekDates = (days: DayId[], weekOffset: number) => {
  const anchor = new Date(2026, 4, 25)
  const today = new Date(2026, 4, 25)
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() + weekOffset * 7)
  const dayIndex: Record<DayId, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 }

  return days.map((day) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + dayIndex[day])
    return {
      day,
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
    }
  })
}

const missingFieldText = (missing: string[]) => {
  if (!missing.length) return ''
  return `Please provide ${missing.join(', ')} so I can calculate the best event time.`
}

const recommendationText = (bestSlots: BestSlot[], duration: number) => {
  if (!bestSlots.length) return 'I need a selected audience and day range before I can recommend a time.'
  const [best, ...rest] = bestSlots
  const alternatives = rest
    .slice(0, 2)
    .map(
      (slot, index) =>
        `${index + 1}. ${formatWindow(slot, duration)} - ${slot.available}/${slot.total} available`,
    )
    .join('\n')

  return [
    `Best option: ${formatWindow(best, duration)}`,
    `Estimated availability: ${best.available}/${best.total} students available (${toPercent(best.v)})`,
    alternatives ? `Alternatives:\n${alternatives}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const explanationText = (bestSlots: BestSlot[], duration: number) => {
  if (!bestSlots.length) return 'Once you select a year, department, and day, I can explain the best time.'
  const best = bestSlots[0]
  return `${formatWindow(best, duration)} is the strongest slot because ${best.available}/${best.total} selected students have no class that overlaps with the event. ${REGISTRAR_DISCLAIMER}`
}

function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [years, setYears] = useState<YearId[]>([])
  const [depts, setDepts] = useState<string[]>([])
  const [concs, setConcs] = useState<string[]>([])
  const [intl, setIntl] = useState<StudentStatus[]>([])
  const [days, setDays] = useState<DayId[]>([])
  const [duration, setDuration] = useState(60)
  const [priority, setPriority] = useState<Priority>('any')
  const [open, setOpen] = useState<DropId>('year')
  const [selected, setSelected] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [explainSignal, setExplainSignal] = useState(0)

  useEffect(() => {
    let active = true
    loadStudents()
      .then((loaded) => {
        if (!active) return
        setStudents(loaded)
        setLoading(false)
      })
      .catch((error: Error) => {
        if (!active) return
        setDataError(error.message)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const showConc = depts.includes('LAS')
  useEffect(() => {
    if (!showConc && concs.length) setConcs([])
  }, [showConc, concs.length])

  const toggle = <T,>(arr: T[], setter: (next: T[]) => void) => (id: T) =>
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])

  const toggleAll = <T extends string>(
      full: readonly { id: T }[],
      current: T[],
      setter: Dispatch<SetStateAction<T[]>>,
  ) => {
    const allIds = full.map((x) => x.id)
    setter(current.length === allIds.length ? [] : allIds)
  }

  const selectedStudents = useMemo(
    () =>
      students.filter((student) => {
        if (years.length && !years.includes(student.year)) return false
        if (depts.length && !depts.includes(student.department)) return false
        if (concs.length && !concs.includes(student.concentration)) return false
        if (intl.length === 1) {
          const wantedInternational = intl[0] === 'international'
          if (student.international !== wantedInternational) return false
        }
        return true
      }),
    [students, years, depts, concs, intl],
  )

  const ready = years.length > 0 && depts.length > 0 && days.length > 0 && selectedStudents.length > 0
  const missing = [
    years.length ? '' : 'year of education',
    depts.length ? '' : 'department',
    days.length ? '' : 'day of the week',
  ].filter(Boolean)

  const cells = useMemo(
    () => makeHeatmap(selectedStudents, days, duration),
    [selectedStudents, days, duration],
  )

  const bestSlots = useMemo(() => {
    if (!ready) return []
    const flat: BestSlot[] = []
    for (let r = 0; r < cells.length; r += 1) {
      if (SLOTS[r].kind === 'break') continue
      for (let c = 0; c < days.length; c += 1) {
        const start = timeToMinutes(SLOTS[r].time)
        const slot: BestSlot = { ...cells[r][c], r, c, day: days[c], time: SLOTS[r].time, start }
        if (inPriorityWindow(slot, priority)) flat.push(slot)
      }
    }
    flat.sort((a, b) => b.v - a.v || a.start - b.start)
    return flat
  }, [cells, days, priority, ready])

  const rooms = useMemo<SuggestedRoom[]>(
    () =>
      [...ROOMS]
        .sort((a, b) => Number(b.cap >= selectedStudents.length) - Number(a.cap >= selectedStudents.length) || a.cap - b.cap)
        .slice(0, 4)
        .map((room) => ({ ...room, status: room.cap >= selectedStudents.length ? 'fits' : 'limited' })),
    [selectedStudents.length],
  )

  const yearSummary =
    years.length === YEARS.length
      ? 'All years'
      : years.length
        ? years.map((id) => YEARS.find((year) => year.id === id)?.label).join(', ')
        : ''
  const deptSummary =
    depts.length === DEPARTMENTS.length
      ? 'All departments'
      : depts.length
        ? depts.length <= 3
          ? depts.map((id) => DEPARTMENTS.find((dept) => dept.id === id)?.name).join(', ')
          : `${depts.length} departments`
        : ''
  const concSummary = concs.length ? `${concs.length} concentration${concs.length > 1 ? 's' : ''}` : ''
  const intlSummary =
    intl.length === 2
      ? 'All students'
      : intl.length === 1
        ? intl[0] === 'local'
          ? 'Local only'
          : 'International only'
        : ''
  const daysSummary =
    days.length === ALL_DAYS.length
      ? 'All days (Mon-Sat)'
      : days.length === 5 && !days.includes('Sat')
        ? 'All weekdays (Mon-Fri)'
        : days.length
          ? days.join(', ')
          : ''
  const prioSummary = PRIORITIES.find((item) => item.id === priority)?.label ?? ''

  const reset = () => {
    setYears([])
    setDepts([])
    setConcs([])
    setIntl([])
    setDays([])
    setDuration(60)
    setPriority('any')
    setSelected(null)
  }

  const requestExplanation = () => {
    setChatOpen(true)
    setExplainSignal((value) => value + 1)
  }

  const exportSummary = () => {
    const rows = [
      ['Rank', 'Day', 'Time', 'Available', 'Total', 'Availability'],
      ...bestSlots.slice(0, 4).map((slot, index) => [
        String(index + 1),
        slot.day,
        `${slot.time}-${minutesToTime(slot.start + duration)}`,
        String(slot.available),
        String(slot.total),
        toPercent(slot.v),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'schedulewhen-summary.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1f2c]">
      <Topbar />

      <main className="mx-auto grid max-w-[1320px] grid-cols-1 items-start gap-7 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-10 lg:py-9">
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <Drop
              name="Year of education"
              value={yearSummary}
              open={open === 'year'}
              onToggle={() => setOpen(open === 'year' ? null : 'year')}
            >
              <div className="flex flex-wrap gap-1.5">
                <AllChip active={years.length === YEARS.length} onClick={() => toggleAll(YEARS, years, setYears)}>
                  All years
                </AllChip>
                {YEARS.map((year) => (
                  <Chip key={year.id} active={years.includes(year.id)} onClick={() => toggle(years, setYears)(year.id)}>
                    {year.label}
                  </Chip>
                ))}
              </div>
            </Drop>

            <Drop
              name="Departments"
              value={deptSummary}
              open={open === 'dept'}
              onToggle={() => setOpen(open === 'dept' ? null : 'dept')}
            >
              <div className="flex flex-wrap gap-1.5">
                <AllChip
                  active={depts.length === DEPARTMENTS.length}
                  onClick={() => toggleAll(DEPARTMENTS, depts, setDepts)}
                >
                  All departments
                </AllChip>
                {DEPARTMENTS.map((department) => (
                  <Chip
                    key={department.id}
                    code={department.id}
                    active={depts.includes(department.id)}
                    onClick={() => toggle(depts, setDepts)(department.id)}
                  >
                    {department.name}
                  </Chip>
                ))}
              </div>
              {showConc && (
                <div className="mt-3 rounded-lg border-l-4 border-[#c8a96a] bg-[#f5f7fb] px-3.5 py-3">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#003366]">
                    <SparkIcon />
                    LAS concentration {concSummary ? `- ${concSummary}` : ''}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <AllChip
                      active={concs.length === CONCENTRATIONS.length}
                      onClick={() => toggleAll(CONCENTRATIONS, concs, setConcs)}
                    >
                      All
                    </AllChip>
                    {CONCENTRATIONS.map((concentration) => (
                      <Chip
                        key={concentration.id}
                        code={concentration.id}
                        active={concs.includes(concentration.id)}
                        onClick={() => toggle(concs, setConcs)(concentration.id)}
                      >
                        {concentration.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </Drop>

            <Drop
              name="Student status"
              value={intlSummary}
              open={open === 'intl'}
              onToggle={() => setOpen(open === 'intl' ? null : 'intl')}
            >
              <div className="flex flex-wrap gap-1.5">
                <AllChip
                  active={intl.length === INTL_OPTIONS.length}
                  onClick={() => toggleAll(INTL_OPTIONS, intl, setIntl)}
                >
                  All students
                </AllChip>
                {INTL_OPTIONS.map((option) => (
                  <Chip
                    key={option.id}
                    active={intl.includes(option.id)}
                    onClick={() => toggle(intl, setIntl)(option.id)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </Drop>

            <Drop
              name="Days of the week"
              value={daysSummary}
              open={open === 'days'}
              onToggle={() => setOpen(open === 'days' ? null : 'days')}
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  className={cx(
                    'rounded-full border border-[#c8a96a] px-3.5 py-2 text-xs font-bold text-[#003366]',
                    days.length === ALL_DAYS.length ? 'bg-[#c8a96a]' : 'bg-[#f7efd9]',
                  )}
                  onClick={() => toggleAll(ALL_DAYS, days, setDays)}
                >
                  All days
                </button>
                <div className="flex gap-1.5">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      title={day.id}
                      className={cx(
                        'h-9 w-9 rounded-full border text-xs font-bold transition',
                        days.includes(day.id)
                          ? 'border-[#003366] bg-[#003366] text-white'
                          : 'border-[#cfd6e3] bg-white text-[#1a1f2c] hover:border-[#003366] hover:text-[#003366]',
                      )}
                      onClick={() => toggle(days, setDays)(day.id)}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            </Drop>

            <Drop
              name="Event duration"
              value={`${duration} minutes`}
              open={open === 'duration'}
              onToggle={() => setOpen(open === 'duration' ? null : 'duration')}
            >
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((minutes) => (
                  <Chip key={minutes} active={duration === minutes} onClick={() => setDuration(minutes)}>
                    {minutes} min
                  </Chip>
                ))}
              </div>
            </Drop>

            <Drop
              name="Time preference"
              value={prioSummary}
              open={open === 'prio'}
              onToggle={() => setOpen(open === 'prio' ? null : 'prio')}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRIORITIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cx(
                      'rounded-lg border px-3 py-3 text-center transition',
                      priority === item.id
                        ? 'border-[#003366] bg-[#eaf0f8]'
                        : 'border-[#cfd6e3] bg-white hover:border-[#003366]',
                    )}
                    onClick={() => setPriority(item.id)}
                  >
                    <span className="block font-mono text-[10px] font-bold text-[#003366]">{item.icon}</span>
                    <span className="mt-1 block text-xs font-bold text-[#003366]">{item.label}</span>
                    <span className="block font-mono text-[10px] text-[#8a92a6]">{item.hint}</span>
                  </button>
                ))}
              </div>
            </Drop>

            <div className="mt-1 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="text-sm font-semibold text-[#8a92a6] underline hover:text-[#003366]"
                onClick={reset}
              >
                Clear all filters
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#003366] underline hover:text-[#00254d]"
                onClick={requestExplanation}
              >
                <InfoIcon />
                Explain why these times
              </button>
            </div>
          </div>

          {dataError ? (
            <Notice title="Could not load schedules" body={dataError} />
          ) : (
            <SummaryCard
              loading={loading}
              ready={ready}
              missing={missing}
              bestSlots={bestSlots}
              rooms={rooms}
              audienceCount={selectedStudents.length}
              duration={duration}
              onExport={exportSummary}
            />
          )}

          <div className="flex gap-2.5 rounded-lg border border-dashed border-[#cfd6e3] bg-[#f5f7fb] px-4 py-3 text-xs leading-5 text-[#3f4a64]">
            <InfoIcon className="mt-0.5 shrink-0 text-[#c8a96a]" />
            <div>
              Schedules are pulled from current enrollment data and may not reflect last-minute changes. Always confirm
              room availability and student schedules with the <strong className="font-bold text-[#003366]">Registrar's Office (Room 110)</strong> before publishing your event.
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 lg:sticky lg:top-[86px]">
          <Heatmap
            loading={loading}
            ready={ready}
            missing={missing}
            days={days}
            cells={cells}
            bestSlots={bestSlots}
            selected={selected}
            onSelect={setSelected}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
          />
          <ChatBot
            open={chatOpen}
            setOpen={setChatOpen}
            bestSlots={bestSlots}
            ready={ready}
            missing={missing}
            duration={duration}
            rooms={rooms}
            explainSignal={explainSignal}
          />
        </section>
      </main>
    </div>
  )
}

function Drop({
  name,
  value,
  open,
  onToggle,
  children,
}: {
  name: string
  value: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className={cx('overflow-hidden rounded-[10px] border bg-white transition', open ? 'border-[#003366]' : 'border-[#cfd6e3] hover:border-[#cdd9ea]')}>
      <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#f5f7fb]" onClick={onToggle}>
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-[#003366]">{name}</span>
          <span className={cx('block truncate text-xs', value ? 'text-[#3f4a64]' : 'italic text-[#8a92a6]')}>
            {value || 'Not selected'}
          </span>
        </span>
        <ChevronIcon className={cx('shrink-0 text-[#8a92a6] transition', open && 'rotate-180 text-[#003366]')} />
      </button>
      <div className={cx('overflow-hidden transition-[max-height] duration-300', open ? 'max-h-[900px]' : 'max-h-0')}>
        <div className="border-t border-dashed border-[#e4e8f0] px-4 py-4">{children}</div>
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
  code,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  code?: string
}) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-[#003366] bg-[#003366] text-white'
          : 'border-[#cfd6e3] bg-white text-[#1a1f2c] hover:border-[#003366] hover:text-[#003366]',
      )}
      onClick={onClick}
    >
      {code ? <span className={cx('font-mono text-[10px]', active ? 'text-white/70' : 'text-[#8a92a6]')}>{code}</span> : null}
      <span>{children}</span>
    </button>
  )
}

function AllChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border border-[#c8a96a] px-3 py-1.5 text-xs font-bold text-[#003366] transition',
        active ? 'bg-[#c8a96a]' : 'bg-[#f7efd9] hover:bg-[#f3e6c2]',
      )}
      onClick={onClick}
    >
      {active ? <CheckIcon /> : <PlusIcon />}
      {children}
    </button>
  )
}

function Heatmap({
  loading,
  ready,
  missing,
  days,
  cells,
  bestSlots,
  selected,
  onSelect,
  weekOffset,
  setWeekOffset,
}: {
  loading: boolean
  ready: boolean
  missing: string[]
  days: DayId[]
  cells: HeatCell[][]
  bestSlots: BestSlot[]
  selected: string | null
  onSelect: (key: string | null) => void
  weekOffset: number
  setWeekOffset: (value: number) => void
}) {
  return (
    <div className="rounded-xl border border-[#e4e8f0] bg-white px-5 py-5 shadow-sm md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[22px] font-bold tracking-tight text-[#003366]">Availability</h2>
        <div className="inline-flex items-center gap-1.5">
          <button className="rounded-md bg-[#003366] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#00254d]" type="button" onClick={() => setWeekOffset(0)}>
            Today
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-[#cfd6e3] text-[#003366] hover:border-[#003366] hover:bg-[#eaf0f8]" type="button" onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous week">
            <ArrowLeftIcon />
          </button>
          <span className="px-1 font-mono text-xs font-semibold text-[#003366]">{formatWeek(weekOffset)}</span>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-[#cfd6e3] text-[#003366] hover:border-[#003366] hover:bg-[#eaf0f8]" type="button" onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next week">
            <ArrowRightIcon />
          </button>
        </div>
      </div>

      {loading ? (
        <EmptyState title="Loading schedules" body="Reading the current enrollment spreadsheet." />
      ) : !ready ? (
        <EmptyState title="Pick your audience" body={missingFieldText(missing) || 'Choose at least one year, one department, and one day.'} />
      ) : (
        <>
          <div className="mb-3 mt-4 flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a92a6]">
            <span>Busy</span>
            <span className="h-2 w-24 rounded-sm bg-gradient-to-r from-[#003366] via-[#4b75b0] to-[#d8e3f3]" />
            <span>Free</span>
          </div>
          <Grid days={days} cells={cells} bestSlots={bestSlots} selected={selected} onSelect={onSelect} weekOffset={weekOffset} />
          <div className="mt-4 flex flex-wrap gap-5 border-t border-dashed border-[#e4e8f0] pt-3 text-xs font-semibold text-[#3f4a64]">
            <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm border-2 border-[#c8a96a] bg-white shadow-[0_0_0_1px_#c8a96a]" />Best 2 slots</span>
            <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-sm border-2 border-[#6b7a99] bg-white shadow-[0_0_0_1px_#6b7a99]" />Backup options</span>
          </div>
        </>
      )}
    </div>
  )
}

function Grid({
  days,
  cells,
  bestSlots,
  selected,
  onSelect,
  weekOffset,
}: {
  days: DayId[]
  cells: HeatCell[][]
  bestSlots: BestSlot[]
  selected: string | null
  onSelect: (key: string | null) => void
  weekOffset: number
}) {
  const dated = weekDates(days, weekOffset)
  const bestKeys = new Set(bestSlots.slice(0, 2).map((slot) => `${slot.r}-${slot.c}`))
  const altKeys = new Set(bestSlots.slice(2, 4).map((slot) => `${slot.r}-${slot.c}`))
  const gridStyle = { gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` } as CSSProperties

  return (
    <div className="grid gap-[3px]" style={gridStyle}>
      <div />
      {dated.map((day) => (
        <div key={day.day} className="flex flex-col items-center justify-center gap-0.5 pb-2 pt-1">
          <span className="text-xs font-bold tracking-wide text-[#003366]">{day.day}</span>
          <span className={cx('font-mono text-[10px] font-medium text-[#8a92a6]', day.isToday && 'rounded-full bg-[#f7efd9] px-2 font-bold text-[#003366]')}>
            {day.date}
          </span>
        </div>
      ))}
      {SLOTS.map((slot, rowIndex) =>
        slot.kind === 'break' ? (
          <Fragment key={slot.time}>
            <div className="flex h-[22px] items-center justify-end pr-2.5 font-mono text-[11px] text-[#8a92a6]">{slot.time}</div>
            <div className="flex h-[22px] items-center justify-center border-y border-dashed border-[#e4e8f0] text-[10px] font-bold uppercase tracking-[0.6em] text-[#8a92a6]" style={{ gridColumn: '2 / -1' }}>
              lunch
            </div>
          </Fragment>
        ) : (
          <Fragment key={slot.time}>
            <div className="flex h-[38px] items-center justify-end pr-2.5 font-mono text-[11px] text-[#8a92a6]">{slot.time}</div>
            {days.map((day, columnIndex) => {
              const cell = cells[rowIndex][columnIndex]
              const key = `${rowIndex}-${columnIndex}`
              const isSelected = selected === key
              const isBest = bestKeys.has(key)
              const isAlt = altKeys.has(key)
              return (
                <button
                  key={day}
                  type="button"
                  className={cx(
                    'group relative h-[38px] rounded border border-transparent transition hover:z-10 hover:scale-[1.06] hover:border-[#003366]',
                    bucket(cell.v),
                    isBest && 'border-[#c8a96a] shadow-[0_0_0_2px_#c8a96a]',
                    isAlt && 'border-[#6b7a99] shadow-[0_0_0_2px_#6b7a99]',
                    isSelected && 'outline outline-2 outline-offset-1 outline-dashed outline-[#003366]',
                  )}
                  onClick={() => onSelect(isSelected ? null : key)}
                >
                  <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-[#003366] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow group-hover:opacity-100">
                    {day} {slot.time} - <strong className="text-[#c8a96a]">{toPercent(cell.v)} free</strong>
                  </span>
                </button>
              )
            })}
          </Fragment>
        ),
      )}
    </div>
  )
}

function SummaryCard({
  loading,
  ready,
  missing,
  bestSlots,
  rooms,
  audienceCount,
  duration,
  onExport,
}: {
  loading: boolean
  ready: boolean
  missing: string[]
  bestSlots: BestSlot[]
  rooms: SuggestedRoom[]
  audienceCount: number
  duration: number
  onExport: () => void
}) {
  if (loading) {
    return <Notice title="Preparing summary" body="Loading enrollment and schedule data." />
  }

  if (!ready) {
    return <Notice title="Your summary will appear here" body={missingFieldText(missing) || 'Pick years, departments, and days to see the best times and rooms.'} />
  }

  const best = bestSlots.slice(0, 2)
  const alternatives = bestSlots.slice(2, 4)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#e4e8f0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-[#e4e8f0] pb-4">
        <div>
          <div className="text-xl font-bold tracking-tight text-[#003366]">Summary</div>
          <div className="text-xs text-[#3f4a64]"><strong className="font-mono text-sm text-[#003366]">~ {audienceCount}</strong> eligible students</div>
        </div>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-[#cfd6e3] px-3 py-1.5 text-xs font-bold text-[#003366] hover:border-[#003366] hover:bg-[#eaf0f8]" onClick={onExport}>
          Export
          <DownloadIcon />
        </button>
      </div>

      <SlotBlock title="Best time" label="2 options" slots={best} duration={duration} variant="best" />
      <SlotBlock title="Also possible" label="backup" slots={alternatives} duration={duration} variant="alt" />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#003366]">
          <BuildingIcon />
          Suggested rooms
          <span className="ml-auto rounded-full bg-[#f5f7fb] px-2 py-0.5 font-mono text-[10px] font-semibold lowercase tracking-normal text-[#8a92a6]">{rooms.length} shown</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {rooms.map((room) => (
            <button key={room.id} type="button" className="flex flex-col gap-1.5 rounded-lg border border-[#e4e8f0] bg-white px-3.5 py-3 text-left transition hover:border-[#cdd9ea]">
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#003366]">{room.name}</span>
                <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]', room.status === 'fits' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700')}>
                  {room.status === 'fits' ? 'Fits' : 'Limited'}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-[#3f4a64]">
                <span>{room.type}</span>
                <span className="text-[#cfd6e3]">|</span>
                <span>{room.floor}</span>
                <span className="text-[#cfd6e3]">|</span>
                <span>up to {room.cap}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SlotBlock({
  title,
  label,
  slots,
  duration,
  variant,
}: {
  title: string
  label: string
  slots: BestSlot[]
  duration: number
  variant: 'best' | 'alt'
}) {
  if (!slots.length) return null

  return (
    <div className="flex flex-col gap-2.5">
      <div className={cx('flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em]', variant === 'best' ? 'text-[#003366]' : 'text-[#6b7a99]')}>
        <span className={cx('h-2 w-2 rounded-full', variant === 'best' ? 'bg-[#c8a96a]' : 'bg-[#6b7a99]')} />
        {title}
        <span className="ml-auto rounded-full bg-[#f5f7fb] px-2 py-0.5 font-mono text-[10px] font-semibold lowercase tracking-normal text-[#8a92a6]">{label}</span>
      </div>
      <div className="flex flex-col gap-2">
        {slots.map((slot, index) => (
          <div key={`${slot.day}-${slot.time}`} className={cx('grid grid-cols-[42px_1fr] items-center gap-x-3 gap-y-1 rounded-lg border px-3.5 py-3', variant === 'best' ? 'border-[#c8a96a] bg-[#f7efd9]' : 'border-[#eef0f5] bg-[#eef0f5]')}>
            <div className={cx('row-span-2 grid h-[42px] w-[42px] place-items-center rounded-full border bg-white text-sm font-bold leading-none', variant === 'best' ? 'border-[#c8a96a] text-[#003366]' : 'border-[#6b7a99] text-[#6b7a99]')}>
              {index + (variant === 'best' ? 1 : 3)}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-bold text-[#003366]">{formatWindow(slot, duration)}</span>
              <span className="text-xs text-[#3f4a64]"><strong className="font-mono text-[#003366]">{toPercent(slot.v)}</strong> free</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/70">
              <div className={cx('h-full rounded-full', variant === 'best' ? 'bg-[#c8a96a]' : 'bg-[#6b7a99]')} style={{ width: `${Math.round(slot.v * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatBot({
  open,
  setOpen,
  bestSlots,
  ready,
  missing,
  duration,
  rooms,
  explainSignal,
}: {
  open: boolean
  setOpen: (value: boolean) => void
  bestSlots: BestSlot[]
  ready: boolean
  missing: string[]
  duration: number
  rooms: SuggestedRoom[]
  explainSignal: number
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: 'bot',
      text: "Hi! I'm AssistantAI. I can recommend times, suggest rooms, or explain a selected result.",
    },
  ])
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const handledExplain = useRef(0)

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    const node = messagesRef.current
    if (open && node) node.scrollTop = node.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!explainSignal || handledExplain.current === explainSignal) return
    handledExplain.current = explainSignal
    setMessages((current) => [
      ...current,
      { from: 'user', text: 'Explain why these times' },
      { from: 'bot', text: ready ? explanationText(bestSlots, duration) : missingFieldText(missing) },
    ])
  }, [bestSlots, duration, explainSignal, missing, ready])

  const reply = (question: string) => {
    const lower = question.toLowerCase()
    if (/(system prompt|hidden|internal|raw data|dataset|api call|logs|algorithm|implementation)/.test(lower)) {
      return "I can't share internal instructions, hidden data, logs, API details, or implementation resources. I can still help you schedule an event."
    }
    if (!ready) return missingFieldText(missing)
    if (/(why|explain|reason|best)/.test(lower)) return explanationText(bestSlots, duration)
    if (/(room|book|location)/.test(lower)) {
      return rooms.length
        ? `Suggested rooms: ${rooms.map((room) => `${room.name} (${room.cap})`).join(', ')}. Please confirm final room availability with the Registrar's Office.`
        : "I do not see a room that clearly fits this audience. Please confirm room options with the Registrar's Office."
    }
    if (/(compare|alternative|backup|alt)/.test(lower)) {
      return bestSlots
        .slice(0, 4)
        .map((slot, index) => `${index + 1}. ${formatWindow(slot, duration)} - ${slot.available}/${slot.total} available (${toPercent(slot.v)})`)
        .join('\n')
    }
    return recommendationText(bestSlots, duration)
  }

  const send = (text?: string) => {
    const value = (text ?? draft).trim()
    if (!value) return
    const nextMessages: ChatMessage[] = [...messages, { from: 'user', text: value }]
    setMessages(nextMessages)
    setDraft('')
    window.setTimeout(() => {
      setMessages([...nextMessages, { from: 'bot', text: reply(value) }])
    }, 350)
  }

  const suggestions = ['Recommend a time', 'Why is this best?', 'Show me rooms', 'Compare alternatives']

  return (
    <div className={cx('overflow-hidden rounded-xl border border-[#003366] bg-white shadow-sm transition', open && 'shadow-[0_8px_24px_-8px_rgba(0,51,102,0.25)]')}>
      <button type="button" className="flex w-full items-center gap-3 bg-[#003366] px-[18px] py-3.5 text-left text-white hover:bg-[#00254d]" onClick={() => setOpen(!open)}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#003366]">
          <AssistantIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold tracking-wide">AssistantAI</span>
          <span className="block truncate text-[11px] text-white/70">{open ? 'Tap to close' : 'Ask for a time, room, or explanation'}</span>
        </span>
        <ChevronIcon className={cx('text-white/80 transition', open && 'rotate-180')} />
      </button>

      <div className={cx('overflow-hidden bg-white transition-[max-height] duration-300', open ? 'max-h-[680px]' : 'max-h-0')}>
        <div
          ref={messagesRef}
          className="flex min-h-[220px] max-h-[420px] flex-col gap-2.5 overflow-y-auto px-[18px] py-4 pr-3"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.from}-${index}`}
              className={cx(
                'max-w-[88%] whitespace-pre-line rounded-[10px] px-3 py-2.5 text-[13px] leading-5',
                message.from === 'bot'
                  ? 'self-start rounded-bl-sm bg-[#eaf0f8] text-[#1a1f2c]'
                  : 'self-end rounded-br-sm bg-[#003366] text-white',
              )}
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 px-[18px] pb-3">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="rounded-full border border-[#cfd6e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#003366] hover:border-[#003366] hover:bg-[#eaf0f8]" onClick={() => send(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
        <form className="flex items-center gap-2 border-t border-[#e4e8f0] bg-[#f5f7fb] px-[18px] py-3" onSubmit={(event) => { event.preventDefault(); send() }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-0 flex-1 rounded-full border border-[#cfd6e3] bg-white px-3.5 py-2 text-[13px] outline-none focus:border-[#003366] focus:ring-4 focus:ring-[#003366]/10"
            placeholder="Ask AssistantAI..."
          />
          <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#003366] text-white hover:bg-[#00254d]" aria-label="Send">
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-dashed border-[#cfd6e3] bg-[#f5f7fb] px-5 py-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f7efd9] text-[#c8a96a]">
        <SparkIcon />
      </div>
      <div>
        <div className="text-[13px] font-bold text-[#003366]">{title}</div>
        <div className="text-xs text-[#8a92a6]">{body}</div>
      </div>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-16 text-center text-[#8a92a6]">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#eaf0f8] text-[#003366]">
        <CalendarIcon />
      </div>
      <div className="mb-1.5 text-[15px] font-bold text-[#003366]">{title}</div>
      <div className="mx-auto max-w-[38ch] text-[13px]">{body}</div>
    </div>
  )
}

function Topbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-[#003366] px-5 py-3.5 text-white shadow-sm md:px-8">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#003366] shadow-sm">
          <LogoIcon />
        </div>
        <div>
          <span className="block text-[17px] font-bold leading-none tracking-tight">ScheduleWhen</span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-white/60">Faculty Portal</span>
        </div>
      </div>
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#c8a96a] text-[11px] font-bold text-[#00254d]">AT</div>
    </header>
  )
}

function LogoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M8 2v4M18 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="3" y="5" width="20" height="18" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h20M7 6.5v1.5M13 6.5v1.5M19 6.5v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <rect x="6" y="17" width="2.4" height="3" rx="0.6" fill="currentColor" />
      <rect x="9.4" y="14.5" width="2.4" height="5.5" rx="0.6" fill="currentColor" opacity="0.75" />
      <rect x="12.8" y="12" width="2.4" height="8" rx="0.6" fill={ACCENT} />
      <rect x="16.2" y="15" width="2.4" height="5" rx="0.6" fill="currentColor" opacity="0.55" />
      <rect x="19.6" y="16.5" width="2.4" height="3.5" rx="0.6" fill="currentColor" opacity="0.4" />
      <path d="M14 10.7l-1.4 1.4h2.8L14 10.7z" fill={ACCENT} />
    </svg>
  )
}

function AssistantIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="11" cy="4.5" r="1.5" fill="currentColor" />
      <path d="M11 6v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="5" y="9" width="12" height="9" rx="2.2" fill="currentColor" />
      <path d="M9 12.8c0 1.2.9 2.2 2 2.2s2-1 2-2.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M4 22c0-1.7 1.4-3 3-3h8c1.7 0 3 1.3 3 3v1H4v-1z" fill="currentColor" />
      <circle cx="22" cy="6.5" r="5" fill="currentColor" />
      <path d="M19.5 9.5l-1.8 2 2.6-.6" fill="currentColor" />
      <rect x="19.5" y="5.3" width="5" height="1.3" rx="0.5" fill={ACCENT} />
      <rect x="19.5" y="7.4" width="5" height="1.3" rx="0.5" fill={ACCENT} />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1l1.8 3.7 4 .6-2.9 2.9.7 4L7 10.3l-3.6 1.9.7-4L1.2 5.3l4-.6L7 1z" fill="currentColor" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2v6M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 12V5l5-3 5 3v7M2 12h10M5 12V8h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8l12-5-5 12-2-5-5-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default App
