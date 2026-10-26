import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../lib/supabase.js'

export function ImageUploader({ value, onChange, folder = 'general', label = 'Image' }) {
  const { store } = useData()
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const maxBytes = store.mode === 'local' ? 400 * 1024 : MAX_IMAGE_BYTES
  const maxLabel = store.mode === 'local' ? '400 KB' : '2 MB'

  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Use a JPEG, PNG, WebP or GIF image.')
      return
    }
    if (file.size > maxBytes) {
      toast.error(`Images must be ${maxLabel} or smaller in this storage mode.`)
      return
    }
    setBusy(true)
    try {
      const url = await store.uploadImage(file, folder)
      onChange(url)
      toast.success('Image uploaded. Save the form to apply it.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
      {value ? (
        <img className="image-preview" src={value} alt="Upload preview" />
      ) : (
        <div className="article-placeholder" style={{ maxHeight: 160 }}>
          No image selected
        </div>
      )}
      <div className="upload-row">
        <input
          ref={inputRef}
          id={`upload-${folder}-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={upload}
        />
        <label
          htmlFor={`upload-${folder}-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className="btn btn-outline btn-sm"
          aria-disabled={busy}
        >
          <ImagePlus size={14} aria-hidden="true" />
          {busy ? 'Uploading\u2026' : value ? 'Replace image' : 'Upload image'}
        </label>
        {value && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              try {
                await store.deleteImage(value)
              } catch {
                // Removing the reference is still safe if remote deletion fails.
              }
              onChange(null)
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove
          </button>
        )}
      </div>
      <span className="help">JPEG, PNG, WebP or GIF, up to {maxLabel}. Only upload images you have rights to use.</span>
    </div>
  )
}
