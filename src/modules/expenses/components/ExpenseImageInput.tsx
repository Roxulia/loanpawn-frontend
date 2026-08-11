import { useEffect, useMemo, useRef } from 'react'
import { Button } from '../../../components/atoms'

type ExpenseImageInputProps = {
  existingImage: boolean
  file: File | null
  id: string
  isRemoved: boolean
  onChange: (file: File | null) => void
  onRemoveChange: (removed: boolean) => void
}

export function ExpenseImageInput({
  existingImage,
  file,
  id,
  isRemoved,
  onChange,
  onRemoveChange,
}: ExpenseImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = useObjectUrl(file)

  function chooseImage() {
    if (!inputRef.current) return

    inputRef.current.value = ''
    inputRef.current.click()
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null

    onChange(nextFile)
    onRemoveChange(false)
  }

  return (
    <div className="expense-image-input">
      <input
        ref={inputRef}
        id={`${id}-image`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleChange}
      />

      <Button onClick={chooseImage} variant="secondary">
        {file ? 'Change reference image' : 'Add reference image'}
      </Button>

      {previewUrl && file && (
        <div className="expense-image-input__preview">
          <img
            src={previewUrl}
            alt="Expense reference preview"
          />

          <span>{file.name}</span>
        </div>
      )}

      {existingImage && !file && !isRemoved && (
        <p>A reference image is currently attached.</p>
      )}

      {(file || (existingImage && !isRemoved)) && (
        <Button
          variant="danger"
          onClick={() => {
            onChange(null)
            onRemoveChange(existingImage)
          }}
        >
          Remove reference image
        </Button>
      )}

      {isRemoved && (
        <p>
          The existing image will be removed when changes are saved.
        </p>
      )}

      <p>JPG, PNG, or WebP. Maximum 5 MB.</p>
    </div>
  )
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => file ? URL.createObjectURL(file) : null, [file])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return url
}
