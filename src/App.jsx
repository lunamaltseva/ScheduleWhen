import { useState, useEffect, useMemo, Fragment } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

const META_COLS = 6  // Student ID, Department, Concentration, Year, International, Total Credits
const PAGE_SIZE = 50

const YEAR_ORDER = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Masters 1st Year', 'Masters 2nd Year']

export default function App() {
  const [headers, setHeaders]   = useState([])
  const [allRows, setAllRows]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [dept, setDept]         = useState('')
  const [year, setYear]         = useState('')
  const [intl, setIntl]         = useState('')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}Fall_2026_Students.xlsx`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — make sure Fall_2026_Students.xlsx is in public/`)
        return r.arrayBuffer()
      })
      .then(buf => {
        const wb   = XLSX.read(buf)
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
        setHeaders(data[0] ?? [])
        setAllRows(data.slice(1).filter(r => r.length > 0))
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const depts = useMemo(
    () => [...new Set(allRows.map(r => r[1]))].filter(Boolean).sort(),
    [allRows],
  )
  const years = useMemo(
    () => [...new Set(allRows.map(r => r[3]))].filter(Boolean)
           .sort((a, b) => YEAR_ORDER.indexOf(a) - YEAR_ORDER.indexOf(b)),
    [allRows],
  )

  const filtered = useMemo(() => allRows.filter(r => {
    if (dept   && r[1] !== dept)   return false
    if (year   && r[3] !== year)   return false
    if (intl   && r[4] !== intl)   return false
    if (search && !String(r[0]).toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [allRows, dept, year, intl, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const intlCount = useMemo(() => allRows.filter(r => r[4] === 'Yes').length, [allRows])

  function resetPage() { setPage(0) }

  if (loading) return <div className="fullscreen-msg">Loading enrollment data…</div>
  if (error)   return <div className="fullscreen-msg error">Error: {error}</div>

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>ScheduleWhen</h1>
          <span>AUCA Fall 2026</span>
        </div>
        <div className="stats">
          <Stat label="Students"      value={allRows.length.toLocaleString()} />
          <Stat label="International" value={intlCount.toLocaleString()} />
          <Stat label="Departments"   value={depts.length} />
        </div>
      </header>

      <div className="toolbar">
        <input
          className="search-box"
          placeholder="Search by Student ID…"
          value={search}
          onChange={e => { setSearch(e.target.value); resetPage() }}
        />
        <select value={dept} onChange={e => { setDept(e.target.value); resetPage() }}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={year} onChange={e => { setYear(e.target.value); resetPage() }}>
          <option value="">All Years</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={intl} onChange={e => { setIntl(e.target.value); resetPage() }}>
          <option value="">All Students</option>
          <option value="Yes">International</option>
          <option value="No">Domestic</option>
        </select>
        <span className="tally">{filtered.length.toLocaleString()} shown</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {headers.slice(0, META_COLS).map((h, i) => <th key={i}>{h}</th>)}
              <th>Courses</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(row => {
              const id      = row[0]
              const isExp   = expanded === id
              const courses = row.slice(META_COLS).filter(Boolean)
              return (
                <Fragment key={id}>
                  <tr
                    className={isExp ? 'row-main open' : 'row-main'}
                    onClick={() => setExpanded(isExp ? null : id)}
                  >
                    {row.slice(0, META_COLS).map((v, ci) => (
                      <td key={ci} data-col={ci}>{v ?? ''}</td>
                    ))}
                    <td className="courses-cell">
                      <span className="course-count">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                      <span className="chevron">{isExp ? '▲' : '▼'}</span>
                    </td>
                  </tr>
                  {isExp && (
                    <tr className="row-expand">
                      <td colSpan={META_COLS + 1}>
                        <ol className="course-list">
                          {courses.map((c, i) => <li key={i}>{c}</li>)}
                        </ol>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="pagination">
          <button onClick={() => setPage(0)}              disabled={page === 0}>«</button>
          <button onClick={() => setPage(p => p - 1)}    disabled={page === 0}>‹</button>
          <span>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)}    disabled={page === totalPages - 1}>›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
        </nav>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
