// for gemini copy/app/update-password/page.js
import UpdatePassword from '@/components/auth/UpdatePassword'

export const metadata = {
    title: 'Update Password',
}

export default function UpdatePasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <UpdatePassword />
        </div>
    )
}