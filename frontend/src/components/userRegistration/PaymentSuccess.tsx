

export const PaymentSuccess = () => {
    return (
        <>

            <div className="app-card-raised bg-gradient-to-r from-emerald-600/90 to-green-600/90 text-app-text p-5 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-app-surface text-emerald-500 flex items-center justify-center rounded-full font-bold text-lg shadow">
                        ✓
                    </div>

                    <div>
                        <h2 className="text-lg font-bold">
                            Payment Successful
                        </h2>
                        <p className="text-sm opacity-90">
                            Your payment has been confirmed and registered successfully.
                        </p>
                    </div>
                </div>

                <div className="mt-3 text-xs opacity-80">
                    Reference: Razorpay Verified • Secure Transaction • UAE Standard Compliance UI
                </div>
            </div>


        </>
    )
}
