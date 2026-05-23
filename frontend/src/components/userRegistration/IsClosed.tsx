import React from 'react'

function IsClosed() {
    return (
        <>
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-600 font-semibold">
                Registration Closed
            </p>
            <p className="text-sm text-red-400 mt-1">
                This event is no longer accepting registrations
            </p>
        </div>
        </>
    )
}

export default IsClosed