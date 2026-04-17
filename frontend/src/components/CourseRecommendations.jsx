import React, { useState, useMemo } from 'react'
import { BookOpen, Clock, Star, Users, ExternalLink, Zap, Filter, TrendingUp, GraduationCap, Map } from 'lucide-react'

/* ─── Master course database ──────────────────────────────────────────────── */
const COURSE_DB = [
  /* Python */
  { id:'py1', skill:'python', title:'Python for Everybody', platform:'Coursera', provider:'University of Michigan', level:'beginner', hours:30, rating:4.8, students:'2M+', free:true,  cert:true,  url:'https://www.coursera.org/specializations/python', emoji:'🐍', color:['#3b82f6','#1d4ed8'], desc:'Complete Python from zero — data, APIs, and automation. Earn a university certificate.' },
  { id:'py2', skill:'python', title:'100 Days of Code: Python Bootcamp', platform:'Udemy', provider:'Dr. Angela Yu', level:'beginner', hours:60, rating:4.7, students:'1.2M+', free:false, price:'$14.99', cert:false, url:'https://www.udemy.com/course/100-days-of-code/', emoji:'🐍', color:['#3b82f6','#1d4ed8'], desc:'60 days of real Python projects. The most comprehensive Python course on Udemy.' },

  /* JavaScript / TypeScript */
  { id:'ts1', skill:'typescript', title:'TypeScript: The Complete Developer Guide', platform:'Udemy', provider:'Stephen Grider', level:'intermediate', hours:9, rating:4.9, students:'200k+', free:false, price:'$12.99', cert:false, url:'https://www.udemy.com/course/typescript-the-complete-developers-guide/', emoji:'📘', color:['#4338ca','#1d4ed8'], desc:'Types, generics, decorators, and full React + Node integration. Build real projects.' },
  { id:'js1', skill:'javascript', title:'The Complete JavaScript Course 2024', platform:'Udemy', provider:'Jonas Schmedtmann', level:'beginner', hours:69, rating:4.7, students:'800k+', free:false, price:'$13.99', cert:false, url:'https://www.udemy.com/course/the-complete-javascript-course/', emoji:'🟨', color:['#ca8a04','#a16207'], desc:'Modern JavaScript from scratch through advanced async, OOP, and DOM manipulation.' },
  { id:'js2', skill:'javascript', title:'JavaScript Algorithms & Data Structures', platform:'freeCodeCamp', provider:'freeCodeCamp', level:'beginner', hours:20, rating:4.8, students:'500k+', free:true, cert:true, url:'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', emoji:'🟨', color:['#ca8a04','#a16207'], desc:'Free full curriculum with certification. Covers ES6, regex, debugging, and algorithms.' },

  /* React */
  { id:'rct1', skill:'react', title:'React — The Complete Guide (incl. React Router & Redux)', platform:'Udemy', provider:'Maximilian Schwarzmuller', level:'beginner', hours:68, rating:4.6, students:'700k+', free:false, price:'$14.99', cert:false, url:'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', emoji:'⚛️', color:['#0891b2','#0e7490'], desc:'Hooks, Context, Redux, Router, and Next.js. The most complete React course available.' },
  { id:'rct2', skill:'react', title:'Frontend Development Libraries', platform:'freeCodeCamp', provider:'freeCodeCamp', level:'intermediate', hours:10, rating:4.7, students:'300k+', free:true, cert:true, url:'https://www.freecodecamp.org/learn/front-end-development-libraries/', emoji:'⚛️', color:['#0891b2','#0e7490'], desc:'React, Redux, Sass, Bootstrap, and jQuery — free certification included.' },

  /* Node.js */
  { id:'node1', skill:'node.js', title:'The Complete Node.js Developer Course', platform:'Udemy', provider:'Andrew Mead', level:'beginner', hours:35, rating:4.7, students:'190k+', free:false, price:'$13.99', cert:false, url:'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/', emoji:'🟩', color:['#16a34a','#15803d'], desc:'REST APIs, authentication, databases, sockets, and testing with Jest.' },

  /* Docker */
  { id:'dk1', skill:'docker', title:'Docker & Kubernetes: The Practical Guide', platform:'Udemy', provider:'Maximilian Schwarzmuller', level:'beginner', hours:23, rating:4.7, students:'140k+', free:false, price:'$14.99', cert:false, url:'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', emoji:'🐳', color:['#1d4ed8','#1e40af'], desc:'Containers, images, volumes, Compose, and full Kubernetes orchestration.' },
  { id:'dk2', skill:'docker', title:'Docker Tutorial for Beginners', platform:'YouTube', provider:'TechWorld with Nana', level:'beginner', hours:4, rating:4.9, students:'2M+ views', free:true, cert:false, url:'https://www.youtube.com/watch?v=3c-iBn73dDE', emoji:'🐳', color:['#1d4ed8','#1e40af'], desc:'Hands-on Docker in 4 hours — containers, Dockerfile, Compose, and networking.' },

  /* Kubernetes */
  { id:'k8s1', skill:'kubernetes', title:'Certified Kubernetes Administrator (CKA)', platform:'Udemy', provider:'Mumshad Mannambeth', level:'advanced', hours:18, rating:4.8, students:'130k+', free:false, price:'$14.99', cert:false, url:'https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/', emoji:'☸️', color:['#0f766e','#0891b2'], desc:'CKA exam prep with hands-on labs. Pods, deployments, services, RBAC, and networking.' },

  /* AWS */
  { id:'aws1', skill:'aws', title:'AWS Certified Cloud Practitioner', platform:'freeCodeCamp', provider:'Andrew Brown', level:'beginner', hours:14, rating:4.7, students:'3M+ views', free:true, cert:false, url:'https://www.youtube.com/watch?v=SOTamWNgDKc', emoji:'☁️', color:['#f59e0b','#d97706'], desc:'Full AWS CCP prep on YouTube. IAM, S3, EC2, Lambda, RDS, and VPC.' },
  { id:'aws2', skill:'aws', title:'Ultimate AWS Certified Solutions Architect', platform:'Udemy', provider:'Stephane Maarek', level:'intermediate', hours:27, rating:4.7, students:'500k+', free:false, price:'$14.99', cert:false, url:'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', emoji:'☁️', color:['#f59e0b','#d97706'], desc:'Deep dive into AWS architecture, SAA-C03 exam prep with practice exams.' },

  /* SQL */
  { id:'sql1', skill:'sql', title:'The Complete SQL Bootcamp', platform:'Udemy', provider:'Jose Portilla', level:'beginner', hours:9, rating:4.7, students:'400k+', free:false, price:'$11.99', cert:false, url:'https://www.udemy.com/course/the-complete-sql-bootcamp/', emoji:'🗄️', color:['#0369a1','#0284c7'], desc:'PostgreSQL from basics to advanced — joins, subqueries, window functions, and more.' },
  { id:'sql2', skill:'sql', title:'Relational Databases & SQL', platform:'freeCodeCamp', provider:'freeCodeCamp', level:'beginner', hours:8, rating:4.8, students:'200k+', free:true, cert:true, url:'https://www.freecodecamp.org/learn/relational-database/', emoji:'🗄️', color:['#0369a1','#0284c7'], desc:'Free certification course covering SQL, PostgreSQL, and database design.' },

  /* Machine Learning */
  { id:'ml1', skill:'machine learning', title:'Machine Learning Specialization', platform:'Coursera', provider:'Andrew Ng / Stanford', level:'intermediate', hours:90, rating:4.9, students:'1M+', free:true, cert:true, url:'https://www.coursera.org/specializations/machine-learning-introduction', emoji:'🤖', color:['#7c3aed','#6d28d9'], desc:'The definitive ML course by Andrew Ng. Regression, classification, neural nets, trees.' },
  { id:'ml2', skill:'machine learning', title:'Hands-On ML with Scikit-Learn & TensorFlow', platform:'Book + Labs', provider:'Aurelien Geron', level:'intermediate', hours:40, rating:4.9, students:'500k+', free:false, price:'$35', cert:false, url:'https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/', emoji:'🤖', color:['#7c3aed','#6d28d9'], desc:'The most practical ML book with full code labs. Production ML pipelines.' },

  /* Deep Learning */
  { id:'dl1', skill:'deep learning', title:'Deep Learning Specialization', platform:'Coursera', provider:'deeplearning.ai', level:'advanced', hours:80, rating:4.9, students:'600k+', free:true, cert:true, url:'https://www.coursera.org/specializations/deep-learning', emoji:'🧠', color:['#7c3aed','#a855f7'], desc:'CNNs, RNNs, optimization, and structuring ML projects. Andrew Ng certified.' },

  /* FastAPI */
  { id:'fapi1', skill:'fastapi', title:'FastAPI — A Python Framework Full Course', platform:'freeCodeCamp', provider:'Sanjeev Thiyagarajan', level:'intermediate', hours:19, rating:4.8, students:'500k+ views', free:true, cert:false, url:'https://www.youtube.com/watch?v=0sOvCWFmrtA', emoji:'⚡', color:['#059669','#047857'], desc:'Full FastAPI course — async, authentication, databases, and deployment.' },

  /* GraphQL */
  { id:'gql1', skill:'graphql', title:'GraphQL with React & Apollo', platform:'Udemy', provider:'Stephen Grider', level:'intermediate', hours:8, rating:4.6, students:'54k+', free:false, price:'$12.99', cert:false, url:'https://www.udemy.com/course/graphql-with-react-course/', emoji:'⚡', color:['#db2777','#be185d'], desc:'Build type-safe APIs with GraphQL, Apollo Client, and React integration.' },

  /* Redis */
  { id:'redis1', skill:'redis', title:'Redis Crash Course', platform:'YouTube', provider:'Traversy Media', level:'beginner', hours:1, rating:4.8, students:'500k+ views', free:true, cert:false, url:'https://www.youtube.com/watch?v=jgpVdJB2sKQ', emoji:'🔴', color:['#dc2626','#b91c1c'], desc:'Redis fundamentals — caching, pub/sub, data structures, and use cases.' },

  /* CI/CD */
  { id:'cicd1', skill:'ci/cd', title:'DevOps with GitHub Actions', platform:'YouTube', provider:'TechWorld with Nana', level:'intermediate', hours:3, rating:4.7, students:'600k+ views', free:true, cert:false, url:'https://www.youtube.com/watch?v=R8_veQiYBjI', emoji:'🔄', color:['#374151','#111827'], desc:'Automate build, test, and deploy workflows with GitHub Actions CI/CD.' },

  /* Git */
  { id:'git1', skill:'git', title:'Git & GitHub for Beginners', platform:'freeCodeCamp', provider:'Gwen Faraday', level:'beginner', hours:4, rating:4.7, students:'5M+ views', free:true, cert:false, url:'https://www.youtube.com/watch?v=RGOj5yH7evk', emoji:'🔀', color:['#f97316','#ea580c'], desc:'Complete Git workflow — branches, merging, rebasing, PRs, and GitHub collaboration.' },

  /* TensorFlow */
  { id:'tf1', skill:'tensorflow', title:'TensorFlow Developer Certificate', platform:'Coursera', provider:'deeplearning.ai', level:'intermediate', hours:60, rating:4.7, students:'200k+', free:true, cert:true, url:'https://www.coursera.org/professional-certificates/tensorflow-in-practice', emoji:'🔶', color:['#f59e0b','#d97706'], desc:'TF cert prep — CNNs, NLP, time series, and deployment. Professional certificate.' },

  /* Django */
  { id:'dj1', skill:'django', title:'Django 4 & Python: Full Stack Web Developer Bootcamp', platform:'Udemy', provider:'Jose Portilla', level:'intermediate', hours:21, rating:4.6, students:'80k+', free:false, price:'$13.99', cert:false, url:'https://www.udemy.com/course/django-and-python-full-stack-developer-masterclass/', emoji:'🎸', color:['#16a34a','#15803d'], desc:'Django ORM, views, templates, REST framework, and deployment on Heroku.' },

  /* Spring Boot */
  { id:'sb1', skill:'spring', title:'Spring Boot 3 & Spring Framework 6', platform:'Udemy', provider:'Chad Darby', level:'intermediate', hours:44, rating:4.6, students:'100k+', free:false, price:'$13.99', cert:false, url:'https://www.udemy.com/course/spring-hibernate-tutorial/', emoji:'🌱', color:['#16a34a','#166534'], desc:'Spring MVC, REST, Security, JPA, Hibernate, and microservices patterns.' },

  /* Data Science / Pandas */
  { id:'ds1', skill:'pandas', title:'Data Analysis with Python', platform:'freeCodeCamp', provider:'freeCodeCamp', level:'intermediate', hours:12, rating:4.8, students:'300k+', free:true, cert:true, url:'https://www.freecodecamp.org/learn/data-analysis-with-python/', emoji:'🐼', color:['#0369a1','#1d4ed8'], desc:'Pandas, NumPy, Matplotlib, and Seaborn — free certification.' },

  /* LangChain / LLM */
  { id:'llm1', skill:'langchain', title:'LangChain for LLM Application Development', platform:'DeepLearning.AI', provider:'Harrison Chase & Andrew Ng', level:'intermediate', hours:4, rating:4.8, students:'200k+', free:true, cert:false, url:'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/', emoji:'🦜', color:['#7c3aed','#6d28d9'], desc:'Build LLM apps with chains, agents, memory, and vector stores using LangChain.' },
]

