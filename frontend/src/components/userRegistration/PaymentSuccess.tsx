

export const PaymentSuccess = () => {
    return (
        <>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-2xl shadow-lg border border-green-300 animate-pulse">

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-green-600 flex items-center justify-center rounded-full font-bold text-lg shadow">
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
