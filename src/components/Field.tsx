import React, { type Ref } from "react"

interface FieldProps {
  label: string
  type: string
  placeholder: string
  mask?: Ref<HTMLInputElement>
  handler: (value: string) => void
  value: string
}

function Field({ label, type, placeholder, mask, handler, value }: FieldProps) {
  
  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    handler(event.target.value)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-black">
        {label}
      </label>
      <input
        value={value}
        onChange={handleValueChange}
        type={type}
        placeholder={placeholder}
        ref={mask}
        className="w-full bg-transparent border-0 border-b border-sand rounded-none px-0 py-2.5 font-sans text-espresso text-base placeholder:text-taupe/40 transition-all duration-300 focus:border-mocha focus:border-b-[1.5px] focus:outline-none"
      />
    </div>
  )
}

export default Field
