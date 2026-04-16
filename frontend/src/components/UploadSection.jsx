import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

export default function UploadSection({ onSubmit, loading, compact = false }) {
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
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary bg-primary-light scale-[1.01]'
            : file
            ? 'border-primary/50 bg-primary-light/40'
            : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-primary-light/20'
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
              <FileText size={16} className="text-white" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-semibold text-ink text-sm truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</span>
                <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={11} /> Ready to analyze
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-danger transition-all ml-auto"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-200 ${
              isDragActive ? 'gradient-primary' : 'bg-bg-subtle border border-slate-200'
            }`}>
              <Upload size={18} className={isDragActive ? 'text-white' : 'text-muted'} />
            </div>
            <p className="font-semibold text-ink text-sm mb-1">
              {isDragActive ? 'Drop it here!' : 'Upload your resume'}
            </p>
            <p className="text-xs text-muted">
              PDF or DOCX &middot; Drag &amp; drop or{' '}
              <span className="text-primary font-semibold">click to browse</span>
            </p>
          </>
        )}
      </div>

      {/* JD Textarea */}
      <div className="relative">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here..."
          rows={compact ? 4 : 5}
          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-ink placeholder-slate-300 text-sm resize-none transition-all"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        {jd.length > 0 && (
          <span className={`absolute bottom-3.5 right-4 text-xs font-mono ${jd.length < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {jd.length} chars
          </span>
        )}
        {jd.length > 0 && jd.length < 100 && (
          <p className="text-xs text-amber-500 mt-1.5 px-1">Paste more of the JD for better accuracy</p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={() => canSubmit && onSubmit(file, jd)}
        disabled={!canSubmit}
        className="btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 text-sm"
      >
        <Sparkles size={15} />
        {loading ? 'Analyzing...' : 'Analyze Resume with AI'}
        {!loading && <ArrowRight size={14} />}
      </button>
    </div>
  )
}
