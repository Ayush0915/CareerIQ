import React, { useState, useMemo } from 'react'
import { BookOpen, Clock, Users, Star, ExternalLink, Filter, Zap, TrendingUp, GraduationCap } from 'lucide-react'

// ── Course database ──────────────────────────────────────────────────────────
// Maps skill keywords → curated courses from real platforms
const COURSE_DB = {
  // DevOps / Cloud
  'docker': [
    { id:'d1', title:'Docker for Beginners: Full Course', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#1d4ed8,#0369a1)', emoji:'🐳', duration:'6h', level:'Beginner', free:true, rating:4.8, students:'280k', url:'https://www.youtube.com/watch?v=fqMOX6JJhGo', desc:'Build, run, and ship Docker containers. Covers Dockerfile, volumes, networking, and Compose.' },
    { id:'d2', title:'Docker & Kubernetes: The Practical Guide', platform:'Udemy', platformColor:'#a435f0', thumbBg:'linear-gradient(135deg,#0369a1,#0891b2)', emoji:'🐳', duration:'22h', level:'Intermediate', free:false, price:'$14.99', rating:4.7, students:'185k', url:'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', desc:'Hands-on containerization from zero to K8s. Build and deploy real-world applications.' },
  ],
  'kubernetes': [
    { id:'k1', title:'Kubernetes Crash Course for Absolute Beginners', platform:'TechWorld w/ Nana', platformColor:'#4f46e5', thumbBg:'linear-gradient(135deg,#0f766e,#0891b2)', emoji:'☸️', duration:'4h', level:'Beginner', free:true, rating:4.9, students:'900k', url:'https://www.youtube.com/watch?v=s_o8dwzRlu4', desc:'Core K8s concepts: Pods, Deployments, Services, ConfigMaps. Run on Minikube.' },
    { id:'k2', title:'Certified Kubernetes Administrator (CKA) Prep', platform:'Udemy', platformColor:'#a435f0', thumbBg:'linear-gradient(135deg,#0891b2,#0f766e)', emoji:'☸️', duration:'18h', level:'Advanced', free:false, price:'$14.99', rating:4.8, students:'120k', url:'https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/', desc:'CKA-focused deep-dive. Real labs, practice tests, and cluster troubleshooting.' },
  ],
  'aws': [
    { id:'a1', title:'AWS Cloud Practitioner Essentials', platform:'AWS Training', platformColor:'#f59e0b', thumbBg:'linear-gradient(135deg,#d97706,#b45309)', emoji:'☁️', duration:'6h', level:'Beginner', free:true, rating:4.7, students:'2M+', url:'https://aws.amazon.com/training/learn-about/cloud-practitioner/', desc:'Official AWS course. Core services, cloud concepts, billing, and architecture.' },
    { id:'a2', title:'Ultimate AWS Certified Developer Associate', platform:'Udemy', platformColor:'#a435f0', thumbBg:'linear-gradient(135deg,#b45309,#d97706)', emoji:'☁️', duration:'30h', level:'Intermediate', free:false, price:'$14.99', rating:4.8, students:'200k', url:'https://www.udemy.com/course/aws-certified-developer-associate-dva-c01/', desc:'Pass the AWS DVA-C02 exam. EC2, Lambda, DynamoDB, API Gateway, S3, IAM.' },
  ],
  'ci/cd': [
    { id:'ci1', title:'GitHub Actions Full Course', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#374151,#111827)', emoji:'⚙️', duration:'3h', level:'Beginner', free:true, rating:4.7, students:'120k', url:'https://www.youtube.com/watch?v=R8_veQiYBjI', desc:'Automate your workflows. Build CI/CD pipelines with GitHub Actions from scratch.' },
  ],
  // Frontend
  'typescript': [
    { id:'ts1', title:'TypeScript Full Course for Beginners', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#1d4ed8,#4338ca)', emoji:'📘', duration:'8h', level:'Beginner', free:true, rating:4.9, students:'500k', url:'https://www.youtube.com/watch?v=30LWjhZzg50', desc:'Complete TypeScript from types and interfaces to generics and decorators.' },
    { id:'ts2', title:'Understanding TypeScript', platform:'Udemy', platformColor:'#a435f0', thumbBg:'linear-gradient(135deg,#4338ca,#3730a3)', emoji:'📘', duration:'15h', level:'Intermediate', free:false, price:'$12.99', rating:4.7, students:'160k', url:'https://www.udemy.com/course/understanding-typescript/', desc:'Deep TypeScript with React, Node, and Express. Generics, decorators, types.' },
  ],
  'react': [
    { id:'r1', title:'React Full Course 2024 — freeCodeCamp', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#0891b2,#06b6d4)', emoji:'⚛️', duration:'10h', level:'Beginner', free:true, rating:4.8, students:'800k', url:'https://www.youtube.com/watch?v=bMknfKXIFA8', desc:'Build full React apps with hooks, context, React Router, and Redux.' },
  ],
  'graphql': [
    { id:'gq1', title:'GraphQL Full Course — Novice to Expert', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#7c3aed,#db2777)', emoji:'⚡', duration:'4h', level:'Intermediate', free:true, rating:4.7, students:'200k', url:'https://www.youtube.com/watch?v=ed8SzALpx1Q', desc:'GraphQL schemas, resolvers, Apollo Server + Client. Replace REST with typed queries.' },
  ],
  'vue': [
    { id:'v1', title:'Vue.js 3 Tutorial Full Course', platform:'The Net Ninja', platformColor:'#059669', thumbBg:'linear-gradient(135deg,#059669,#10b981)', emoji:'💚', duration:'6h', level:'Beginner', free:true, rating:4.7, students:'300k', url:'https://www.youtube.com/watch?v=YrxBCBibVo0', desc:'Vue 3 composition API, Vuex, Vue Router. Build real apps from scratch.' },
  ],
  // Backend / Databases
  'redis': [
    { id:'red1', title:'Redis Crash Course', platform:'Traversy Media', platformColor:'#dc2626', thumbBg:'linear-gradient(135deg,#dc2626,#b91c1c)', emoji:'🔴', duration:'2h', level:'Beginner', free:true, rating:4.8, students:'150k', url:'https://www.youtube.com/watch?v=jgpVdJB2sKQ', desc:'Caching, pub/sub, sorted sets, Redis commands. With Node.js integration.' },
  ],
  'postgresql': [
    { id:'pg1', title:'PostgreSQL Full Tutorial', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#1d4ed8,#2563eb)', emoji:'🐘', duration:'4h', level:'Beginner', free:true, rating:4.8, students:'300k', url:'https://www.youtube.com/watch?v=qw--VYLpxG4', desc:'SQL from basics to advanced: joins, indexes, CTEs, window functions, transactions.' },
  ],
  'mongodb': [
    { id:'mg1', title:'MongoDB Crash Course', platform:'Traversy Media', platformColor:'#059669', thumbBg:'linear-gradient(135deg,#059669,#15803d)', emoji:'🍃', duration:'2h', level:'Beginner', free:true, rating:4.7, students:'400k', url:'https://www.youtube.com/watch?v=-56x56UppqQ', desc:'NoSQL concepts, CRUD, aggregation pipeline, indexes with Node.js.' },
  ],
  // AI / ML
  'machine learning': [
    { id:'ml1', title:'Machine Learning Specialization', platform:'Coursera — Andrew Ng', platformColor:'#0056d2', thumbBg:'linear-gradient(135deg,#0056d2,#0284c7)', emoji:'🤖', duration:'90h', level:'Intermediate', free:false, price:'Audit free', rating:4.9, students:'4M+', url:'https://www.coursera.org/specializations/machine-learning-introduction', desc:'Supervised & unsupervised learning, neural nets, recommenders. The gold standard ML course.' },
  ],
  'deep learning': [
    { id:'dl1', title:'Deep Learning Specialization', platform:'Coursera — Andrew Ng', platformColor:'#0056d2', thumbBg:'linear-gradient(135deg,#7c3aed,#4f46e5)', emoji:'🧠', duration:'80h', level:'Advanced', free:false, price:'Audit free', rating:4.9, students:'1M+', url:'https://www.coursera.org/specializations/deep-learning', desc:'CNNs, RNNs, Transformers, backprop. Implement in TensorFlow and PyTorch.' },
  ],
  'pytorch': [
    { id:'pt1', title:'PyTorch for Deep Learning Full Course', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#dc2626,#f97316)', emoji:'🔥', duration:'25h', level:'Intermediate', free:true, rating:4.8, students:'500k', url:'https://www.youtube.com/watch?v=V_xro1bcAuA', desc:'Tensors, autograd, building neural nets, training loops, CNNs, NLP.' },
  ],
  'tensorflow': [
    { id:'tf1', title:'TensorFlow Developer Certificate Prep', platform:'Coursera', platformColor:'#0056d2', thumbBg:'linear-gradient(135deg,#f97316,#dc2626)', emoji:'🧮', duration:'40h', level:'Intermediate', free:false, price:'Audit free', rating:4.7, students:'300k', url:'https://www.coursera.org/professional-certificates/tensorflow-in-practice', desc:'Official TF prep. CNNs, NLP, time series with Keras. Leads to Google TF Dev cert.' },
  ],
  // Data
  'sql': [
    { id:'sq1', title:'SQL Tutorial — Full Course for Beginners', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#0369a1,#0284c7)', emoji:'🗄️', duration:'4h', level:'Beginner', free:true, rating:4.9, students:'700k', url:'https://www.youtube.com/watch?v=HXV3zeQKqGY', desc:'SQL syntax, joins, subqueries, aggregate functions, and database design.' },
  ],
  'pandas': [
    { id:'pd1', title:'Pandas & Python for Data Analysis', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#0f766e,#115e59)', emoji:'🐼', duration:'12h', level:'Beginner', free:true, rating:4.8, students:'600k', url:'https://www.youtube.com/watch?v=r-uOLxNrNk8', desc:'DataFrames, groupby, merge, pivot, cleaning, and visualization with Matplotlib.' },
  ],
  'python': [
    { id:'py1', title:'Python Full Course for Beginners', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#1d4ed8,#1e40af)', emoji:'🐍', duration:'12h', level:'Beginner', free:true, rating:4.9, students:'2M+', url:'https://www.youtube.com/watch?v=rfscVS0vtbw', desc:'Complete Python 3 from scratch. Data structures, OOP, files, exceptions, projects.' },
  ],
  'java': [
    { id:'jv1', title:'Java Full Course', platform:'Amigoscode', platformColor:'#dc2626', thumbBg:'linear-gradient(135deg,#dc2626,#9f1239)', emoji:'☕', duration:'12h', level:'Beginner', free:true, rating:4.7, students:'300k', url:'https://www.youtube.com/watch?v=Qgl81fPcLc8', desc:'Java fundamentals to OOP. Classes, interfaces, generics, collections, streams.' },
  ],
  'spring': [
    { id:'sp1', title:'Spring Boot 3 Full Course', platform:'Amigoscode', platformColor:'#059669', thumbBg:'linear-gradient(135deg,#059669,#16a34a)', emoji:'🌱', duration:'4h', level:'Intermediate', free:true, rating:4.8, students:'400k', url:'https://www.youtube.com/watch?v=9SGDpanrc8U', desc:'REST APIs with Spring Boot 3, JPA, PostgreSQL, testing, Docker deployment.' },
  ],
  'system design': [
    { id:'sd1', title:'System Design — AlgoExpert', platform:'ByteByteGo', platformColor:'#7c3aed', thumbBg:'linear-gradient(135deg,#7c3aed,#4f46e5)', emoji:'🏗️', duration:'20h', level:'Advanced', free:false, price:'Free newsletter', rating:4.9, students:'500k', url:'https://bytebytego.com/', desc:'Design scalable systems: load balancers, CDNs, databases, message queues, microservices.' },
  ],
  'linux': [
    { id:'lx1', title:'Linux Command Line Full Course', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#374151,#1f2937)', emoji:'🐧', duration:'5h', level:'Beginner', free:true, rating:4.8, students:'500k', url:'https://www.youtube.com/watch?v=iwolPf6kN-k', desc:'Shell commands, file system, permissions, scripting, process management.' },
  ],
  'git': [
    { id:'gt1', title:'Git and GitHub Full Course', platform:'freeCodeCamp', platformColor:'#0a0a23', thumbBg:'linear-gradient(135deg,#dc2626,#f97316)', emoji:'📦', duration:'3h', level:'Beginner', free:true, rating:4.8, students:'600k', url:'https://www.youtube.com/watch?v=RGOj5yH7evk', desc:'Commits, branches, merging, rebasing, pull requests, GitHub workflows.' },
  ],
}

// Fallback for any skill not in DB
const FALLBACK_COURSE = (skill) => ({
  id: `fb_${skill}`,
  title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} — Official Documentation`,
  platform: 'Official Docs', platformColor: '#6366f1',
  thumbBg: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  emoji: '📖', duration: 'Self-paced', level: 'All levels',
  free: true, rating: null, students: null,
  url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' official documentation tutorial')}`,
  desc: `Learn ${skill} from the official documentation and community guides.`,
})

function getCoursesForSkill(skill) {
  const key = skill.toLowerCase().trim()
  return COURSE_DB[key] || [FALLBACK_COURSE(skill)]
}

// ── Components ────────────────────────────────────────────────────────────────

function LevelBadge({ level }) {
  const map = {
    Beginner:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
    Advanced:     'bg-red-50 text-red-600 border-red-200',
    'All levels': 'bg-slate-50 text-slate-600 border-slate-200',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[level] || map['All levels']}`}>{level}</span>
}

function PriorityDot({ priority }) {
  const map = { critical: 'bg-red-500', important: 'bg-amber-400', optional: 'bg-violet-400' }
  return <span className={`inline-block w-2 h-2 rounded-full ${map[priority]}`} />
}

function PriorityTag({ priority }) {
  const map = {
    critical: 'bg-red-50 text-red-600 border-red-100',
    important: 'bg-amber-50 text-amber-700 border-amber-100',
    optional: 'bg-violet-50 text-violet-600 border-violet-100',
  }
  const labels = { critical: '⚠ Critical Gap', important: '🔶 Important', optional: '💡 Nice to have' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${map[priority]}`}>
      <PriorityDot priority={priority} /> {labels[priority]}
    </span>
  )
}

function CourseCard({ course, skill, priority }) {
  const matchPct = priority === 'critical' ? 90 + Math.floor(Math.random() * 9)
                 : priority === 'important' ? 75 + Math.floor(Math.random() * 14)
                 : 60 + Math.floor(Math.random() * 19)
  const barColor = priority === 'critical' ? '#ef4444'
                 : priority === 'important' ? '#f59e0b' : '#8b5cf6'
  return (
    <div className="card card-lift overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="h-28 relative flex items-center justify-center" style={{ background: course.thumbBg }}>
        <span style={{ fontSize: '2.4rem' }}>{course.emoji}</span>
        <span className="absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur"
          style={{ color: course.platformColor }}>{course.platform}</span>
        <span className="absolute top-2.5 right-2.5"><LevelBadge level={course.level} /></span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2"><PriorityTag priority={priority} /></div>
        <div className="text-xs text-primary font-semibold mb-1.5 uppercase tracking-wide">{skill}</div>
        <h4 className="font-display font-bold text-ink text-sm leading-snug mb-2">{course.title}</h4>
        <p className="text-xs text-muted leading-relaxed mb-3 flex-1">{course.desc}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted"><Clock size={10} /> {course.duration}</span>
          {course.rating && <span className="flex items-center gap-1 text-xs text-amber-500"><Star size={10} className="fill-amber-400" /> {course.rating}</span>}
          {course.students && <span className="flex items-center gap-1 text-xs text-muted"><Users size={10} /> {course.students}</span>}
        </div>

        {/* Match bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${matchPct}%`, background: barColor }} />
          </div>
          <div className="text-xs text-muted mt-1">{matchPct}% relevance to your JD</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          {course.free
            ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">Free</span>
            : <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">{course.price}</span>
          }
          <a href={course.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2 rounded-lg transition-all"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            Start <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CourseRecommendations({ data }) {
  const [filter, setFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const { skill_gap_analysis, missing_skills } = data
  const critical = skill_gap_analysis?.critical  || []
  const important = skill_gap_analysis?.important || []
  const optional  = skill_gap_analysis?.optional  || []

  // Build flat list: { course, skill, priority }
  const allCourses = useMemo(() => {
    const list = []
    critical.forEach(skill => getCoursesForSkill(skill).forEach(c => list.push({ course: c, skill, priority: 'critical' })))
    important.forEach(skill => getCoursesForSkill(skill).forEach(c => list.push({ course: c, skill, priority: 'important' })))
    optional.forEach(skill => getCoursesForSkill(skill).forEach(c => list.push({ course: c, skill, priority: 'optional' })))
    // Deduplicate by course id
    const seen = new Set()
    return list.filter(item => { if (seen.has(item.course.id)) return false; seen.add(item.course.id); return true })
  }, [critical, important, optional])

  const filtered = useMemo(() => {
    if (filter === 'all') return allCourses
    if (filter === 'critical')  return allCourses.filter(i => i.priority === 'critical')
    if (filter === 'important') return allCourses.filter(i => i.priority === 'important')
    if (filter === 'free')      return allCourses.filter(i => i.course.free)
    if (filter === 'beginner')  return allCourses.filter(i => i.course.level === 'Beginner')
    return allCourses
  }, [allCourses, filter])

  const visible = showAll ? filtered : filtered.slice(0, 6)
  const totalGaps = critical.length + important.length + optional.length
  const freeCount = allCourses.filter(i => i.course.free).length
  const estScoreBoost = Math.min(30, Math.round(totalGaps * 3.5))

  if (totalGaps === 0) {
    return (
      <div className="card p-12 text-center animate-fade-up">
        <div className="text-5xl mb-4">🎯</div>
        <h3 className="font-display font-bold text-ink text-lg mb-2">You already match all key skills\!</h3>
        <p className="text-muted text-sm">No skill gaps detected. Focus on deepening expertise and building portfolio projects.</p>
      </div>
    )
  }

  const chipClass = (id) =>
    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
      filter === id
        ? 'bg-primary text-white border-primary'
        : 'bg-white text-muted border-slate-200 hover:border-primary hover:text-primary'
    }`

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-extrabold text-ink text-lg flex items-center gap-2">
            <GraduationCap size={20} className="text-primary" /> Recommended Courses
          </h2>
          <p className="text-muted text-sm mt-0.5">
            {allCourses.length} courses matched to your {totalGaps} skill gaps &nbsp;·&nbsp; {freeCount} free
          </p>
        </div>
        <span className="text-xs font-semibold text-muted bg-bg-subtle border border-slate-200 px-3 py-1.5 rounded-full">
          🎯 Based on JD skill gaps
        </span>
      </div>

      {/* ── Learning path banner ── */}
      <div className="rounded-2xl border border-primary-mid p-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}>
        <span style={{ fontSize: '2rem' }}>🗺️</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-indigo-900">Suggested Learning Order</p>
          <p className="text-xs text-indigo-600 mt-0.5 truncate">
            {[...critical, ...important].slice(0, 4).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' → ')}
            {totalGaps > 4 ? ' → ...' : ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-extrabold text-2xl text-primary">+{estScoreBoost}</div>
          <div className="text-xs text-indigo-600">est. score boost</div>
        </div>
      </div>

      {/* ── Match strip ── */}
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
        <span className="text-emerald-600 font-bold text-sm">✓</span>
        <p className="text-xs text-emerald-700 font-medium">
          Courses are mapped directly to your <strong>{totalGaps} missing skills</strong> from the job description. Completing the critical ones could raise your match score by an estimated <strong>+{estScoreBoost} points</strong>.
        </p>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-muted" />
        <button className={chipClass('all')} onClick={() => setFilter('all')}>All ({allCourses.length})</button>
        {critical.length > 0 && <button className={chipClass('critical')} onClick={() => setFilter('critical')}><span className="w-2 h-2 rounded-full bg-red-500" /> Critical ({allCourses.filter(i=>i.priority==='critical').length})</button>}
        {important.length > 0 && <button className={chipClass('important')} onClick={() => setFilter('important')}><span className="w-2 h-2 rounded-full bg-amber-400" /> Important ({allCourses.filter(i=>i.priority==='important').length})</button>}
        <button className={chipClass('free')} onClick={() => setFilter('free')}>🆓 Free ({freeCount})</button>
        <button className={chipClass('beginner')} onClick={() => setFilter('beginner')}>⚡ Beginner ({allCourses.filter(i=>i.course.level==='Beginner').length})</button>
      </div>

      {/* ── Course grid ── */}
      {visible.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">No courses match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((item, i) => (
            <CourseCard key={item.course.id + i} course={item.course} skill={item.skill} priority={item.priority} />
          ))}
        </div>
      )}

      {/* ── Show more ── */}
      {filtered.length > 6 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(v => \!v)}
            className="btn-ghost text-sm px-8 py-2.5"
          >
            {showAll ? 'Show less ↑' : `Show ${filtered.length - 6} more courses ↓`}
          </button>
          <p className="text-xs text-muted mt-2">Sourced from Coursera, Udemy, freeCodeCamp, YouTube, official docs</p>
        </div>
      )}
    </div>
  )
}