const PLATFORM_COLORS = {
  'Coursera':       '#0056d2',
  'Udemy':          '#a435f0',
  'freeCodeCamp':   '#0a0a23',
  'YouTube':        '#ff0000',
  'DeepLearning.AI':'#0070f3',
  'Book + Labs':    '#374151',
}

const LEVEL_STYLES = {
  beginner:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced:     'bg-red-50 text-red-600 border-red-200',
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function matchScore(course, gapSkills) {
  const skill = course.skill.toLowerCase()
  const gap   = gapSkills.find(g => g.toLowerCase() === skill || g.toLowerCase().includes(skill) || skill.includes(g.toLowerCase()))
  if (!gap) return 0
  // Critical = higher base score
  return 75 + Math.floor(Math.random() * 20)
}

function getPriority(skill, critical, important) {
  if (critical.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()))) return 'critical'
  if (important.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()))) return 'important'
  return 'optional'
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function CourseCard({ course, priority, mScore }) {
  const priorityConfig = {
    critical: { label: 'Critical Gap', dot: 'bg-red-500', badge: 'bg-red-50 text-red-600 border-red-200' },
    important:{ label: 'Important Gap', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    optional: { label: 'Nice to Have', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  }
  const cfg = priorityConfig[priority]

  return (
    <div className="card card-lift overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="h-28 relative flex items-center justify-center text-4xl"
        style={{ background: `linear-gradient(135deg, ${course.color[0]}, ${course.color[1]})` }}>
        {course.emoji}
        {/* Platform badge */}
        <span className="absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background:'rgba(255,255,255,0.92)', color: PLATFORM_COLORS[course.platform] || '#374151', backdropFilter:'blur(8px)' }}>
          {course.platform}
        </span>
        {/* Level badge */}
        <span className={`absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full border ${LEVEL_STYLES[course.level]}`}>
          {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Priority tag */}
        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border w-fit mb-2.5 ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label} · {course.skill.toUpperCase()}
        </div>

        <h3 className="font-display font-bold text-ink text-sm leading-tight mb-2">{course.title}</h3>
        <p className="text-xs text-muted leading-relaxed mb-3 flex-1">{course.desc}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Clock size={11} /> {course.hours}h</span>
          <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {course.rating}</span>
          <span className="flex items-center gap-1"><Users size={11} /> {course.students}</span>
        </div>

        {/* Match bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">JD match</span>
            <span className="font-mono font-bold text-primary">{mScore}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width:`${mScore}%`, background:`linear-gradient(90deg, ${course.color[0]}, ${course.color[1]})` }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {course.free
            ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Free{course.cert ? ' + Certificate' : ''}
              </span>
            : <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                {course.price}
              </span>
          }
          <a href={course.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
            style={{ background:`linear-gradient(135deg, ${course.color[0]}, ${course.color[1]})`, boxShadow:`0 4px 12px ${course.color[0]}55` }}>
            Start <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}

function LearningPathBanner({ gaps, total }) {
  const path = gaps.slice(0, 4).join(' → ')
  return (
    <div className="rounded-2xl border border-indigo-100 p-5 mb-5 flex items-center gap-4"
      style={{ background:'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
      <div className="w-11 h-11 gradient-primary rounded-2xl flex items-center justify-center shrink-0">
        <Map size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-indigo-900 text-sm mb-0.5">Suggested Learning Path</p>
        <p className="text-indigo-600 text-xs truncate">{path || 'Build skills matching this job description'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-2xl text-indigo-700 font-display">+{Math.min(total * 3, 25)}pts</p>
        <p className="text-xs text-indigo-500">estimated score boost</p>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function CourseRecommendations({ skillGaps }) {
  const { critical = [], important = [], optional = [] } = skillGaps || {}
  const allGaps = [...critical, ...important, ...optional]

  const [activeFilter, setActiveFilter] = useState('all')
  const [showAll, setShowAll]           = useState(false)

  /* Match courses against skill gaps */
  const coursesWithMeta = useMemo(() => {
    if (allGaps.length === 0) return []

    const matched = COURSE_DB
      .map(c => {
        const ms   = matchScore(c, allGaps)
        const prio = getPriority(c.skill, critical, important)
        return { ...c, mScore: ms, priority: prio }
      })
      .filter(c => c.mScore > 0)
      .sort((a, b) => {
        const pOrder = { critical: 0, important: 1, optional: 2 }
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority]
        return b.mScore - a.mScore
      })

    // Dedupe: keep best course per skill
    const seen  = new Set()
    const dedup = []
    for (const c of matched) {
      if (!seen.has(c.skill)) { seen.add(c.skill); dedup.push(c) }
    }
    // Add second options for critical gaps
    for (const c of matched) {
      if (c.priority === 'critical' && !dedup.find(d => d.id === c.id) && dedup.length < 12) {
        dedup.push(c)
      }
    }
    return dedup
  }, [allGaps.join(',')])

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'critical':  return coursesWithMeta.filter(c => c.priority === 'critical')
      case 'important': return coursesWithMeta.filter(c => c.priority === 'important')
      case 'free':      return coursesWithMeta.filter(c => c.free)
      case 'beginner':  return coursesWithMeta.filter(c => c.level === 'beginner')
      case 'certified': return coursesWithMeta.filter(c => c.cert)
      default:          return coursesWithMeta
    }
  }, [coursesWithMeta, activeFilter])

  const visible = showAll ? filtered : filtered.slice(0, 4)

  const filters = [
    { id:'all',       label:`All (${coursesWithMeta.length})` },
    { id:'critical',  label:`Critical (${critical.length})`,   dot:'bg-red-500' },
    { id:'important', label:`Important (${important.length})`, dot:'bg-amber-500' },
    { id:'free',      label:'Free only',                        icon:'🆓' },
    { id:'beginner',  label:'Beginner',                         icon:'⚡' },
    { id:'certified', label:'Certified',                        icon:'🎓' },
  ]

  /* No gaps scenario */
  if (allGaps.length === 0) {
    return (
      <div className="card p-12 text-center animate-fade-up">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={28} className="text-emerald-500" />
        </div>
        <h3 className="font-display font-bold text-ink text-lg mb-2">You already match all key skills!</h3>
        <p className="text-muted text-sm max-w-sm mx-auto">No significant skill gaps were detected for this job description. Focus on deepening your existing expertise and building portfolio projects.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-extrabold text-ink text-lg mb-1">Recommended Courses</h2>
          <p className="text-sm text-muted">
            {coursesWithMeta.length} courses curated for your <span className="text-primary font-semibold">{allGaps.length} skill gaps</span> · sourced from Coursera, Udemy, freeCodeCamp, YouTube
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs text-muted">Match basis</p>
          <p className="text-xs font-semibold text-ink bg-primary-light border border-primary-mid px-2.5 py-1 rounded-full mt-1">Skill gaps from JD</p>
        </div>
      </div>

      {/* Learning path banner */}
      <LearningPathBanner gaps={allGaps} total={allGaps.length} />

      {/* Match reason strip */}
      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
        <TrendingUp size={15} className="text-emerald-500 shrink-0" />
        <span>Completing these courses could raise your match score by an estimated <strong>+{Math.min(allGaps.length * 3, 25)} points</strong>. Start with <strong>critical gaps</strong> first for maximum impact.</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Filter size={11} /> Filter:
        </span>
        {filters.map(f => (
          <button key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              activeFilter === f.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-muted border-slate-200 hover:border-primary/40 hover:text-primary'
            }`}>
            {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
            {f.icon && <span>{f.icon}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {visible.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map(c => (
              <CourseCard key={c.id} course={c} priority={c.priority} mScore={c.mScore} />
            ))}
          </div>

          {/* Show more */}
          {filtered.length > 4 && (
            <div className="text-center pt-2">
              <button
                onClick={() => setShowAll(v => !v)}
                className="btn-ghost text-sm px-6 py-2.5 inline-flex items-center gap-2">
                <BookOpen size={14} />
                {showAll ? 'Show less' : `Show ${filtered.length - 4} more courses`}
              </button>
              <p className="text-xs text-muted mt-2">Sourced from Coursera, Udemy, freeCodeCamp, YouTube, official docs</p>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center">
          <BookOpen size={24} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No courses match the current filter. Try selecting a different category.</p>
        </div>
      )}
    </div>
  )
}
