import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

export default function UploadSection({ onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [jd, setJd]   = useState('')

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  const canSubmit = file && jd.trim() && !loading

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#5147E5' : file ? '#A5B4FC' : '#E8EAF0'}`,
          borderRadius: 12,
          padding: '18px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? '#EEF0FE' : file ? '#F5F6FF' : '#FAFBFF',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
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
            <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', background: isDragActive ? 'linear-gradient(135deg,#5147E5,#8B7CF6)' : '#F0F1F5', transition:'all 0.2s' }}>
              <Upload size={18} color={isDragActive ? '#fff' : '#9CA3AF'} />
            </div>
            <p style={{ fontWeight:600, fontSize:'0.85rem', color:'#1A1D2E', marginBottom:4 }}>
              {isDragActive ? 'Drop it here!' : 'Upload your resume'}
            </p>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>
              PDF or DOCX &middot; Drag &amp; drop or{' '}
              <span style={{ color:'#5147E5', fontWeight:600 }}>click to browse</span>
            </p>
          </>
        )}
      </div>

      {/* JD Textarea */}
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

      {/* Submit */}
      <button
        onClick={() => canSubmit && onSubmit(file, jd)}
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
