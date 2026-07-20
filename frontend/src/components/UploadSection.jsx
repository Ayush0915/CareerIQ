import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, ArrowRight, Sparkles, CheckCircle2, Type, File } from 'lucide-react'

export default function UploadSection({ onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [jdMode, setJdMode] = useState('text') // 'text' | 'pdf'
  const [jd, setJd] = useState('')
  const [jdFile, setJdFile] = useState(null)

  // Resume dropzone
  const onDropResume = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps, isDragActive: isResumeDragActive } = useDropzone({
    onDrop: onDropResume,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  // JD PDF dropzone
  const onDropJd = useCallback((accepted) => {
    if (accepted[0]) setJdFile(accepted[0])
  }, [])

  const { getRootProps: getJdRootProps, getInputProps: getJdInputProps, isDragActive: isJdDragActive } = useDropzone({
    onDrop: onDropJd,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  })

  const canSubmit = file && (jdMode === 'text' ? jd.trim() : jdFile) && !loading

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>

      {/* Resume Drop Zone */}
      <div
        {...getResumeRootProps()}
        style={{
          border: `2px dashed ${isResumeDragActive ? '#5147E5' : file ? '#A5B4FC' : '#E8EAF0'}`,
          borderRadius: 12,
          padding: '18px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isResumeDragActive ? '#EEF0FE' : file ? '#F5F6FF' : '#FAFBFF',
          transition: 'all 0.2s',
        }}
      >
        <input {...getResumeInputProps()} />
        {file ? (
          <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <FileText size={16} color="#fff" />
            </div>
            <div style={{ textAlign:'left', flex:1, minWidth:0 }}>
              <p style={{ fontWeight:600, fontSize:'0.85rem', color:'#1A1D2E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</p>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                <span style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>{(file.size / 1024).toFixed(0)} KB</span>
                <span style={{ fontSize:'0.7rem', color:'#22C55E', display:'flex', alignItems:'center', gap:3, fontWeight:500 }}>
                  <CheckCircle2 size={11} /> Ready
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#EF4444' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9CA3AF' }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', background: isResumeDragActive ? 'linear-gradient(135deg,#5147E5,#8B7CF6)' : '#F0F1F5', transition:'all 0.2s' }}>
              <Upload size={18} color={isResumeDragActive ? '#fff' : '#9CA3AF'} />
            </div>
            <p style={{ fontWeight:600, fontSize:'0.85rem', color:'#1A1D2E', marginBottom:4 }}>
              {isResumeDragActive ? 'Drop it here!' : 'Upload your resume'}
            </p>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>
              PDF or DOCX &middot; Drag &amp; drop or{' '}
              <span style={{ color:'#5147E5', fontWeight:600 }}>click to browse</span>
            </p>
          </>
        )}
      </div>

      {/* Mode Selector for Job Description */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
          <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#4B5563' }}>Job Description</span>
          <div style={{ display:'flex', gap: 4, background:'#F3F4F6', padding: 2, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setJdMode('text')}
              style={{
                display:'flex', alignItems:'center', gap: 4,
                padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 6,
                border: 'none', cursor: 'pointer',
                background: jdMode === 'text' ? '#fff' : 'transparent',
                color: jdMode === 'text' ? '#5147E5' : '#6B7280',
                boxShadow: jdMode === 'text' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Type size={12} />
              Paste text
            </button>
            <button
              type="button"
              onClick={() => setJdMode('pdf')}
              style={{
                display:'flex', alignItems:'center', gap: 4,
                padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, borderRadius: 6,
                border: 'none', cursor: 'pointer',
                background: jdMode === 'pdf' ? '#fff' : 'transparent',
                color: jdMode === 'pdf' ? '#5147E5' : '#6B7280',
                boxShadow: jdMode === 'pdf' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <File size={12} />
              Upload PDF
            </button>
          </div>
        </div>

        {/* JD Textarea OR JD PDF Dropzone */}
        {jdMode === 'text' ? (
          <div style={{ position:'relative' }}>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              rows={5}
              className="ev-input"
              style={{ resize:'none', fontFamily:"'Inter', sans-serif", width:'100%', boxSizing:'border-box' }}
            />
            {jd.length > 0 && (
              <span style={{ position:'absolute', bottom:12, right:14, fontSize:'0.68rem', fontFamily:'monospace', color: jd.length < 100 ? '#F59E0B' : '#22C55E' }}>
                {jd.length} chars
              </span>
            )}
            {jd.length > 0 && jd.length < 100 && (
              <p style={{ fontSize:'0.68rem', color:'#F59E0B', marginTop:4, paddingLeft:4 }}>Paste more of the JD for better accuracy</p>
            )}
          </div>
        ) : (
          <div
            {...getJdRootProps()}
            style={{
              border: `2px dashed ${isJdDragActive ? '#5147E5' : jdFile ? '#A5B4FC' : '#E8EAF0'}`,
              borderRadius: 12,
              padding: '18px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isJdDragActive ? '#EEF0FE' : jdFile ? '#F5F6FF' : '#FAFBFF',
              transition: 'all 0.2s',
            }}
          >
            <input {...getJdInputProps()} />
            {jdFile ? (
              <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                <div style={{ width:38, height:38, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FileText size={16} color="#fff" />
                </div>
                <div style={{ textAlign:'left', flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:'0.85rem', color:'#1A1D2E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{jdFile.name}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                    <span style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>{(jdFile.size / 1024).toFixed(0)} KB</span>
                    <span style={{ fontSize:'0.7rem', color:'#22C55E', display:'flex', alignItems:'center', gap:3, fontWeight:500 }}>
                      <CheckCircle2 size={11} /> Ready
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setJdFile(null) }}
                  style={{ padding:6, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', flexShrink:0 }}
                  onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9CA3AF' }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', background: isJdDragActive ? 'linear-gradient(135deg,#5147E5,#8B7CF6)' : '#F0F1F5', transition:'all 0.2s' }}>
                  <Upload size={16} color={isJdDragActive ? '#fff' : '#9CA3AF'} />
                </div>
                <p style={{ fontWeight:600, fontSize:'0.82rem', color:'#1A1D2E', marginBottom:2 }}>
                  {isJdDragActive ? 'Drop JD PDF here!' : 'Upload Job Description PDF'}
                </p>
                <p style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>
                  PDF format &middot; Drag &amp; drop or <span style={{ color:'#5147E5', fontWeight:600 }}>click to browse</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={() => canSubmit && onSubmit(file, jdMode === 'text' ? jd : '', jdMode === 'pdf' ? jdFile : null)}
        disabled={!canSubmit}
        className="btn-primary"
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 20px', fontSize:'0.875rem', opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
      >
        <Sparkles size={15} />
        {loading ? 'Analyzing...' : 'Analyze Resume with AI'}
        {!loading && <ArrowRight size={14} />}
      </button>
    </div>
  )
}
