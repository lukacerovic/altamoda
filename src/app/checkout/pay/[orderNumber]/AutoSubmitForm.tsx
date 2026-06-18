'use client'

import { useEffect, useRef } from 'react'

interface Props {
  action: string
  fields: Record<string, string>
}

/**
 * Renders a hidden POST form targeting the SIA VPOS payment page and submits it
 * automatically on mount. A manual button is shown as a no-JS / slow-network
 * fallback. POST (not GET) is used per the spec — GET is discouraged and 3DSDATA
 * can be large.
 */
export default function AutoSubmitForm({ action, fields }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    formRef.current?.submit()
  }, [])

  return (
    <form ref={formRef} method="POST" action={action} className="text-center">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="px-6 py-3 bg-[#edb4bd] text-white rounded font-medium hover:bg-[#413d3a]"
      >
        Nastavi na plaćanje
      </button>
    </form>
  )
}
