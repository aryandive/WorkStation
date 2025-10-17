'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const handle = async () => {
            // Supabase may send either code in query or tokens in hash
            const code = searchParams.get('code')
            const type = searchParams.get('type')
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (!error) {
                    if (type === 'recovery') {
                        router.replace('/update-password')
                    } else {
                        router.replace('/')
                    }
                    return
                }
                router.replace('/login?message=' + encodeURIComponent('Could not log in with provider'))
                return
            }

            // If the provider returns tokens in the URL hash, the client SDK will parse it automatically on first call
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // If coming from recovery, type may still be present
                if (type === 'recovery') {
                    router.replace('/update-password')
                    return
                }
                router.replace('/')
                return
            }

            router.replace('/login?message=' + encodeURIComponent('No session found'))
        }
        handle()
        // We intentionally only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return null
}


